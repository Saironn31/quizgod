"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import ApiStatusBanner from '@/components/ApiStatusBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentProcessing } from '@/contexts/DocumentProcessingContext';
import { 
  getUserSubjects, 
  getAllUserSubjects,
  FirebaseSubject,
  createQuiz,
  getUserClasses,
  FirebaseClass,
  FirebaseQuiz,
  createSubject
} from '@/lib/firestore';

type Question = { question: string; options: string[]; correct: number };

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function CreatePage() {
  const { user } = useAuth();
  const { currentJob, startProcessing, cancelProcessing } = useDocumentProcessing();
  
  // Mode selection
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  
  // Common fields
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [classes, setClasses] = useState<FirebaseClass[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<FirebaseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Manual mode fields
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  
  // AI mode fields
  const [numQuestions, setNumQuestions] = useState(5);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [useOCR, setUseOCR] = useState(true);
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState("");
  
  // AI Chatbot states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // User statistics for chatbot
  const [userStats, setUserStats] = useState({
    totalClasses: 0,
    totalSubjects: 0,
    totalQuizzes: 0,
    classesAsPresident: 0,
    classesAsMember: 0
  });
  
  // Document preview states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('create_quiz_draft_v3');
      if (savedData) {
        const draft = JSON.parse(savedData);
        const isRecent = draft.timestamp && (Date.now() - draft.timestamp) < 7 * 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          setMode(draft.mode || 'manual');
          setTitle(draft.title || "");
          setSubject(draft.subject || "");
          setSelectedClass(draft.selectedClass || "");
          setDescription(draft.description || "");
          setQuestions(draft.questions || [{ question: "", options: ["", "", "", ""], correct: 0 }]);
          setNumQuestions(draft.numQuestions || 5);
          setGeneratedQuestions(draft.generatedQuestions || "");
          setPdfText(draft.pdfText || "");
          
          // Restore extraction state (but don't restart extraction automatically)
          if (draft.isExtracting === false && draft.pdfText) {
            // Extraction was completed
            setIsExtracting(false);
            setOcrProgress(draft.ocrProgress || { current: 0, total: 0, percentage: 0 });
          }
        } else {
          localStorage.removeItem('create_quiz_draft_v3');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem('create_quiz_draft_v3');
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sync context job state with local state
  useEffect(() => {
    if (currentJob) {
      setIsExtracting(currentJob.isExtracting);
      setOcrProgress(currentJob.ocrProgress);
      
      // If extraction is complete and we have text, update pdfText
      if (!currentJob.isExtracting && currentJob.extractedText && !pdfText) {
        setPdfText(currentJob.extractedText);
      }
    }
  }, [currentJob]);

  // Auto-save draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isEmpty = !title && !subject && !selectedClass && !description && 
                    !generatedQuestions &&
                    questions.length === 1 && !questions[0].question && 
                    questions[0].options.every(opt => !opt);
    
    if (isEmpty) return;
    
    const draft = {
      mode,
      title,
      subject,
      selectedClass,
      description,
      questions,
      numQuestions,
      generatedQuestions,
      pdfText,
      isExtracting,
      ocrProgress,
      pdfFileName: pdfFile?.name || null,
      pdfFileSize: pdfFile?.size || null,
      pdfFileType: pdfFile?.type || null,
      timestamp: Date.now()
    };
    
    localStorage.setItem('create_quiz_draft_v3', JSON.stringify(draft));
  }, [mode, title, subject, selectedClass, description, questions, numQuestions, generatedQuestions, pdfText, isExtracting, ocrProgress, pdfFile]);

  // Dynamic filtering
  useEffect(() => {
    if (selectedClass) {
      setFilteredSubjects(subjects.filter(s => !s.classId || s.classId === selectedClass));
    } else {
      setFilteredSubjects(subjects);
    }
  }, [selectedClass, subjects]);

  useEffect(() => {
    if (subject) {
      const subjectObj = subjects.find(s => s.name === subject);
      if (subjectObj?.classId) {
        setFilteredClasses(classes.filter(c => c.id === subjectObj.classId));
      } else {
        setFilteredClasses(classes);
      }
    } else {
      setFilteredClasses(classes);
    }
  }, [subject, classes, subjects]);

  useEffect(() => {
    if (!user?.uid || !user?.email) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid || !user?.email) return;
    
    try {
      setLoading(true);
      const allSubjects = await getAllUserSubjects(user.uid, user.email);
      const userClasses = await getUserClasses(user.email);
      
      const extendedSubjects: ExtendedFirebaseSubject[] = allSubjects.map(subj => {
        if (subj.classId) {
          const parentClass = userClasses.find(c => c.id === subj.classId);
          return {
            ...subj,
            source: 'class' as const,
            className: parentClass?.name || 'Unknown Class'
          };
        } else {
          return {
            ...subj,
            source: 'personal' as const
          };
        }
      });
      
      setSubjects(extendedSubjects);
      setFilteredSubjects(extendedSubjects);
      setClasses(userClasses);
      setFilteredClasses(userClasses);
      
      // Load user statistics for chatbot
      await loadUserStatistics(user.uid, user.email, userClasses, extendedSubjects);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStatistics = async (userId: string, userEmail: string, userClasses: FirebaseClass[], allSubjects: ExtendedFirebaseSubject[]) => {
    try {
      // Get all user's quizzes
      const { getUserQuizzes } = await import('@/lib/firestore');
      const userQuizzes = await getUserQuizzes(userId);
      
      // Calculate class statistics
      const classesAsPresident = userClasses.filter(c => 
        c.president === userEmail || c.memberRoles?.[userEmail] === 'president'
      ).length;
      const classesAsMember = userClasses.length - classesAsPresident;
      
      setUserStats({
        totalClasses: userClasses.length,
        totalSubjects: allSubjects.length,
        totalQuizzes: userQuizzes.length,
        classesAsPresident,
        classesAsMember
      });
    } catch (error) {
      console.error('Error loading user statistics:', error);
    }
  };

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    const subjectObj = subjects.find(s => s.name === value);
    if (subjectObj?.classId) {
      setSelectedClass(subjectObj.classId);
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    if (value && subject) {
      const subjectObj = subjects.find(s => s.name === subject);
      if (subjectObj?.classId && subjectObj.classId !== value) {
        setSubject("");
      }
    }
  };

  // Manual mode functions
  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  // AI mode functions
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc (legacy)
      'application/vnd.ms-powerpoint' // .ppt (legacy)
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document (.docx), or PowerPoint file (.pptx)');
      return;
    }

    setPdfFile(file);
    setIsExtracting(true);
    setError("");
    setOcrProgress({ current: 0, total: 0, percentage: 0 });

    // Generate preview immediately after upload
    generatePreview(file);

    // Start processing using the persistent context
    const jobId = startProcessing(
      file,
      useOCR,
      (extractedText) => {
        // On completion callback
        setPdfText(extractedText);
        setIsExtracting(false);
        setOcrProgress({ current: 0, total: 0, percentage: 0 });
      },
      (progress) => {
        // On progress callback
        setOcrProgress(progress);
      }
    );
  };

  // Preview generation functions
  const generatePreview = async (file: File) => {
    try {
      if (file.type === 'application/pdf') {
        await generatePdfPreview(file);
      } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        await generateDocxPreview(file);
      } else if (file.type.includes('presentation') || file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
        await generatePptxPreview(file);
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      // Don't show error for preview - it's not critical
      // Preview will just show loading state
    }
  };

  const generatePdfPreview = async (file: File) => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    setPdfDoc(pdf);
    setTotalPages(pdf.numPages);
    setCurrentPage(1);
    renderPdfPage(pdf, 1);
    } catch (error) {
      console.error('PDF preview generation error:', error);
    }
  };

  const renderPdfPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;
    
    const page = await pdf.getPage(pageNum);
    const scale = zoomLevel / 100;
    const viewport = page.getViewport({ scale });
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
    }
  };

  const generateDocxPreview = async (file: File) => {
    try {
      // For DOCX, we'll create a simple HTML preview
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
    
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              line-height: 1.6;
              background: white;
              color: black;
            }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>${result.value}</body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setTotalPages(1);
    setCurrentPage(1);
    } catch (error) {
      console.error('DOCX preview generation error:', error);
    }
  };

  const generatePptxPreview = async (file: File) => {
    try {
      const JSZip = await import('jszip');
      const zip = await JSZip.default.loadAsync(file);
    
    // Extract all images from slides
    const imageFiles = Object.keys(zip.files)
      .filter(name => name.startsWith('ppt/media/') && 
        (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')))
      .sort();
    
    if (imageFiles.length > 0) {
      // Create preview from first image
      const firstImage = imageFiles[0];
      const imageData = await zip.files[firstImage].async('base64');
      const imageExt = firstImage.split('.').pop();
      setPreviewUrl(`data:image/${imageExt};base64,${imageData}`);
      setTotalPages(imageFiles.length);
      setCurrentPage(1);
    } else {
      // No images found, create text preview
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
        .sort();
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial; padding: 20px; background: white; color: black; }
          </style>
        </head>
        <body>`;
      
      for (const slideName of slideFiles) {
        const slideContent = await zip.files[slideName].async('string');
        const textMatches = slideContent.match(/<a:t>([^<]+)<\/a:t>/g);
        if (textMatches) {
          const slideText = textMatches.map(match => match.replace(/<\/?a:t>/g, '')).join('<br>');
          htmlContent += `<div style="margin-bottom:20px;padding:20px;border:1px solid #ccc;">${slideText}</div>`;
        }
      }
      
      htmlContent += '</body></html>';
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setTotalPages(slideFiles.length);
      setCurrentPage(1);
    }
    } catch (error) {
      console.error('PPTX preview generation error:', error);
    }
  };

  // Preview navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      if (pdfDoc) {
        renderPdfPage(pdfDoc, nextPage);
      }
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      if (pdfDoc) {
        renderPdfPage(pdfDoc, prevPage);
      }
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 25, 200);
    setZoomLevel(newZoom);
    if (pdfDoc) {
      renderPdfPage(pdfDoc, currentPage);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 25, 50);
    setZoomLevel(newZoom);
    if (pdfDoc) {
      renderPdfPage(pdfDoc, currentPage);
    }
  };

  // Update PDF rendering when zoom changes
  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPdfPage(pdfDoc, currentPage);
    }
  }, [zoomLevel]);
  
  const generateWithAI = async () => {
    if (!title.trim() || !subject) {
      alert("Please fill in quiz title and select a subject");
      return;
    }

    if (!pdfText) {
      alert("Please upload a document (PDF/Word/PowerPoint) file");
      return;
    }

    setIsGenerating(true);
    setError("");

    const basePrompt = `You are a quiz generator. Create ${numQuestions} multiple choice questions about ${subject} based on the following content.

Content:
${pdfText.slice(0, 15000)}

MANDATORY FORMAT - Follow this EXACTLY:

1. What is the question text?
A) First option
B) Second option*
C) Third option
D) Fourth option

2. What is another question?
A) Option one
B) Option two
C) Option three*
D) Option four

CRITICAL RULES:
1. Start output with "1." immediately - NO introduction text
2. Each question MUST have EXACTLY ONE asterisk (*) marking the correct answer
3. Put asterisk directly after the correct answer text like this: "Correct answer*"
4. Every question needs 4 options: A) B) C) D)
5. End after the last question - NO conclusion text

The asterisk (*) is MANDATORY for marking correct answers. Without it, the quiz cannot work.

Generate ${numQuestions} questions NOW:`;




    // Try Groq first (lightning fast, high free tier limits)
    try {
      console.log('Trying Groq API...');
      const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      
      if (groqKey && groqKey !== 'your_groq_api_key_here') {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-4-scout', // Good balance of cost and instruction following
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a quiz generator. Always mark the correct answer with an asterisk (*) immediately after the option text. Format: "Correct answer*". This is mandatory.'
                },
                { role: 'user', content: basePrompt }
              ],
              temperature: 0.7,
              max_tokens: 4000,
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          let generatedText = data.choices?.[0]?.message?.content;
          
          if (generatedText) {
            // Clean up any extra text before first question or after last question
            // Find the first question number and start from there
            const firstQuestionMatch = generatedText.match(/1\.\s/);
            if (firstQuestionMatch) {
              generatedText = generatedText.substring(firstQuestionMatch.index!);
            }
            
            // Remove any trailing text after the last question pattern
            // Look for text after the last option pattern (A-D with closing parenthesis or period)
            const lines = generatedText.split('\n');
            let lastQuestionLineIndex = -1;
            for (let i = lines.length - 1; i >= 0; i--) {
              if (lines[i].trim().match(/^[A-D][\)\.\:]\s*.+/i)) {
                lastQuestionLineIndex = i;
                break;
              }
            }
            if (lastQuestionLineIndex !== -1) {
              generatedText = lines.slice(0, lastQuestionLineIndex + 1).join('\n');
            }
            
            console.log('✅ Successfully generated with Groq');
            setGeneratedQuestions(generatedText);
            alert('✅ Quiz generated successfully with Groq! Review and parse the questions below.');
            setIsGenerating(false);
            return;
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Groq failed:', errorData);
        }
      }
    } catch (groqError) {
      console.log('Groq error:', groqError);
    }

    // No backup - just show error
    setError("Failed to generate quiz. Please check your API key and try again.");
    alert('❌ Failed to generate quiz. Please check your Groq API key in .env.local');
    setIsGenerating(false);
  };

  // Keep old function name for compatibility
  const generateWithGemini = generateWithAI;

  // AI Chatbot function with Groq
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !pdfText) {
      if (!pdfText) {
        alert("Please upload a document first before chatting with the AI.");
      }
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput("");
    
    // Add user message to chat
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    // Build conversation context with document AND QuizGod knowledge
    const systemMessage = `You are QuizGod AI Assistant - an expert helper for the QuizGod quiz creation platform.

CURRENT USER PROFILE:
- Username: ${user?.displayName || user?.email || 'User'}
- Total Classes: ${userStats.totalClasses}
  · As President: ${userStats.classesAsPresident}
  · As Member: ${userStats.classesAsMember}
- Total Subjects: ${userStats.totalSubjects}
- Total Quizzes Created: ${userStats.totalQuizzes}
- Available Classes: ${classes.map(c => c.name).join(', ') || 'None'}
- Available Subjects: ${subjects.slice(0, 10).map(s => s.name).join(', ')}${subjects.length > 10 ? ` and ${subjects.length - 10} more` : ''}

ABOUT QUIZGOD:
QuizGod is a comprehensive quiz management platform that helps educators and students create, share, and take quizzes.

KEY FEATURES:

1. QUIZ CREATION:
   - Manual Quiz Creator (/create): Create quizzes manually with custom questions
   - AI Quiz Generator (/quiz-creator): Upload documents (PDF, DOCX, PPTX) and AI generates quiz questions automatically
   - Question types: Multiple choice with 4 options (A, B, C, D)
   - Add quiz titles, descriptions, and subjects
   - OCR support for scanned documents

2. CLASSES SYSTEM (/classes):
   - Create virtual classes for organizing students
   - Invite members via username/email or join code
   - Class president can manage members
   - Share quizzes with entire class
   - Class leaderboards and analytics
   - Subject organization within classes

3. QUIZ LIBRARY (/quizzes):
   - Browse all available quizzes
   - Filter by subject
   - Search functionality
   - Take quizzes and track scores
   - View detailed results and correct answers

4. ANALYTICS & LEADERBOARDS:
   - Class-wide performance tracking
   - Individual member analytics
   - Quiz-specific leaderboards
   - Score history and progress tracking
   - Average scores and completion rates

5. CURRENT DOCUMENT:
${pdfText ? `The user has uploaded a document. Here's the content:\n\n${pdfText.slice(0, 10000)}\n\nYou can answer questions about this document.` : 'No document uploaded yet.'}

YOUR ROLE:
- Help users understand QuizGod features
- Answer questions about uploaded documents
- Guide users on how to create effective quizzes
- Explain how to use classes and share quizzes
- Provide tips for quiz generation
- Troubleshoot issues with document uploads or quiz creation

Be friendly, concise, and helpful. When discussing the uploaded document, provide specific answers based on its content.`;

    // Use Groq for chat
    try {
      console.log('Using Groq for chat...');
      const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      
      if (!groqKey || groqKey === 'your_groq_api_key_here') {
        throw new Error("No Groq API key configured");
      }

      const messages = [
        { role: 'system' as const, content: systemMessage },
        ...newMessages
      ];

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = data.choices?.[0]?.message?.content;
        
        if (assistantMessage) {
          console.log('✅ Chat response from Groq');
          setChatMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
          
          // Scroll to bottom
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          }, 100);
          
          setIsChatLoading(false);
          return;
        }
      }
      
      throw new Error("Failed to get response from Groq");
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages([...newMessages, { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again.' 
      }]);
      setIsChatLoading(false);
    }
  };

  // Auto-scroll chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const parseQuizQuestions = (text: string) => {
    const questions: Question[] = [];
    const questionBlocks = text.split(/\d+\.\s+/).filter(block => block.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 5) continue;

      const questionText = lines[0].replace(/\?$/, '').trim();
      const options = [];
      let correctIndex = -1; // Start with -1 to detect if no asterisk found
      let foundAsterisk = false;

      for (let i = 1; i < lines.length && options.length < 4; i++) {
        const line = lines[i].trim();
        // Match patterns like "A) text*", "A. text*", "A text*", or just "text*"
        const match = line.match(/^[A-D][\)\.\:]?\s*(.+?)$/i);
        if (match) {
          const optionText = match[1].trim();
          // Check if this option has an asterisk (correct answer marker)
          const hasAsterisk = optionText.includes('*');
          // Remove asterisk from the option text
          const cleanText = optionText.replace(/\*+/g, '').trim();
          
          options.push(cleanText);
          
          if (hasAsterisk && !foundAsterisk) {
            correctIndex = options.length - 1;
            foundAsterisk = true;
          }
        }
      }

      // If no asterisk was found, log warning and default to first option
      if (questionText && options.length === 4) {
        if (correctIndex === -1) {
          console.warn(`No correct answer marked for question: "${questionText}". Defaulting to option A.`);
          correctIndex = 0;
        }
        
        questions.push({
          question: questionText,
          options,
          correct: correctIndex
        });
      }
    }

    return questions;
  };

  // Submit handlers
  const handleManualSubmit = async () => {
    if (!user?.uid) {
      alert("Please log in to create a quiz");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    if (!subject) {
      alert("Please select a subject");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Please enter question ${i + 1}`);
        return;
      }
      if (q.options.some(option => !option.trim())) {
        alert(`Please fill all options for question ${i + 1}`);
        return;
      }
    }

    try {
      setSaving(true);
      
      const selectedSubject = subjects.find(s => s.name === subject);
      
      const quizData: any = {
        title: title.trim(),
        subject: subject,
        questions: questions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      
      if (description.trim()) {
        quizData.description = description.trim();
      }
      if (selectedSubject?.id) {
        quizData.subjectId = selectedSubject.id;
      }
      if (selectedClass) {
        quizData.classId = selectedClass;
      }
      
      await createQuiz(quizData);

      alert("Quiz created successfully!");
      
      localStorage.removeItem('create_quiz_draft_v3');
      
      setTitle("");
      setSubject("");
      setSelectedClass("");
      setDescription("");
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
      
      window.location.href = "/quizzes";
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAISubmit = async () => {
    if (!title.trim() || !subject || !generatedQuestions.trim() || !user?.uid) {
      alert("Please fill in all required fields and generate questions first");
      return;
    }

    try {
      setSaving(true);
      
      const selectedSubjectObj = subjects.find(s => s.name === subject);
      
      const parsedQuestions = parseQuizQuestions(generatedQuestions);

      if (parsedQuestions.length === 0) {
        alert("No valid questions found. Please check the format.");
        return;
      }
      
      const quizData: Omit<FirebaseQuiz, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        subject: subject,
        questions: parsedQuestions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      
      if (selectedClass) {
        quizData.classId = selectedClass;
      }
      if (selectedSubjectObj?.id) {
        quizData.subjectId = selectedSubjectObj.id;
      }

      await createQuiz(quizData);

      localStorage.removeItem('create_quiz_draft_v3');

      setTitle("");
      setSubject("");
      setGeneratedQuestions("");
      setPdfText("");
      setPdfFile(null);
      setSelectedClass("");

      alert(`Quiz created successfully with ${parsedQuestions.length} questions!`);
      window.location.href = "/quizzes";
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear this draft? This cannot be undone.')) {
      localStorage.removeItem('create_quiz_draft_v3');
      setTitle("");
      setSubject("");
      setSelectedClass("");
      setDescription("");
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
      setNumQuestions(5);
      setGeneratedQuestions("");
      setPdfText("");
      setPdfFile(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="gradient-text">Create Quiz</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Please log in to create a quiz
          </p>
          <Link href="/" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-glow">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6 md:mb-8">
          <div className="glass-card rounded-3xl p-4 md:p-8 lg:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-black mb-2 md:mb-3">
                  <span className="text-white">Create Quiz</span>
                </h1>
                <p className="text-slate-300 text-sm md:text-base lg:text-lg">Build manually or generate with AI</p>
              </div>
              {/* Mode Switcher in Header */}
              <div className="glass-card rounded-2xl p-2 inline-flex gap-2">
                <button
                  onClick={() => setMode('manual')}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    mode === 'manual'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ✍️ Manual
                </button>
                <button
                  onClick={() => setMode('ai')}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    mode === 'ai'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🤖 AI Generator
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Background Processing Indicator */}
        {(isExtracting || (currentJob && currentJob.isExtracting)) && (
          <div className="relative z-10 mb-6 glass-card rounded-2xl p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-spin">
                <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"></div>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">Document Processing in Background</p>
                <p className="text-sm text-slate-300">
                  {(currentJob?.ocrProgress.total || ocrProgress.total) > 0 
                    ? `OCR Processing: ${currentJob?.ocrProgress.current || ocrProgress.current}/${currentJob?.ocrProgress.total || ocrProgress.total} (${currentJob?.ocrProgress.percentage || ocrProgress.percentage}%)`
                    : 'Extracting text from document...'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  💡 You can navigate to other pages - processing will continue in the background!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-20">
          <div className="glass-card rounded-3xl p-4 md:p-6 lg:col-span-2 animate-slide-up">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">
              {mode === 'manual' ? 'Quiz Builder' : 'AI Quiz Generator'}
            </h3>

            {/* Draft indicator */}
            {(title || subject || description || generatedQuestions || questions.some(q => q.question || q.options.some(o => o))) && (
              <div className="mb-4 md:mb-6 p-2 md:p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-300">💾</span>
                  <span className="text-xs md:text-sm text-blue-200">Draft auto-saved</span>
                </div>
                <button
                  onClick={handleClearDraft}
                  className="text-xs px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors w-full sm:w-auto"
                >
                  Clear Draft
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-purple-200">Loading...</p>
              </div>
            ) : (
              <>
                {/* Common Fields */}
                <div className="space-y-4 md:space-y-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Quiz Title *</label>
                      <input 
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        placeholder="Enter quiz title..." 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-white mb-2">Subject *</label>
                      <select 
                        className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 hover:bg-white/[0.12] hover:border-white/30 active:scale-[0.99] cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white [&>option]:py-2 [&>option]:px-4" 
                        value={subject} 
                        onChange={e => handleSubjectChange(e.target.value)}
                      >
                        <option value="">Select subject</option>
                        {filteredSubjects.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.source === 'class' ? `${s.name} (${s.className})` : s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-white mb-2">Add to Class (Optional)</label>
                    <select 
                      className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 hover:bg-white/[0.12] hover:border-white/30 active:scale-[0.99] cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white [&>option]:py-2 [&>option]:px-4" 
                      value={selectedClass} 
                      onChange={e => handleClassChange(e.target.value)}
                    >
                      <option value="">Personal quiz (no class)</option>
                      {filteredClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Manual Mode */}
                {mode === 'manual' && (
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                      <textarea 
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        rows={3} 
                        placeholder="Brief description of your quiz..." 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>

                    {/* Questions */}
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h2 className="text-lg md:text-xl font-semibold text-white">Questions ({questions.length})</h2>
                        <button 
                          onClick={addQuestion}
                          className="px-4 py-2 text-sm md:text-base bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:scale-105 font-medium w-full sm:w-auto"
                        >
                          ➕ Add Question
                        </button>
                      </div>

                      {questions.map((q, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
                          <div className="flex justify-between items-center mb-3 md:mb-4">
                            <h3 className="text-base md:text-lg font-medium text-white">Question {i + 1}</h3>
                            {questions.length > 1 && (
                              <button 
                                onClick={() => removeQuestion(i)}
                                className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-3 md:space-y-4">
                            <input 
                              className="w-full p-2 md:p-3 text-sm md:text-base border border-white/30 bg-white/10 text-white placeholder-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" 
                              placeholder="Enter your question..." 
                              value={q.question} 
                              onChange={e => updateQuestion(i, { question: e.target.value })}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                              {q.options.map((option, oi) => (
                                <div key={oi} className="flex items-center gap-2 md:gap-3">
                                  <input 
                                    type="radio" 
                                    name={`correct-${i}`} 
                                    checked={q.correct === oi} 
                                    onChange={() => updateQuestion(i, { correct: oi })}
                                    className="text-purple-500 focus:ring-purple-400 shrink-0"
                                  />
                                  <input 
                                    className="flex-1 min-w-0 p-2 text-sm md:text-base border border-white/30 bg-white/10 text-white placeholder-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400" 
                                    placeholder={`Option ${oi + 1}`} 
                                    value={option} 
                                    onChange={e => { 
                                      const opts = [...q.options]; 
                                      opts[oi] = e.target.value; 
                                      updateQuestion(i, { options: opts }); 
                                    }} 
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4 md:pt-6">
                      <button 
                        onClick={handleManualSubmit}
                        disabled={saving}
                        className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Creating Quiz..." : "🚀 Create Quiz"}
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Mode */}
                {mode === 'ai' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Quiz Settings in One Container */}
                    <div className="lg:col-span-1">
                      <div className="glass-card rounded-2xl p-6 space-y-6">
                        <div className="border-b border-white/20 pb-4">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>⚙️</span>
                            Quiz Settings
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Configure your AI-generated quiz</p>
                        </div>

                        {/* Upload Document Section */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                              📄
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-white">Upload Document</h4>
                              <p className="text-xs text-slate-400">PDF, Word, or PowerPoint</p>
                            </div>
                          </div>
                          
                          {/* OCR Checkbox */}
                          {pdfFile && (
                            <div className="mb-3 bg-white/5 rounded-xl p-3 border border-white/10">
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useOCR}
                                  onChange={(e) => setUseOCR(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded border-2 border-purple-400 bg-white/10 checked:bg-purple-500 checked:border-purple-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <span className="text-white font-medium text-sm">Enable OCR</span>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {pdfFile.type === 'application/pdf' 
                                      ? 'Extract text from scanned PDFs'
                                      : 'Extract text from images'}
                                  </p>
                                </div>
                              </label>
                            </div>
                          )}
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc,.pptx,.ppt"
                            onChange={handlePDFUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-bold disabled:opacity-50 text-sm"
                          >
                            {isExtracting ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                {useOCR && ocrProgress.total > 0 
                                  ? `OCR: ${ocrProgress.current}/${ocrProgress.total}`
                                  : 'Extracting...'}
                              </span>
                            ) : pdfFile ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="text-green-300">✓</span>
                                {pdfFile.name.length > 15 ? pdfFile.name.substring(0, 15) + '...' : pdfFile.name}
                              </span>
                            ) : (
                              "📤 Choose Document"
                            )}
                          </button>
                          
                          {/* OCR Progress */}
                          {isExtracting && useOCR && ocrProgress.total > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                                <span>OCR Progress</span>
                                <span className="font-semibold">{ocrProgress.percentage}%</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                  style={{ width: `${ocrProgress.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {pdfText && (
                            <div className="mt-3 p-3 bg-green-500/10 rounded-xl border border-green-400/30">
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 text-lg">✓</span>
                                <div>
                                  <p className="text-sm font-semibold text-white">Text Extracted</p>
                                  <p className="text-xs text-slate-400">{pdfText.length.toLocaleString()} chars</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Number of Questions */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                              🔢
                            </div>
                            <label className="text-base font-bold text-white">Number of Questions</label>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                            className="w-full p-3 text-lg font-bold border border-white/20 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                          />
                        </div>

                        {/* Generate Button */}
                        <div>
                          <button
                            onClick={generateWithGemini}
                            disabled={isGenerating || !pdfText}
                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                          >
                            {isGenerating ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Generating...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                ✨ Generate Questions
                              </span>
                            )}
                          </button>
                          {!pdfText && (
                            <p className="text-xs text-slate-400 mt-2 text-center">Upload a document first</p>
                          )}
                        </div>

                        {/* Error Display */}
                        {error && (
                          <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
                            <div className="flex items-start gap-3">
                              <span className="text-xl">⚠️</span>
                              <div>
                                <p className="font-semibold text-red-300 text-sm">Error</p>
                                <p className="text-xs text-red-200 mt-1">{error}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Preview & Chatbot */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Document Preview Card */}
                      {pdfFile ? (
                        <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/30">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                              <span>📄</span>
                              Document Preview
                            </h4>
                            <span className="text-xs text-slate-400">{pdfFile.name}</span>
                          </div>
                          
                          {/* Preview Controls */}
                          <div className="flex items-center justify-between mb-4 gap-2">
                            {/* Page Navigation */}
                            {totalPages > 1 && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={goToPrevPage}
                                  disabled={currentPage === 1}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title="Previous page"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <span className="text-xs text-white font-medium">
                                  {currentPage} / {totalPages}
                                </span>
                                <button
                                  onClick={goToNextPage}
                                  disabled={currentPage === totalPages}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title="Next page"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            
                            {/* Zoom Controls */}
                            {pdfDoc && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleZoomOut}
                                  disabled={zoomLevel <= 50}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title="Zoom out"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                  </svg>
                                </button>
                                <span className="text-xs text-white font-medium">{zoomLevel}%</span>
                                <button
                                  onClick={handleZoomIn}
                                  disabled={zoomLevel >= 200}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                  title="Zoom in"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Preview Container */}
                          <div className="bg-white/5 rounded-xl p-2 border border-white/10 overflow-auto max-h-[500px]">
                            {pdfDoc ? (
                              <canvas ref={canvasRef} className="w-full h-auto" />
                            ) : previewUrl ? (
                              <iframe
                                src={previewUrl}
                                className="w-full h-[400px] border-0 rounded-lg bg-white"
                                title="Document Preview"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-64 text-slate-400">
                                <div className="text-center">
                                  <div className="text-4xl mb-2">📄</div>
                                  <p className="text-sm">Processing preview...</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* File Info */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>File size: {(pdfFile.size / 1024).toFixed(2)} KB</span>
                              {totalPages > 0 && <span>{totalPages} {totalPages === 1 ? 'page' : 'pages'}</span>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-card rounded-2xl p-12 border border-white/20 text-center">
                          <div className="text-6xl mb-4">📄</div>
                          <h4 className="text-xl font-bold text-white mb-2">No Document Uploaded</h4>
                          <p className="text-sm text-slate-400">Upload a document to see the preview here</p>
                        </div>
                      )}

                      {/* AI Chatbot Card */}
                      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl">
                            🤖
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">AI Assistant</h4>
                            <p className="text-xs text-slate-300">Chat with DeepSeek R1 about your document</p>
                          </div>
                        </div>
                        
                        {/* Chat Messages */}
                        <div 
                          ref={chatContainerRef}
                          className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 h-64 overflow-y-auto space-y-3"
                        >
                          {chatMessages.length === 0 ? (
                            <div className="text-sm text-slate-400 text-center py-8">
                              <div className="text-4xl mb-3">💬</div>
                              <p>Ask questions about your document!</p>
                              <p className="text-xs mt-2">Upload a document first, then chat with AI</p>
                            </div>
                          ) : (
                            chatMessages.map((msg, idx) => (
                              <div 
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[80%] px-4 py-2 rounded-xl ${
                                    msg.role === 'user'
                                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                      : 'bg-white/10 text-slate-200'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                          {isChatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white/10 px-4 py-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Chat Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={pdfText ? "Ask a question about your document..." : "Upload a document first..."}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !isChatLoading && pdfText) {
                                sendChatMessage();
                              }
                            }}
                            disabled={!pdfText || isChatLoading}
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={sendChatMessage}
                            disabled={!pdfText || isChatLoading || !chatInput.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-600 transition-all"
                          >
                            {isChatLoading ? (
                              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                              "Send"
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Generated Questions Preview */}
                      {generatedQuestions && (
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-6 animate-slide-up">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl">
                              ✨
                            </div>
                            <div>
                              <h4 className="text-lg md:text-xl font-bold text-white">Questions Generated!</h4>
                              <p className="text-sm text-slate-300">Review and create your quiz</p>
                            </div>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 mb-4 max-h-96 overflow-y-auto border border-white/10">
                            <pre className="text-xs md:text-sm text-slate-200 whitespace-pre-wrap font-mono">{generatedQuestions}</pre>
                          </div>
                          <button
                            onClick={handleAISubmit}
                            disabled={saving}
                            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                          >
                            {saving ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Creating Quiz...
                              </span>
                            ) : (
                              "🚀 Create Quiz from AI"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

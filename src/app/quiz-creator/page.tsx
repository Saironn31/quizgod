"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import ApiStatusBanner from '@/components/ApiStatusBanner';
import AdsterraAd from '@/components/AdsterraAd';

// Trigger redeploy
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
  createSubject,
  isUserPremium
} from '@/lib/firestore';

type Question = { 
  question: string; 
  options: string[]; 
  correct: number;
  type?: 'multiple-choice' | 'true-false' | 'fill-blank';
  imageUrl?: string;
};

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function CreatePage() {
  const { user, userProfile } = useAuth();
  const { currentJob, startProcessing, cancelProcessing } = useDocumentProcessing();
  
  // Mode selection
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);
  
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
  
  // Quiz settings
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timerType, setTimerType] = useState<'none' | 'per-question' | 'whole-quiz'>('none');
  const [timerDuration, setTimerDuration] = useState<number>(60);
  const [questionTypes, setQuestionTypes] = useState<{
    'multiple-choice': number;
    'true-false': number;
    'fill-blank': number;
  }>({ 
    'multiple-choice': 5,
    'true-false': 0,
    'fill-blank': 0
  });  // AI mode fields
  const [numQuestions, setNumQuestions] = useState(5);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [useOCR, setUseOCR] = useState(false); // Default to false - user must enable
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
    
    // Check premium status
    const checkPremium = async () => {
      if (user?.uid) {
        try {
          const premium = await isUserPremium(user.uid);
          setIsPremium(premium);
        } catch (error) {
          console.error('Error checking premium:', error);
        } finally {
          setCheckingPremium(false);
        }
      } else {
        setCheckingPremium(false);
      }
    };
    checkPremium();
    
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
    setError("");
    setOcrProgress({ current: 0, total: 0, percentage: 0 });

    // Generate preview immediately after upload
    generatePreview(file);

    // Always extract text (embedded text) immediately
    // OCR will only run if user enables it and clicks "Start OCR"
    setIsExtracting(true);
    
    const jobId = startProcessing(
      file,
      false, // Don't use OCR initially
      (extractedText) => {
        // On completion callback for basic text extraction
        setPdfText(extractedText);
        setIsExtracting(false);
        setOcrProgress({ current: 0, total: 0, percentage: 0 });
      },
      (progress) => {
        // On progress callback (won't be used for non-OCR)
        setOcrProgress(progress);
      }
    );
  };

  // New function to start OCR processing
  const handleStartOCR = () => {
    if (!pdfFile || !useOCR) return;
    
    setIsExtracting(true);
    
    // Start processing using the persistent context with OCR enabled
    const jobId = startProcessing(
      pdfFile,
      true, // Use OCR this time
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

    // Calculate total questions
    const totalQuestions = questionTypes['multiple-choice'] + questionTypes['true-false'] + 
                          questionTypes['fill-blank'];
    
    if (totalQuestions === 0) {
      alert("Please specify at least one question to generate");
      return;
    }

    setIsGenerating(true);
    setError("");

    // Build question type instructions
    let typeInstructions = '';
    const types = [];
    
    if (questionTypes['multiple-choice'] > 0) {
      types.push(`${questionTypes['multiple-choice']} multiple-choice questions (4 options each, mark correct with *)`);
    }
    if (questionTypes['true-false'] > 0) {
      types.push(`${questionTypes['true-false']} true/false questions (options: True/False, mark correct with *)`);
    }
    if (questionTypes['fill-blank'] > 0) {
      types.push(`${questionTypes['fill-blank']} fill-in-the-blank questions (ANSWER MUST BE 1-3 WORDS MAXIMUM)`);
    }

    const basePrompt = `You are a quiz generator. Create a quiz about ${subject} with difficulty level: ${difficulty.toUpperCase()}.

Based on the following content, generate EXACTLY:
${types.join('\n')}

TOTAL QUESTIONS REQUIRED: ${totalQuestions}

Content:
${pdfText.slice(0, 15000)}

MANDATORY FORMAT - Follow this EXACTLY:

For MULTIPLE CHOICE questions:
1. What is the question text?
A) First option
B) Second option*
C) Third option
D) Fourth option

For TRUE/FALSE questions:
2. Is this statement correct?
A) True*
B) False

For FILL-IN-THE-BLANK questions:
3. The capital of France is _____.
ANSWER: Paris

CRITICAL RULES:
1. Start output with "1." immediately - NO introduction text
2. For multiple-choice and true/false: EXACTLY ONE asterisk (*) marking the correct answer
3. For fill-blank: Use "ANSWER:" followed by ONLY 1-3 WORDS (no full sentences or long phrases)
4. Number questions sequentially: 1, 2, 3, etc.
5. Generate EXACTLY ${totalQuestions} questions total (${types.join(', ')})
6. DO NOT generate more or fewer than ${totalQuestions} questions
7. Adjust difficulty based on: ${difficulty === 'easy' ? 'Simple concepts, clear answers' : difficulty === 'medium' ? 'Moderate complexity, some reasoning' : 'Complex concepts, critical thinking required'}
8. End after the last question - NO conclusion text
9. Fill-in-the-blank answers will be checked case-insensitively, so focus on the core term/concept

IMPORTANT: You must generate exactly ${totalQuestions} questions. No more, no less.

Generate the questions NOW:`;




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
              model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Good balance of cost and instruction following
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

    // Parse current generated questions if available
    const parsedQuestions = generatedQuestions ? parseQuizQuestions(generatedQuestions) : [];
    const questionsContext = parsedQuestions.length > 0 
      ? `\n\nCURRENT GENERATED QUESTIONS (${parsedQuestions.length} total):\n${parsedQuestions.map((q, idx) => {
          const typeLabel = q.type === 'multiple-choice' ? 'Multiple Choice' : 
                           q.type === 'true-false' ? 'True/False' : 'Fill-in-Blank';
          return `${idx + 1}. [${typeLabel}] ${q.question}\n   Options: ${q.options.join(', ')}\n   Correct: ${q.options[typeof q.correct === 'number' ? q.correct : 0]}`;
        }).join('\n\n')}`
      : '\n\nNo questions generated yet.';

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
   - Question types: Multiple choice with 4 options (A, B, C, D), True/False, Fill-in-the-blank
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
${pdfText ? `The user has uploaded a document. Here's the content:\n\n${pdfText.slice(0, 8000)}\n\nYou can answer questions about this document.` : 'No document uploaded yet.'}

${questionsContext}

YOUR ABILITIES:
- Help users understand QuizGod features
- Answer questions about uploaded documents
- Guide users on how to create effective quizzes
- Review and provide feedback on generated questions
- EDIT QUESTIONS: If user asks to modify questions, respond with the edited questions in the EXACT format below
- Add, remove, or modify specific questions when requested
- Improve question clarity and difficulty

EDITING QUESTIONS FORMAT:
When user asks to edit questions, respond ONLY with the edited questions in this format:

EDITED_QUESTIONS_START
1. Question text here?
A) Option 1
B) Option 2*
C) Option 3
D) Option 4

2. Another question?
A) True*
B) False

3. Fill in blank question text with _____.
ANSWER: correct answer
EDITED_QUESTIONS_END

Mark correct answers with asterisk (*) for multiple choice and true/false.
For fill-blank, use ANSWER: format.

Be friendly, concise, and helpful. When discussing the uploaded document or questions, provide specific answers based on content.`;

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
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        let assistantMessage = data.choices?.[0]?.message?.content;
        
        if (assistantMessage) {
          console.log('✅ Chat response from Groq');
          
          // Check if response contains edited questions
          const editedQuestionsMatch = assistantMessage.match(/EDITED_QUESTIONS_START\s*([\s\S]*?)\s*EDITED_QUESTIONS_END/);
          
          if (editedQuestionsMatch) {
            const editedQuestionsText = editedQuestionsMatch[1].trim();
            
            // Apply the edited questions
            setGeneratedQuestions(editedQuestionsText);
            
            // Update the assistant message to confirm the edit
            const beforeEdit = assistantMessage.substring(0, editedQuestionsMatch.index);
            const afterEdit = assistantMessage.substring(editedQuestionsMatch.index! + editedQuestionsMatch[0].length);
            
            const parsedCount = parseQuizQuestions(editedQuestionsText).length;
            const confirmMessage = `✅ I've updated the questions! (${parsedCount} questions parsed)\n\n${beforeEdit}${afterEdit}`.trim();
            
            assistantMessage = confirmMessage || `✅ I've updated ${parsedCount} questions for you!`;
            
            // Show success notification
            setTimeout(() => {
              alert(`✅ AI Assistant updated the questions!\n${parsedCount} questions have been edited and applied.`);
            }, 500);
          }
          
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
    // Split by question numbers more reliably - use positive lookahead to keep the number
    const questionBlocks = text.split(/(?=\d+\.\s+)/g).filter(block => block.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) continue;

      // Extract question number and text from first line
      const firstLineMatch = lines[0].match(/^\d+\.\s+(.+)$/);
      if (!firstLineMatch) continue;
      
      const questionText = firstLineMatch[1].replace(/\?$/, '').trim();
      
      // Check if it's a fill-blank question (has ANSWER: format)
      const answerMatch = block.match(/ANSWER:\s*(.+?)(?=\n\d+\.|$)/i);
      
      if (answerMatch) {
        // Fill-in-the-blank question
        const answer = answerMatch[1].trim().split('\n')[0].trim();
        
        questions.push({
          question: questionText,
          options: [answer],
          correct: 0,
          type: 'fill-blank'
        });
      } else {
        // Multiple choice or True/False question
        const options = [];
        let correctIndex = -1;
        let foundAsterisk = false;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          // Stop if we hit the next question or ANSWER: line
          if (line.match(/^\d+\.\s+/) || line.match(/^ANSWER:/i)) break;
          
          // Match patterns like "A) text*", "A. text*", "A: text*" or just "A text*"
          const match = line.match(/^[A-D][\)\.:\s]+(.+?)$/i);
          if (match && options.length < 4) {
            const optionText = match[1].trim();
            const hasAsterisk = optionText.includes('*');
            const cleanText = optionText.replace(/\*+/g, '').trim();
            
            options.push(cleanText);
            
            if (hasAsterisk && !foundAsterisk) {
              correctIndex = options.length - 1;
              foundAsterisk = true;
            }
          }
        }

        if (questionText && options.length >= 2) {
          if (correctIndex === -1) {
            console.warn(`No correct answer marked for question: "${questionText}". Defaulting to option A.`);
            correctIndex = 0;
          }
          
          // Determine if it's True/False or Multiple Choice
          const isTrueFalse = options.length === 2 && 
            options.some(opt => opt.toLowerCase() === 'true') && 
            options.some(opt => opt.toLowerCase() === 'false');
          
          questions.push({
            question: questionText,
            options,
            correct: correctIndex,
            type: isTrueFalse ? 'true-false' : 'multiple-choice'
          });
        }
      }
    }

    return questions;
  };

  // Validate parsed questions against requested count
  const validateQuestionCount = (parsedQuestions: Question[], requestedTypes: typeof questionTypes) => {
    const totalRequested = Object.values(requestedTypes).reduce((sum, count) => sum + count, 0);
    const totalParsed = parsedQuestions.length;

    // Count by type
    const parsedCounts = {
      'multiple-choice': parsedQuestions.filter(q => q.type === 'multiple-choice').length,
      'true-false': parsedQuestions.filter(q => q.type === 'true-false').length,
      'fill-blank': parsedQuestions.filter(q => q.type === 'fill-blank').length,
    };

    const warnings = [];
    
    if (totalParsed !== totalRequested) {
      warnings.push(`⚠️ Expected ${totalRequested} questions but parsed ${totalParsed}`);
    }

    if (requestedTypes['multiple-choice'] > 0 && parsedCounts['multiple-choice'] !== requestedTypes['multiple-choice']) {
      warnings.push(`⚠️ Multiple Choice: Expected ${requestedTypes['multiple-choice']}, got ${parsedCounts['multiple-choice']}`);
    }

    if (requestedTypes['true-false'] > 0 && parsedCounts['true-false'] !== requestedTypes['true-false']) {
      warnings.push(`⚠️ True/False: Expected ${requestedTypes['true-false']}, got ${parsedCounts['true-false']}`);
    }

    if (requestedTypes['fill-blank'] > 0 && parsedCounts['fill-blank'] !== requestedTypes['fill-blank']) {
      warnings.push(`⚠️ Fill-in-Blank: Expected ${requestedTypes['fill-blank']}, got ${parsedCounts['fill-blank']}`);
    }

    return warnings;
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
        isPersonal: !selectedClass || selectedClass === "",
        difficulty: difficulty,
        timerType: timerType,
        timerDuration: timerType === 'whole-quiz' ? timerDuration * 60 : timerDuration
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
        setSaving(false);
        return;
      }

      // Validate question count
      const warnings = validateQuestionCount(parsedQuestions, questionTypes);
      if (warnings.length > 0) {
        const warningMessage = warnings.join('\n');
        const proceed = confirm(
          `${warningMessage}\n\nParsed ${parsedQuestions.length} questions total.\n\nDo you want to continue creating the quiz with the parsed questions?`
        );
        if (!proceed) {
          setSaving(false);
          return;
        }
      }
      
      const quizData: Omit<FirebaseQuiz, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        subject: subject,
        questions: parsedQuestions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === "",
        difficulty: difficulty,
        timerType: timerType,
        timerDuration: timerType === 'whole-quiz' ? timerDuration * 60 : timerDuration
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
                  onClick={() => {
                    if (!isPremium && !checkingPremium) {
                      setMode('ai'); // Set mode to 'ai' to show premium content
                      return;
                    }
                    setMode('ai');
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition-all relative ${
                    mode === 'ai'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🤖 AI Generator
                  {!isPremium && !checkingPremium && (
                    <span className="absolute -top-1 -right-1 text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                      PRO
                    </span>
                  )}
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

                    {/* Quiz Settings */}
                    <div className="glass-card rounded-2xl p-4 md:p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-white/10">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>⚙️</span>
                        Quiz Settings
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Difficulty Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            🎯 Difficulty Level
                          </label>
                          <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          >
                            <option value="easy" className="bg-slate-800">🟢 Easy</option>
                            <option value="medium" className="bg-slate-800">🟡 Medium</option>
                            <option value="hard" className="bg-slate-800">🔴 Hard</option>
                          </select>
                        </div>

                        {/* Timer Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            ⏱️ Timer Type
                          </label>
                          <select
                            value={timerType}
                            onChange={(e) => setTimerType(e.target.value as 'none' | 'per-question' | 'whole-quiz')}
                            className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                          >
                            <option value="none" className="bg-slate-800">No Timer</option>
                            <option value="per-question" className="bg-slate-800">Per Question</option>
                            <option value="whole-quiz" className="bg-slate-800">Whole Quiz</option>
                          </select>
                        </div>

                        {/* Timer Duration - Only show if timer is enabled */}
                        {timerType !== 'none' && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              ⏲️ Timer Duration
                            </label>
                            <input
                              type="number"
                              min="10"
                              max={timerType === 'whole-quiz' ? "180" : "300"}
                              value={timerDuration}
                              onChange={(e) => setTimerDuration(parseInt(e.target.value) || 60)}
                              className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder={timerType === 'whole-quiz' ? "Minutes for entire quiz" : "Seconds per question"}
                            />
                            <p className="text-xs text-slate-400 mt-1">
                              {timerType === 'whole-quiz' ? '⏰ Minutes for entire quiz' : '⏰ Seconds per question'}
                            </p>
                          </div>
                        )}
                      </div>
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
                            {/* Question Type Selector */}
                            <div>
                              <label className="block text-xs text-slate-300 mb-2">Question Type</label>
                              <select
                                value={q.type || 'multiple-choice'}
                                onChange={(e) => {
                                  const newType = e.target.value as 'multiple-choice' | 'true-false' | 'fill-blank';
                                  // Adjust options based on type
                                  let newOptions = [...q.options];
                                  let newCorrect = q.correct;
                                  
                                  if (newType === 'true-false') {
                                    newOptions = ['True', 'False'];
                                    newCorrect = 0;
                                  } else if (newType === 'fill-blank') {
                                    newOptions = [''];
                                    newCorrect = 0;
                                  } else if (newOptions.length < 4) {
                                    newOptions = ['', '', '', ''];
                                    newCorrect = 0;
                                  }
                                  
                                  updateQuestion(i, { type: newType, options: newOptions, correct: newCorrect });
                                }}
                                className="w-full p-2 text-sm border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                              >
                                <option value="multiple-choice" className="bg-slate-800">📝 Multiple Choice</option>
                                <option value="true-false" className="bg-slate-800">✓✗ True/False</option>
                                <option value="fill-blank" className="bg-slate-800">📋 Fill in the Blank (1-3 words)</option>
                              </select>
                            </div>

                            {/* Question Text */}
                            <input 
                              className="w-full p-2 md:p-3 text-sm md:text-base border border-white/30 bg-white/10 text-white placeholder-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" 
                              placeholder="Enter your question..." 
                              value={q.question} 
                              onChange={e => updateQuestion(i, { question: e.target.value })}
                            />
                            
                            {/* Dynamic Options based on Question Type */}
                            {(q.type === 'multiple-choice' || !q.type) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                                {q.options.slice(0, 4).map((option, oi) => (
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
                            )}

                            {q.type === 'true-false' && (
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-3 rounded-lg border-2 border-white/20 hover:border-green-400 transition-all">
                                  <input 
                                    type="radio" 
                                    name={`correct-${i}`} 
                                    checked={q.correct === 0} 
                                    onChange={() => updateQuestion(i, { correct: 0, options: ['True', 'False'] })}
                                    className="text-green-500 focus:ring-green-400"
                                  />
                                  <span className="text-white font-semibold">✓ True</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-3 rounded-lg border-2 border-white/20 hover:border-red-400 transition-all">
                                  <input 
                                    type="radio" 
                                    name={`correct-${i}`} 
                                    checked={q.correct === 1} 
                                    onChange={() => updateQuestion(i, { correct: 1, options: ['True', 'False'] })}
                                    className="text-red-500 focus:ring-red-400"
                                  />
                                  <span className="text-white font-semibold">✗ False</span>
                                </label>
                              </div>
                            )}

                            {q.type === 'fill-blank' && (
                              <div>
                                <label className="block text-xs text-slate-300 mb-2">Correct Answer</label>
                                <input 
                                  className="w-full p-2 md:p-3 text-sm md:text-base border border-white/30 bg-white/10 text-white placeholder-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" 
                                  placeholder="Enter the correct answer..." 
                                  value={q.options[0] || ''} 
                                  onChange={e => updateQuestion(i, { options: [e.target.value], correct: 0 })}
                                />
                              </div>
                            )}
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
                  <>
                    {!isPremium && !checkingPremium ? (
                      // Premium Upgrade Content in Main Area
                      <div className="glass-card rounded-3xl p-8 md:p-12 text-center max-w-3xl mx-auto">
                        <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-bounce-soft">
                          ⭐
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                          Upgrade to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Premium</span>
                        </h2>
                        <p className="text-xl text-slate-300 mb-8">
                          AI Quiz Generator is available for Premium users
                        </p>
                        
                        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                          <h3 className="text-xl font-bold text-white mb-4">✨ Premium Benefits</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-left">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🚀</span>
                              <div>
                                <p className="text-white font-semibold">Unlimited AI Generation</p>
                                <p className="text-sm text-slate-400">Generate as many quizzes as you need</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🎯</span>
                              <div>
                                <p className="text-white font-semibold">Advanced Question Types</p>
                                <p className="text-sm text-slate-400">Multiple choice, true/false, fill-blank & more</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">📊</span>
                              <div>
                                <p className="text-white font-semibold">Detailed Analytics</p>
                                <p className="text-sm text-slate-400">Track performance and progress</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🔒</span>
                              <div>
                                <p className="text-white font-semibold">Priority Support</p>
                                <p className="text-sm text-slate-400">Get help when you need it</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <button
                            onClick={() => setMode('manual')}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
                          >
                            Use Manual Mode
                          </button>
                          <button
                            onClick={() => window.location.href = '/premium'}
                            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:scale-105"
                          >
                            🚀 Upgrade to Premium
                          </button>
                        </div>

                        <p className="text-slate-400 text-sm mt-6">
                          Starting at just $5/month • Cancel anytime
                        </p>
                      </div>
                    ) : (
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
                          
                          {/* OCR Checkbox - Show always for AI mode */}
                          <div className="mb-3 bg-white/5 rounded-xl p-3 border border-white/10">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useOCR}
                                onChange={(e) => setUseOCR(e.target.checked)}
                                disabled={isExtracting}
                                className="mt-0.5 w-4 h-4 rounded border-2 border-purple-400 bg-white/10 checked:bg-purple-500 checked:border-purple-500 cursor-pointer disabled:opacity-50"
                              />
                              <div className="flex-1">
                                <span className="text-white font-medium text-sm">Enable OCR (Optical Character Recognition)</span>
                                <p className="text-xs text-slate-400 mt-1">
                                  Extract text from scanned PDFs and images in documents. 
                                  <strong className="text-yellow-400"> Note: This will be slower but more accurate for scanned documents.</strong>
                                </p>
                              </div>
                            </label>
                          </div>
                          
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
                            {pdfFile ? 'Change Document' : '📤 Choose Document'}
                          </button>

                          {/* Start OCR Button - Show when text is extracted but user wants additional OCR */}
                          {pdfFile && useOCR && !isExtracting && pdfText && !pdfText.includes('--- OCR Text ---') && (
                            <button
                              onClick={handleStartOCR}
                              className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-bold text-sm shadow-lg"
                            >
                              🔍 Run Additional OCR Processing
                            </button>
                          )}

                          {/* File Info */}
                          {pdfFile && !isExtracting && pdfText && (
                            <div className="mt-3 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-green-300">✓</span>
                                <span className="text-sm text-green-200">
                                  {pdfFile.name.length > 30 ? pdfFile.name.substring(0, 30) + '...' : pdfFile.name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {pdfText.includes('--- OCR Text ---') 
                                  ? 'Text extracted with OCR' 
                                  : useOCR 
                                    ? 'Text extracted (click "Run Additional OCR" for image text)'
                                    : 'Text extracted (embedded text only)'}
                              </p>
                            </div>
                          )}
                          
                          {/* OCR Processing Indicator */}
                          {isExtracting && (
                            <div className="mt-3 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-spin">
                                  <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"></div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-bold text-sm">
                                    {ocrProgress.total > 0 
                                      ? `Processing Page ${ocrProgress.current} of ${ocrProgress.total}`
                                      : 'Extracting text from document...'}
                                  </p>
                                </div>
                              </div>
                              {ocrProgress.total > 0 && (
                                <>
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
                                </>
                              )}
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

                        {/* Difficulty Level */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center text-xl">
                              🎯
                            </div>
                            <label className="text-base font-bold text-white">Difficulty Level</label>
                          </div>
                          <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                            className="w-full p-3 text-base font-semibold border border-white/20 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="easy" className="bg-slate-800">🟢 Easy</option>
                            <option value="medium" className="bg-slate-800">🟡 Medium</option>
                            <option value="hard" className="bg-slate-800">🔴 Hard</option>
                          </select>
                        </div>

                        {/* Timer Settings */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl">
                              ⏱️
                            </div>
                            <label className="text-base font-bold text-white">Timer Type</label>
                          </div>
                          <select
                            value={timerType}
                            onChange={(e) => setTimerType(e.target.value as 'none' | 'per-question' | 'whole-quiz')}
                            className="w-full p-3 text-base font-semibold border border-white/20 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                          >
                            <option value="none" className="bg-slate-800">No Timer</option>
                            <option value="per-question" className="bg-slate-800">Per Question</option>
                            <option value="whole-quiz" className="bg-slate-800">Whole Quiz</option>
                          </select>
                          
                          {timerType !== 'none' && (
                            <div>
                              <label className="block text-sm text-slate-300 mb-2">
                                ⏲️ Duration {timerType === 'whole-quiz' ? '(minutes)' : '(seconds)'}
                              </label>
                              <input
                                type="number"
                                min="10"
                                max={timerType === 'whole-quiz' ? "180" : "300"}
                                value={timerDuration}
                                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 60)}
                                className="w-full p-3 text-lg font-bold border border-white/20 bg-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                              />
                            </div>
                          )}
                        </div>

                        {/* Question Types with Quantities */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                              🔢
                            </div>
                            <label className="text-base font-bold text-white">Question Types</label>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Multiple Choice */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                              <label className="block text-sm text-slate-300 mb-2">📝 Multiple Choice</label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={questionTypes['multiple-choice']}
                                onChange={(e) => setQuestionTypes({...questionTypes, 'multiple-choice': parseInt(e.target.value) || 0})}
                                className="w-full p-2 text-base font-semibold border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-center"
                              />
                            </div>

                            {/* True/False */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                              <label className="block text-sm text-slate-300 mb-2">✓✗ True/False</label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={questionTypes['true-false']}
                                onChange={(e) => setQuestionTypes({...questionTypes, 'true-false': parseInt(e.target.value) || 0})}
                                className="w-full p-2 text-base font-semibold border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-center"
                              />
                            </div>

                            {/* Fill in the Blank */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                              <label className="block text-sm text-slate-300 mb-2">📋 Fill in the Blank</label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={questionTypes['fill-blank']}
                                onChange={(e) => setQuestionTypes({...questionTypes, 'fill-blank': parseInt(e.target.value) || 0})}
                                className="w-full p-2 text-base font-semibold border border-white/20 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-center"
                              />
                            </div>

                            {/* Total Questions Display */}
                            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-3 border-2 border-purple-400/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-300">Total Questions:</span>
                                <span className="text-2xl font-bold text-white">
                                  {questionTypes['multiple-choice'] + questionTypes['true-false'] + questionTypes['fill-blank']}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Generate Button */}
                        <div>
                          <button
                            onClick={generateWithGemini}
                            disabled={isGenerating || isExtracting || !pdfFile}
                            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                          >
                            {isGenerating ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Generating...
                              </span>
                            ) : isExtracting ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Extracting Text...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                ✨ Generate Questions
                              </span>
                            )}
                          </button>
                          {!pdfFile && (
                            <p className="text-xs text-slate-400 mt-2 text-center">Upload a document first</p>
                          )}
                          {pdfFile && isExtracting && (
                            <p className="text-xs text-blue-400 mt-2 text-center">⏳ Extracting text from document...</p>
                          )}
                          {pdfFile && !isExtracting && pdfText && (
                            <p className="text-xs text-green-400 mt-2 text-center">✓ Ready to generate questions!</p>
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
                            <p className="text-xs text-slate-300">
                              {generatedQuestions 
                                ? 'Ask me to review or edit your questions!' 
                                : 'Chat about your document'}
                            </p>
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
                              <p className="font-semibold text-slate-300">Ask questions about your document!</p>
                              <p className="text-xs mt-2">Upload a document first, then chat with AI</p>
                              {generatedQuestions && (
                                <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-lg text-left">
                                  <p className="text-xs font-semibold text-cyan-300 mb-1">💡 Pro Tip:</p>
                                  <p className="text-xs text-slate-300">
                                    I can see your generated questions! Try asking me to:
                                  </p>
                                  <ul className="text-xs text-slate-400 mt-1 space-y-1 list-disc list-inside">
                                    <li>Review the questions</li>
                                    <li>Make question 3 easier</li>
                                    <li>Improve question clarity</li>
                                    <li>Change the difficulty level</li>
                                  </ul>
                                </div>
                              )}
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
                    </div>
                  </div>
                )}
              </>
            )}
                  </>
                )}
        </div>

          {/* Right Column - Generated Questions Preview (only in AI mode) */}
          {mode === 'ai' && isPremium && generatedQuestions && (
            <div className="glass-card rounded-3xl p-4 md:p-6 animate-slide-up lg:sticky lg:top-4 lg:self-start">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-lg md:text-xl font-bold text-white">Generated Questions</h4>
                    <p className="text-sm text-slate-300">Review your quiz</p>
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 mb-4 max-h-[calc(100vh-300px)] overflow-y-auto border border-white/10">
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
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Center Ad - Only for non-premium users */}
      {!(userProfile?.isPremium || userProfile?.role === 'admin') && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <AdsterraAd 
            atOptions={{
              key: 'e478b629ee3a3e02c8e9579be23fe46d',
              format: 'iframe',
              height: 90,
              width: 728,
              params: {}
            }}
          />
        </div>
      )}

    </div>
  );
}

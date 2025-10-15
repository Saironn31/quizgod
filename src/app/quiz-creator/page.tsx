"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';
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
        } else {
          localStorage.removeItem('create_quiz_draft_v3');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem('create_quiz_draft_v3');
    }
  }, []);

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
      timestamp: Date.now()
    };
    
    localStorage.setItem('create_quiz_draft_v3', JSON.stringify(draft));
  }, [mode, title, subject, selectedClass, description, questions, numQuestions, generatedQuestions, pdfText]);

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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

    try {
      // Handle PDF files with OCR
      if (file.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';
      let ocrText = '';
      
      // Extract embedded text using PDF.js
      console.log(`Extracting text from ${pdf.numPages} pages...`);
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        extractedText += pageText + '\n\n';
      }
      
      console.log(`Extracted ${extractedText.length} characters from embedded text`);
      
      // Run OCR only if enabled
      if (useOCR) {
        console.log('Running OCR on all pages...');
        
        const Tesseract = await import('tesseract.js');
        
        // Create a Tesseract worker with CDN configuration
        const worker = await Tesseract.createWorker('eng', 1, {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        setOcrProgress({ current: 0, total: pdf.numPages, percentage: 0 });
        
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); // Reduced from 2.0 for speed
            
            // Create canvas to render PDF page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              
              // Update progress before OCR
              setOcrProgress({ 
                current: i, 
                total: pdf.numPages, 
                percentage: Math.round((i / pdf.numPages) * 100) 
              });
              
              // Run OCR on the rendered page
              console.log(`Processing page ${i}/${pdf.numPages}...`);
              const { data } = await worker.recognize(canvas);
              ocrText += data.text + '\n\n';
            }
          } catch (ocrError) {
            console.error(`OCR failed for page ${i}:`, ocrError);
          }
        }
        
        // Terminate worker
        await worker.terminate();
        
        console.log(`OCR extracted ${ocrText.length} characters`);
        
        // Combine both texts
        const combinedText = extractedText + '\n\n--- OCR Text ---\n\n' + ocrText;
        setPdfText(combinedText);
        
        console.log(`Total text: ${combinedText.length} characters`);
      } else {
        // Just use extracted text without OCR
        setPdfText(extractedText);
        console.log(`Total text (no OCR): ${extractedText.length} characters`);
      }
      }
      // Handle DOCX files with OCR for images
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        const mammoth = await import('mammoth');
        const JSZip = await import('jszip');
        const arrayBuffer = await file.arrayBuffer();
        
        // Extract text content
        const result = await mammoth.extractRawText({ arrayBuffer });
        let docxText = result.value;
        console.log(`Extracted ${docxText.length} characters from Word document`);
        
        // Extract and OCR images if enabled
        if (useOCR) {
          try {
            const Tesseract = await import('tesseract.js');
            const zip = await JSZip.default.loadAsync(file);
            
            // Find all image files in the Word document
            const imageFiles = Object.keys(zip.files).filter(name => 
              name.startsWith('word/media/') && 
              (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif'))
            );
            
            if (imageFiles.length > 0) {
              console.log(`Found ${imageFiles.length} images in Word document. Running OCR...`);
              
              const worker = await Tesseract.createWorker('eng', 1, {
                workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
                logger: (m: any) => {
                  if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                  }
                }
              });
              
              setOcrProgress({ current: 0, total: imageFiles.length, percentage: 0 });
              let imageOcrText = '';
              
              for (let i = 0; i < imageFiles.length; i++) {
                try {
                  const imageFile = imageFiles[i];
                  const imageData = await zip.files[imageFile].async('base64');
                  const imageUrl = `data:image/${imageFile.split('.').pop()};base64,${imageData}`;
                  
                  setOcrProgress({ 
                    current: i + 1, 
                    total: imageFiles.length, 
                    percentage: Math.round(((i + 1) / imageFiles.length) * 100) 
                  });
                  
                  console.log(`OCR on image ${i + 1}/${imageFiles.length}...`);
                  const { data } = await worker.recognize(imageUrl);
                  imageOcrText += data.text + '\n\n';
                } catch (imgError) {
                  console.error(`OCR failed for image ${i + 1}:`, imgError);
                }
              }
              
              await worker.terminate();
              
              if (imageOcrText.trim()) {
                docxText += '\n\n--- Text from Images (OCR) ---\n\n' + imageOcrText;
                console.log(`OCR extracted ${imageOcrText.length} characters from images`);
              }
            }
          } catch (ocrError) {
            console.error('OCR processing error:', ocrError);
          }
        }
        
        setPdfText(docxText);
        console.log(`Total text from Word: ${docxText.length} characters`);
      }
      // Handle PPTX files with OCR for images
      else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.type === 'application/vnd.ms-powerpoint') {
        try {
          const JSZip = await import('jszip');
          const zip = await JSZip.default.loadAsync(file);
          let fullText = '';
          
          // Extract text from slides
          const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
          
          for (const slideName of slideFiles) {
            const slideContent = await zip.files[slideName].async('string');
            // Extract text between <a:t> tags (PowerPoint text tags)
            const textMatches = slideContent.match(/<a:t>([^<]+)<\/a:t>/g);
            if (textMatches) {
              const slideText = textMatches.map(match => match.replace(/<\/?a:t>/g, '')).join(' ');
              fullText += slideText + '\n\n';
            }
          }
          
          console.log(`Extracted ${fullText.length} characters from PowerPoint text`);
          
          // Extract and OCR images if enabled
          if (useOCR) {
            try {
              const Tesseract = await import('tesseract.js');
              
              // Find all image files in the PowerPoint
              const imageFiles = Object.keys(zip.files).filter(name => 
                name.startsWith('ppt/media/') && 
                (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.emf') || name.endsWith('.wmf'))
              );
              
              if (imageFiles.length > 0) {
                console.log(`Found ${imageFiles.length} images in PowerPoint. Running OCR...`);
                
                const worker = await Tesseract.createWorker('eng', 1, {
                  workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
                  corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
                  logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                      console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                  }
                });
                
                setOcrProgress({ current: 0, total: imageFiles.length, percentage: 0 });
                let imageOcrText = '';
                
                for (let i = 0; i < imageFiles.length; i++) {
                  try {
                    const imageFile = imageFiles[i];
                    const imageExt = imageFile.split('.').pop()?.toLowerCase();
                    
                    // Skip vector formats that Tesseract can't process
                    if (imageExt === 'emf' || imageExt === 'wmf') {
                      console.log(`Skipping vector image: ${imageFile}`);
                      continue;
                    }
                    
                    const imageData = await zip.files[imageFile].async('base64');
                    const imageUrl = `data:image/${imageExt};base64,${imageData}`;
                    
                    setOcrProgress({ 
                      current: i + 1, 
                      total: imageFiles.length, 
                      percentage: Math.round(((i + 1) / imageFiles.length) * 100) 
                    });
                    
                    console.log(`OCR on image ${i + 1}/${imageFiles.length}...`);
                    const { data } = await worker.recognize(imageUrl);
                    imageOcrText += data.text + '\n\n';
                  } catch (imgError) {
                    console.error(`OCR failed for image ${i + 1}:`, imgError);
                  }
                }
                
                await worker.terminate();
                
                if (imageOcrText.trim()) {
                  fullText += '\n\n--- Text from Images (OCR) ---\n\n' + imageOcrText;
                  console.log(`OCR extracted ${imageOcrText.length} characters from images`);
                }
              }
            } catch (ocrError) {
              console.error('OCR processing error:', ocrError);
            }
          }
          
          if (!fullText.trim()) {
            throw new Error('No text content found in PowerPoint file');
          }
          
          setPdfText(fullText);
          console.log(`Total text from PowerPoint: ${fullText.length} characters`);
        } catch (error) {
          console.error('PowerPoint extraction error:', error);
          setError('Failed to extract text from PowerPoint. The file might be password-protected or corrupted.');
          setIsExtracting(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error extracting document:', error);
      setError('Failed to extract text from document. Please try again.');
    } finally {
      setIsExtracting(false);
      setOcrProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const generateWithGemini = async () => {
    if (!title.trim() || !subject) {
      alert("Please fill in quiz title and select a subject");
      return;
    }

    if (!pdfText) {
      alert("Please upload a document (PDF/Word/PowerPoint) file");
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      alert("Please configure your Gemini API key in .env.local file.\n\nGet your free API key from: https://makersuite.google.com/app/apikey");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      console.log('Starting Gemini API request...');
      console.log('API Key exists:', !!apiKey);
      console.log('PDF Text length:', pdfText?.length || 0);
      
      const basePrompt = `Create ${numQuestions} multiple choice quiz questions about ${subject}.

Based on this content:
${pdfText.slice(0, 10000)}

Format each question EXACTLY like this:
1. Question text here?
A) Option 1
B) Option 2*
C) Option 3
D) Option 4

Mark the correct answer with an asterisk (*).
Provide exactly ${numQuestions} questions.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: basePrompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
        throw new Error(`API request failed (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No content generated from AI. Please try again.');
      }

      setGeneratedQuestions(generatedText);
    } catch (error) {
      console.error('Error generating with Gemini:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate questions. Please try again.';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseQuizQuestions = (text: string) => {
    const questions: Question[] = [];
    const questionBlocks = text.split(/\d+\.\s+/).filter(block => block.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 5) continue;

      const questionText = lines[0].replace(/\?$/, '').trim();
      const options = [];
      let correctIndex = 0;

      for (let i = 1; i < lines.length && options.length < 4; i++) {
        const line = lines[i].trim();
        const match = line.match(/^[A-D][\)\.]?\s*(.+?)(\*)?$/i);
        if (match) {
          options.push(match[1].trim().replace(/\*$/, ''));
          if (match[2] || line.includes('*')) {
            correctIndex = options.length - 1;
          }
        }
      }

      if (questionText && options.length === 4) {
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
              <Link href="/quizzes" className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow w-full sm:w-auto text-center">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="relative z-10 mb-6">
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
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Subject *</label>
                      <select 
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
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
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Add to Class (Optional)</label>
                    <select 
                      className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
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
                  <div className="space-y-4 md:space-y-6">
                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PDF Upload - Large Card */}
                      <div className="md:col-span-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-2xl p-6 animate-slide-up">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl shrink-0">
                            📄
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg md:text-xl font-bold text-white mb-1">Upload Study Material</h4>
                            <p className="text-sm text-slate-300">PDF, Word (.docx), or PowerPoint (.pptx) - AI will extract and generate questions</p>
                          </div>
                        </div>
                        
                        {/* OCR Checkbox - For all document types */}
                        {pdfFile && (
                        <div className="mb-4 bg-white/5 rounded-xl p-4 border border-white/10">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useOCR}
                              onChange={(e) => setUseOCR(e.target.checked)}
                              className="mt-1 w-5 h-5 rounded border-2 border-purple-400 bg-white/10 checked:bg-purple-500 checked:border-purple-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="text-white font-medium">Enable OCR (Optical Character Recognition)</span>
                              <p className="text-xs text-slate-400 mt-1">
                                {pdfFile.type === 'application/pdf' 
                                  ? 'Extract text from scanned PDFs and images. Recommended for better accuracy but takes longer.'
                                  : 'Extract text from images embedded in your document. Useful for slides with screenshots or diagrams containing text.'}
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
                          className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-bold disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                        >
                          {isExtracting ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              {useOCR && ocrProgress.total > 0 
                                ? `Processing OCR: ${ocrProgress.current}/${ocrProgress.total} pages (${ocrProgress.percentage}%)`
                                : 'Extracting text from PDF...'}
                            </span>
                          ) : pdfFile ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="text-green-300">✓</span>
                              {pdfFile.name}
                            </span>
                          ) : (
                            "📤 Choose Document (PDF/Word/PPT)"
                          )}
                        </button>
                        
                        {/* OCR Progress Bar */}
                        {isExtracting && useOCR && ocrProgress.total > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                              <span>OCR Progress</span>
                              <span className="font-semibold">{ocrProgress.percentage}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${ocrProgress.percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Processing page {ocrProgress.current} of {ocrProgress.total}
                            </p>
                          </div>
                        )}
                        
                        {pdfText && (
                          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-white">✓ Text Extracted Successfully</p>
                                <p className="text-xs text-slate-400 mt-1">{pdfText.length.toLocaleString()} characters ready for AI processing</p>
                              </div>
                              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-xl">
                                ✓
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Number of Questions - Small Card */}
                      <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                            🔢
                          </div>
                          <label className="text-base font-bold text-white">Questions</label>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                          className="w-full p-3 text-lg font-bold border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                        />
                        <p className="text-xs text-slate-400 mt-2 text-center">AI will generate this many questions</p>
                      </div>

                      {/* Generate Button - Small Card */}
                      <div className="glass-card rounded-2xl p-6 flex flex-col justify-center animate-slide-up" style={{animationDelay: '0.2s'}}>
                        <button
                          onClick={generateWithGemini}
                          disabled={isGenerating || !pdfText}
                          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
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
                          <p className="text-xs text-slate-400 mt-3 text-center">Upload a document first</p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl animate-slide-up">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">⚠️</span>
                          <div>
                            <p className="font-semibold text-red-300">Error</p>
                            <p className="text-sm text-red-200 mt-1">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

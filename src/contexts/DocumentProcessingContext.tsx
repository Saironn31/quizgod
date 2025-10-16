'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface OcrProgress {
  current: number;
  total: number;
  percentage: number;
}

interface ProcessingJob {
  id: string;
  fileName: string;
  fileType: string;
  isExtracting: boolean;
  ocrProgress: OcrProgress;
  extractedText: string;
  error: string | null;
  startTime: number;
}

interface DocumentProcessingContextType {
  currentJob: ProcessingJob | null;
  startProcessing: (file: File, useOCR: boolean, onComplete: (text: string) => void, onProgress: (progress: OcrProgress) => void) => string;
  cancelProcessing: (jobId: string) => void;
  getJobStatus: (jobId: string) => ProcessingJob | null;
}

const DocumentProcessingContext = createContext<DocumentProcessingContextType | undefined>(undefined);

export const useDocumentProcessing = () => {
  const context = useContext(DocumentProcessingContext);
  if (!context) {
    throw new Error('useDocumentProcessing must be used within DocumentProcessingProvider');
  }
  return context;
};

export const DocumentProcessingProvider = ({ children }: { children: ReactNode }) => {
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const jobsRef = useRef<Map<string, ProcessingJob>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const callbacksRef = useRef<Map<string, { onComplete: (text: string) => void; onProgress: (progress: OcrProgress) => void }>>(new Map());

  // Load job from localStorage on mount
  useEffect(() => {
    console.log('[DocumentProcessingContext] Initializing...');
    const savedJob = localStorage.getItem('document_processing_job');
    if (savedJob) {
      try {
        const job = JSON.parse(savedJob);
        console.log('[DocumentProcessingContext] Found saved job:', job);
        // Only restore if job is less than 1 hour old and still processing
        if (job.isExtracting && Date.now() - job.startTime < 3600000) {
          console.log('[DocumentProcessingContext] Restoring active job');
          setCurrentJob(job);
          jobsRef.current.set(job.id, job);
        } else {
          console.log('[DocumentProcessingContext] Job expired or completed, removing');
          localStorage.removeItem('document_processing_job');
        }
      } catch (error) {
        console.error('[DocumentProcessingContext] Failed to restore processing job:', error);
        localStorage.removeItem('document_processing_job');
      }
    } else {
      console.log('[DocumentProcessingContext] No saved job found');
    }
  }, []);

  // Save job to localStorage whenever it changes
  useEffect(() => {
    if (currentJob) {
      console.log('[DocumentProcessingContext] Saving job to localStorage:', currentJob.id);
      localStorage.setItem('document_processing_job', JSON.stringify(currentJob));
    } else {
      console.log('[DocumentProcessingContext] Removing job from localStorage');
      localStorage.removeItem('document_processing_job');
    }
  }, [currentJob]);

  const updateJob = (jobId: string, updates: Partial<ProcessingJob>) => {
    setCurrentJob(prev => {
      if (prev?.id === jobId) {
        const updated = { ...prev, ...updates };
        jobsRef.current.set(jobId, updated);
        return updated;
      }
      return prev;
    });
  };

  const startProcessing = (
    file: File,
    useOCR: boolean,
    onComplete: (text: string) => void,
    onProgress: (progress: OcrProgress) => void
  ): string => {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[DocumentProcessingContext] Starting new job:', jobId, 'File:', file.name, 'OCR:', useOCR);
    
    const job: ProcessingJob = {
      id: jobId,
      fileName: file.name,
      fileType: file.type,
      isExtracting: true,
      ocrProgress: { current: 0, total: 0, percentage: 0 },
      extractedText: '',
      error: null,
      startTime: Date.now()
    };

    setCurrentJob(job);
    jobsRef.current.set(jobId, job);
    callbacksRef.current.set(jobId, { onComplete, onProgress });

    const abortController = new AbortController();
    abortControllersRef.current.set(jobId, abortController);

    console.log('[DocumentProcessingContext] Job initialized, starting extraction...');
    
    // Start the extraction process
    extractTextFromDocument(file, useOCR, jobId, abortController.signal);

    return jobId;
  };

  const cancelProcessing = (jobId: string) => {
    const controller = abortControllersRef.current.get(jobId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(jobId);
    }

    updateJob(jobId, { isExtracting: false, error: 'Cancelled by user' });
    callbacksRef.current.delete(jobId);
  };

  const getJobStatus = (jobId: string): ProcessingJob | null => {
    return jobsRef.current.get(jobId) || null;
  };

  const extractTextFromDocument = async (
    file: File,
    useOCR: boolean,
    jobId: string,
    signal: AbortSignal
  ) => {
    const callbacks = callbacksRef.current.get(jobId);
    if (!callbacks) return;

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
        console.log(`[Job ${jobId}] Extracting text from ${pdf.numPages} pages...`);
        for (let i = 1; i <= pdf.numPages; i++) {
          if (signal.aborted) return;
          
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n\n';
        }

        console.log(`[Job ${jobId}] Extracted ${extractedText.length} characters from embedded text`);

        // Run OCR only if enabled
        if (useOCR) {
          console.log(`[Job ${jobId}] Running OCR on all pages...`);

          const Tesseract = await import('tesseract.js');
          const worker = await Tesseract.createWorker('eng', 1, {
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
            corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                console.log(`[Job ${jobId}] OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          });

          updateJob(jobId, { ocrProgress: { current: 0, total: pdf.numPages, percentage: 0 } });

          for (let i = 1; i <= pdf.numPages; i++) {
            if (signal.aborted) {
              await worker.terminate();
              return;
            }

            try {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1.5 });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                await page.render({ canvasContext: context, viewport }).promise;

                const progress = {
                  current: i,
                  total: pdf.numPages,
                  percentage: Math.round((i / pdf.numPages) * 100)
                };
                updateJob(jobId, { ocrProgress: progress });
                callbacks.onProgress(progress);

                console.log(`[Job ${jobId}] Processing page ${i}/${pdf.numPages}...`);
                const { data } = await worker.recognize(canvas);
                ocrText += data.text + '\n\n';
              }
            } catch (ocrError) {
              console.error(`[Job ${jobId}] OCR failed for page ${i}:`, ocrError);
            }
          }

          await worker.terminate();
          console.log(`[Job ${jobId}] OCR extracted ${ocrText.length} characters`);

          const combinedText = extractedText + '\n\n--- OCR Text ---\n\n' + ocrText;
          completeJob(jobId, combinedText);
        } else {
          completeJob(jobId, extractedText);
        }
      }
      // Handle DOCX files
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        const mammoth = await import('mammoth');
        const JSZip = await import('jszip');
        const arrayBuffer = await file.arrayBuffer();

        const result = await mammoth.extractRawText({ arrayBuffer });
        let docxText = result.value;
        console.log(`[Job ${jobId}] Extracted ${docxText.length} characters from Word document`);

        if (useOCR) {
          const Tesseract = await import('tesseract.js');
          const zip = await JSZip.default.loadAsync(file);

          const imageFiles = Object.keys(zip.files).filter(name =>
            name.startsWith('word/media/') &&
            (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif'))
          );

          if (imageFiles.length > 0) {
            console.log(`[Job ${jobId}] Found ${imageFiles.length} images. Running OCR...`);

            const worker = await Tesseract.createWorker('eng', 1, {
              workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
              corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js'
            });

            updateJob(jobId, { ocrProgress: { current: 0, total: imageFiles.length, percentage: 0 } });

            let imageOcrText = '';

            for (let i = 0; i < imageFiles.length; i++) {
              if (signal.aborted) {
                await worker.terminate();
                return;
              }

              try {
                const imageFile = imageFiles[i];
                const imageData = await zip.files[imageFile].async('base64');
                const imageUrl = `data:image/${imageFile.split('.').pop()};base64,${imageData}`;

                const progress = {
                  current: i + 1,
                  total: imageFiles.length,
                  percentage: Math.round(((i + 1) / imageFiles.length) * 100)
                };
                updateJob(jobId, { ocrProgress: progress });
                callbacks.onProgress(progress);

                const { data } = await worker.recognize(imageUrl);
                imageOcrText += data.text + '\n\n';
              } catch (imgError) {
                console.error(`[Job ${jobId}] OCR failed for image ${i + 1}:`, imgError);
              }
            }

            await worker.terminate();

            if (imageOcrText.trim()) {
              docxText += '\n\n--- Text from Images (OCR) ---\n\n' + imageOcrText;
            }
          }
        }

        completeJob(jobId, docxText);
      }
      // Handle PPTX files
      else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.type === 'application/vnd.ms-powerpoint') {
        const JSZip = await import('jszip');
        const zip = await JSZip.default.loadAsync(file);
        let fullText = '';

        const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));

        for (const slideName of slideFiles) {
          const slideContent = await zip.files[slideName].async('string');
          const textMatches = slideContent.match(/<a:t>([^<]+)<\/a:t>/g);
          if (textMatches) {
            const slideText = textMatches.map(match => match.replace(/<\/?a:t>/g, '')).join(' ');
            fullText += slideText + '\n\n';
          }
        }

        console.log(`[Job ${jobId}] Extracted ${fullText.length} characters from PowerPoint text`);

        if (useOCR) {
          const Tesseract = await import('tesseract.js');

          const imageFiles = Object.keys(zip.files).filter(name =>
            name.startsWith('ppt/media/') &&
            (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif'))
          );

          if (imageFiles.length > 0) {
            console.log(`[Job ${jobId}] Found ${imageFiles.length} images. Running OCR...`);

            const worker = await Tesseract.createWorker('eng', 1, {
              workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
              corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js'
            });

            updateJob(jobId, { ocrProgress: { current: 0, total: imageFiles.length, percentage: 0 } });

            let imageOcrText = '';

            for (let i = 0; i < imageFiles.length; i++) {
              if (signal.aborted) {
                await worker.terminate();
                return;
              }

              try {
                const imageFile = imageFiles[i];
                const imageExt = imageFile.split('.').pop()?.toLowerCase();

                if (imageExt === 'emf' || imageExt === 'wmf') {
                  continue;
                }

                const imageData = await zip.files[imageFile].async('base64');
                const imageUrl = `data:image/${imageExt};base64,${imageData}`;

                const progress = {
                  current: i + 1,
                  total: imageFiles.length,
                  percentage: Math.round(((i + 1) / imageFiles.length) * 100)
                };
                updateJob(jobId, { ocrProgress: progress });
                callbacks.onProgress(progress);

                const { data } = await worker.recognize(imageUrl);
                imageOcrText += data.text + '\n\n';
              } catch (imgError) {
                console.error(`[Job ${jobId}] OCR failed for image ${i + 1}:`, imgError);
              }
            }

            await worker.terminate();

            if (imageOcrText.trim()) {
              fullText += '\n\n--- Text from Images (OCR) ---\n\n' + imageOcrText;
            }
          }
        }

        if (!fullText.trim()) {
          throw new Error('No text content found in PowerPoint file');
        }

        completeJob(jobId, fullText);
      }
    } catch (error) {
      console.error(`[Job ${jobId}] Error extracting document:`, error);
      if (!signal.aborted) {
        updateJob(jobId, {
          isExtracting: false,
          error: 'Failed to extract text from document. Please try again.'
        });
      }
    }
  };

  const completeJob = (jobId: string, text: string) => {
    const callbacks = callbacksRef.current.get(jobId);
    
    updateJob(jobId, {
      isExtracting: false,
      extractedText: text,
      ocrProgress: { current: 0, total: 0, percentage: 0 }
    });

    if (callbacks) {
      callbacks.onComplete(text);
      callbacksRef.current.delete(jobId);
    }

    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Document Processing Complete', {
        body: 'Text extraction finished! You can now generate quiz questions.',
        icon: '/favicon.ico'
      });
    }

    console.log(`[Job ${jobId}] Processing complete: ${text.length} characters extracted`);
  };

  const value = {
    currentJob,
    startProcessing,
    cancelProcessing,
    getJobStatus
  };

  return (
    <DocumentProcessingContext.Provider value={value}>
      {children}
    </DocumentProcessingContext.Provider>
  );
};

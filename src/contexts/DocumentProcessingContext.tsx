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
    const savedJob = localStorage.getItem('document_processing_job');
    if (savedJob) {
      try {
        const job = JSON.parse(savedJob);
        // Only restore if job is less than 1 hour old and still processing
        if (job.isExtracting && Date.now() - job.startTime < 3600000) {
          setCurrentJob(job);
          jobsRef.current.set(job.id, job);
        } else {
          localStorage.removeItem('document_processing_job');
        }
      } catch (error) {
        console.error('[DocumentProcessingContext] Failed to restore processing job:', error);
        localStorage.removeItem('document_processing_job');
      }
    }
  }, []);

  // Save job to localStorage whenever it changes
  useEffect(() => {
    if (currentJob) {
      localStorage.setItem('document_processing_job', JSON.stringify(currentJob));
    } else {
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
          console.log(`[Job ${jobId}] Running PARALLEL OCR on ${pdf.numPages} pages...`);

          const Tesseract = await import('tesseract.js');
          
          updateJob(jobId, { ocrProgress: { current: 0, total: pdf.numPages, percentage: 0 } });

          // Prepare all pages for OCR first
          const pageCanvases: { pageNum: number; canvas: HTMLCanvasElement }[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            if (signal.aborted) return;
            
            try {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1.5 });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                pageCanvases.push({ pageNum: i, canvas });
              }
            } catch (renderError) {
              console.error(`[Job ${jobId}] Failed to render page ${i}:`, renderError);
            }
          }

          console.log(`[Job ${jobId}] Rendered ${pageCanvases.length} pages, starting parallel OCR...`);

          // Create multiple workers for parallel processing
          const numWorkers = Math.min(4, pageCanvases.length); // Max 4 workers
          const workers = await Promise.all(
            Array.from({ length: numWorkers }, () =>
              Tesseract.createWorker('eng', 1, {
                workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
              })
            )
          );

          let completedPages = 0;
          const pageResults: { pageNum: number; text: string }[] = [];
          const progressLock = { value: 0 }; // For thread-safe progress updates

          // Process a single page
          const processPage = async (pageCanvas: { pageNum: number; canvas: HTMLCanvasElement }, workerIndex: number) => {
            if (signal.aborted) return;

            try {
              const worker = workers[workerIndex];
              console.log(`[Job ${jobId}] Worker ${workerIndex} processing page ${pageCanvas.pageNum}...`);
              
              const { data } = await worker.recognize(pageCanvas.canvas);
              
              progressLock.value++;
              const progress = {
                current: progressLock.value,
                total: pdf.numPages,
                percentage: Math.round((progressLock.value / pdf.numPages) * 100)
              };
              updateJob(jobId, { ocrProgress: progress });
              callbacks.onProgress(progress);

              pageResults.push({ pageNum: pageCanvas.pageNum, text: data.text });
              
              console.log(`[Job ${jobId}] Completed page ${pageCanvas.pageNum} (${progressLock.value}/${pdf.numPages})`);
            } catch (ocrError) {
              console.error(`[Job ${jobId}] OCR failed for page ${pageCanvas.pageNum}:`, ocrError);
            }
          };

          // Distribute pages across workers and process in parallel
          const processingQueue: Promise<void>[] = [];
          
          for (let i = 0; i < pageCanvases.length; i++) {
            if (signal.aborted) break;
            const workerIndex = i % numWorkers;
            
            // Add to processing queue
            processingQueue.push(processPage(pageCanvases[i], workerIndex));
            
            // Process in batches (one batch per worker to avoid overwhelming)
            if (processingQueue.length >= numWorkers || i === pageCanvases.length - 1) {
              await Promise.all(processingQueue);
              processingQueue.length = 0; // Clear the queue
            }
          }

          // Terminate all workers
          await Promise.all(workers.map(worker => worker.terminate()));

          // Sort results by page number and combine
          pageResults.sort((a, b) => a.pageNum - b.pageNum);
          ocrText = pageResults.map(r => r.text).join('\n\n');
          
          console.log(`[Job ${jobId}] Parallel OCR completed! Extracted ${ocrText.length} characters`);

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

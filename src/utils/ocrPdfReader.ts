/**
 * OCR-Enhanced PDF Reader
 * Extracts text from both text-based and scanned (image-based) PDFs
 */

export interface OCRExtractionResult {
  text: string;
  pageTexts: string[];
  isScanned: boolean;
  confidence: number;
  metadata: {
    totalPages: number;
    processingTime: number;
    ocrUsed: boolean;
  };
}

export class OCRPDFReader {
  private ocrWorker: any = null;

  async initializeOCR(): Promise<void> {
    if (!this.ocrWorker) {
      console.log('🤖 Initializing OCR worker...');
      
      // Dynamic import to avoid SSR issues
      const Tesseract = await import('tesseract.js');
      
      this.ocrWorker = await Tesseract.createWorker('eng', 1, {
        logger: m => console.log('OCR:', m)
      });
      
      console.log('✅ OCR worker initialized');
    }
  }

  async extractTextWithOCR(file: File, onProgress?: (progress: string) => void): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    
    try {
      if (onProgress) onProgress('🔍 Analyzing PDF structure...');

      // First, try to extract text directly
      const directTextResult = await this.tryDirectTextExtraction(file, onProgress);
      
      if (directTextResult.success && directTextResult.text.length > 100) {
        console.log('✅ Direct text extraction successful');
        return {
          text: directTextResult.text,
          pageTexts: directTextResult.pageTexts || [],
          isScanned: false,
          confidence: 0.95,
          metadata: {
            totalPages: directTextResult.pageCount || 1,
            processingTime: Date.now() - startTime,
            ocrUsed: false
          }
        };
      }

      // If direct extraction failed, use OCR
      console.log('📸 Direct text extraction failed, switching to OCR...');
      if (onProgress) onProgress('📸 Converting PDF to images for OCR...');

      const ocrResult = await this.extractTextWithOCRFallback(file, onProgress);
      
      return {
        text: ocrResult.text,
        pageTexts: ocrResult.pageTexts,
        isScanned: true,
        confidence: ocrResult.confidence,
        metadata: {
          totalPages: ocrResult.pageTexts.length,
          processingTime: Date.now() - startTime,
          ocrUsed: true
        }
      };

    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async tryDirectTextExtraction(file: File, onProgress?: (progress: string) => void): Promise<{
    success: boolean;
    text: string;
    pageTexts?: string[];
    pageCount?: number;
  }> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configure worker - try multiple approaches
      if (typeof window !== 'undefined') {
        try {
          // Try using unpkg CDN which is more reliable
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js`;
        } catch (error) {
          console.warn('Failed to set worker from unpkg, trying jsdelivr:', error);
          // Fallback to jsdelivr
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.js`;
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      }).promise;

      const pageTexts: string[] = [];
      let fullText = '';
      let hasValidText = false;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (onProgress) onProgress(`📖 Checking page ${pageNum} for text...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageTextItems = textContent.items
            .map((item: any) => {
              if ('str' in item && item.str && typeof item.str === 'string') {
                // Filter out PDF metadata and binary data
                const str = item.str.trim();
                if (str.length === 0 || 
                    str.startsWith('%PDF') || 
                    str.includes('/Type/') ||
                    str.includes('obj') ||
                    str.includes('endobj') ||
                    /^[\d\s]+R$/.test(str)) {
                  return '';
                }
                return str;
              }
              return '';
            })
            .filter(str => str.length > 0);

          const pageText = pageTextItems.join(' ').trim();
          
          // Check if we got meaningful text (not just metadata)
          const wordCount = pageText.split(/\s+/).filter(word => 
            word.length > 1 && 
            !/^[\d]+$/.test(word) && 
            !word.includes('/') &&
            !word.includes('<')
          ).length;

          if (wordCount > 5) {
            pageTexts.push(pageText);
            fullText += pageText + '\n\n';
            hasValidText = true;
          }

        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
        }
      }

      return {
        success: hasValidText && fullText.length > 100,
        text: fullText.trim(),
        pageTexts,
        pageCount: pdf.numPages
      };

    } catch (error) {
      console.error('Direct text extraction failed:', error);
      return { success: false, text: '' };
    }
  }

  private async extractTextWithOCRFallback(file: File, onProgress?: (progress: string) => void): Promise<{
    text: string;
    pageTexts: string[];
    confidence: number;
  }> {
    await this.initializeOCR();
    
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker - try multiple approaches
    if (typeof window !== 'undefined') {
      try {
        // Try using unpkg CDN which is more reliable
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js`;
      } catch (error) {
        console.warn('Failed to set worker from unpkg, trying jsdelivr:', error);
        // Fallback to jsdelivr
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.js`;
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];
    let totalConfidence = 0;
    let pageCount = 0;

    // Limit to first 5 pages for demo purposes (OCR is slow)
    const maxPages = Math.min(pdf.numPages, 5);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      if (onProgress) onProgress(`🔍 OCR processing page ${pageNum} of ${maxPages}... (this may take a while)`);

      try {
        const page = await pdf.getPage(pageNum);
        
        // Render page to canvas
        const scale = 2.0; // Higher scale for better OCR accuracy
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert canvas to image data for OCR
        const imageData = canvas.toDataURL('image/png');
        
        // Perform OCR
        const ocrResult = await this.ocrWorker.recognize(imageData);
        const pageText = ocrResult.data.text.trim();
        
        console.log(`Page ${pageNum} OCR result: ${pageText.length} characters, confidence: ${ocrResult.data.confidence}%`);
        
        if (pageText.length > 20) { // Only include pages with substantial content
          pageTexts.push(pageText);
          totalConfidence += ocrResult.data.confidence;
          pageCount++;
        }

      } catch (pageError) {
        console.error(`OCR failed for page ${pageNum}:`, pageError);
        pageTexts.push(''); // Add empty string to maintain page alignment
      }
    }

    const fullText = pageTexts.filter(text => text.length > 0).join('\n\n');
    const avgConfidence = pageCount > 0 ? totalConfidence / pageCount / 100 : 0;

    return {
      text: fullText,
      pageTexts,
      confidence: avgConfidence
    };
  }

  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

// Main extraction function for use in the app
export async function extractTextWithOCR(file: File, onProgress?: (progress: string) => void): Promise<string> {
  const reader = new OCRPDFReader();
  
  try {
    const result = await reader.extractTextWithOCR(file, onProgress);
    
    console.log('=== OCR EXTRACTION RESULTS ===');
    console.log('Is scanned document:', result.isScanned);
    console.log('OCR confidence:', result.confidence);
    console.log('Total pages:', result.metadata.totalPages);
    console.log('Processing time:', result.metadata.processingTime, 'ms');
    console.log('Text length:', result.text.length);
    console.log('================================');
    
    if (result.text.length < 50) {
      throw new Error('Unable to extract sufficient text from PDF. The document may be corrupted or contain no readable content.');
    }
    
    return result.text;
    
  } finally {
    await reader.cleanup();
  }
}

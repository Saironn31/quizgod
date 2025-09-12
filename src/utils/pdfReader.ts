/**
 * Advanced PDF Text Extraction Utility with OCR Support
 * Extracts text content from PDF files using PDF.js and Tesseract.js for OCR
 */

import { createWorker } from 'tesseract.js';

export interface ExtractedContent {
  text: string;
  images: string[];
  metadata: {
    pageCount: number;
    title?: string;
    subject?: string;
    author?: string;
  };
}

export class AdvancedPDFReader {
  private ocrWorker: any = null;

  async initializeOCR(): Promise<void> {
    if (!this.ocrWorker) {
      this.ocrWorker = await createWorker('eng');
    }
  }

  async extractTextFromPDF(file: File, onProgress?: (progress: string) => void): Promise<ExtractedContent> {
    try {
      // Load PDF.js library dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      if (onProgress) onProgress('Loading PDF...');

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const metadata = await pdf.getMetadata();
      const result: ExtractedContent = {
        text: '',
        images: [],
        metadata: {
          pageCount: pdf.numPages,
          title: metadata.info?.Title,
          subject: metadata.info?.Subject,
          author: metadata.info?.Author,
        }
      };

      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (onProgress) onProgress(`Processing page ${pageNum} of ${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        
        // Extract direct text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (pageText) {
          result.text += `\n\nPage ${pageNum}:\n${pageText}`;
        }

        // Extract images and perform OCR
        if (onProgress) onProgress(`Analyzing images on page ${pageNum}...`);
        const imageText = await this.extractImagesFromPage(page);
        
        if (imageText) {
          result.text += `\n\n[Image Text from Page ${pageNum}]:\n${imageText}`;
        }
      }

      return result;
    } catch (error) {
      console.error('Error in advanced PDF extraction:', error);
      throw error;
    }
  }

  private async extractImagesFromPage(page: any): Promise<string> {
    let combinedImageText = '';
    
    try {
      // Get the page's viewport
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas to render the page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return '';
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Convert canvas to image data for OCR
      const imageData = canvas.toDataURL('image/png');
      
      // Initialize OCR if not already done
      await this.initializeOCR();
      
      // Perform OCR on the rendered page
      const { data: { text } } = await this.ocrWorker.recognize(imageData);
      
      if (text && text.trim().length > 20) { // Only include substantial text
        combinedImageText += text.trim() + '\n';
      }
      
    } catch (error) {
      console.warn('Error extracting images from page:', error);
    }
    
    return combinedImageText;
  }

  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

// Enhanced extraction function with OCR support
export async function extractTextFromPDF(file: File, onProgress?: (progress: string) => void): Promise<string> {
  const reader = new AdvancedPDFReader();
  
  try {
    if (onProgress) onProgress('Initializing advanced PDF reader...');
    
    const content = await reader.extractTextFromPDF(file, onProgress);
    
    if (onProgress) onProgress('PDF extraction complete!');
    
    return content.text;
  } catch (error) {
    console.error('Advanced PDF extraction failed, falling back to basic extraction:', error);
    if (onProgress) onProgress('Using basic text extraction...');
    
    // Fallback to basic extraction
    return await extractBasicTextFromPDF(file);
  } finally {
    await reader.cleanup();
  }
}

// Simplified version for basic text extraction (fallback)
export async function extractBasicTextFromPDF(file: File): Promise<string> {
  try {
    console.log('🔧 Starting basic PDF text extraction...');
    
    // Load PDF.js library dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0, // Reduce noise
      disableFontFace: false,
      disableAutoFetch: false,
    }).promise;
    
    console.log(`📚 PDF loaded: ${pdf.numPages} pages`);
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        // Extract text with better formatting
        let pageText = '';
        let lastY = null;
        
        for (const item of textContent.items) {
          if ('str' in item && item.str.trim()) {
            // Add line breaks for new lines (different Y coordinates)
            if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
              pageText += '\n';
            }
            
            pageText += item.str + ' ';
            lastY = item.transform[5];
          }
        }
        
        // Clean and validate page text
        pageText = pageText.trim();
        
        if (pageText && !containsGarbledText(pageText)) {
          fullText += `\n\nPage ${pageNum}:\n${pageText}`;
          console.log(`✅ Page ${pageNum}: ${pageText.length} readable characters`);
        } else {
          console.warn(`⚠️ Page ${pageNum}: No readable text or garbled content`);
        }
        
      } catch (pageError) {
        console.warn(`❌ Error processing page ${pageNum}:`, pageError);
      }
    }
    
    // Final cleaning
    const cleanedText = preprocessText(fullText);
    
    if (cleanedText.trim().length < 50) {
      throw new Error('PDF appears to contain no readable text. It may be a scanned document that requires OCR.');
    }
    
    console.log(`✅ Basic extraction complete: ${cleanedText.length} characters`);
    return cleanedText;
    
  } catch (error) {
    console.error('❌ Basic PDF extraction failed:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Clean and prepare text for question generation
 */
export function preprocessText(text: string): string {
  // First, check if text contains mostly garbled characters
  if (containsGarbledText(text)) {
    console.warn('⚠️ Detected garbled text, attempting to clean...');
    text = cleanGarbledText(text);
  }

  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that might interfere (but keep common punctuation)
    .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
    // Clean up punctuation spacing
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])\s*([A-Z])/g, '$1 $2')
    // Remove isolated single characters that might be OCR artifacts
    .replace(/\b[^\w\s]\b/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect if text contains mostly garbled/encoded characters
 */
export function containsGarbledText(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  // Count readable vs non-readable characters
  const readableChars = text.match(/[a-zA-Z0-9\s.,!?;:()\-'"]/g) || [];
  const totalChars = text.length;
  const readableRatio = readableChars.length / totalChars;
  
  // If less than 70% of characters are readable, consider it garbled
  return readableRatio < 0.7;
}

/**
 * Attempt to clean garbled text
 */
export function cleanGarbledText(text: string): string {
  console.log('🧹 Cleaning garbled text...');
  
  return text
    // Remove PDF metadata and structure
    .replace(/%PDF-[\d.]+/g, '')
    .replace(/<<\/[^>]+>>/g, '')
    .replace(/\/Type\/[^\s]+/g, '')
    .replace(/\/Filter\/[^\s]+/g, '')
    .replace(/\/Length\s+\d+/g, '')
    .replace(/stream[\s\S]*?endstream/g, '')
    .replace(/xref[\s\S]*?trailer/g, '')
    .replace(/startxref[\s\S]*?%%EOF/g, '')
    // Remove binary-looking sequences
    .replace(/[^\x20-\x7E\s]/g, ' ')
    // Remove sequences of special characters
    .replace(/[◊$□⁯⁢]+/g, ' ')
    // Remove isolated numbers and references
    .replace(/\b\d+\s+\d+\s+R\b/g, ' ')
    .replace(/\b\d+\s+obj\b/g, ' ')
    .replace(/\bendobj\b/g, ' ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into meaningful chunks for processing
 */
export function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence.trim();
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

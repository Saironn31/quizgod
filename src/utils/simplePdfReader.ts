/**
 * Simple PDF Text Extractor
 * Basic text extraction without worker complications
 */

export async function extractTextSimple(file: File, onProgress?: (progress: string) => void): Promise<string> {
  try {
    if (onProgress) onProgress('📄 Loading PDF...');
    
    console.log('🔍 Starting simple PDF extraction...');
    
    // Import PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure to use legacy build (no worker needed)
    if (typeof window !== 'undefined') {
      // Don't set worker source - use legacy build
      pdfjsLib.GlobalWorkerOptions.workerSrc = false as any;
    }
    
    const arrayBuffer = await file.arrayBuffer();
    
    if (onProgress) onProgress('🔍 Parsing PDF...');
    
    // Load PDF with minimal configuration
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    console.log(`📚 PDF loaded: ${pdf.numPages} pages`);
    
    let fullText = '';
    let pagesWithText = 0;
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (onProgress) onProgress(`📖 Processing page ${pageNum} of ${pdf.numPages}...`);
      
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({
          disableCombineTextItems: false
        });
        
        let pageText = '';
        let lastY = null;
        
        for (const item of textContent.items) {
          if ('str' in item && item.str && typeof item.str === 'string') {
            const str = item.str.trim();
            
            // Skip PDF metadata and structure
            if (str.length === 0 || 
                str.startsWith('%PDF') || 
                str.includes('/Type/') ||
                str.includes('obj') ||
                str.includes('endobj') ||
                str.includes('stream') ||
                str.includes('endstream') ||
                /^[\d\s]+R$/.test(str) ||
                /^<</.test(str) ||
                />>$/.test(str)) {
              continue;
            }
            
            // Add line breaks for different Y positions
            if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
              pageText += '\n';
            }
            
            pageText += str + ' ';
            lastY = item.transform[5];
          }
        }
        
        pageText = pageText.trim();
        
        // Only include pages with meaningful content
        const wordCount = pageText.split(/\s+/).filter(word => 
          word.length > 1 && 
          !/^[\d]+$/.test(word) &&
          !word.includes('/') &&
          !word.includes('<') &&
          !word.includes('>')
        ).length;
        
        if (wordCount > 3) {
          fullText += `\n\nPage ${pageNum}:\n${pageText}`;
          pagesWithText++;
          console.log(`✅ Page ${pageNum}: ${wordCount} meaningful words`);
        } else {
          console.log(`⚠️ Page ${pageNum}: Skipped (${wordCount} words, likely metadata)`);
        }
        
      } catch (pageError) {
        console.warn(`❌ Error processing page ${pageNum}:`, pageError);
      }
    }
    
    const cleanText = fullText.trim();
    
    console.log('=== SIMPLE EXTRACTION RESULTS ===');
    console.log('Pages processed:', pdf.numPages);
    console.log('Pages with text:', pagesWithText);
    console.log('Total text length:', cleanText.length);
    console.log('===================================');
    
    if (cleanText.length < 50 || pagesWithText === 0) {
      throw new Error(`No readable text found. This appears to be a scanned PDF that contains images instead of text. Found ${pagesWithText} pages with text out of ${pdf.numPages} total pages. You may need OCR (Optical Character Recognition) to extract text from images.`);
    }
    
    if (onProgress) onProgress(`✅ Extraction complete! Found text on ${pagesWithText} pages.`);
    
    return cleanText;
    
  } catch (error) {
    console.error('❌ Simple PDF extraction failed:', error);
    throw error;
  }
}

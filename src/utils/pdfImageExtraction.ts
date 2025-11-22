import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export interface ExtractedImage {
  blob: Blob;
  pageNumber: number;
  context: string;
  index: number;
}

/**
 * Extract images from a PDF file with surrounding text context
 */
export async function extractImagesFromPDF(file: File): Promise<ExtractedImage[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const extractedImages: ExtractedImage[] = [];
    let imageIndex = 0;

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get page text for context
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .slice(0, 200); // First 200 chars as context

      // Get page operations to find images
      const ops = await page.getOperatorList();
      
      for (let i = 0; i < ops.fnArray.length; i++) {
        // Check if operation is painting an image
        if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || 
            ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
          
          try {
            const imageName = ops.argsArray[i][0];
            
            // Get image from page resources
            const resources = await (page as any).objs.get(imageName);
            
            if (resources && resources.data) {
              // Convert image data to blob
              const canvas = document.createElement('canvas');
              canvas.width = resources.width;
              canvas.height = resources.height;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                const imageData = ctx.createImageData(resources.width, resources.height);
                
                // Handle different color formats
                if (resources.data.length === resources.width * resources.height * 4) {
                  // RGBA
                  imageData.data.set(resources.data);
                } else if (resources.data.length === resources.width * resources.height * 3) {
                  // RGB - convert to RGBA
                  for (let j = 0; j < resources.data.length; j += 3) {
                    const pixel = j / 3 * 4;
                    imageData.data[pixel] = resources.data[j];
                    imageData.data[pixel + 1] = resources.data[j + 1];
                    imageData.data[pixel + 2] = resources.data[j + 2];
                    imageData.data[pixel + 3] = 255;
                  }
                } else {
                  // Grayscale or other format - skip
                  continue;
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                // Convert canvas to blob
                const blob = await new Promise<Blob>((resolve) => {
                  canvas.toBlob((b) => {
                    resolve(b || new Blob());
                  }, 'image/png');
                });
                
                // Only include images larger than 5KB (filter out tiny icons)
                if (blob.size > 5000) {
                  extractedImages.push({
                    blob,
                    pageNumber: pageNum,
                    context: pageText,
                    index: imageIndex++
                  });
                }
              }
            }
          } catch (err) {
            console.log(`Could not extract image ${i} from page ${pageNum}:`, err);
            continue;
          }
        }
      }
    }

    console.log(`Extracted ${extractedImages.length} images from PDF`);
    return extractedImages;
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
    return [];
  }
}

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadedImage {
  url: string;
  pageNumber: number;
  context: string;
  index: number;
}

/**
 * Upload an image blob to Firebase Storage and return the download URL
 */
export async function uploadImageToStorage(
  blob: Blob,
  userId: string,
  quizId: string,
  imageIndex: number
): Promise<string> {
  try {
    // Create a unique path for the image
    const timestamp = Date.now();
    const imagePath = `quiz-images/${userId}/${quizId}/image_${imageIndex}_${timestamp}.png`;
    
    // Create storage reference
    const storageRef = ref(storage, imagePath);
    
    // Upload the blob
    await uploadBytes(storageRef, blob, {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    });
    
    // Get and return the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw error;
  }
}

/**
 * Upload multiple images from PDF extraction to Firebase Storage
 */
export async function uploadExtractedImages(
  images: Array<{ blob: Blob; pageNumber: number; context: string; index: number }>,
  userId: string,
  quizId: string
): Promise<UploadedImage[]> {
  try {
    const uploadPromises = images.map(async (image) => {
      const url = await uploadImageToStorage(
        image.blob,
        userId,
        quizId,
        image.index
      );
      
      return {
        url,
        pageNumber: image.pageNumber,
        context: image.context,
        index: image.index
      };
    });
    
    const uploadedImages = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${uploadedImages.length} images to Firebase Storage`);
    return uploadedImages;
  } catch (error) {
    console.error('Error uploading images:', error);
    return [];
  }
}

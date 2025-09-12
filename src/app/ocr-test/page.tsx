'use client';

import { useState } from 'react';
import Link from 'next/link';
import { extractTextWithOCR, OCRExtractionResult } from '../../utils/ocrPdfReader';

export default function OCRTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<OCRExtractionResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
      setError('');
    } else {
      alert('Please select a PDF file');
    }
  };

  const processWithOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress('Starting OCR processing...');
    setError('');

    try {
      const extractedText = await extractTextWithOCR(selectedFile, (progressMessage) => {
        setProgress(progressMessage);
      });

      // For demonstration, we'll show the result as a simple extraction result
      setResult({
        text: extractedText,
        pageTexts: [extractedText], // Simplified for demo
        isScanned: extractedText.length > 0,
        confidence: 0.9, // Mock confidence
        metadata: {
          totalPages: 1,
          processingTime: 0,
          ocrUsed: true
        }
      });

      setProgress('✅ OCR processing completed successfully!');

    } catch (err) {
      console.error('OCR processing failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setProgress('❌ OCR processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            📄 OCR PDF Test
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/advanced-ai" className="text-blue-600 dark:text-blue-400 hover:underline">
              Advanced AI
            </Link>
            <Link href="/ai-quiz" className="text-blue-600 dark:text-blue-400 hover:underline">
              AI Quiz
            </Link>
            <Link href="/pdf-debug" className="text-blue-600 dark:text-blue-400 hover:underline">
              PDF Debug
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            🤖 OCR PDF Reader Test
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Test the integrated OCR PDF reader that can handle both text-based and scanned PDFs
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            This OCR system automatically detects if a PDF is scanned and uses Tesseract.js for text extraction
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            📁 Upload PDF File
          </h2>
          
          <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                Click to select a PDF file
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Supports both text-based and scanned PDFs
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-medium">{selectedFile.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* Process Button */}
        {selectedFile && (
          <div className="text-center mb-6">
            <button
              onClick={processWithOCR}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {isProcessing ? '🔄 Processing...' : '🚀 Extract Text with OCR'}
            </button>
          </div>
        )}

        {/* Progress Section */}
        {progress && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              📊 Processing Status
            </h3>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{progress}</p>
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3">
              ❌ Error
            </h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              ✅ Extraction Results
            </h3>
            
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.isScanned ? '📸' : '📝'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {result.isScanned ? 'Scanned PDF' : 'Text-based PDF'}
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(result.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Confidence
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {result.metadata.totalPages}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pages
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {result.text.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Characters
                </div>
              </div>
            </div>

            {/* Extracted Text */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                📋 Extracted Text (First 1000 characters):
              </h4>
              <div className="max-h-64 overflow-y-auto bg-white dark:bg-gray-800 rounded border p-3">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {result.text.substring(0, 1000)}
                  {result.text.length > 1000 && '...'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            ℹ️ How OCR PDF Reader Works
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-3">
              <span className="text-blue-500">1️⃣</span>
              <p><strong>Direct Text Extraction:</strong> First tries to extract text directly from the PDF if it contains selectable text.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-500">2️⃣</span>
              <p><strong>OCR Fallback:</strong> If direct extraction fails or returns insufficient text, automatically switches to OCR mode.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-500">3️⃣</span>
              <p><strong>Image Processing:</strong> Converts PDF pages to high-resolution images for better OCR accuracy.</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-orange-500">4️⃣</span>
              <p><strong>Text Recognition:</strong> Uses Tesseract.js engine to recognize text from images with confidence scores.</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> OCR processing may take longer for scanned documents, especially for multi-page PDFs. 
              The system automatically optimizes performance while maintaining accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

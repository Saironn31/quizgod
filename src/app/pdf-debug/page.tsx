'use client';

import { useState } from 'react';
import { extractRealTextFromPDF } from '../../utils/realPdfReader';
import { extractTextWithOCR } from '../../utils/ocrPdfReader';
import { extractTextSimple } from '../../utils/simplePdfReader';

export default function PDFDebugPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<'simple' | 'basic' | 'ocr'>('simple');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      console.log('📄 PDF selected for debugging:', file.name);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const testPDFExtraction = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setStatus('Starting PDF extraction...');

    try {
      console.log('🔍 DEBUG: Starting PDF extraction test');
      console.log('🔧 Method:', extractionMethod);
      
      let extractedText: string;
      
      if (extractionMethod === 'simple') {
        setStatus('🔧 Using simple extraction (no worker)...');
        extractedText = await extractTextSimple(selectedFile, (progress) => {
          console.log('📊 Simple Progress:', progress);
          setStatus(progress);
        });
      } else if (extractionMethod === 'ocr') {
        setStatus('🤖 Using OCR extraction for scanned PDFs...');
        extractedText = await extractTextWithOCR(selectedFile, (progress) => {
          console.log('📊 OCR Progress:', progress);
          setStatus(progress);
        });
      } else {
        setStatus('📄 Using basic text extraction...');
        extractedText = await extractRealTextFromPDF(selectedFile, (progress) => {
          console.log('📊 Progress:', progress);
          setStatus(progress);
        });
      }

      console.log('✅ DEBUG: Extraction complete');
      console.log('📝 Raw extracted text length:', extractedText.length);
      console.log('📝 First 500 chars:', extractedText.substring(0, 500));
      console.log('📝 Character codes of first 50 chars:', 
        extractedText.substring(0, 50).split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ')
      );

      setExtractedText(extractedText);
      setStatus('✅ Extraction complete! Check console for details.');

    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If basic extraction failed and we haven't tried OCR yet, suggest OCR
      if (extractionMethod === 'basic' && error instanceof Error) {
        if (error.message.includes('scanned') || error.message.includes('OCR')) {
          setStatus(prev => prev + '\n💡 Tip: Try switching to OCR method for scanned PDFs.');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">
          🔍 PDF Extraction Debug Tool
        </h1>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload PDF for Testing</h2>
          
          {/* Extraction Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Extraction Method:
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="extractionMethod"
                  value="simple"
                  checked={extractionMethod === 'simple'}
                  onChange={(e) => setExtractionMethod(e.target.value as 'simple' | 'basic' | 'ocr')}
                  className="mr-2"
                />
                <span className="text-sm">🔧 Simple Extraction (No Worker)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="extractionMethod"
                  value="basic"
                  checked={extractionMethod === 'basic'}
                  onChange={(e) => setExtractionMethod(e.target.value as 'simple' | 'basic' | 'ocr')}
                  className="mr-2"
                />
                <span className="text-sm">📄 Basic Text Extraction</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="extractionMethod"
                  value="ocr"
                  checked={extractionMethod === 'ocr'}
                  onChange={(e) => setExtractionMethod(e.target.value as 'simple' | 'basic' | 'ocr')}
                  className="mr-2"
                />
                <span className="text-sm">🤖 OCR (For Scanned PDFs)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {extractionMethod === 'simple' 
                ? 'Fastest method, avoids worker issues' 
                : extractionMethod === 'basic' 
                ? 'Fast extraction for text-based PDFs' 
                : 'Slower but works with scanned/image-based PDFs'}
            </p>
          </div>
          
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              <button
                onClick={testPDFExtraction}
                disabled={isProcessing}
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isProcessing ? '🔄 Processing...' : '🧪 Test PDF Extraction'}
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        {status && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200">{status}</p>
          </div>
        )}

        {/* Extracted Text Preview */}
        {extractedText && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Extracted Text Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p><strong>Text Length:</strong> {extractedText.length} characters</p>
                <p><strong>Words:</strong> {extractedText.split(/\s+/).length}</p>
              </div>
              <div>
                <p><strong>Lines:</strong> {extractedText.split('\n').length}</p>
                <p><strong>Non-empty Lines:</strong> {extractedText.split('\n').filter(l => l.trim()).length}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">First 1000 Characters:</h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {extractedText.substring(0, 1000)}
              </pre>
              {extractedText.length > 1000 && (
                <p className="text-gray-500 mt-2">... and {extractedText.length - 1000} more characters</p>
              )}
            </div>

            {/* Character Analysis */}
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Character Analysis (First 100 chars):</h3>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                {extractedText.substring(0, 100).split('').map((char, index) => (
                  <span key={index} className="inline-block mr-1 mb-1 p-1 bg-gray-200 dark:bg-gray-600 rounded">
                    {char === ' ' ? '␣' : char === '\n' ? '↵' : char === '\t' ? '→' : char}
                    <sub className="text-xs">({char.charCodeAt(0)})</sub>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-2">🔧 Debug Instructions:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Upload a PDF file and click "Test PDF Extraction"</li>
            <li>Check the browser console (F12) for detailed logs</li>
            <li>Review the character analysis to identify encoding issues</li>
            <li>Look for non-printable characters or unicode issues</li>
            <li>Compare the extracted text with the original PDF content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

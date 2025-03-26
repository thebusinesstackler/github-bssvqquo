import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { generateScreenerFromProtocol } from '../lib/openai';
import { useScreenerStore } from '../store/useScreenerStore';

interface ProtocolUploadProps {
  onSuccess?: (fields: any[]) => void;
  onClose: () => void;
}

export function ProtocolUpload({ onSuccess, onClose }: ProtocolUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [protocolText, setProtocolText] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Read the file content
      const text = await file.text();
      setProtocolText(text);
    } catch (err) {
      setError('Failed to read protocol file');
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleGenerateScreener = async () => {
    if (!protocolText) {
      setError('Please upload a protocol file first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fields = await generateScreenerFromProtocol(protocolText);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(fields);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to generate screener form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Study Protocol</h2>

      <div
        {...getRootProps()}
        className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <div className="space-y-1 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <input {...getInputProps()} />
            <p>
              {isDragActive
                ? 'Drop the protocol file here'
                : 'Drag and drop your protocol file, or click to select'}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            TXT, PDF, DOC, or DOCX files only
          </p>
        </div>
      </div>

      {protocolText && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Protocol Preview</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {protocolText.substring(0, 500)}...
            </pre>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Screener form generated successfully!
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerateScreener}
          disabled={!protocolText || isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate Screener
            </>
          )}
        </button>
      </div>
    </div>
  );
}
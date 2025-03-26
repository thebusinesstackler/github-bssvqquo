import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface CSVRow {
  firstName: string;
  lastName: string;
  age: string;
  sex: string;
  phone: string;
  email: string;
  zipCode: string;
  indication: string;
}

const REQUIRED_HEADERS = [
  'firstName',
  'lastName',
  'age',
  'sex',
  'phone',
  'email',
  'zipCode',
  'indication'
];

export function LeadImport() {
  const { partners } = useAdminStore();
  const { addLead } = useLeadStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Validate headers
          const headers = Object.keys(results.data[0] || {});
          const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            setError(`Missing required columns: ${missingHeaders.join(', ')}`);
            setPreview([]);
            return;
          }

          setPreview(results.data.slice(0, 5) as CSVRow[]);
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
          setPreview([]);
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (!selectedFile || !selectedPartner) {
      setError('Please select a file and partner');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const results = await new Promise<Papa.ParseResult<CSVRow>>((resolve, reject) => {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        });
      });

      let successCount = 0;
      let errorCount = 0;

      for (const row of results.data) {
        try {
          await addLead({
            ...row,
            age: parseInt(row.age, 10),
            partnerId: selectedPartner,
            status: 'new'
          });
          successCount++;
        } catch (err) {
          errorCount++;
          console.error('Error importing lead:', err);
        }
      }

      setSuccess(`Successfully imported ${successCount} leads${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
    } catch (err) {
      setError('Failed to import leads. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Import Leads</h2>
      
      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Lead Data
          </label>
          <div
            {...getRootProps()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <div className="space-y-1 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <input {...getInputProps()} />
                <p>
                  {isDragActive
                    ? 'Drop the file here'
                    : 'Drag and drop a CSV file, or click to select'}
                </p>
              </div>
              <p className="text-xs text-gray-500">CSV files only</p>
            </div>
          </div>
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        {/* Partner Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Partner
          </label>
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select a partner</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (First 5 Rows)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {REQUIRED_HEADERS.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {REQUIRED_HEADERS.map((header) => (
                        <td
                          key={header}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {row[header as keyof CSVRow]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || !selectedPartner || importing}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
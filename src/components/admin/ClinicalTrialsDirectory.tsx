import React, { useState, useCallback } from 'react';
import { Search, Filter, Download, AlertCircle, CheckCircle, FileText, MapPin, Users, Calendar, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { format } from 'date-fns';

interface ClinicalTrial {
  id: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  locations: {
    facility: string;
    city: string;
    state: string;
    country: string;
  }[];
  briefSummary: string;
  startDate: string;
  completionDate: string;
  eligibilityCriteria: string;
  contacts: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  }[];
}

interface UploadedTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  condition: string;
  facility: string;
  city: string;
  state: string;
  country: string;
  summary: string;
  startDate: string;
  completionDate: string;
  eligibility: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
}

export function ClinicalTrialsDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [trials, setTrials] = useState<ClinicalTrial[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<UploadedTrial[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const trials = results.data as UploadedTrial[];
          setUploadPreview(trials.slice(0, 5)); // Show first 5 trials for preview
          setSuccess(`Successfully parsed ${trials.length} trials`);
        },
        error: (error) => {
          setError(`Failed to parse file: ${error.message}`);
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx', '.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleImport = () => {
    setIsUploading(true);
    setError(null);

    try {
      // Transform uploaded trials to match ClinicalTrial interface
      const transformedTrials = uploadPreview.map(trial => ({
        id: trial.nctId,
        title: trial.title,
        status: trial.status,
        phase: trial.phase,
        conditions: [trial.condition],
        locations: [{
          facility: trial.facility,
          city: trial.city,
          state: trial.state,
          country: trial.country
        }],
        briefSummary: trial.summary,
        startDate: trial.startDate,
        completionDate: trial.completionDate,
        eligibilityCriteria: trial.eligibility,
        contacts: [{
          name: trial.contactName,
          role: trial.contactRole,
          email: trial.contactEmail,
          phone: trial.contactPhone
        }]
      }));

      setTrials(prev => [...prev, ...transformedTrials]);
      setSuccess(`Successfully imported ${transformedTrials.length} trials`);
      setShowUploadModal(false);
    } catch (err) {
      setError('Failed to import trials. Please check your file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const phases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'];
  const statuses = ['Not yet recruiting', 'Recruiting', 'Active, not recruiting', 'Completed'];

  const filteredTrials = trials.filter(trial => {
    const matchesSearch = trial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trial.conditions.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPhase = !selectedPhase || trial.phase === selectedPhase;
    const matchesStatus = !selectedStatus || trial.status === selectedStatus;
    const matchesLocation = !selectedLocation || trial.locations.some(l => l.country === selectedLocation);
    
    return matchesSearch && matchesPhase && matchesStatus && matchesLocation;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Trials Directory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and manage clinical trials
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Trials
          </button>
          <a
            href="/template.csv"
            download
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Template
          </a>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search trials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Phases</option>
            {phases.map(phase => (
              <option key={phase} value={phase}>{phase}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
          </select>
        </div>
      </div>

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

      {/* Trial List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredTrials.map((trial) => (
            <div
              key={trial.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedTrial(trial)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {trial.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {trial.id}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {trial.locations[0].city}, {trial.locations[0].state}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {trial.phase}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {trial.status}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {trial.briefSummary}
              </p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Start Date: {format(new Date(trial.startDate), 'MMM d, yyyy')}
              </div>
            </div>
          ))}

          {filteredTrials.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No trials found. Try adjusting your filters or upload new trials.
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Upload Clinical Trials</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

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
                        ? 'Drop the file here'
                        : 'Drag and drop your CSV file, or click to select'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">CSV files only</p>
                </div>
              </div>

              {uploadPreview.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(uploadPreview[0]).map((header) => (
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
                        {uploadPreview.map((trial, index) => (
                          <tr key={index}>
                            {Object.values(trial).map((value, i) => (
                              <td
                                key={i}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isUploading || uploadPreview.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? 'Importing...' : 'Import Trials'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Details Modal */}
      {selectedTrial && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTrial.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">NCT ID: {selectedTrial.id}</p>
                </div>
                <button
                  onClick={() => setSelectedTrial(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Study Details</h3>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTrial.status}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phase</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTrial.phase}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Conditions</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedTrial.conditions.join(', ')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Dates</h3>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(selectedTrial.startDate), 'MMM d, yyyy')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Completion Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(selectedTrial.completionDate), 'MMM d, yyyy')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="col-span-2">
                  <h3 className="text-lg font-medium text-gray-900">Brief Summary</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedTrial.briefSummary}</p>
                </div>

                <div className="col-span-2">
                  <h3 className="text-lg font-medium text-gray-900">Eligibility Criteria</h3>
                  <p className="mt-2 text-sm text-gray-600">{selectedTrial.eligibilityCriteria}</p>
                </div>

                <div className="col-span-2">
                  <h3 className="text-lg font-medium text-gray-900">Locations</h3>
                  <div className="mt-2 space-y-3">
                    {selectedTrial.locations.map((location, index) => (
                      <div key={index} className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900">{location.facility}</p>
                          <p className="text-sm text-gray-500">
                            {location.city}, {location.state}, {location.country}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <h3 className="text-lg font-medium text-gray-900">Contacts</h3>
                  <div className="mt-2 space-y-3">
                    {selectedTrial.contacts.map((contact, index) => (
                      <div key={index} className="flex items-start">
                        <Users className="w-5 h-5 text-gray-400 mt-1" />
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500">{contact.role}</p>
                          {contact.email && (
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
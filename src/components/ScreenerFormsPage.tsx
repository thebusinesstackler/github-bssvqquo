import React, { useState, useCallback, useEffect } from 'react';
import { useScreenerStore } from '../store/useScreenerStore';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Code,
  Edit,
  Eye,
  Search,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { formatDistanceToNow } from 'date-fns';
import { ScreenerField } from '../types';

const DEFAULT_FIELDS: ScreenerField[] = [
  {
    id: 'name',
    type: 'text',
    label: 'Full Name',
    required: true,
    category: 'contact'
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    category: 'contact'
  },
  {
    id: 'phone',
    type: 'tel',
    label: 'Phone Number',
    required: true,
    category: 'contact'
  }
];

export function ScreenerFormsPage() {
  const { forms, addForm, publishForm, duplicateForm, deleteForm } = useScreenerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [...DEFAULT_FIELDS]
  });

  const handleAddField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: `f${Date.now()}`,
          type: 'text',
          label: '',
          required: false,
          category: 'eligibility'
        }
      ]
    }));
  };

  const handleFieldChange = (index: number, field: Partial<ScreenerField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }));
  };

  const handleRemoveField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!formData.name || formData.fields.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      await addForm({
        ...formData,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setSuccess('Form created successfully');
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        fields: [...DEFAULT_FIELDS]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Screener Forms</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage screening forms for your studies
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? (
            <>
              <ChevronUp className="w-5 h-5 mr-2" />
              Hide Form
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Create Form
            </>
          )}
        </button>
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

      {/* Create Form Section */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Form Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter form name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter form description"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Form Fields
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </button>
              </div>

              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(index, { label: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, { type: e.target.value as any })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="number">Number</option>
                          <option value="radio">Radio</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="select">Select</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleFieldChange(index, { required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Forms */}
      <div className="flex space-x-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredForms.map((form) => (
            <div key={form.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{form.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{form.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {form.fields.length} fields
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      form.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {form.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {form.status === 'published' ? (
                    <button
                      onClick={() => setShowEmbedCode(form.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Get Embed Code"
                    >
                      <Code className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => publishForm(form.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Publish"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => duplicateForm(form.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteForm(form.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredForms.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No forms found. Create a new form to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
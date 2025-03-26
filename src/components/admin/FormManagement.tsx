import React, { useState, useEffect } from 'react';
import { useScreenerStore } from '../../store/useScreenerStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Plus,
  Search,
  FileText,
  Users,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  Code,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ScreenerField, ScreenerForm } from '../../types';

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
  },
  {
    id: 'age',
    type: 'select',
    label: 'Age Range',
    required: true,
    category: 'demographics',
    options: [
      '18-24',
      '25-34',
      '35-44',
      '45-54',
      '55-64',
      '65+'
    ]
  },
  {
    id: 'study_interest',
    type: 'select',
    label: 'Study Interest',
    required: true,
    category: 'eligibility',
    options: [
      'Type 2 Diabetes',
      'Major Depression',
      'Rheumatoid Arthritis',
      'Hypertension',
      'COPD',
      'Other'
    ]
  }
];

export function FormManagement() {
  const { user } = useAuthStore();
  const { forms, addForm, updateForm, deleteForm, duplicateForm, fetchForms, isLoading } = useScreenerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ScreenerForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [localForms, setLocalForms] = useState(forms);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [...DEFAULT_FIELDS] as ScreenerField[],
    assignedPartners: [] as string[]
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchForms().catch(err => {
        console.error('Error fetching forms:', err);
        setError('Failed to fetch forms');
      });
    }
  }, [user]);

  const handleEdit = (form: ScreenerForm) => {
    setSelectedForm(form);
    setFormData({
      name: form.name,
      description: form.description,
      fields: [...form.fields],
      assignedPartners: form.assignedPartners || []
    });
    setShowFormModal(true);
  };

  const handleClone = async (form: ScreenerForm) => {
    try {
      const clonedForm = await duplicateForm(form.id);
      setLocalForms(prevForms => [...prevForms, clonedForm]);
      setSuccess('Form cloned successfully');
    } catch (err) {
      setError('Failed to clone form');
    }
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteForm(formId);
      setLocalForms(prevForms => prevForms.filter(form => form.id !== formId));
      setSuccess('Form deleted successfully');
    } catch (err) {
      setError('Failed to delete form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!formData.name || formData.fields.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      if (selectedForm) {
        await updateForm(selectedForm.id, {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        await addForm({
          ...formData,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setSuccess(selectedForm ? 'Form updated successfully' : 'Form created successfully');
      setShowFormModal(false);
      setSelectedForm(null);
      setFormData({
        name: '',
        description: '',
        fields: [...DEFAULT_FIELDS],
        assignedPartners: []
      });

      await fetchForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form');
    }
  };

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

  const handleCopyEmbedCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generateEmbedCode = (formId: string) => {
    return `<div id="screener-form-${formId}"></div>
<script src="${window.location.origin}/embed/${formId}.js"></script>`;
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage screener forms for partners
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedForm(null);
            setFormData({
              name: '',
              description: '',
              fields: [...DEFAULT_FIELDS],
              assignedPartners: []
            });
            setShowFormModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Form
        </button>
      </div>

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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredForms.length > 0 ? (
            filteredForms.map((form) => (
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
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {form.assignedPartners?.length || 0} partners
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowEmbedCode(form.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Get Embed Code"
                    >
                      <Code className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(form)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleClone(form)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Clone"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? 'No forms found matching your search.' : 'No forms found. Create a new form to get started.'}
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {selectedForm ? 'Edit Form' : 'Create Form'}
                </h2>
                <button
                  onClick={() => {
                    setShowFormModal(false);
                    setSelectedForm(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

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
                    onClick={() => {
                      setShowFormModal(false);
                      setSelectedForm(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {selectedForm ? 'Update Form' : 'Create Form'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEmbedCode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Embed Code</h3>
                <button
                  onClick={() => setShowEmbedCode(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                  {generateEmbedCode(showEmbedCode)}
                </pre>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleCopyEmbedCode(generateEmbedCode(showEmbedCode))}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(success || error) && (
        <div className={`fixed bottom-4 right-4 ${
          success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        } p-4 rounded-lg shadow-lg flex items-center`}>
          {success ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          <span>{success || error}</span>
        </div>
      )}
    </div>
  );
}
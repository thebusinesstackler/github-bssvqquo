import React, { useState, useEffect } from 'react';
import { useScreenerStore } from '../../store/useScreenerStore';
import { useAdminStore } from '../../store/useAdminStore';
import {
  Plus,
  Save,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Settings,
  Users,
  DndKit,
  FormInput,
  List
} from 'lucide-react';
import { ScreenerField, ScreenerForm } from '../../types';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FieldItemProps {
  field: ScreenerField;
  onEdit: (field: ScreenerField) => void;
  onDelete: (id: string) => void;
  onDuplicate: (field: ScreenerField) => void;
}

function FieldItem({ field, onEdit, onDelete, onDuplicate }: FieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };
  
  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text Field';
      case 'email': return 'Email Field';
      case 'tel': return 'Phone Field';
      case 'number': return 'Number Field';
      case 'select': return 'Dropdown Select';
      case 'radio': return 'Radio Buttons';
      case 'checkbox': return 'Checkboxes';
      case 'date': return 'Date Picker';
      default: return type;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="p-4 mb-3 bg-white border border-gray-200 rounded-md shadow-sm hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-gray-900">{field.label || 'Untitled Field'}</h3>
            {field.required && <span className="ml-2 text-xs text-red-500">*Required</span>}
          </div>
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {getFieldTypeLabel(field.type)}
            </span>
            {field.category && (
              <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs capitalize">
                {field.category}
              </span>
            )}
          </div>
          
          {field.options && field.options.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">Options: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {field.options.map((option, index) => (
                  <span key={index} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {option}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onEdit(field);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onDuplicate(field);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onDelete(field.id);
            }}
            className="text-gray-400 hover:text-red-600 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdvancedFormBuilder({ formId }: { formId?: string }) {
  const { forms, addForm, updateForm } = useScreenerStore();
  const { partners } = useAdminStore();
  const [formData, setFormData] = useState<Omit<ScreenerForm, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    status: 'draft',
    fields: [],
    assignedPartners: []
  });
  const [currentField, setCurrentField] = useState<ScreenerField | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  
  // For DnD functionality
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (formId) {
      const form = forms.find(f => f.id === formId);
      if (form) {
        setFormData({
          name: form.name,
          description: form.description,
          status: form.status,
          fields: [...form.fields],
          assignedPartners: form.assignedPartners || []
        });
        setIsEditing(true);
      }
    } else {
      // Set up default fields for new form
      setFormData({
        name: '',
        description: '',
        status: 'draft',
        fields: [
          {
            id: `field-${Date.now()}-1`,
            type: 'text',
            label: 'Full Name',
            required: true,
            category: 'contact'
          },
          {
            id: `field-${Date.now()}-2`,
            type: 'email',
            label: 'Email Address',
            required: true,
            category: 'contact'
          },
          {
            id: `field-${Date.now()}-3`,
            type: 'tel',
            label: 'Phone Number',
            required: true,
            category: 'contact'
          }
        ],
        assignedPartners: []
      });
    }
  }, [formId, forms]);

  const handleSaveForm = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!formData.name) {
        throw new Error('Form name is required');
      }
      
      if (formData.fields.length === 0) {
        throw new Error('Form must have at least one field');
      }
      
      if (isEditing && formId) {
        await updateForm(formId, formData);
        setSuccess('Form updated successfully');
      } else {
        await addForm(formData);
        setSuccess('Form created successfully');
      }
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setIsLoading(false);
    }
  };

  const addField = (type: ScreenerField['type']) => {
    const newField: ScreenerField = {
      id: `field-${Date.now()}`,
      type,
      label: '',
      required: false,
      category: 'eligibility'
    };
    
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = ['Option 1'];
    }
    
    setCurrentField(newField);
    setEditingFieldId(null);
  };

  const saveField = (field: ScreenerField) => {
    if (editingFieldId) {
      // Update existing field
      setFormData(prev => ({
        ...prev,
        fields: prev.fields.map(f => f.id === editingFieldId ? field : f)
      }));
    } else {
      // Add new field
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, field]
      }));
    }
    
    setCurrentField(null);
    setEditingFieldId(null);
  };

  const editField = (field: ScreenerField) => {
    setCurrentField({...field});
    setEditingFieldId(field.id);
  };

  const deleteField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const duplicateField = (field: ScreenerField) => {
    const newField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`
    };
    
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const addOption = () => {
    if (!currentField || !newOption) return;
    
    setCurrentField(prev => ({
      ...prev!,
      options: [...(prev!.options || []), newOption]
    }));
    
    setNewOption('');
  };

  const removeOption = (index: number) => {
    if (!currentField?.options) return;
    
    setCurrentField(prev => ({
      ...prev!,
      options: prev!.options!.filter((_, i) => i !== index)
    }));
  };

  const handlePartnerAssignment = (partnerId: string, assigned: boolean) => {
    if (assigned) {
      // Add partner to assigned partners
      setFormData(prev => ({
        ...prev,
        assignedPartners: [...(prev.assignedPartners || []), partnerId]
      }));
    } else {
      // Remove partner from assigned partners
      setFormData(prev => ({
        ...prev,
        assignedPartners: (prev.assignedPartners || []).filter(id => id !== partnerId)
      }));
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.fields.findIndex(f => f.id === active.id);
        const newIndex = prev.fields.findIndex(f => f.id === over.id);
        
        const newFields = [...prev.fields];
        const [removed] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, removed);
        
        return {
          ...prev,
          fields: newFields
        };
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditing ? 'Edit Form' : 'Create New Form'}
        </h2>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Form Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="formName" className="block text-sm font-medium text-gray-700">
                  Form Name
                </label>
                <input
                  id="formName"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter form name"
                />
              </div>
              
              <div>
                <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="formDescription"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe the purpose of this form"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'draft' | 'published'})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign to Partners</h3>
            
            {partners.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {partners.filter(p => p.role === 'partner').map(partner => (
                  <label key={partner.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.assignedPartners?.includes(partner.id) || false}
                      onChange={e => handlePartnerAssignment(partner.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {partner.name} {!partner.active && <span className="text-red-500">(Inactive)</span>}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p>No partners found</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Fields</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => addField('text')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Text Field
              </button>
              <button
                type="button"
                onClick={() => addField('email')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Email Field
              </button>
              <button
                type="button"
                onClick={() => addField('tel')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Phone Field
              </button>
              <button
                type="button"
                onClick={() => addField('number')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Number Field
              </button>
              <button
                type="button"
                onClick={() => addField('select')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <List className="w-4 h-4 mr-2" />
                Dropdown
              </button>
              <button
                type="button"
                onClick={() => addField('radio')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <List className="w-4 h-4 mr-2" />
                Radio Buttons
              </button>
              <button
                type="button"
                onClick={() => addField('checkbox')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Check className="w-4 h-4 mr-2" />
                Checkboxes
              </button>
              <button
                type="button"
                onClick={() => addField('date')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Date Field
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveForm}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEditing ? 'Update Form' : 'Save Form'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form Builder Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Form Builder</h3>
            
            {currentField ? (
              <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-800 text-sm">
                  {editingFieldId ? 'Edit Field' : 'Add New Field'}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={currentField.label}
                    onChange={e => setCurrentField({...currentField, label: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter field label"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Field Type
                  </label>
                  <select
                    value={currentField.type}
                    onChange={e => {
                      const newType = e.target.value as ScreenerField['type'];
                      setCurrentField({
                        ...currentField,
                        type: newType,
                        options: (newType === 'select' || newType === 'radio' || newType === 'checkbox') 
                          ? currentField.options || ['Option 1'] 
                          : undefined
                      });
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="text">Text Field</option>
                    <option value="email">Email Field</option>
                    <option value="tel">Phone Field</option>
                    <option value="number">Number Field</option>
                    <option value="select">Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkboxes</option>
                    <option value="date">Date Field</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={currentField.category}
                    onChange={e => setCurrentField({...currentField, category: e.target.value as any})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="contact">Contact Information</option>
                    <option value="demographics">Demographics</option>
                    <option value="medical">Medical History</option>
                    <option value="eligibility">Eligibility Criteria</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="required"
                    type="checkbox"
                    checked={currentField.required}
                    onChange={e => setCurrentField({...currentField, required: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                    Required Field
                  </label>
                </div>

                {/* Options for select, radio, checkbox */}
                {['select', 'radio', 'checkbox'].includes(currentField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Options
                    </label>
                    <div className="mt-2 space-y-2">
                      {currentField.options?.map((option, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="text"
                            value={option}
                            onChange={e => {
                              const newOptions = [...(currentField.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentField({...currentField, options: newOptions});
                            }}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newOption}
                          onChange={e => setNewOption(e.target.value)}
                          placeholder="Add new option"
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={addOption}
                          disabled={!newOption}
                          className="ml-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation rules for number inputs */}
                {currentField.type === 'number' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Minimum Value
                      </label>
                      <input
                        type="number"
                        value={currentField.validation?.min || ''}
                        onChange={e => setCurrentField({
                          ...currentField,
                          validation: {
                            ...currentField.validation,
                            min: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Maximum Value
                      </label>
                      <input
                        type="number"
                        value={currentField.validation?.max || ''}
                        onChange={e => setCurrentField({
                          ...currentField,
                          validation: {
                            ...currentField.validation,
                            max: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end space-x-3 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentField(null);
                      setEditingFieldId(null);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveField(currentField)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingFieldId ? 'Update Field' : 'Add Field'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 min-h-[400px]">
                {formData.fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FormInput className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Fields Added</h3>
                    <p className="text-gray-500 text-center mt-2">
                      Start by adding fields from the panel on the left.
                    </p>
                  </div>
                ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={formData.fields.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {formData.fields.map(field => (
                          <FieldItem 
                            key={field.id}
                            field={field}
                            onEdit={editField}
                            onDelete={deleteField}
                            onDuplicate={duplicateField}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
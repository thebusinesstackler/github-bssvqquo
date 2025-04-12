import { create } from 'zustand';
import { ScreenerForm, ScreenerField } from '../types';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

interface ScreenerStore {
  forms: ScreenerForm[];
  isLoading: boolean;
  error: string | null;
  
  fetchForms: () => Promise<void>;
  addForm: (form: Omit<ScreenerForm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateForm: (id: string, updates: Partial<ScreenerForm>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  duplicateForm: (id: string) => Promise<ScreenerForm>;
  assignFormToPartner: (formId: string, partnerId: string) => Promise<void>;
  unassignFormFromPartner: (formId: string, partnerId: string) => Promise<void>;
  generateFormFromProtocol: (protocol: string) => ScreenerField[];
}

const generateQuestionsFromCriteria = (criteria: string): ScreenerField[] => {
  const fields: ScreenerField[] = [
    {
      id: 'contact_name',
      type: 'text',
      label: 'Full Name',
      required: true,
      category: 'contact'
    },
    {
      id: 'contact_email',
      type: 'email',
      label: 'Email Address',
      required: true,
      category: 'contact'
    },
    {
      id: 'contact_phone',
      type: 'tel',
      label: 'Phone Number',
      required: true,
      category: 'contact'
    }
  ];

  // Extract age criteria
  const ageMatch = criteria.match(/age(?:s)?\s*(?:of)?\s*(\d+)(?:\s*-\s*|\s+to\s+)(\d+)/i);
  if (ageMatch) {
    fields.push({
      id: 'age',
      type: 'number',
      label: 'Age',
      required: true,
      category: 'demographics',
      validation: {
        min: parseInt(ageMatch[1]),
        max: parseInt(ageMatch[2]),
        message: `Age must be between ${ageMatch[1]} and ${ageMatch[2]}`
      }
    });
  }

  // Extract gender criteria
  const genderMatch = criteria.match(/(?:male|female|both genders|all genders)/i);
  if (genderMatch) {
    fields.push({
      id: 'gender',
      type: 'radio',
      label: 'Gender',
      required: true,
      category: 'demographics',
      options: ['Male', 'Female', 'Other']
    });
  }

  // Extract medical conditions
  const conditions = criteria.match(/(?:diagnosed with|history of|current|active)\s+([^,.]+)/gi);
  if (conditions) {
    conditions.forEach((condition, index) => {
      const cleanCondition = condition.replace(/(?:diagnosed with|history of|current|active)\s+/i, '').trim();
      fields.push({
        id: `condition_${index}`,
        type: 'radio',
        label: `Have you been diagnosed with ${cleanCondition}?`,
        required: true,
        category: 'medical',
        options: ['Yes', 'No']
      });
    });
  }

  // Extract medications
  const medications = criteria.match(/(?:taking|on|using|treated with)\s+([^,.]+)\s+(?:medication|therapy|treatment)/gi);
  if (medications) {
    medications.forEach((medication, index) => {
      const cleanMedication = medication.replace(/(?:taking|on|using|treated with)\s+|\s+(?:medication|therapy|treatment)/gi, '').trim();
      fields.push({
        id: `medication_${index}`,
        type: 'radio',
        label: `Are you currently taking ${cleanMedication}?`,
        required: true,
        category: 'medical',
        options: ['Yes', 'No']
      });
    });
  }

  // Extract lab values
  const labValues = criteria.match(/(?:A1C|HbA1c|blood pressure|BMI|weight|height)\s*(?:[<>]=?|=)\s*\d+(?:\.\d+)?/gi);
  if (labValues) {
    labValues.forEach((labValue, index) => {
      const [test, comparison] = labValue.split(/([<>]=?|=)/);
      fields.push({
        id: `lab_${index}`,
        type: 'number',
        label: `What is your current ${test.trim()}?`,
        required: true,
        category: 'medical',
        validation: {
          message: `Please enter your ${test.trim()} value`
        }
      });
    });
  }

  return fields;
};

export const useScreenerStore = create<ScreenerStore>((set, get) => ({
  forms: [],
  isLoading: false,
  error: null,

  fetchForms: async () => {
    set({ isLoading: true, error: null });
    try {
      // First check if user is admin
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userDoc = await getDoc(doc(db, 'partners', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const isAdmin = userData.email === 'theranovex@gmail.com';

      let formDocs = [];
      if (isAdmin) {
        // Admin can see all forms
        // Use only orderBy without complex filtering that requires a composite index
        const formsQuery = query(
          collection(db, 'screenerForms'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(formsQuery);
        formDocs = querySnapshot.docs;
      } else {
        // Partners can only see forms assigned to them
        // Split into two steps to avoid the need for composite index
        // First, get all forms
        const allFormsQuery = query(collection(db, 'screenerForms'));
        const allFormsSnapshot = await getDocs(allFormsQuery);
        
        // Then filter on the client side for forms assigned to this partner
        formDocs = allFormsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.assignedPartners && data.assignedPartners.includes(user.uid);
        });
        
        // Sort manually since we can't use orderBy with the composite index
        formDocs.sort((a, b) => {
          const aDate = a.data().createdAt?.toDate() || new Date(0);
          const bDate = b.data().createdAt?.toDate() || new Date(0);
          return bDate.getTime() - aDate.getTime(); // descending order
        });
      }

      const forms = formDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        expirationDate: doc.data().expirationDate?.toDate() || null
      })) as ScreenerForm[];

      set({ forms, isLoading: false });
    } catch (error) {
      console.error('Error fetching forms:', error);
      set({ error: 'Failed to fetch forms', isLoading: false });
    }
  },

  addForm: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'screenerForms'), {
        ...formData,
        assignedPartners: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft'
      });

      const newForm = {
        id: docRef.id,
        ...formData,
        assignedPartners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft'
      } as ScreenerForm;

      set(state => ({
        forms: [newForm, ...state.forms],
        isLoading: false
      }));

      return newForm;
    } catch (error) {
      console.error('Error adding form:', error);
      set({ error: 'Failed to add form', isLoading: false });
      throw error;
    }
  },

  updateForm: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const formRef = doc(db, 'screenerForms', id);
      await updateDoc(formRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      set(state => ({
        forms: state.forms.map(form =>
          form.id === id
            ? { ...form, ...updates, updatedAt: new Date() }
            : form
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating form:', error);
      set({ error: 'Failed to update form', isLoading: false });
      throw error;
    }
  },

  deleteForm: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'screenerForms', id));
      
      set(state => ({
        forms: state.forms.filter(form => form.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting form:', error);
      set({ error: 'Failed to delete form', isLoading: false });
      throw error;
    }
  },

  duplicateForm: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const formToDuplicate = get().forms.find(f => f.id === id);
      if (!formToDuplicate) throw new Error('Form not found');

      const { id: _, createdAt, updatedAt, assignedPartners, ...formData } = formToDuplicate;
      const newForm = {
        ...formData,
        name: `${formData.name} (Copy)`,
        status: 'draft' as const,
        assignedPartners: []
      };

      const createdForm = await get().addForm(newForm);
      return createdForm;
    } catch (error) {
      console.error('Error duplicating form:', error);
      set({ error: 'Failed to duplicate form', isLoading: false });
      throw error;
    }
  },

  assignFormToPartner: async (formId: string, partnerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const formRef = doc(db, 'screenerForms', formId);
      await updateDoc(formRef, {
        assignedPartners: arrayUnion(partnerId),
        updatedAt: serverTimestamp()
      });

      set(state => ({
        forms: state.forms.map(form =>
          form.id === formId
            ? {
                ...form,
                assignedPartners: [...(form.assignedPartners || []), partnerId],
                updatedAt: new Date()
              }
            : form
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error assigning form to partner:', error);
      set({ error: 'Failed to assign form', isLoading: false });
      throw error;
    }
  },

  unassignFormFromPartner: async (formId: string, partnerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const formRef = doc(db, 'screenerForms', formId);
      await updateDoc(formRef, {
        assignedPartners: arrayRemove(partnerId),
        updatedAt: serverTimestamp()
      });

      set(state => ({
        forms: state.forms.map(form =>
          form.id === formId
            ? {
                ...form,
                assignedPartners: form.assignedPartners?.filter(id => id !== partnerId) || [],
                updatedAt: new Date()
              }
            : form
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error unassigning form from partner:', error);
      set({ error: 'Failed to unassign form', isLoading: false });
      throw error;
    }
  },

  generateFormFromProtocol: (protocol: string) => {
    return generateQuestionsFromCriteria(protocol);
  }
}));
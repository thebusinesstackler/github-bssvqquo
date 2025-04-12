import { create } from 'zustand';
import { Patient, Site, Protocol, Indication } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface PatientStore {
  patients: Patient[];
  sites: Site[];
  protocols: Protocol[];
  indications: Indication[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  archivePatient: (id: string) => void;
  fetchPatients: (partnerId: string) => Promise<void>;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],
  sites: [],
  protocols: [],
  indications: [],
  loading: false,
  error: null,
  
  fetchPatients: async (partnerId: string) => {
    set({ loading: true, error: null });
    try {
      // In a real implementation, fetch from Firestore
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('partnerId', '==', partnerId));
      const querySnapshot = await getDocs(q);
      
      const patients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      })) as Patient[];
      
      set({ patients, loading: false });
    } catch (error) {
      console.error('Error fetching patients:', error);
      set({ error: 'Failed to load patients', loading: false });
    }
  },
  
  addPatient: async (patient) => {
    set({ loading: true, error: null });
    try {
      const patientData = {
        ...patient,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'patients'), patientData);
      
      set(state => ({
        patients: [...state.patients, { 
          ...patientData, 
          id: docRef.id,
          createdAt: new Date(),
          lastUpdated: new Date()
        } as Patient],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding patient:', error);
      set({ error: 'Failed to add patient', loading: false });
    }
  },
  
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map(patient =>
      patient.id === id ? { ...patient, ...updates, lastUpdated: new Date() } : patient
    )
  })),
  
  archivePatient: (id) => set((state) => ({
    patients: state.patients.map(patient =>
      patient.id === id ? { ...patient, status: 'archived', lastUpdated: new Date() } : patient
    )
  }))
}));
import { create } from 'zustand';
import { Patient, Site, Protocol, Indication } from '../types';

interface PatientStore {
  patients: Patient[];
  sites: Site[];
  protocols: Protocol[];
  indications: Indication[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  archivePatient: (id: string) => void;
}

// Updated dummy data with more realistic protocol matching
const DUMMY_PATIENTS: Patient[] = [
  {
    id: '1',
    firstName: 'EDDIE',
    lastName: 'Hunt',
    age: 45,
    sex: 'male',
    phone: '+17049605676',
    email: 'eddie.hunt@example.com',
    indication: 'Major Depressive Disorder',
    status: 'ineligible',
    protocol: '345-201-00002',
    site: 'Monroe Biomedical',
    bmi: 28.5,
    createdAt: new Date('2024-03-01'),
    lastUpdated: new Date('2024-03-01')
  },
  {
    id: '2',
    firstName: 'Tina',
    lastName: 'Martin',
    age: 52,
    sex: 'female',
    phone: '+17047762231',
    email: 'tina.martin@example.com',
    indication: 'Major Depressive Disorder',
    status: 'screening',
    protocol: '345-201-00002',
    site: 'Charlotte Research',
    bmi: 24.3,
    createdAt: new Date('2024-03-02'),
    lastUpdated: new Date('2024-03-02')
  },
  {
    id: '3',
    firstName: 'Pamela',
    lastName: 'Mitchum',
    age: 63,
    sex: 'female',
    phone: '+17042549571',
    email: 'pamela.mitchum@example.com',
    indication: 'Major Depressive Disorder',
    status: 'eligible',
    protocol: '345-201-00002',
    site: 'Raleigh Clinical',
    bmi: 26.7,
    createdAt: new Date('2024-03-03'),
    lastUpdated: new Date('2024-03-03')
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    age: 48,
    sex: 'male',
    phone: '+17042886122',
    email: 'james.wilson@example.com',
    indication: 'Major Depressive Disorder',
    status: 'randomized',
    protocol: '345-201-00002',
    site: 'Monroe Biomedical',
    bmi: 25.1,
    createdAt: new Date('2024-03-04'),
    lastUpdated: new Date('2024-03-04')
  },
  {
    id: '5',
    firstName: 'Sarah',
    lastName: 'Thompson',
    age: 55,
    sex: 'female',
    phone: '+17043457121',
    email: 'sarah.thompson@example.com',
    indication: 'Major Depressive Disorder',
    status: 'completed',
    protocol: '345-201-00002',
    site: 'Charlotte Research',
    bmi: 23.8,
    createdAt: new Date('2024-03-05'),
    lastUpdated: new Date('2024-03-05')
  }
];

const DUMMY_SITES: Site[] = [
  { id: 'site1', name: 'Monroe Biomedical' },
  { id: 'site2', name: 'Charlotte Research' },
  { id: 'site3', name: 'Raleigh Clinical' }
];

const DUMMY_PROTOCOLS: Protocol[] = [
  { id: '345-201-00002', name: 'Depression - Major Depressive Disorder' },
  { id: '345-201-00003', name: 'Anxiety - Generalized Anxiety Disorder' },
  { id: '345-201-00004', name: 'ADHD - Adult' }
];

const DUMMY_INDICATIONS: Indication[] = [
  { id: 'ind1', name: 'Major Depressive Disorder' },
  { id: 'ind2', name: 'Generalized Anxiety Disorder' },
  { id: 'ind3', name: 'ADHD' }
];

export const usePatientStore = create<PatientStore>((set) => ({
  patients: DUMMY_PATIENTS,
  sites: DUMMY_SITES,
  protocols: DUMMY_PROTOCOLS,
  indications: DUMMY_INDICATIONS,
  
  addPatient: (patient) => set((state) => ({
    patients: [...state.patients, { ...patient, id: String(state.patients.length + 1) }]
  })),
  
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
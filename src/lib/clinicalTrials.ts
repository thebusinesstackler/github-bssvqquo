import axios from 'axios';
import queryString from 'query-string';

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

export interface SearchParams {
  query?: string;
  status?: string;
  phase?: string;
  location?: string;
  pageSize?: number;
  page?: number;
}

export interface StudyLocation {
  facility: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
  status?: string;
}

export interface StudyContact {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface ClinicalTrial {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle: string;
    };
    statusModule: {
      overallStatus: string;
      startDate?: string;
      primaryCompletionDate?: string;
      completionDate?: string;
    };
    descriptionModule: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule: {
      conditions?: string[];
    };
    designModule: {
      phases?: string[];
    };
    contactsLocationsModule: {
      locations?: StudyLocation[];
      centralContacts?: StudyContact[];
    };
    eligibilityModule: {
      eligibilityCriteria?: string;
      healthyVolunteers?: boolean;
      gender?: string;
      minimumAge?: string;
      maximumAge?: string;
    };
  };
}

export interface SearchResponse {
  studies: ClinicalTrial[];
  totalCount: number;
}

export async function searchClinicalTrials(params: SearchParams): Promise<SearchResponse> {
  try {
    const queryParams = queryString.stringify({
      query: params.query,
      status: params.status,
      phase: params.phase,
      country: params.location,
      pageSize: params.pageSize || 20,
      page: params.page || 1,
      format: 'json'
    });

    const response = await axios.get(`${BASE_URL}?${queryParams}`);
    return {
      studies: response.data.studies,
      totalCount: response.data.totalCount
    };
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
    throw new Error('Failed to fetch clinical trials');
  }
}

export async function getTrialById(nctId: string): Promise<ClinicalTrial> {
  try {
    const response = await axios.get(`${BASE_URL}/${nctId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trial details:', error);
    throw new Error('Failed to fetch trial details');
  }
}
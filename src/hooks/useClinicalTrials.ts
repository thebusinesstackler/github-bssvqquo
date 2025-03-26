import useSWR from 'swr';
import { searchClinicalTrials, SearchParams, SearchResponse } from '../lib/clinicalTrials';

export function useClinicalTrials(params: SearchParams) {
  const { data, error, isLoading, mutate } = useSWR<SearchResponse>(
    ['clinicalTrials', params],
    () => searchClinicalTrials(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return {
    trials: data?.studies || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refresh: mutate
  };
}
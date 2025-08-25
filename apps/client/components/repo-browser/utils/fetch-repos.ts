/**
 * GitHub API utility function for fetching user repositories.
 * Features:
 * - Repository search functionality
 * - Loading state management
 * - Error handling
 * - Tree data transformation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from 'react';

import { parseError } from '@/lib/utils';

import type { ExtendedTreeDataItem } from '../types/tree';
import { transformReposToTreeData } from '../utils/transform-repos-to-tree';

export const fetchRepos = async (
  setLoading: Dispatch<SetStateAction<boolean>>,
  setError: Dispatch<SetStateAction<string>>,
  setTreeData: Dispatch<SetStateAction<ExtendedTreeDataItem[]>>,
  query?: string,
) => {
  if (query?.trim() === '') {
    query = undefined;
  }

  setLoading(true);
  setError('');
  try {
    const endpoint =
      '/api/github/repos' + (query ? `?q=${encodeURIComponent(query)}` : '');
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Failed to fetch repositories');
    const data = await response.json();
    setTreeData(transformReposToTreeData(data.repositories));
  } catch (err) {
    setError(parseError(err));
  } finally {
    setLoading(false);
  }
};

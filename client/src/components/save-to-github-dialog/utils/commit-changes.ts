import { CommitResponse } from '@/components/repo-browser/types/github';
import {
  itemType,
  type ExtendedTreeDataItem,
} from '@/components/repo-browser/types/tree';

import { CommitForm } from '../types/form';

export async function commitChanges(
  data: CommitForm,
  selectedItem: ExtendedTreeDataItem | null,
  repo: string,
  branch: string,
  content: string,
): Promise<CommitResponse> {
  try {
    if (!selectedItem) {
      throw new Error('Please select a branch, directory, or file to save to.');
    }

    if (selectedItem.type === itemType.REPO) {
      throw new Error('Please select a branch, directory, or file to save to.');
    }

    const commitData = {
      repo: repo,
      branch: branch,
      path:
        selectedItem.type === itemType.DIR
          ? selectedItem.path
          : selectedItem.path?.split('/').slice(0, -1).join('/'),
      filename: data.fileName,
      commitMessage: data.commitSummary,
      content: btoa(content),
    };

    const response = await fetch('/api/github/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commitData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to commit changes');
    }

    return (await response.json()) as CommitResponse;
  } catch (error) {
    // Rethrow the error but ensure it's an Error object
    throw error instanceof Error ? error : new Error(String(error));
  }
}

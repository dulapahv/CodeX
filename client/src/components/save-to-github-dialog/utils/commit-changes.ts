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
): Promise<CommitResponse> {
  if (!selectedItem) throw new Error('No file selected');

  const commitData = {
    repo: repo,
    branch: branch,
    path:
      selectedItem.type === itemType.DIR
        ? selectedItem.path
        : selectedItem.path?.split('/').slice(0, -1).join('/'),
    filename: data.fileName,
    commitMessage: data.commitSummary,
    content: btoa('Hello World!'),
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
}

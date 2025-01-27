/**
 * Form submission handler for committing changes to GitHub.
 * Features:
 * - Promise-based commit handling
 * - Toast notifications
 * - Success/error messaging
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';
import type { ExtendedTreeDataItem } from '@/components/repo-browser/types/tree';

import { CommitForm } from '../types';
import { commitChanges } from './commit-changes';

export const onSubmit = (
  data: CommitForm,
  selectedItem: ExtendedTreeDataItem | null,
  repo: string,
  branch: string,
  content: string,
  closeDialog: () => void,
) => {
  return new Promise((resolve) => {
    const createPromise = commitChanges(
      data,
      selectedItem,
      repo,
      branch,
      content,
    );

    toast.promise(createPromise, {
      loading: 'Committing changes...',
      success: (result) => {
        closeDialog();
        return (
          <div className="flex flex-col font-medium [font-size:13px] [line-height:1.5rem]">
            <p>Changes committed successfully!</p>
            <div className="text-accent-foreground flex items-center gap-x-1">
              <a
                href={result.content.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit hover:underline"
              >
                View on GitHub
              </a>
              <ExternalLink className="size-4" />
            </div>
          </div>
        );
      },
      error: (error) => `Failed to commit changes.\n${parseError(error)}`,
    });

    createPromise
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        console.error('Commit error:', error);
        // Resolve with null instead of rejecting to prevent uncaught errors
        resolve(null);
      });
  });
};

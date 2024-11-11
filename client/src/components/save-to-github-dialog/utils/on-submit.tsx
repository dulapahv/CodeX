import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';
import { type ExtendedTreeDataItem } from '@/components/repo-browser/types/tree';

import { CommitForm } from '../types/form';
import { commitChanges } from './commit-changes';

export function onSubmit(
  data: CommitForm,
  selectedItem: ExtendedTreeDataItem | null,
  repo: string,
  branch: string,
  closeDialog: () => void,
) {
  const createPromise = commitChanges(data, selectedItem, repo, branch);

  toast.promise(createPromise, {
    loading: 'Committing changes...',
    success: (result) => {
      closeDialog();
      return (
        <div className="flex flex-col text-sm font-medium">
          <p>Changes committed successfully!</p>
          <div className="flex items-center gap-x-1 text-accent-foreground">
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

  return createPromise;
}

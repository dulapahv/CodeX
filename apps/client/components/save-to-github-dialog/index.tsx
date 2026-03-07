/**
 * GitHub save dialog component that handles file saving integration.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { forwardRef, useEffect, useState } from 'react';

import type * as monaco from 'monaco-editor';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RepoBrowser } from '@/components/repo-browser';
import { itemType, type ExtendedTreeDataItem } from '@/components/repo-browser/types/tree';
import { ResponsiveDialog } from '@/components/shared/dialog/components/responsive-dialog';
import { useDialogState, type DialogRef } from '@/components/shared/dialog/hooks/useDialogState';
import { GithubAuthPrompt } from '@/components/shared/github/components/github-auth-prompt';
import { GithubFooterInfo } from '@/components/shared/github/components/github-footer-info';
import { useGithubAuth } from '@/components/shared/github/hooks/useGithubAuth';
import { Spinner } from '@/components/spinner';

import { useCommitForm } from './hooks/useCommitForm';
import { getDisplayPath } from './utils/get-display-path';
import { onSubmit } from './utils/on-submit';

interface SaveToGithubDialogProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

type SaveToGithubDialogRef = DialogRef;

const SaveToGithubDialog = forwardRef<SaveToGithubDialogRef, SaveToGithubDialogProps>(
  ({ editor }, ref) => {
    const {
      register,
      handleSubmit,
      setValue,
      clearErrors,
      reset,
      watch,
      formState: { errors, isSubmitting }
    } = useCommitForm();

    const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(null);
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('');

    const { isOpen, setIsOpen, closeDialog } = useDialogState(ref, {
      canClose: () => !isSubmitting,
      onClose: () => {
        setRepo('');
        setBranch('');
        setSelectedItem(null);
        reset();
      }
    });

    const { githubUser, isLoading } = useGithubAuth(isOpen);

    useEffect(() => {
      const fileName = selectedItem?.type === itemType.FILE ? selectedItem.name : '';
      if (fileName) {
        setValue('fileName', fileName);
        clearErrors('fileName');
      }
    }, [selectedItem, setValue, clearErrors]);

    const onError = () => {
      toast.error('Please check the information and try again.');
    };

    const content =
      !isLoading && !githubUser ? (
        <GithubAuthPrompt
          isLoading={isLoading}
          githubUser={githubUser}
          promptText="Please connect to GitHub to save your work to a repository."
        />
      ) : (
        <>
          <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
            <RepoBrowser
              setSelectedItem={setSelectedItem}
              setRepo={setRepo}
              setBranch={setBranch}
              aria-label="Repository browser"
            />
          </div>
          <div className="mx-4 flex-shrink-0 space-y-3 md:mx-0">
            <div role="group" aria-labelledby="filename-group">
              <span id="filename-group" className="sr-only">
                File details
              </span>
              <Input
                placeholder="Filename (e.g., hello.js)"
                disabled={isSubmitting}
                aria-invalid={errors.fileName ? 'true' : 'false'}
                aria-describedby={errors.fileName ? 'filename-error' : undefined}
                {...register('fileName')}
              />
              {errors.fileName && (
                <p id="filename-error" className="text-sm text-red-500" role="alert">
                  {errors.fileName.message}
                </p>
              )}
            </div>
            <div role="group" aria-labelledby="commit-group">
              <span id="commit-group" className="sr-only">
                Commit details
              </span>
              <Input
                placeholder="Commit summary"
                disabled={isSubmitting}
                aria-invalid={errors.commitSummary ? 'true' : 'false'}
                aria-describedby={errors.commitSummary ? 'commit-error' : undefined}
                {...register('commitSummary')}
              />
              {errors.commitSummary && (
                <p id="commit-error" className="text-sm text-red-500" role="alert">
                  {errors.commitSummary.message}
                </p>
              )}
            </div>
          </div>
        </>
      );

    const footer = (
      <form
        onSubmit={handleSubmit(
          data =>
            onSubmit(
              data,
              selectedItem,
              repo,
              branch,
              editor?.getModel()?.getValue() || '',
              closeDialog
            ),
          onError
        )}
        className="flex w-full items-center justify-between gap-2"
      >
        <GithubFooterInfo
          githubUser={githubUser}
          displayPath={getDisplayPath(repo, githubUser, branch, selectedItem, watch('fileName'))}
          actionLabel="Save to"
        />
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          {githubUser && (
            <Button
              type="submit"
              disabled={isSubmitting || !selectedItem || selectedItem.type === itemType.REPO}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          )}
        </div>
      </form>
    );

    return (
      <ResponsiveDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Save to GitHub"
        description="Select a repository, branch, and folder to save your code."
        footer={footer}
        dismissible={false}
      >
        {content}
      </ResponsiveDialog>
    );
  }
);

SaveToGithubDialog.displayName = 'SaveToGithubDialog';

export { SaveToGithubDialog, type SaveToGithubDialogRef };

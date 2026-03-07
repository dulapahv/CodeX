/**
 * Open from GitHub dialog component that handles file browsing and loading.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { forwardRef, useEffect, useState } from 'react';

import type { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { RepoBrowser } from '@/components/repo-browser';
import { itemType, type ExtendedTreeDataItem } from '@/components/repo-browser/types/tree';
import { ResponsiveDialog } from '@/components/shared/dialog/components/responsive-dialog';
import { useDialogState, type DialogRef } from '@/components/shared/dialog/hooks/useDialogState';
import { GithubAuthPrompt } from '@/components/shared/github/components/github-auth-prompt';
import { GithubFooterInfo } from '@/components/shared/github/components/github-footer-info';
import { useGithubAuth } from '@/components/shared/github/hooks/useGithubAuth';
import { Spinner } from '@/components/spinner';

import { getDisplayPath } from './utils';

interface OpenFromGithubDialogProps {
  monaco: Monaco | null;
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

type OpenFromGithubDialogRef = DialogRef;

const OpenFromGithubDialog = forwardRef<OpenFromGithubDialogRef, OpenFromGithubDialogProps>(
  ({ monaco, editor }, ref) => {
    const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(null);
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('');
    const [fileName, setFileName] = useState('');
    const [isFetchingContent, setIsFetchingContent] = useState(false);

    const { isOpen, setIsOpen, closeDialog } = useDialogState(ref, {
      onClose: () => {
        setRepo('');
        setBranch('');
        setFileName('');
        setSelectedItem(null);
      }
    });

    const { githubUser, isLoading } = useGithubAuth(isOpen);

    useEffect(() => {
      const fileName = selectedItem?.type === itemType.FILE ? selectedItem.name : '';
      if (fileName) {
        setFileName(fileName);
      }
    }, [selectedItem]);

    const handleOpenFile = async () => {
      if (!monaco || !editor || !repo || !branch || !fileName || !selectedItem) {
        toast.error('Please select a file to open');
        return;
      }

      try {
        setIsFetchingContent(true);

        // Construct the path from selectedItem's path
        const path = (selectedItem.path ?? '').split('/').slice(0, -1).join('/');

        const response = await fetch(
          `/api/github/content?repo=${repo}&branch=${branch}&path=${path}&filename=${fileName}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch file content');
        }

        const data = await response.json();

        // Try to detect language from file extension
        const extension = fileName.split('.').pop() || '';
        const languages = monaco.languages.getLanguages();
        const language = languages.find(lang =>
          lang.extensions?.some(ext => ext.replace('.', '') === extension)
        );

        // Set content and language (default to plaintext)
        editor.setValue(data.content);
        const model = editor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, language?.id || 'plaintext');
        }

        // Close dialog
        closeDialog();

        // Show success message
        toast.success('File opened successfully');
      } catch (error) {
        console.error('Error opening file:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to open file');
      } finally {
        setIsFetchingContent(false);
      }
    };

    const content =
      !isLoading && !githubUser ? (
        <GithubAuthPrompt
          isLoading={isLoading}
          githubUser={githubUser}
          promptText="Please connect to GitHub to open files from your repositories."
        />
      ) : (
        <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
          <RepoBrowser
            setSelectedItem={setSelectedItem}
            setRepo={setRepo}
            setBranch={setBranch}
            aria-label="Repository browser"
          />
        </div>
      );

    const footer = (
      <>
        <GithubFooterInfo
          githubUser={githubUser}
          displayPath={getDisplayPath(repo, githubUser, branch, selectedItem, fileName)}
          actionLabel="Open"
        />
        <div className="ml-auto flex gap-2">
          {githubUser && (
            <Button
              onClick={handleOpenFile}
              disabled={
                !selectedItem?.type || selectedItem.type !== itemType.FILE || isFetchingContent
              }
              aria-busy={isFetchingContent}
            >
              {isFetchingContent ? (
                <>
                  <Spinner className="mr-2" />
                  Opening...
                </>
              ) : (
                'Open'
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={closeDialog}
            disabled={isFetchingContent}
          >
            Cancel
          </Button>
        </div>
      </>
    );

    return (
      <ResponsiveDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Open from GitHub"
        description="Select a repository, branch, and folder to open your code."
        footer={footer}
        dismissible={false}
      >
        {content}
      </ResponsiveDialog>
    );
  }
);

OpenFromGithubDialog.displayName = 'OpenFromGithubDialog';

export { OpenFromGithubDialog, type OpenFromGithubDialogRef };

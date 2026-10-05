/**
 * GitHub save dialog component that handles file saving integration.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { ExternalLink } from "lucide-react";
import type * as monaco from "monaco-editor";
import { forwardRef, useEffect, useState } from "react";
import { RepoBrowser } from "@/components/repo-browser";
import {
  type ExtendedTreeDataItem,
  itemType,
} from "@/components/repo-browser/types/tree";
import { ResponsiveDialog } from "@/components/shared/dialog/components/responsive-dialog";
import {
  type DialogRef,
  useDialogState,
} from "@/components/shared/dialog/hooks/useDialogState";
import { GithubAuthPrompt } from "@/components/shared/github/components/github-auth-prompt";
import { GithubFooterInfo } from "@/components/shared/github/components/github-footer-info";
import { useGithubAuth } from "@/components/shared/github/hooks/useGithubAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { parseError } from "@/lib/utils";
import { commitChanges } from "./utils/commit-changes";
import { getDisplayPath } from "./utils/get-display-path";

const COMMIT_FORM_ID = "commit-form";

interface SaveToGithubDialogProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

type SaveToGithubDialogRef = DialogRef;

const SaveToGithubDialog = forwardRef<
  SaveToGithubDialogRef,
  SaveToGithubDialogProps
>(({ editor }, ref) => {
  const [fileName, setFileName] = useState("");
  const [commitSummary, setCommitSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(
    null
  );
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");

  const { isOpen, setIsOpen, closeDialog } = useDialogState(ref, {
    canClose: () => !isSubmitting,
    onClose: () => {
      setRepo("");
      setBranch("");
      setSelectedItem(null);
      setFileName("");
      setCommitSummary("");
      setError(null);
      setCommitUrl(null);
    },
  });

  const { githubUser, isLoading } = useGithubAuth(isOpen);

  useEffect(() => {
    const name = selectedItem?.type === itemType.FILE ? selectedItem.name : "";
    if (name) {
      setFileName(name);
    }
  }, [selectedItem]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCommitUrl(null);
    try {
      const result = await commitChanges(
        {
          fileName: fileName.trim(),
          commitSummary: commitSummary.trim(),
        },
        selectedItem,
        repo,
        branch,
        editor?.getModel()?.getValue() || ""
      );
      setCommitUrl(result.content.html_url);
    } catch (error) {
      setError(`Failed to commit changes. ${parseError(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content =
    isLoading || githubUser ? (
      <>
        <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
          <RepoBrowser
            aria-label="Repository browser"
            setBranch={setBranch}
            setRepo={setRepo}
            setSelectedItem={setSelectedItem}
          />
        </div>
        <Form
          className="mx-4 flex-shrink-0 space-y-3 md:mx-0"
          id={COMMIT_FORM_ID}
          onSubmit={handleSubmit}
        >
          <Field.Root
            name="fileName"
            validate={(value) =>
              String(value).trim().length > 4096
                ? "File name must be less than 4096 characters"
                : null
            }
          >
            <Input
              disabled={isSubmitting}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Filename (e.g., hello.js)"
              required
              value={fileName}
            />
            <Field.Error className="text-red-500 text-sm" match="valueMissing">
              File name is required
            </Field.Error>
            <Field.Error className="text-red-500 text-sm" match="customError" />
          </Field.Root>
          <Field.Root
            name="commitSummary"
            validate={(value) =>
              String(value).trim().length > 72
                ? "Commit summary must be less than 72 characters"
                : null
            }
          >
            <Input
              disabled={isSubmitting}
              onChange={(e) => setCommitSummary(e.target.value)}
              placeholder="Commit summary"
              required
              value={commitSummary}
            />
            <Field.Error className="text-red-500 text-sm" match="valueMissing">
              Commit summary is required
            </Field.Error>
            <Field.Error className="text-red-500 text-sm" match="customError" />
          </Field.Root>
        </Form>
      </>
    ) : (
      <GithubAuthPrompt
        githubUser={githubUser}
        isLoading={isLoading}
        promptText="Please connect to GitHub to save your work to a repository."
      />
    );

  const footer = (
    <div className="flex w-full items-center justify-between gap-2">
      <GithubFooterInfo
        actionLabel="Save to"
        displayPath={getDisplayPath(
          repo,
          githubUser,
          branch,
          selectedItem,
          fileName
        )}
        githubUser={githubUser}
      />
      <div className="ml-auto flex flex-col items-end gap-2">
        {error && (
          <p className="text-right text-destructive text-xs" role="alert">
            {error}
          </p>
        )}
        {commitUrl && (
          <a
            className="flex items-center gap-1 text-xs hover:underline"
            href={commitUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Saved · View on GitHub
            <ExternalLink className="size-3" />
          </a>
        )}
        <div className="flex gap-2">
          <Button
            disabled={isSubmitting}
            onClick={closeDialog}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          {githubUser && (
            <Button
              aria-busy={isSubmitting}
              disabled={
                isSubmitting ||
                !selectedItem ||
                selectedItem.type === itemType.REPO
              }
              form={COMMIT_FORM_ID}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      description="Select a repository, branch, and folder to save your code."
      footer={footer}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Save to GitHub"
    >
      {content}
    </ResponsiveDialog>
  );
});

SaveToGithubDialog.displayName = "SaveToGithubDialog";

export { SaveToGithubDialog, type SaveToGithubDialogRef };

/**
 * GitHub save dialog component that handles file saving integration.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import * as Form from "@radix-ui/react-form";
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
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { getDisplayPath } from "./utils/get-display-path";
import { onSubmit } from "./utils/on-submit";

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
    try {
      await onSubmit(
        {
          fileName: fileName.trim(),
          commitSummary: commitSummary.trim(),
        },
        selectedItem,
        repo,
        branch,
        editor?.getModel()?.getValue() || "",
        closeDialog
      );
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
        <Form.Root
          className="mx-4 flex-shrink-0 space-y-3 md:mx-0"
          id={COMMIT_FORM_ID}
          onSubmit={handleSubmit}
        >
          <Form.Field name="fileName">
            <Form.Control asChild>
              <Input
                disabled={isSubmitting}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Filename (e.g., hello.js)"
                required
                value={fileName}
              />
            </Form.Control>
            <Form.Message className="text-red-500 text-sm" match="valueMissing">
              File name is required
            </Form.Message>
            <Form.Message
              className="text-red-500 text-sm"
              match={(value) => value.trim().length > 4096}
            >
              File name must be less than 4096 characters
            </Form.Message>
          </Form.Field>
          <Form.Field name="commitSummary">
            <Form.Control asChild>
              <Input
                disabled={isSubmitting}
                onChange={(e) => setCommitSummary(e.target.value)}
                placeholder="Commit summary"
                required
                value={commitSummary}
              />
            </Form.Control>
            <Form.Message className="text-red-500 text-sm" match="valueMissing">
              Commit summary is required
            </Form.Message>
            <Form.Message
              className="text-red-500 text-sm"
              match={(value) => value.trim().length > 72}
            >
              Commit summary must be less than 72 characters
            </Form.Message>
          </Form.Field>
        </Form.Root>
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
      <div className="ml-auto flex gap-2">
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
                <Spinner className="mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      description="Select a repository, branch, and folder to save your code."
      dismissible={false}
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

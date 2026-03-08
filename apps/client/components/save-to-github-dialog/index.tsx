/**
 * GitHub save dialog component that handles file saving integration.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type * as monaco from "monaco-editor";
import { forwardRef, useEffect, useState } from "react";
import { toast } from "sonner";
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

import { useCommitForm } from "./hooks/useCommitForm";
import { getDisplayPath } from "./utils/get-display-path";
import { onSubmit } from "./utils/on-submit";

interface SaveToGithubDialogProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

type SaveToGithubDialogRef = DialogRef;

const SaveToGithubDialog = forwardRef<
  SaveToGithubDialogRef,
  SaveToGithubDialogProps
>(({ editor }, ref) => {
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useCommitForm();

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
      reset();
    },
  });

  const { githubUser, isLoading } = useGithubAuth(isOpen);

  useEffect(() => {
    const fileName =
      selectedItem?.type === itemType.FILE ? selectedItem.name : "";
    if (fileName) {
      setValue("fileName", fileName);
      clearErrors("fileName");
    }
  }, [selectedItem, setValue, clearErrors]);

  const onError = () => {
    toast.error("Please check the information and try again.");
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
        <div className="mx-4 flex-shrink-0 space-y-3 md:mx-0">
          <fieldset aria-labelledby="filename-group">
            <span className="sr-only" id="filename-group">
              File details
            </span>
            <Input
              aria-describedby={errors.fileName ? "filename-error" : undefined}
              aria-invalid={errors.fileName ? "true" : "false"}
              disabled={isSubmitting}
              placeholder="Filename (e.g., hello.js)"
              {...register("fileName")}
            />
            {errors.fileName && (
              <p
                className="text-red-500 text-sm"
                id="filename-error"
                role="alert"
              >
                {errors.fileName.message}
              </p>
            )}
          </fieldset>
          <fieldset aria-labelledby="commit-group">
            <span className="sr-only" id="commit-group">
              Commit details
            </span>
            <Input
              aria-describedby={
                errors.commitSummary ? "commit-error" : undefined
              }
              aria-invalid={errors.commitSummary ? "true" : "false"}
              disabled={isSubmitting}
              placeholder="Commit summary"
              {...register("commitSummary")}
            />
            {errors.commitSummary && (
              <p
                className="text-red-500 text-sm"
                id="commit-error"
                role="alert"
              >
                {errors.commitSummary.message}
              </p>
            )}
          </fieldset>
        </div>
      </>
    ) : (
      <GithubAuthPrompt
        githubUser={githubUser}
        isLoading={isLoading}
        promptText="Please connect to GitHub to save your work to a repository."
      />
    );

  const footer = (
    <form
      className="flex w-full items-center justify-between gap-2"
      onSubmit={handleSubmit(
        (data) =>
          onSubmit(
            data,
            selectedItem,
            repo,
            branch,
            editor?.getModel()?.getValue() || "",
            closeDialog
          ),
        onError
      )}
    >
      <GithubFooterInfo
        actionLabel="Save to"
        displayPath={getDisplayPath(
          repo,
          githubUser,
          branch,
          selectedItem,
          watch("fileName")
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
    </form>
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

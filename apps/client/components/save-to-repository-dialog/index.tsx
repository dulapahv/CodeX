/**
 * Dialog for saving the editor's content to a connected git provider as a
 * commit.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { ExternalLink } from "lucide-react";
import type * as monaco from "monaco-editor";
import { type FormEvent, forwardRef, useEffect, useState } from "react";
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
import { GitAuthPrompt } from "@/components/shared/git/components/git-auth-prompt";
import { GitFooterInfo } from "@/components/shared/git/components/git-footer-info";
import { ProviderTabs } from "@/components/shared/git/components/provider-tabs";
import { useProviderChoice } from "@/components/shared/git/hooks/use-provider-choice";
import { getDisplayPath } from "@/components/shared/git/utils/get-display-path";
import { requestJson } from "@/components/shared/git/utils/request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  type CommitResult,
  PROVIDER_LABELS,
  type ProviderId,
} from "@/lib/git-providers/types";
import { parseError } from "@/lib/utils";

const COMMIT_FORM_ID = "commit-form";
const MAX_FILE_NAME_LENGTH = 4096;
const MAX_SUMMARY_LENGTH = 72;

interface SaveToRepositoryDialogProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
}

type SaveToRepositoryDialogRef = DialogRef;

// The folder a save lands in: the selected folder, or the selected file's folder
const getTargetFolder = (item: ExtendedTreeDataItem) =>
  item.type === itemType.DIR
    ? (item.path ?? "")
    : (item.path?.split("/").slice(0, -1).join("/") ?? "");

const SaveToRepositoryDialog = forwardRef<
  SaveToRepositoryDialogRef,
  SaveToRepositoryDialogProps
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

  const resetSelection = () => {
    setRepo("");
    setBranch("");
    setSelectedItem(null);
    setFileName("");
    setError(null);
    setCommitUrl(null);
  };

  const { isOpen, setIsOpen, closeDialog } = useDialogState(ref, {
    canClose: () => !isSubmitting,
    onClose: () => {
      resetSelection();
      setCommitSummary("");
    },
  });

  const { isLoading, provider, choose, user, configured } =
    useProviderChoice(isOpen);
  const label = PROVIDER_LABELS[provider];

  useEffect(() => {
    const name = selectedItem?.type === itemType.FILE ? selectedItem.name : "";
    if (name) {
      setFileName(name);
    }
  }, [selectedItem]);

  const handleProviderChange = (next: ProviderId) => {
    resetSelection();
    choose(next);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem || selectedItem.type === itemType.REPO) {
      setError("Please select a branch, folder, or file to save to.");
      return;
    }

    const folder = getTargetFolder(selectedItem);
    const name = fileName.trim();

    setIsSubmitting(true);
    setError(null);
    setCommitUrl(null);
    try {
      const result = await requestJson<CommitResult>(
        `/api/${provider}/commit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo,
            branch,
            path: folder ? `${folder}/${name}` : name,
            message: commitSummary.trim(),
            content: editor?.getModel()?.getValue() ?? "",
          }),
        }
      );
      setCommitUrl(result.url);
    } catch (error) {
      setError(`Failed to commit changes. ${parseError(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <ProviderTabs onValueChange={handleProviderChange} value={provider}>
      {user ? (
        <>
          <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
            <RepoBrowser
              aria-label="Repository browser"
              key={provider}
              provider={provider}
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
                String(value).trim().length > MAX_FILE_NAME_LENGTH
                  ? `File name must not exceed ${MAX_FILE_NAME_LENGTH} characters`
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
              <Field.Error
                className="text-red-500 text-sm"
                match="valueMissing"
              >
                File name is required
              </Field.Error>
              <Field.Error
                className="text-red-500 text-sm"
                match="customError"
              />
            </Field.Root>
            <Field.Root
              name="commitSummary"
              validate={(value) =>
                String(value).trim().length > MAX_SUMMARY_LENGTH
                  ? `Commit summary must not exceed ${MAX_SUMMARY_LENGTH} characters`
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
              <Field.Error
                className="text-red-500 text-sm"
                match="valueMissing"
              >
                Commit summary is required
              </Field.Error>
              <Field.Error
                className="text-red-500 text-sm"
                match="customError"
              />
            </Field.Root>
          </Form>
        </>
      ) : (
        <GitAuthPrompt
          configured={configured}
          isLoading={isLoading}
          promptText={`Connect to ${label} to save your work to a repository.`}
          provider={provider}
        />
      )}
    </ProviderTabs>
  );

  const footer = (
    <div className="flex w-full items-center justify-between gap-2">
      {user && (
        <GitFooterInfo
          actionLabel="Save to"
          displayPath={getDisplayPath(
            repo,
            user.username,
            branch,
            selectedItem,
            fileName
          )}
          provider={provider}
        />
      )}
      <div className="ml-auto flex gap-2">
        <Button
          disabled={isSubmitting}
          onClick={closeDialog}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
        {user && (
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
  );

  return (
    <ResponsiveDialog
      description="Select a repository, branch, and folder to save your code."
      footer={footer}
      fullHeight={isLoading || Boolean(user)}
      isOpen={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : closeDialog())}
      status={
        error ? (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : (
          commitUrl && (
            <a
              className="flex items-center gap-1 text-xs hover:underline"
              href={commitUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Saved · View on {label}
              <ExternalLink className="size-3" />
            </a>
          )
        )
      }
      title="Save to repository"
    >
      {content}
    </ResponsiveDialog>
  );
});

SaveToRepositoryDialog.displayName = "SaveToRepositoryDialog";

export { SaveToRepositoryDialog, type SaveToRepositoryDialogRef };

/**
 * Open from GitHub dialog component that handles file browsing and loading.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
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
import { Spinner } from "@/components/ui/spinner";

import { getDisplayPath } from "./utils";

interface OpenFromGithubDialogProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}

type OpenFromGithubDialogRef = DialogRef;

const OpenFromGithubDialog = forwardRef<
  OpenFromGithubDialogRef,
  OpenFromGithubDialogProps
>(({ monaco, editor }, ref) => {
  const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(
    null
  );
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [fileName, setFileName] = useState("");
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, setIsOpen, closeDialog } = useDialogState(ref, {
    onClose: () => {
      setRepo("");
      setBranch("");
      setFileName("");
      setSelectedItem(null);
      setError(null);
    },
  });

  const { githubUser, isLoading } = useGithubAuth(isOpen);

  useEffect(() => {
    const fileName =
      selectedItem?.type === itemType.FILE ? selectedItem.name : "";
    if (fileName) {
      setFileName(fileName);
    }
  }, [selectedItem]);

  const handleOpenFile = async () => {
    if (!(monaco && editor && repo && branch && fileName && selectedItem)) {
      setError("Please select a file to open");
      return;
    }

    try {
      setError(null);
      setIsFetchingContent(true);

      // Construct the path from selectedItem's path
      const path = (selectedItem.path ?? "").split("/").slice(0, -1).join("/");

      const response = await fetch(
        `/api/github/content?${new URLSearchParams({ repo, branch, path, filename: fileName })}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to fetch file content");
      }

      const data = await response.json();

      // Try to detect language from file extension
      const extension = fileName.split(".").pop() || "";
      const languages = monaco.languages.getLanguages();
      const language = languages.find((lang) =>
        lang.extensions?.some((ext) => ext.replace(".", "") === extension)
      );

      // Set content and language (default to plaintext)
      editor.setValue(data.content);
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language?.id || "plaintext");
      }

      closeDialog();
    } catch (error) {
      console.error("Error opening file:", error);
      setError(error instanceof Error ? error.message : "Failed to open file");
    } finally {
      setIsFetchingContent(false);
    }
  };

  const content =
    isLoading || githubUser ? (
      <div className="mx-4 min-h-10 flex-1 md:mx-0 md:mb-0">
        <RepoBrowser
          aria-label="Repository browser"
          setBranch={setBranch}
          setRepo={setRepo}
          setSelectedItem={setSelectedItem}
        />
      </div>
    ) : (
      <GithubAuthPrompt
        githubUser={githubUser}
        isLoading={isLoading}
        promptText="Please connect to GitHub to open files from your repositories."
      />
    );

  const footer = (
    <>
      <GithubFooterInfo
        actionLabel="Open"
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
          disabled={isFetchingContent}
          onClick={closeDialog}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
        {githubUser && (
          <Button
            aria-busy={isFetchingContent}
            disabled={
              !selectedItem?.type ||
              selectedItem.type !== itemType.FILE ||
              isFetchingContent
            }
            onClick={handleOpenFile}
          >
            {isFetchingContent ? (
              <>
                <Spinner />
                Opening...
              </>
            ) : (
              "Open"
            )}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <ResponsiveDialog
      description="Select a repository, branch, and folder to open your code."
      footer={footer}
      fullHeight={isLoading || Boolean(githubUser)}
      isOpen={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : closeDialog())}
      status={
        error && (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        )
      }
      title="Open from GitHub"
    >
      {content}
    </ResponsiveDialog>
  );
});

OpenFromGithubDialog.displayName = "OpenFromGithubDialog";

export { OpenFromGithubDialog, type OpenFromGithubDialogRef };

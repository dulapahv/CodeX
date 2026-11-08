/**
 * Dialog for opening a file from a connected git provider into the editor.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Monaco } from "@monaco-editor/react";
import type * as monacoEditor from "monaco-editor";
import { forwardRef, useState } from "react";
import { ReplacePromptDialog } from "@/components/replace-prompt-dialog";
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
import { loadIntoEditor } from "@/components/toolbar/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PROVIDER_LABELS, type ProviderId } from "@/lib/git-providers/types";
import { parseError } from "@/lib/utils";

interface OpenFromRepositoryDialogProps {
  editor: monacoEditor.editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}

type OpenFromRepositoryDialogRef = DialogRef;

const OpenFromRepositoryDialog = forwardRef<
  OpenFromRepositoryDialogRef,
  OpenFromRepositoryDialogProps
>(({ monaco, editor }, ref) => {
  const [selectedItem, setSelectedItem] = useState<ExtendedTreeDataItem | null>(
    null
  );
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    content: string;
    name: string;
  } | null>(null);
  const [isReplacePromptOpen, setIsReplacePromptOpen] = useState(false);

  const resetSelection = () => {
    setRepo("");
    setBranch("");
    setSelectedItem(null);
    setError(null);
  };

  const { isOpen, setIsOpen, closeDialog } = useDialogState(ref, {
    onClose: resetSelection,
  });

  const { isLoading, provider, choose, user, configured } =
    useProviderChoice(isOpen);
  const label = PROVIDER_LABELS[provider];
  const fileName =
    selectedItem?.type === itemType.FILE ? selectedItem.name : "";

  const handleProviderChange = (next: ProviderId) => {
    resetSelection();
    choose(next);
  };

  const handleOpenFile = async () => {
    const path = selectedItem?.path;
    if (!(monaco && editor && repo && branch && path && fileName)) {
      setError("Please select a file to open");
      return;
    }

    try {
      setError(null);
      setIsFetchingContent(true);

      const { content } = await requestJson<{ content: string }>(
        `/api/${provider}/file?${new URLSearchParams({ path, ref: branch, repo })}`
      );

      // Asks first when the file would replace code someone wrote
      if (editor.getModel()?.getValue()) {
        setPendingFile({ content, name: fileName });
        setIsReplacePromptOpen(true);
        return;
      }
      loadIntoEditor(monaco, editor, fileName, content);
      closeDialog();
    } catch (fetchError) {
      setError(parseError(fetchError));
    } finally {
      setIsFetchingContent(false);
    }
  };

  const replacePendingFile = () => {
    setIsReplacePromptOpen(false);
    if (monaco && editor && pendingFile) {
      loadIntoEditor(monaco, editor, pendingFile.name, pendingFile.content);
    }
    closeDialog();
  };

  const content = (
    <ProviderTabs onValueChange={handleProviderChange} value={provider}>
      {user ? (
        <div className="mx-4 min-h-10 flex-1 md:mx-0">
          <RepoBrowser
            aria-label="Repository browser"
            key={provider}
            provider={provider}
            setBranch={setBranch}
            setRepo={setRepo}
            setSelectedItem={setSelectedItem}
          />
        </div>
      ) : (
        <GitAuthPrompt
          configured={configured}
          isLoading={isLoading}
          promptText={`Connect to ${label} to open files from your repositories.`}
          provider={provider}
        />
      )}
      <ReplacePromptDialog
        confirmLabel="Replace code"
        description="This replaces the editor's code for everyone in the room. Save the current code first if you want to keep it."
        onCancel={() => setIsReplacePromptOpen(false)}
        onConfirm={replacePendingFile}
        open={isReplacePromptOpen}
        title={`Replace the code with ${pendingFile?.name ?? "this file"}?`}
      />
    </ProviderTabs>
  );

  const footer = (
    <>
      {user && (
        <GitFooterInfo
          actionLabel="Open"
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
          disabled={isFetchingContent}
          onClick={closeDialog}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
        {user && (
          <Button
            aria-busy={isFetchingContent}
            disabled={!fileName || isFetchingContent}
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
      description="Select a repository, branch, and file to open in the editor."
      footer={footer}
      fullHeight={isLoading || Boolean(user)}
      isOpen={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : closeDialog())}
      status={
        error && (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        )
      }
      title="Open from repository"
    >
      {content}
    </ResponsiveDialog>
  );
});

OpenFromRepositoryDialog.displayName = "OpenFromRepositoryDialog";

export { OpenFromRepositoryDialog, type OpenFromRepositoryDialogRef };

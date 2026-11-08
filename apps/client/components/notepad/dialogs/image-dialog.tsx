/**
 * Inserts an image or GIF from a web address or an uploaded file.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { type ChangeEvent, type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { INSERT_IMAGE_COMMAND } from "../commands";
import { restoreEditorFocus } from "../utils";

// Uploads live in the shared note itself, so they are kept small
const MAX_UPLOAD_BYTES = 1024 * 1024;
const IMAGE_URL_PROTOCOLS = new Set(["http:", "https:"]);
const FILE_EXTENSION = /\.[^.]+$/u;

const isImageUrl = (value: string) => {
  try {
    return IMAGE_URL_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
};

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

interface ImageDialogProps {
  kind: "image" | "gif";
  onClose: () => void;
  open: boolean;
}

const ImageDialog = ({ kind, onClose, open }: ImageDialogProps) => {
  const [editor] = useLexicalComposerContext();
  const [source, setSource] = useState<"link" | "upload">("link");
  const [url, setUrl] = useState("");
  const [upload, setUpload] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [altText, setAltText] = useState("");
  const urlId = useId();
  const fileId = useId();
  const altId = useId();
  const noun = kind === "gif" ? "GIF" : "image";
  const src = source === "link" ? url.trim() : upload;
  const isValid = source === "link" ? isImageUrl(src) : Boolean(upload);

  const reset = () => {
    setUrl("");
    setUpload("");
    setUploadError("");
    setAltText("");
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUpload("");
    setUploadError("");
    if (!file) {
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("Choose a file up to 1 MB, or link a larger one.");
      return;
    }
    try {
      setUpload(await readAsDataUrl(file));
      if (!altText) {
        setAltText(file.name.replace(FILE_EXTENSION, ""));
      }
    } catch {
      setUploadError("This file couldn't be read.");
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText: altText.trim(),
      src,
    });
    reset();
    onClose();
  };

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
      <DialogContent finalFocus={() => restoreEditorFocus(editor)}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Insert {noun}</DialogTitle>
            <DialogDescription>
              Link a {noun} by its web address, or upload one up to 1 MB.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            onValueChange={(value) => setSource(value as "link" | "upload")}
            value={source}
          >
            <TabsList>
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent className="grid gap-2 pt-2" value="link">
              <Label htmlFor={urlId}>
                {kind === "gif" ? "GIF URL" : "Image URL"}
              </Label>
              <Input
                id={urlId}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={`https://example.com/${kind === "gif" ? "animation.gif" : "image.png"}`}
                type="url"
                value={url}
              />
            </TabsContent>
            <TabsContent className="grid gap-2 pt-2" value="upload">
              <Label htmlFor={fileId}>File</Label>
              <Input
                accept={kind === "gif" ? "image/gif" : "image/*"}
                id={fileId}
                onChange={handleFile}
                type="file"
              />
              {uploadError && (
                <p className="text-destructive text-xs">{uploadError}</p>
              )}
            </TabsContent>
          </Tabs>
          <div className="grid gap-2">
            <Label htmlFor={altId}>Alt text</Label>
            <Input
              id={altId}
              onChange={(event) => setAltText(event.target.value)}
              placeholder={`Describe the ${noun}`}
              value={altText}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Cancel</Button>} />
            <Button disabled={!isValid} type="submit">
              Insert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { ImageDialog };

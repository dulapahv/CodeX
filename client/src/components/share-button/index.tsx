import { useState } from "react";
import { Check, Copy, Image as LuImage, Share } from "lucide-react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomProps {
  roomId: string;
}

export function ShareButton({ roomId }: RoomProps) {
  const [copyStatus, setCopyStatus] = useState({
    roomIdCopied: false,
    roomLinkCopied: false,
    qrCodeCopied: false,
  });

  function handleCopy(text: string, key: keyof typeof copyStatus) {
    navigator.clipboard.writeText(text);
    setCopyStatus((prevState) => ({ ...prevState, [key]: true }));
    setTimeout(() => {
      setCopyStatus((prevState) => ({ ...prevState, [key]: false }));
    }, 500);
  }

  async function handleCopyQRCode() {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Increase resolution by scaling
      const scale = 2; // Adjust this value to increase/decrease resolution
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard
            .write([new ClipboardItem({ "image/png": blob })])
            .then(() => {
              setCopyStatus((prevState) => ({
                ...prevState,
                qrCodeCopied: true,
              }));
              setTimeout(() => {
                setCopyStatus((prevState) => ({
                  ...prevState,
                  qrCodeCopied: false,
                }));
              }, 500);
            })
            .catch((error) => {
              console.error("Failed to copy QR code:", error);
            });
        }
      }, "image/png");
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger
            onFocus={(e) => {
              e.preventDefault();
            }}
            asChild
          >
            <Button variant="ghost" size="sm" className="h-7 rounded-sm px-2">
              <Share className="mr-2 size-4" />
              Share
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share Room</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Share Room</DialogTitle>
          <DialogDescription>
            Anyone with this Room ID or link can join and edit code in this
            room.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Room ID Section */}
          <div className="flex flex-col space-y-1.5">
            <Label>Room ID</Label>
            <div className="flex gap-x-2">
              <Input value={roomId} readOnly />
              <Button
                onClick={() => handleCopy(roomId, "roomIdCopied")}
                size="icon"
                variant="secondary"
                className="aspect-square"
              >
                {copyStatus.roomIdCopied ? (
                  <Check className="size-4 animate-scale-up-center" />
                ) : (
                  <Copy className="size-4 animate-fade-in" />
                )}
              </Button>
            </div>
          </div>
          {/* Room Link Section */}
          <div className="flex flex-col space-y-1.5">
            <Label>Room Link</Label>
            <div className="flex gap-x-2">
              {typeof window !== "undefined" && (
                <Input
                  value={`${window.location.origin}/room/${roomId}`}
                  readOnly
                />
              )}
              <Button
                onClick={() =>
                  handleCopy(
                    `${window.location.origin}/room/${roomId}`,
                    "roomLinkCopied",
                  )
                }
                size="icon"
                variant="secondary"
                className="aspect-square"
              >
                {copyStatus.roomLinkCopied ? (
                  <Check className="size-4 animate-scale-up-center" />
                ) : (
                  <Copy className="size-4 animate-fade-in" />
                )}
              </Button>
            </div>
          </div>
          {/* QR Code Section */}
          <div className="flex flex-col space-y-1.5">
            <Label>QR Code</Label>
            <div className="flex flex-col items-center space-y-2">
              <QRCode
                value={`${window.location.origin}/room/${roomId}`}
                size={256}
                id="qr-code"
              />
              <Button onClick={handleCopyQRCode} size="sm" variant="secondary">
                {copyStatus.qrCodeCopied ? (
                  <Check className="mr-2 size-4 animate-scale-up-center" />
                ) : (
                  <LuImage className="mr-2 size-4 animate-fade-in" />
                )}
                Copy QR Code as Image
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button asChild>
            <DialogClose>Close</DialogClose>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

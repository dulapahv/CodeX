import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { CopyStatus } from './types';

/**
 * Attempts to copy a QR code canvas to clipboard with fallbacks
 */
export const copyQRCode = async (
  qrCodeRef: RefObject<HTMLCanvasElement | null>,
  setCopyStatus: Dispatch<SetStateAction<CopyStatus>>,
) => {
  try {
    const canvas = qrCodeRef.current;
    if (!canvas) {
      throw new Error('Canvas reference not found');
    }

    // Try the modern Clipboard API first
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      handleCopySuccess();
    } else {
      // Fallback: Create a temporary image and copy it
      const dataUrl = canvas.toDataURL('image/png');
      const img = new Image();
      img.src = dataUrl;

      // Create a temporary canvas with higher resolution
      const tempCanvas = document.createElement('canvas');
      const scale = 2; // Increase resolution
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;

      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Wait for image to load before drawing
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Draw with scaling for better quality
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      // Try to copy the higher resolution image
      tempCanvas.toBlob(
        async (blob) => {
          if (!blob) {
            throw new Error('Failed to create blob from temporary canvas');
          }

          try {
            // Attempt to use the clipboard API again with the higher quality image
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': blob,
                }),
              ]);
              handleCopySuccess();
            } else {
              // Final fallback: Download the image
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = 'qr-code.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
              handleCopySuccess(true);
            }
          } catch (error) {
            console.error('Failed to copy/download image:', error);
            handleCopyError();
          }
        },
        'image/png',
        1.0,
      );
    }
  } catch (error) {
    console.error('Error copying QR code:', error);
    handleCopyError();
  }

  function handleCopySuccess(isDownload = false) {
    setCopyStatus((prev) => ({
      ...prev,
      qrCodeCopied: true,
    }));

    // Show a toast or alert for download fallback
    if (isDownload) {
      alert('QR code has been downloaded to your device.');
    }

    // Reset copy status after a delay
    setTimeout(() => {
      setCopyStatus((prev) => ({
        ...prev,
        qrCodeCopied: false,
      }));
    }, 500);
  }

  function handleCopyError() {
    alert(
      'Failed to copy QR code. Please try again or use a different browser.',
    );
    setCopyStatus((prev) => ({
      ...prev,
      qrCodeCopied: false,
    }));
  }
};

export const copy = (
  text: string,
  key: keyof CopyStatus,
  setCopyStatus: Dispatch<SetStateAction<CopyStatus>>,
) => {
  navigator.clipboard.writeText(text);
  setCopyStatus((prevState) => ({ ...prevState, [key]: true }));
  setTimeout(() => {
    setCopyStatus((prevState) => ({ ...prevState, [key]: false }));
  }, 500);
};

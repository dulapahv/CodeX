import { Dispatch, SetStateAction } from 'react';

import type { CopyStatus } from './types';

export const copyQRCode = (
  setCopyStatus: Dispatch<SetStateAction<CopyStatus>>,
) => {
  const svg = document.getElementById('qr-code');
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    // Increase resolution by scaling
    const scale = 2; // Adjust this value to increase/decrease resolution
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx?.scale(scale, scale);
    ctx?.drawImage(img, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Try using the Clipboard API first
        if (navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard
            .write([new ClipboardItem({ 'image/png': blob })])
            .then(handleCopySuccess)
            .catch(handleCopyFallback);
        } else {
          // Fallback for browsers that don't support Clipboard API
          handleCopyFallback();
        }
      }
    }, 'image/png');
  };

  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;

  function handleCopySuccess() {
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
  }

  function handleCopyFallback() {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Notify user to manually save the image
    alert('Please save the downloaded image to your device.');
    handleCopySuccess();
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

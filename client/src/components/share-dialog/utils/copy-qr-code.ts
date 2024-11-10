import { Dispatch, SetStateAction } from 'react';

import type { CopyStatus } from '../types/copy-status';

export async function copyQRCode(
  setCopyStatus: Dispatch<SetStateAction<CopyStatus>>,
) {
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

    canvas.toBlob((blob) => {
      if (blob) {
        navigator.clipboard
          .write([new ClipboardItem({ 'image/png': blob })])
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
            console.error('Failed to copy QR code:', error);
          });
      }
    }, 'image/png');
  };
  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
}

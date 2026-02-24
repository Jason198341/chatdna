import html2canvas from 'html2canvas';

/**
 * Capture an HTML element as a PNG data URL.
 * Uses html2canvas with high-quality settings for share cards.
 */
export async function generateShareImage(
  element: HTMLElement,
): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2, // Retina-quality
    useCORS: true,
    allowTaint: false,
    backgroundColor: null, // Preserve transparent/gradient backgrounds
    logging: false,
    // Capture the full element including overflow
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Trigger a browser download for a data URL image.
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Capture an element and copy the image to the system clipboard.
 * Falls back to download if clipboard API is unavailable.
 */
export async function shareToClipboard(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create image blob'));
      },
      'image/png',
      1.0,
    );
  });

  // Try modern clipboard API first
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof ClipboardItem !== 'undefined'
  ) {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return;
  }

  // Fallback: download the image instead
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  downloadImage(dataUrl, 'chatdna-share.png');
}

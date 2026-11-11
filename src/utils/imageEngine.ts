export interface ImageDimensions {
  width: number;
  height: number;
}

export function calculateGreatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function calculateAspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '0:0';
  const gcd = calculateGreatestCommonDivisor(width, height);
  return `${Math.round(width / gcd)}:${Math.round(height / gcd)}`;
}

export function calculateProportionalDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number
): ImageDimensions {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: 1, height: 1 };
  }
  const ratio = originalWidth / originalHeight;
  if (targetWidth && !targetHeight) {
    const w = Math.max(1, Math.round(targetWidth));
    return { width: w, height: Math.max(1, Math.round(w / ratio)) };
  }
  if (targetHeight && !targetWidth) {
    const h = Math.max(1, Math.round(targetHeight));
    return { width: Math.max(1, Math.round(h * ratio)), height: h };
  }
  return {
    width: Math.max(1, Math.round(targetWidth || originalWidth)),
    height: Math.max(1, Math.round(targetHeight || originalHeight)),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bayt';
  const k = 1024;
  const sizes = ['Bayt', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.max(1, bytes)) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

export interface CanvasProcessOptions {
  targetWidth?: number;
  targetHeight?: number;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number; // 0.1 to 1.0
  backgroundColor?: string;
  crop?: { x: number; y: number; width: number; height: number };
  rotateDegrees?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export async function loadHtmlImage(srcUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel dosyası yüklenemedi veya dosya bozuk.'));
    img.src = srcUrl;
  });
}

export async function processImageWithCanvas(
  img: HTMLImageElement,
  options: CanvasProcessOptions
): Promise<{ size: number; dataUrl: string; width: number; height: number }> {
  const srcX = options.crop ? Math.max(0, options.crop.x) : 0;
  const srcY = options.crop ? Math.max(0, options.crop.y) : 0;
  const srcW = options.crop
    ? Math.max(1, Math.min(img.naturalWidth - srcX, options.crop.width))
    : img.naturalWidth;
  const srcH = options.crop
    ? Math.max(1, Math.min(img.naturalHeight - srcY, options.crop.height))
    : img.naturalHeight;

  const outW = Math.max(1, Math.round(options.targetWidth || srcW));
  const outH = Math.max(1, Math.round(options.targetHeight || srcH));

  const rot = (((options.rotateDegrees || 0) % 360) + 360) % 360;
  const isRotated90 = rot === 90 || rot === 270;

  const canvas = document.createElement('canvas');
  canvas.width = isRotated90 ? outH : outW;
  canvas.height = isRotated90 ? outW : outH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Tarayıcınız HTML5 2D Canvas işlemini desteklemiyor.');
  }

  if (options.mimeType === 'image/jpeg' || options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  if (rot !== 0) {
    ctx.rotate((rot * Math.PI) / 180);
  }
  const scaleX = options.flipHorizontal ? -1 : 1;
  const scaleY = options.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -outW / 2, -outH / 2, outW, outH);
  ctx.restore();

  const quality = Math.max(0.05, Math.min(1, options.quality ?? 0.85));
  const dataUrl = canvas.toDataURL(options.mimeType, quality);
  const commaIdx = dataUrl.indexOf(',');
  const base64Length = commaIdx >= 0 ? dataUrl.length - commaIdx - 1 : dataUrl.length;
  const byteSize = Math.max(1, Math.round((base64Length * 3) / 4));

  return {
    size: byteSize,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

export function extractDominantColors(img: HTMLImageElement): string[] {
  try {
    const canvas = document.createElement('canvas');
    const size = 24;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return ['#2563EB'];
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    const buckets = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue;
      // Quantize to 32-step buckets
      const r = Math.min(255, Math.round(data[i] / 32) * 32);
      const g = Math.min(255, Math.round(data[i + 1] / 32) * 32);
      const b = Math.min(255, Math.round(data[i + 2] / 32) * 32);
      const hex =
        '#' +
        [r, g, b]
          .map((v) => v.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
      buckets.set(hex, (buckets.get(hex) || 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hex]) => hex);
  } catch {
    return ['#2563EB'];
  }
}

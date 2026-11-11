import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  calculateAspectRatioLabel,
  calculateProportionalDimensions,
  extractDominantColors,
  formatBytes,
  loadHtmlImage,
  processImageWithCanvas,
} from '../../utils/imageEngine';

interface UploadedImageItem {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  objectUrl: string;
  width: number;
  height: number;
  element: HTMLImageElement;
}

async function createSampleImageBlob(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(0.5, '#1D4ED8');
  grad.addColorStop(1, '#0284C7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Decorative geometric shapes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(920, 260, 210, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(100, 120, 160, 12);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('PRATIKBOX GÖRSEL TEST', 100, 230);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '32px sans-serif';
  ctx.fillText('1200 x 800 px · Tarayıcı İçi Örnek Görsel', 100, 300);

  // Color calibration bars
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  colors.forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.fillRect(100 + idx * 165, 460, 145, 200);
  });

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png', 1)
  );
  return new File([blob], 'ornek-gorsel-pratikbox.png', {
    type: 'image/png',
    lastModified: Date.now(),
  });
}

export const ImageToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [imageItem, setImageItem] = useState<UploadedImageItem | null>(null);
  const [extraBatchResults, setExtraBatchResults] = useState<
    { name: string; originalSize: number; outSize: number; dataUrl: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Shared controls
  const [quality, setQuality] = useState<number>(80);
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [outputMime, setOutputMime] = useState<'image/jpeg' | 'image/png' | 'image/webp'>(
    slug === 'png-den-jpg-ye'
      ? 'image/jpeg'
      : slug === 'jpg-den-png-ye'
      ? 'image/png'
      : slug === 'gorsel-webp-donusturucu'
      ? 'image/webp'
      : 'image/jpeg'
  );

  // Cropper controls
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(400);
  const [cropH, setCropH] = useState<number>(400);

  // Preview controls
  const [zoom, setZoom] = useState<number>(100);
  const [rotateDeg, setRotateDeg] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [previewBg, setPreviewBg] = useState<'checker' | 'dark' | 'light' | 'white'>('checker');

  // Output state
  const [processedResult, setProcessedResult] = useState<{
    dataUrl: string;
    size: number;
    width: number;
    height: number;
    ext: string;
  } | null>(null);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset default output format when switching tools
  useEffect(() => {
    if (slug === 'png-den-jpg-ye') setOutputMime('image/jpeg');
    else if (slug === 'jpg-den-png-ye') setOutputMime('image/png');
    else if (slug === 'gorsel-webp-donusturucu') setOutputMime('image/webp');
    else if (slug === 'gorsel-sikistirma') setOutputMime('image/jpeg');
    else setOutputMime('image/png');
  }, [slug]);

  // Revoke object URL on unmount or change
  useEffect(() => {
    return () => {
      if (imageItem?.objectUrl) {
        URL.revokeObjectURL(imageItem.objectUrl);
      }
    };
  }, [imageItem]);

  const handleFilesSelected = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    const first = list[0];
    if (!first.type.startsWith('image/')) {
      setError('Geçersiz dosya türü. Lütfen PNG, JPG, WebP, GIF veya SVG formatında bir görsel seçin.');
      return;
    }
    if (first.size > 40 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük (Maksimum 40 MB). Lütfen daha küçük bir görsel seçin.');
      return;
    }

    try {
      setIsProcessing(true);
      if (imageItem?.objectUrl) {
        URL.revokeObjectURL(imageItem.objectUrl);
      }
      const objUrl = URL.createObjectURL(first);
      const htmlImg = await loadHtmlImage(objUrl);

      const newItem: UploadedImageItem = {
        name: first.name,
        size: first.size,
        type: first.type,
        lastModified: first.lastModified,
        objectUrl: objUrl,
        width: htmlImg.naturalWidth,
        height: htmlImg.naturalHeight,
        element: htmlImg,
      };

      setImageItem(newItem);
      setTargetWidth(htmlImg.naturalWidth);
      setTargetHeight(htmlImg.naturalHeight);
      setCropX(Math.round(htmlImg.naturalWidth * 0.1));
      setCropY(Math.round(htmlImg.naturalHeight * 0.1));
      setCropW(Math.max(10, Math.round(htmlImg.naturalWidth * 0.8)));
      setCropH(Math.max(10, Math.round(htmlImg.naturalHeight * 0.8)));
      setRotateDeg(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(100);
      setDominantColors(extractDominantColors(htmlImg));

      // Process additional files if multiple uploaded in compressor/converter
      if (list.length > 1) {
        const extras: { name: string; originalSize: number; outSize: number; dataUrl: string }[] = [];
        for (let i = 1; i < Math.min(list.length, 6); i++) {
          const f = list[i];
          if (!f.type.startsWith('image/')) continue;
          const u = URL.createObjectURL(f);
          try {
            const el = await loadHtmlImage(u);
            const res = await processImageWithCanvas(el, {
              mimeType: outputMime,
              quality: quality / 100,
              backgroundColor: bgColor,
            });
            extras.push({
              name: f.name,
              originalSize: f.size,
              outSize: res.size,
              dataUrl: res.dataUrl,
            });
          } finally {
            URL.revokeObjectURL(u);
          }
        }
        setExtraBatchResults(extras);
      } else {
        setExtraBatchResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Görsel işlenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-run canvas processing whenever parameters change
  useEffect(() => {
    if (!imageItem) {
      setProcessedResult(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setIsProcessing(true);
        const mime: 'image/jpeg' | 'image/png' | 'image/webp' =
          slug === 'png-den-jpg-ye'
            ? 'image/jpeg'
            : slug === 'jpg-den-png-ye'
            ? 'image/png'
            : slug === 'gorsel-webp-donusturucu'
            ? 'image/webp'
            : outputMime;

        const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';

        const out = await processImageWithCanvas(imageItem.element, {
          targetWidth: slug === 'gorsel-boyutlandirma' ? targetWidth : slug === 'gorsel-kirpma' ? cropW : undefined,
          targetHeight: slug === 'gorsel-boyutlandirma' ? targetHeight : slug === 'gorsel-kirpma' ? cropH : undefined,
          mimeType: mime,
          quality: quality / 100,
          backgroundColor: mime === 'image/jpeg' ? bgColor : undefined,
          crop:
            slug === 'gorsel-kirpma'
              ? { x: cropX, y: cropY, width: cropW, height: cropH }
              : undefined,
          rotateDegrees: slug === 'gorsel-onizleme' ? rotateDeg : 0,
          flipHorizontal: slug === 'gorsel-onizleme' ? flipH : false,
          flipVertical: slug === 'gorsel-onizleme' ? flipV : false,
        });

        if (!cancelled) {
          setProcessedResult({
            dataUrl: out.dataUrl,
            size: out.size,
            width: out.width,
            height: out.height,
            ext,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Görsel dönüştürülemedi.');
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [
    imageItem,
    slug,
    quality,
    targetWidth,
    targetHeight,
    bgColor,
    outputMime,
    cropX,
    cropY,
    cropW,
    cropH,
    rotateDeg,
    flipH,
    flipV,
  ]);

  const handleWidthChange = (val: number) => {
    const safe = Math.max(1, Math.min(8000, val || 1));
    setTargetWidth(safe);
    if (lockAspect && imageItem) {
      const dims = calculateProportionalDimensions(imageItem.width, imageItem.height, safe, undefined);
      setTargetHeight(dims.height);
    }
  };

  const handleHeightChange = (val: number) => {
    const safe = Math.max(1, Math.min(8000, val || 1));
    setTargetHeight(safe);
    if (lockAspect && imageItem) {
      const dims = calculateProportionalDimensions(imageItem.width, imageItem.height, undefined, safe);
      setTargetWidth(dims.width);
    }
  };

  const applyCropPreset = (ratioW: number, ratioH: number) => {
    if (!imageItem) return;
    const maxW = imageItem.width;
    const maxH = imageItem.height;
    let w = maxW;
    let h = Math.round((w * ratioH) / ratioW);
    if (h > maxH) {
      h = maxH;
      w = Math.round((h * ratioW) / ratioH);
    }
    setCropX(Math.round((maxW - w) / 2));
    setCropY(Math.round((maxH - h) / 2));
    setCropW(w);
    setCropH(h);
  };

  const handleClear = () => {
    if (imageItem?.objectUrl) {
      URL.revokeObjectURL(imageItem.objectUrl);
    }
    setImageItem(null);
    setProcessedResult(null);
    setExtraBatchResults([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = async () => {
    const sampleFile = await createSampleImageBlob();
    await handleFilesSelected([sampleFile]);
  };

  const savingsPercent =
    imageItem && processedResult
      ? Math.round(((imageItem.size - processedResult.size) / imageItem.size) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      {!imageItem ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 md:p-12 text-center transition-colors bg-slate-50/60 dark:bg-slate-900/40"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={slug === 'gorsel-sikistirma' || slug === 'gorsel-webp-donusturucu'}
            onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            className="hidden"
            id="image-file-input"
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Görsel dosyanızı buraya sürükleyin veya seçin
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            PNG, JPG, WebP, GIF veya SVG desteklenir. Görselleriniz sunucuya yüklenmez, doğrudan tarayıcınızda işlenir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="image-file-input"
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Görsel Seçin
            </label>
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              Örnek Görsel ile Dene
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Toolbar */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-sm">
                <span className="font-semibold text-slate-900 dark:text-white">{imageItem.name}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-400 tabular-nums">
                  {imageItem.width} × {imageItem.height} px
                </span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-slate-600 dark:text-slate-400 tabular-nums">
                  Orijinal: {formatBytes(imageItem.size)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Sıfırla / Yeni Görsel
                </button>
              </div>
            </div>

            {/* Tool-specific controls */}
            {(slug === 'gorsel-sikistirma' ||
              slug === 'png-den-jpg-ye' ||
              slug === 'gorsel-webp-donusturucu') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label htmlFor="quality-slider" className="font-medium text-slate-700 dark:text-slate-300">
                      Kalite / Sıkıştırma Oranı
                    </label>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      %{quality}
                    </span>
                  </div>
                  <input
                    id="quality-slider"
                    type="range"
                    min={10}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Maksimum Sıkıştırma (%10)</span>
                    <span>Dengeli (%80)</span>
                    <span>En Yüksek Kalite (%100)</span>
                  </div>
                </div>

                {slug === 'gorsel-sikistirma' && (
                  <div>
                    <label htmlFor="format-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Çıktı Formatı
                    </label>
                    <select
                      id="format-select"
                      value={outputMime}
                      onChange={(e) => setOutputMime(e.target.value as 'image/jpeg' | 'image/png' | 'image/webp')}
                      className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="image/jpeg">JPEG (.jpg) – Fotoğraflar için en iyi sıkıştırma</option>
                      <option value="image/webp">WebP (.webp) – Modern web siteleri için en hafif</option>
                      <option value="image/png">PNG (.png) – Kayıpsız grafik formatı</option>
                    </select>
                  </div>
                )}

                {slug === 'png-den-jpg-ye' && (
                  <div>
                    <label htmlFor="bg-color-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Şeffaf Alan Arka Plan Rengi
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="bg-color-input"
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
                      />
                      <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{bgColor}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {slug === 'gorsel-boyutlandirma' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label htmlFor="resize-width" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Genişlik (px)
                    </label>
                    <input
                      id="resize-width"
                      type="number"
                      min={1}
                      max={8000}
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="resize-height" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Yükseklik (px)
                    </label>
                    <input
                      id="resize-height"
                      type="number"
                      min={1}
                      max={8000}
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setLockAspect(!lockAspect)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                        lockAspect
                          ? 'bg-blue-600/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      {lockAspect ? 'En-Boy Oranı Kilitli' : 'Serbest Boyut'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 mr-1">Hazır Ölçüler:</span>
                  {[
                    { label: '%50 Küçült', w: Math.round(imageItem.width * 0.5), h: Math.round(imageItem.height * 0.5) },
                    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
                    { label: 'Sosyal Medya Kare (1080×1080)', w: 1080, h: 1080 },
                    { label: 'Open Graph (1200×630)', w: 1200, h: 630 },
                    { label: 'Web Standart (800×600)', w: 800, h: 600 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setLockAspect(false);
                        setTargetWidth(preset.w);
                        setTargetHeight(preset.h);
                      }}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors whitespace-nowrap"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {slug === 'gorsel-kirpma' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">Kırpma Oranı:</span>
                  {[
                    { label: '1:1 Kare', w: 1, h: 1 },
                    { label: '16:9 Geniş', w: 16, h: 9 },
                    { label: '4:3 Klasik', w: 4, h: 3 },
                    { label: '4:5 Dikey', w: 4, h: 5 },
                  ].map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => applyCropPreset(r.w, r.h)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors whitespace-nowrap"
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Sol X (px)</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, imageItem.width - 10)}
                      value={cropX}
                      onChange={(e) => setCropX(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Üst Y (px)</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, imageItem.height - 10)}
                      value={cropY}
                      onChange={(e) => setCropY(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Kırpma Genişliği (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={imageItem.width - cropX}
                      value={cropW}
                      onChange={(e) => setCropW(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Kırpma Yüksekliği (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={imageItem.height - cropY}
                      value={cropH}
                      onChange={(e) => setCropH(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>
            )}

            {slug === 'gorsel-onizleme' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(25, z - 25))}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    aria-label="Uzaklaştır"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs px-2 tabular-nums">%{zoom}</span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(300, z + 25))}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    aria-label="Yakınlaştır"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotateDeg((d) => (d + 90) % 360)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    90° Döndür
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipH(!flipH)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    Yatay Çevir
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV(!flipV)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    Dikey Çevir
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 mr-1">Zemin:</span>
                  {[
                    { id: 'checker', label: 'Şeffaf Dama' },
                    { id: 'dark', label: 'Koyu' },
                    { id: 'white', label: 'Beyaz' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setPreviewBg(b.id as 'checker' | 'dark' | 'white')}
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        previewBg === b.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image Information Table (for gorsel-bilgisi) */}
          {slug === 'gorsel-bilgisi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Teknik Görsel Özellikleri
                </h4>
                <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {[
                    ['Dosya Adı', imageItem.name],
                    ['MIME Türü', imageItem.type || 'image/png'],
                    ['Çözünürlük', `${imageItem.width} × ${imageItem.height} piksel`],
                    [
                      'Megapiksel',
                      `${((imageItem.width * imageItem.height) / 1_000_000).toFixed(2)} MP`,
                    ],
                    ['En-Boy Oranı', calculateAspectRatioLabel(imageItem.width, imageItem.height)],
                    ['Dosya Boyutu', `${formatBytes(imageItem.size)} (${imageItem.size.toLocaleString('tr-TR')} bayt)`],
                    [
                      'Son Değiştirilme',
                      new Date(imageItem.lastModified).toLocaleString('tr-TR'),
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="py-2 flex justify-between gap-4">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-mono text-slate-900 dark:text-white text-right tabular-nums">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Görseldeki Baskın Renk Paleti
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {dominantColors.map((hex) => (
                    <div
                      key={hex}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-lg border border-black/10 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="font-mono text-sm font-medium">{hex}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(hex);
                          setCopiedHex(hex);
                          setTimeout(() => setCopiedHex(null), 1500);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {copiedHex === hex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedHex === hex ? 'Kopyalandı' : 'Kodu Kopyala'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Output Preview & Download Bar */}
          {processedResult && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">İşlenmiş Görsel Çıktısı</div>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {processedResult.width} × {processedResult.height} px
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
                      Yeni Boyut: {formatBytes(processedResult.size)}
                    </span>
                    {savingsPercent > 0 && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          %{savingsPercent} daha küçük
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <a
                  href={processedResult.dataUrl}
                  download={`pratikbox-${ imageItem.name.replace(/\.[^/.]+$/, '') }.${processedResult.ext}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Görseli İndir (.{processedResult.ext.toUpperCase()})
                </a>
              </div>

              <div
                className={`relative rounded-xl overflow-auto max-h-[460px] flex items-center justify-center p-6 border border-slate-200 dark:border-slate-800 ${
                  previewBg === 'dark'
                    ? 'bg-slate-950'
                    : previewBg === 'white'
                    ? 'bg-white'
                    : 'bg-slate-100 dark:bg-slate-950/70'
                }`}
              >
                <img
                  src={processedResult.dataUrl}
                  alt="İşlenmiş görsel önizlemesi"
                  style={{
                    transform: slug === 'gorsel-onizleme' ? `scale(${zoom / 100})` : undefined,
                    transformOrigin: 'center center',
                  }}
                  className="max-h-[380px] w-auto object-contain rounded shadow-sm transition-transform"
                />
              </div>

              {isProcessing && (
                <p className="text-xs text-slate-500 text-center">Görsel tarayıcıda işleniyor...</p>
              )}
            </div>
          )}

          {/* Extra Batch Processed Items */}
          {extraBatchResults.length > 0 && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Toplu İşlenen Diğer Görseller ({extraBatchResults.length})
              </h4>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {extraBatchResults.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                      <span className="mx-2 text-slate-400">·</span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatBytes(item.originalSize)} → {formatBytes(item.outSize)}
                      </span>
                    </div>
                    <a
                      href={item.dataUrl}
                      download={`pratikbox-${item.name}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      İndir
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

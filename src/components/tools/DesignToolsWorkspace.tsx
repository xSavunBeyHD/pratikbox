import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download } from 'lucide-react';
import { hexToRgb, rgbToHex, rgbToHsl } from '../../utils/toolEngines';

export const DesignToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Color Picker / HEX / RGB shared states
  const [hexInput, setHexInput] = useState<string>('#2563EB');
  const [rgbR, setRgbR] = useState<number>(37);
  const [rgbG, setRgbG] = useState<number>(99);
  const [rgbB, setRgbB] = useState<number>(235);
  const [alpha, setAlpha] = useState<number>(100);

  // Gradient generator state
  const [gradColor1, setGradColor1] = useState<string>('#0F172A');
  const [gradColor2, setGradColor2] = useState<string>('#2563EB');
  const [gradAngle, setGradAngle] = useState<number>(135);
  const [gradType, setGradType] = useState<'linear' | 'radial'>('linear');

  // QR Code state
  const [qrText, setQrText] = useState<string>('https://pratikbox.com');
  const [qrSize, setQrSize] = useState<number>(320);
  const [qrFg, setQrFg] = useState<string>('#0F172A');
  const [qrBg, setQrBg] = useState<string>('#FFFFFF');
  const [qrErrorLevel, setQrErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Favicon state
  const [favText, setFavText] = useState<string>('PB');
  const [favBg, setFavBg] = useState<string>('#2563EB');
  const [favFg, setFavFg] = useState<string>('#FFFFFF');
  const [favRadius, setFavRadius] = useState<number>(22);
  const [favUrls, setFavUrls] = useState<Record<number, string>>({});

  const copyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Sync HEX -> RGB
  const handleHexChange = (val: string) => {
    setHexInput(val);
    const parsed = hexToRgb(val);
    if (parsed) {
      setRgbR(parsed.r);
      setRgbG(parsed.g);
      setRgbB(parsed.b);
    }
  };

  // Sync RGB -> HEX
  const handleRgbChange = (r: number, g: number, b: number) => {
    setRgbR(r);
    setRgbG(g);
    setRgbB(b);
    setHexInput(rgbToHex(r, g, b));
  };

  // Generate QR Code
  useEffect(() => {
    if (slug !== 'qr-kod-olusturucu') return;
    const content = qrText.trim() || 'https://pratikbox.com';
    QRCode.toDataURL(content, {
      width: qrSize,
      margin: 2,
      errorCorrectionLevel: qrErrorLevel,
      color: { dark: qrFg, light: qrBg },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [slug, qrText, qrSize, qrFg, qrBg, qrErrorLevel]);

  // Generate Favicon sizes (16, 32, 180, 512)
  useEffect(() => {
    if (slug !== 'favicon-olusturucu') return;
    const sizes = [16, 32, 180, 512];
    const generated: Record<number, string> = {};

    sizes.forEach((sz) => {
      const canvas = document.createElement('canvas');
      canvas.width = sz;
      canvas.height = sz;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const r = (favRadius / 100) * sz;
      ctx.beginPath();
      ctx.roundRect(0, 0, sz, sz, r);
      ctx.fillStyle = favBg;
      ctx.fill();

      ctx.fillStyle = favFg;
      ctx.font = `bold ${Math.round(sz * 0.48)}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((favText || 'P').slice(0, 3), sz / 2, sz / 2 + sz * 0.03);

      generated[sz] = canvas.toDataURL('image/png');
    });

    setFavUrls(generated);
  }, [slug, favText, favBg, favFg, favRadius]);

  // 46, 47, 48: Color Picker, HEX to RGB, RGB to HEX
  if (
    slug === 'renk-secici' ||
    slug === 'hex-rgb-donusturucu' ||
    slug === 'rgb-hex-donusturucu'
  ) {
    const validHex = rgbToHex(rgbR, rgbG, rgbB);
    const hsl = rgbToHsl(rgbR, rgbG, rgbB);
    const rgbCss =
      alpha < 100
        ? `rgba(${rgbR}, ${rgbG}, ${rgbB}, ${(alpha / 100).toFixed(2)})`
        : `rgb(${rgbR}, ${rgbG}, ${rgbB})`;
    const hslCss = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={validHex}
                onChange={(e) => handleHexChange(e.target.value)}
                aria-label="Görsel Renk Seçici"
                className="w-16 h-16 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 shrink-0"
              />
              <div className="flex-1">
                <label htmlFor="hex-code-input" className="block text-xs font-semibold text-slate-500 mb-1">
                  HEX Renk Kodu
                </label>
                <input
                  id="hex-code-input"
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Kırmızı (R)', val: rgbR, set: (v: number) => handleRgbChange(v, rgbG, rgbB) },
                { label: 'Yeşil (G)', val: rgbG, set: (v: number) => handleRgbChange(rgbR, v, rgbB) },
                { label: 'Mavi (B)', val: rgbB, set: (v: number) => handleRgbChange(rgbR, rgbG, v) },
              ].map((ch) => (
                <div key={ch.label}>
                  <label className="block text-xs text-slate-500 mb-1">{ch.label}</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={ch.val}
                    onChange={(e) => ch.set(Math.max(0, Math.min(255, Number(e.target.value))))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-sm tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Opaklık (Alpha)</span>
                <span className="font-mono tabular-nums">%{alpha}</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-inner"
              style={{ backgroundColor: rgbCss }}
            >
              <span className="text-white font-semibold text-sm drop-shadow">
                Beyaz Metin Görünümü
              </span>
              <span className="text-slate-950 font-semibold text-sm bg-white/70 px-2.5 py-1 rounded">
                Koyu Metin Görünümü
              </span>
            </div>

            {[
              { label: 'HEX Kodu', val: validHex, key: 'hex' },
              { label: 'RGB / RGBA', val: rgbCss, key: 'rgb' },
              { label: 'HSL Kodu', val: hslCss, key: 'hsl' },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div>
                  <div className="text-xs text-slate-500">{row.label}</div>
                  <div className="font-mono text-sm font-semibold">{row.val}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(row.val, row.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                >
                  {copiedKey === row.key ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === row.key ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 49: CSS Gradient Generator
  if (slug === 'gradyan-olusturucu') {
    const cssVal =
      gradType === 'linear'
        ? `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})`
        : `radial-gradient(circle, ${gradColor1}, ${gradColor2})`;
    const fullCss = `background: ${cssVal};`;

    const downloadGradientPng = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d')!;
      const g =
        gradType === 'linear'
          ? ctx.createLinearGradient(0, 0, 1920, 1080)
          : ctx.createRadialGradient(960, 540, 50, 960, 540, 960);
      g.addColorStop(0, gradColor1);
      g.addColorStop(1, gradColor2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1920, 1080);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'pratikbox-gradyan-1920x1080.png';
      a.click();
    };

    return (
      <div className="space-y-6">
        <div
          className="h-52 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner"
          style={{ background: cssVal }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Başlangıç Rengi</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={gradColor1}
                onChange={(e) => setGradColor1(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer"
              />
              <span className="font-mono text-xs">{gradColor1}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Bitiş Rengi</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={gradColor2}
                onChange={(e) => setGradColor2(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer"
              />
              <span className="font-mono text-xs">{gradColor2}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Gradyan Türü</label>
            <select
              value={gradType}
              onChange={(e) => setGradType(e.target.value as 'linear' | 'radial')}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
            >
              <option value="linear">Doğrusal (Linear)</option>
              <option value="radial">Dairesel (Radial)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Açı: {gradAngle}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={gradAngle}
              onChange={(e) => setGradAngle(Number(e.target.value))}
              className="w-full accent-blue-600 mt-2"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <code className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
            {fullCss}
          </code>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyValue(fullCss, 'grad')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
            >
              {copiedKey === 'grad' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              CSS Kopyala
            </button>
            <button
              type="button"
              onClick={downloadGradientPng}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Full HD PNG İndir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 50: QR Code Generator
  if (slug === 'qr-kod-olusturucu') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div>
            <label htmlFor="qr-content-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              URL Adresi, Metin, Telefon veya Wi-Fi Bilgisi
            </label>
            <textarea
              id="qr-content-input"
              rows={3}
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="https://pratikbox.com"
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Çözünürlük Boyutu</label>
              <select
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
              >
                <option value={256}>256 × 256 px</option>
                <option value={320}>320 × 320 px</option>
                <option value={512}>512 × 512 px (Baskı)</option>
                <option value={1024}>1024 × 1024 px (Yüksek)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hata Düzeltme Seviyesi</label>
              <select
                value={qrErrorLevel}
                onChange={(e) => setQrErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
              >
                <option value="L">Düşük (L - %7)</option>
                <option value="M">Orta (M - %15)</option>
                <option value="Q">Yüksek (Q - %25)</option>
                <option value="H">Maksimum (H - %30)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">QR Çizgi Rengi</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={qrFg}
                  onChange={(e) => setQrFg(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer"
                />
                <span className="font-mono text-xs">{qrFg}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Arka Plan Rengi</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={qrBg}
                  onChange={(e) => setQrBg(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer"
                />
                <span className="font-mono text-xs">{qrBg}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Oluşturulan QR Kod"
              className="w-56 h-56 rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-white"
            />
          )}
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            {qrSize} × {qrSize} px · Süresiz & Filigransız PNG
          </div>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`pratikbox-qr-${qrSize}px.png`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              QR Kodu İndir (PNG)
            </a>
          )}
        </div>
      </div>
    );
  }

  // 51: Favicon Generator
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div>
          <label htmlFor="fav-text-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            İkon Metni / Harf (1-3 Karakter)
          </label>
          <input
            id="fav-text-input"
            type="text"
            maxLength={3}
            value={favText}
            onChange={(e) => setFavText(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Arka Plan Rengi</label>
            <input
              type="color"
              value={favBg}
              onChange={(e) => setFavBg(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Yazı Rengi</label>
            <input
              type="color"
              value={favFg}
              onChange={(e) => setFavFg(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Köşe Yuvarlaklığı</span>
            <span className="font-mono tabular-nums">%{favRadius}</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            value={favRadius}
            onChange={(e) => setFavRadius(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
          Hazır Favicon Boyutları ve İndirme
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { size: 32, desc: 'Tarayıcı Sekmesi (32×32)' },
            { size: 16, desc: 'Küçük Sekme (16×16)' },
            { size: 180, desc: 'Apple Touch Icon (180×180)' },
            { size: 512, desc: 'PWA / Android (512×512)' },
          ].map((item) => (
            <div
              key={item.size}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {favUrls[item.size] && (
                  <img
                    src={favUrls[item.size]}
                    alt={item.desc}
                    className="w-10 h-10 rounded shrink-0"
                  />
                )}
                <div className="text-xs">
                  <div className="font-semibold">{item.size}×{item.size}</div>
                  <div className="text-slate-500">{item.desc}</div>
                </div>
              </div>
              {favUrls[item.size] && (
                <a
                  href={favUrls[item.size]}
                  download={`favicon-${item.size}x${item.size}.png`}
                  className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                  aria-label={`${item.size}x${item.size} İndir`}
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

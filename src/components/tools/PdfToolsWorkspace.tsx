import React, { useState, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  Upload,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  AlertCircle,
  Sparkles,
  RotateCcw,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  extractPagesFromPdfBuffer,
  inspectPdfBuffer,
  mergePdfBuffers,
  parsePageRangeString,
  PdfMetadataInfo,
} from '../../utils/pdfEngine';
import { formatBytes } from '../../utils/imageEngine';

interface LoadedPdfFile {
  id: string;
  name: string;
  size: number;
  buffer: Uint8Array;
  info: PdfMetadataInfo;
}

async function createSamplePdfBytes(title: string, pageLabels: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor('PRATIKBOX PDF Motoru');
  doc.setSubject('Tarayıcı İçi Örnek PDF Belgesi');
  doc.setCreator('PRATIKBOX (pdf-lib)');
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  pageLabels.forEach((label, idx) => {
    const page = doc.addPage([595, 842]);
    page.drawText('PRATIKBOX ORNEK PDF BELGESI', {
      x: 50,
      y: 760,
      size: 20,
      font,
      color: rgb(0.14, 0.38, 0.92),
    });
    page.drawText(`${label} (Sayfa ${idx + 1} / ${pageLabels.length})`, {
      x: 50,
      y: 710,
      size: 14,
      font,
      color: rgb(0.15, 0.2, 0.3),
    });
  });

  return await doc.save();
}

export const PdfToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [pdfFiles, setPdfFiles] = useState<LoadedPdfFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Splitter state
  const [rangeInput, setRangeInput] = useState<string>('1-2, 3');
  const [splitOutputs, setSplitOutputs] = useState<{ label: string; url: string; size: number }[]>([]);

  // Page Extractor state
  const [selectedPages, setSelectedPages] = useState<number[]>([0]);

  // Merger / Extractor output URL
  const [outputPdf, setOutputPdf] = useState<{ url: string; name: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanupUrls = () => {
    if (outputPdf?.url) URL.revokeObjectURL(outputPdf.url);
    splitOutputs.forEach((s) => URL.revokeObjectURL(s.url));
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    setError(null);
    cleanupUrls();
    setOutputPdf(null);
    setSplitOutputs([]);

    const arr = Array.from(files);
    if (arr.length === 0) return;

    setIsBusy(true);
    try {
      const loaded: LoadedPdfFile[] = [];
      for (const f of arr) {
        if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
          throw new Error(`"${f.name}" geçerli bir PDF dosyası değil. Lütfen .pdf uzantılı belge seçin.`);
        }
        const ab = await f.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        try {
          const info = await inspectPdfBuffer(uint8);
          loaded.push({
            id: `${f.name}-${Date.now()}-${Math.random()}`,
            name: f.name,
            size: f.size,
            buffer: uint8,
            info,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (msg.toLowerCase().includes('encrypt')) {
            throw new Error(
              `"${f.name}" şifreli (parola korumalı) bir PDF belgesidir. Güvenlik kısıtlaması nedeniyle şifreli PDF'ler işlenemez.`
            );
          }
          throw new Error(`"${f.name}" okunamadı veya bozuk bir PDF dosyası.`);
        }
      }

      const nextList = slug === 'pdf-birlestirme' ? [...pdfFiles, ...loaded] : [loaded[0]];
      setPdfFiles(nextList);

      if (nextList[0]) {
        const total = nextList[0].info.pageCount;
        setSelectedPages([0]);
        setRangeInput(total >= 2 ? `1-${Math.ceil(total / 2)}, ${Math.ceil(total / 2) + 1}-${total}` : '1');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF yüklenirken hata oluştu.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLoadSamplePdfs = async () => {
    setIsBusy(true);
    setError(null);
    try {
      if (slug === 'pdf-birlestirme') {
        const b1 = await createSamplePdfBytes('PRATIKBOX Rapor Bolum 1', ['Kapak Sayfasi', 'Finansal Ozet']);
        const b2 = await createSamplePdfBytes('PRATIKBOX Rapor Bolum 2', ['Teknik Ekler', 'Sonuc Tablosu']);
        const f1 = new File([new Uint8Array(b1)], 'rapor-bolum-1.pdf', { type: 'application/pdf' });
        const f2 = new File([new Uint8Array(b2)], 'rapor-bolum-2.pdf', { type: 'application/pdf' });
        await handleFilesUpload([f1, f2]);
      } else {
        const b = await createSamplePdfBytes('PRATIKBOX 4 Sayfali Ornek Belge', [
          '1. Giris ve Ozet',
          '2. Mimari Detaylar',
          '3. Performans Verileri',
          '4. Sonuc ve Ekler',
        ]);
        const f = new File([new Uint8Array(b)], 'ornek-4-sayfali-belge.pdf', { type: 'application/pdf' });
        await handleFilesUpload([f]);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pdfFiles.length) return;
    const copy = [...pdfFiles];
    const tmp = copy[index];
    copy[index] = copy[target];
    copy[target] = tmp;
    setPdfFiles(copy);
  };

  const handleRunMerger = async () => {
    setError(null);
    if (pdfFiles.length < 2) {
      setError('Birleştirme işlemi için lütfen en az 2 adet PDF dosyası ekleyin.');
      return;
    }
    setIsBusy(true);
    try {
      cleanupUrls();
      const mergedBytes = await mergePdfBuffers(pdfFiles.map((f) => f.buffer));
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutputPdf({
        url,
        name: 'pratikbox-birlestirilmis.pdf',
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF birleştirme sırasında hata oluştu.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRunSplitter = async () => {
    setError(null);
    const active = pdfFiles[0];
    if (!active) return;
    setIsBusy(true);
    try {
      cleanupUrls();
      const groups = parsePageRangeString(rangeInput, active.info.pageCount);
      const outputs: { label: string; url: string; size: number }[] = [];
      for (let i = 0; i < groups.length; i++) {
        const bytes = await extractPagesFromPdfBuffer(active.buffer, groups[i]);
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
        const pageNums = groups[i].map((n) => n + 1).join(',');
        outputs.push({
          label: `Parça ${i + 1} (Sayfa: ${pageNums})`,
          url: URL.createObjectURL(blob),
          size: blob.size,
        });
      }
      setSplitOutputs(outputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF bölme işlemi başarısız oldu.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRunExtractor = async () => {
    setError(null);
    const active = pdfFiles[0];
    if (!active) return;
    if (selectedPages.length === 0) {
      setError('Lütfen dışa aktarmak için en az bir sayfa seçin.');
      return;
    }
    setIsBusy(true);
    try {
      cleanupUrls();
      const sorted = [...selectedPages].sort((a, b) => a - b);
      const bytes = await extractPagesFromPdfBuffer(active.buffer, sorted);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      setOutputPdf({
        url: URL.createObjectURL(blob),
        name: `pratikbox-secili-sayfalar.pdf`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sayfa çıkarma sırasında hata oluştu.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleClear = () => {
    cleanupUrls();
    setPdfFiles([]);
    setOutputPdf(null);
    setSplitOutputs([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      {/* Upload Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center transition-colors bg-slate-50/60 dark:bg-slate-900/40"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple={slug === 'pdf-birlestirme'}
          onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
          className="hidden"
          id="pdf-file-input"
        />
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          {slug === 'pdf-birlestirme'
            ? 'Birleştirmek istediğiniz PDF dosyalarını sürükleyin veya seçin'
            : 'İşlem yapmak istediğiniz PDF belgesini yükleyin'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Tüm PDF işlemleri `pdf-lib` ile doğrudan tarayıcınızda gerçekleşir.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <label
            htmlFor="pdf-file-input"
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            {slug === 'pdf-birlestirme' ? 'PDF Dosyaları Ekle' : 'PDF Dosyası Seç'}
          </label>
          <button
            type="button"
            onClick={handleLoadSamplePdfs}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            Örnek PDF ile Dene
          </button>
          {pdfFiles.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Loaded Files & Tool Controls */}
      {pdfFiles.length > 0 && (
        <div className="space-y-6">
          {/* PDF MERGER UI */}
          {slug === 'pdf-birlestirme' && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Birleştirilecek PDF Sıralaması ({pdfFiles.length} Dosya)
                </h4>
                <button
                  type="button"
                  onClick={handleRunMerger}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  PDF Dosyalarını Birleştir
                </button>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {pdfFiles.map((file, idx) => (
                  <div key={file.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono flex items-center justify-center shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {file.info.pageCount} sayfa · {formatBytes(file.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Yukarı Taşı"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === pdfFiles.length - 1}
                        aria-label="Aşağı Taşı"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfFiles(pdfFiles.filter((_, i) => i !== idx))}
                        aria-label="Dosyayı Kaldır"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF SPLITTER UI */}
          {slug === 'pdf-bolme' && pdfFiles[0] && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-sm">
                <span className="font-semibold">{pdfFiles[0].name}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  Toplam {pdfFiles[0].info.pageCount} Sayfa
                </span>
              </div>
              <div>
                <label htmlFor="pdf-range-input" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Bölünecek Sayfa Aralıkları (Virgülle ayırın, örn: 1-2, 3-4)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="pdf-range-input"
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="Örn: 1-2, 3-4"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleRunSplitter}
                    disabled={isBusy}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    PDF Belgesini Böl
                  </button>
                </div>
              </div>

              {splitOutputs.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-500">Bölünen PDF Parçaları:</div>
                  {splitOutputs.map((part, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="text-sm font-medium">
                        {part.label} · <span className="font-mono text-xs text-slate-500">{formatBytes(part.size)}</span>
                      </span>
                      <a
                        href={part.url}
                        download={`pratikbox-bolum-${i + 1}.pdf`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        İndir
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PDF PAGE EXTRACTOR UI */}
          {slug === 'pdf-sayfa-cikarma' && pdfFiles[0] && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    Çıkarmak İstediğiniz Sayfaları Seçin ({selectedPages.length} / {pdfFiles[0].info.pageCount} seçili)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPages(Array.from({ length: pdfFiles[0].info.pageCount }, (_, i) => i))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPages([])}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Seçimi Temizle
                  </button>
                  <button
                    type="button"
                    onClick={handleRunExtractor}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                  >
                    Seçili Sayfaları Çıkar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                {Array.from({ length: pdfFiles[0].info.pageCount }, (_, idx) => {
                  const isSel = selectedPages.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSelectedPages((prev) =>
                          prev.includes(idx) ? prev.filter((p) => p !== idx) : [...prev, idx]
                        )
                      }
                      className={`p-3 rounded-xl border text-center transition-colors flex flex-col items-center gap-1.5 ${
                        isSel
                          ? 'bg-blue-600/10 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      <span className="text-xs font-mono tabular-nums">Sayfa {idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PDF INFO VIEWER UI */}
          {slug === 'pdf-bilgisi' && pdfFiles[0] && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                PDF Belgesi Metadata ve Sayfa Özellikleri
              </h4>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {[
                  ['Dosya Adı', pdfFiles[0].name],
                  ['Dosya Boyutu', formatBytes(pdfFiles[0].size)],
                  ['Toplam Sayfa Sayısı', `${pdfFiles[0].info.pageCount} Sayfa`],
                  ['Belge Başlığı (Title)', pdfFiles[0].info.title],
                  ['Yazar (Author)', pdfFiles[0].info.author],
                  ['Konu (Subject)', pdfFiles[0].info.subject],
                  ['Oluşturan Uygulama (Creator)', pdfFiles[0].info.creator],
                  ['PDF Üreticisi (Producer)', pdfFiles[0].info.producer],
                  ['Oluşturulma Tarihi', pdfFiles[0].info.creationDate],
                  ['Son Değiştirilme Tarihi', pdfFiles[0].info.modificationDate],
                  [
                    '1. Sayfa Boyutu',
                    `${pdfFiles[0].info.firstPageWidthMm} × ${pdfFiles[0].info.firstPageHeightMm} mm (${pdfFiles[0].info.firstPageWidthPt} × ${pdfFiles[0].info.firstPageHeightPt} pt)`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-mono text-slate-900 dark:text-white text-right tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Download Banner for Merger & Extractor */}
          {outputPdf && (
            <div className="p-5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  PDF Belgeniz Hazır!
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  {outputPdf.name} · {formatBytes(outputPdf.size)}
                </div>
              </div>
              <a
                href={outputPdf.url}
                download={outputPdf.name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                PDF Dosyasını İndir
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

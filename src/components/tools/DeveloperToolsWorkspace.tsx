import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Copy,
  Check,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle2,
  Upload,
  Sparkles,
} from 'lucide-react';
import {
  computeLineDiff,
  decodeBase64Utf8,
  decodeHtmlEntities,
  decodeUrlText,
  encodeBase64Utf8,
  encodeHtmlEntities,
  encodeUrlText,
  processJson,
} from '../../utils/toolEngines';

const SAMPLE_JSON = `{
  "platform": "PRATIKBOX",
  "ücretsiz": true,
  "araçSayısı": 51,
  "kategoriler": ["Görsel", "PDF", "Metin", "Geliştirici", "SEO", "Güvenlik", "Tasarım"],
  "gizlilik": {
    "tarayıcıİçiİşlem": true,
    "sunucuYüklemesi": false
  }
}`;

const SAMPLE_CSV = `Ad Soyad,Departman,Şehir,DeneyimYılı,Durum
Ayşe Yılmaz,Yazılım Mimarisi,İstanbul,7,Aktif
Mehmet Kaya,Ürün Tasarımı,Ankara,5,Aktif
Zeynep Demir,SEO & İçerik,İzmir,4,İzinli
Caner Aydın,Güvenlik Mühendisliği,Bursa,9,Aktif
Elif Çelik,Veri Analitiği,Eskişehir,3,Aktif`;

export const DeveloperToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [input, setInput] = useState<string>(() => {
    if (slug === 'json-bicimlendirici' || slug === 'json-dogrulayici') return SAMPLE_JSON;
    if (slug === 'base64-sifreleme') return 'PRATIKBOX ile güvenli ve hızlı tarayıcı içi araçlar!';
    if (slug === 'base64-cozucu')
      return encodeBase64Utf8('PRATIKBOX ile güvenli ve hızlı tarayıcı içi araçlar!');
    if (slug === 'url-kodlayici') return 'https://pratikbox.com/arama?q=ücretsiz online araçlar&dil=tr';
    if (slug === 'url-cozucu')
      return 'https%3A%2F%2Fpratikbox.com%2Farama%3Fq%3D%C3%BCcretsiz%20online%20ara%C3%A7lar%26dil%3Dtr';
    if (slug === 'html-entity-kodlayici')
      return '<div class="kart">PRATIKBOX & "Güvenli Web Araçları"</div>';
    if (slug === 'html-entity-cozucu')
      return '&lt;div class=&quot;kart&quot;&gt;PRATIKBOX &amp; &quot;Güvenli Web Araçları&quot;&lt;/div&gt;';
    if (slug === 'csv-goruntuleyici') return SAMPLE_CSV;
    return '';
  });

  // Reset sensible default when switching developer tool
  React.useEffect(() => {
    if (slug === 'json-bicimlendirici' || slug === 'json-dogrulayici') setInput(SAMPLE_JSON);
    else if (slug === 'base64-sifreleme')
      setInput('PRATIKBOX ile güvenli ve hızlı tarayıcı içi araçlar!');
    else if (slug === 'base64-cozucu')
      setInput(encodeBase64Utf8('PRATIKBOX ile güvenli ve hızlı tarayıcı içi araçlar!'));
    else if (slug === 'url-kodlayici')
      setInput('https://pratikbox.com/arama?q=ücretsiz online araçlar&dil=tr');
    else if (slug === 'url-cozucu')
      setInput(
        'https%3A%2F%2Fpratikbox.com%2Farama%3Fq%3D%C3%BCcretsiz%20online%20ara%C3%A7lar%26dil%3Dtr'
      );
    else if (slug === 'html-entity-kodlayici')
      setInput('<div class="kart">PRATIKBOX & "Güvenli Web Araçları"</div>');
    else if (slug === 'html-entity-cozucu')
      setInput(
        '&lt;div class=&quot;kart&quot;&gt;PRATIKBOX &amp; &quot;Güvenli Web Araçları&quot;&lt;/div&gt;'
      );
    else if (slug === 'csv-goruntuleyici') setInput(SAMPLE_CSV);
  }, [slug]);

  const [jsonIndent, setJsonIndent] = useState<2 | 4 | 'minify'>(2);
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [urlMode, setUrlMode] = useState<'component' | 'uri'>('component');
  const [encodeNonAscii, setEncodeNonAscii] = useState<boolean>(false);

  // CSV state
  const [csvSearch, setCsvSearch] = useState<string>('');
  const [csvSortCol, setCsvSortCol] = useState<number | null>(null);
  const [csvSortAsc, setCsvSortAsc] = useState<boolean>(true);

  // Diff state
  const [diffOld, setDiffOld] = useState<string>(
    `function hesaplaToplam(fiyat, kdv) {\n  const vergi = fiyat * 0.18;\n  return fiyat + vergi;\n}`
  );
  const [diffNew, setDiffNew] = useState<string>(
    `function hesaplaToplam(fiyat, kdvOrani = 0.20) {\n  const vergi = fiyat * kdvOrani;\n  const toplam = fiyat + vergi;\n  return Number(toplam.toFixed(2));\n}`
  );
  const [diffIgnoreWs, setDiffIgnoreWs] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);

  // JSON processing
  const jsonResult = useMemo(() => {
    if (slug !== 'json-bicimlendirici' && slug !== 'json-dogrulayici') return null;
    return processJson(input, jsonIndent === 'minify' ? 2 : jsonIndent, sortKeys);
  }, [slug, input, jsonIndent, sortKeys]);

  // Encoding / Decoding output
  const transformResult = useMemo((): { output: string; error?: string } => {
    switch (slug) {
      case 'json-bicimlendirici':
      case 'json-dogrulayici':
        if (!jsonResult) return { output: '' };
        if (!jsonResult.valid) return { output: '', error: jsonResult.error };
        return {
          output:
            jsonIndent === 'minify' ? jsonResult.minified || '' : jsonResult.formatted || '',
        };
      case 'base64-sifreleme':
        return { output: encodeBase64Utf8(input) };
      case 'base64-cozucu': {
        const res = decodeBase64Utf8(input);
        return { output: res.result, error: res.error };
      }
      case 'url-kodlayici':
        return { output: encodeUrlText(input, urlMode) };
      case 'url-cozucu': {
        const res = decodeUrlText(input);
        return { output: res.result, error: res.error };
      }
      case 'html-entity-kodlayici':
        return { output: encodeHtmlEntities(input, encodeNonAscii) };
      case 'html-entity-cozucu':
        return { output: decodeHtmlEntities(input) };
      default:
        return { output: '' };
    }
  }, [slug, input, jsonResult, jsonIndent, urlMode, encodeNonAscii]);

  // CSV parsing
  const csvData = useMemo(() => {
    if (slug !== 'csv-goruntuleyici') return null;
    if (!input.trim()) return { headers: [], rows: [], error: 'Lütfen CSV verisi girin veya dosya yükleyin.' };
    const parsed = Papa.parse<string[]>(input.trim(), { skipEmptyLines: true });
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return { headers: [], rows: [], error: `CSV Ayrıştırma Hatası: ${parsed.errors[0].message}` };
    }
    const allRows = parsed.data;
    const headers = allRows[0] || [];
    let body = allRows.slice(1);

    if (csvSearch.trim()) {
      const q = csvSearch.toLocaleLowerCase('tr-TR');
      body = body.filter((r) => r.some((cell) => String(cell).toLocaleLowerCase('tr-TR').includes(q)));
    }
    if (csvSortCol !== null) {
      const col = csvSortCol;
      body = [...body].sort((a, b) => {
        const va = String(a[col] ?? '');
        const vb = String(b[col] ?? '');
        const na = parseFloat(va);
        const nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) {
          return csvSortAsc ? na - nb : nb - na;
        }
        return csvSortAsc
          ? va.localeCompare(vb, 'tr-TR')
          : vb.localeCompare(va, 'tr-TR');
      });
    }

    return { headers, rows: body, error: undefined };
  }, [slug, input, csvSearch, csvSortCol, csvSortAsc]);

  // Diff calculation
  const diffLines = useMemo(() => {
    if (slug !== 'metin-farki-karsilastirici') return [];
    return computeLineDiff(diffOld, diffNew, { ignoreWhitespace: diffIgnoreWs });
  }, [slug, diffOld, diffNew, diffIgnoreWs]);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = (content: string, ext: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pratikbox-${slug}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== RENDER DIFF CHECKER ====================
  if (slug === 'metin-farki-karsilastirici') {
    const addedCount = diffLines.filter((d) => d.type === 'insert').length;
    const removedCount = diffLines.filter((d) => d.type === 'delete').length;
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={diffIgnoreWs}
              onChange={(e) => setDiffIgnoreWs(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>Satır başı/sonu boşluk farklarını yok say</span>
          </label>
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              +{addedCount} eklenen satır
            </span>
            <span>·</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">
              -{removedCount} silinen satır
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              1. Orijinal Metin / Kod
            </label>
            <textarea
              rows={7}
              value={diffOld}
              onChange={(e) => setDiffOld(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              2. Yeni / Değiştirilmiş Metin
            </label>
            <textarea
              rows={7}
              value={diffNew}
              onChange={(e) => setDiffNew(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
            Satır Bazlı Karşılaştırma Sonucu
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs overflow-x-auto">
            {diffLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start px-3 py-1.5 ${
                  line.type === 'insert'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : line.type === 'delete'
                    ? 'bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="w-8 shrink-0 text-slate-400 select-none tabular-nums">
                  {line.oldLineNumber ?? ''}
                </span>
                <span className="w-8 shrink-0 text-slate-400 select-none tabular-nums">
                  {line.newLineNumber ?? ''}
                </span>
                <span className="w-5 shrink-0 font-bold select-none">
                  {line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' '}
                </span>
                <span className="whitespace-pre">{line.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER CSV VIEWER ====================
  if (slug === 'csv-goruntuleyici') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium">
            <Upload className="w-4 h-4" />
            CSV Dosyası Yükle
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const txt = await file.text();
                  setInput(txt);
                }
              }}
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInput(SAMPLE_CSV)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Örnek CSV Yükle
            </button>
            <button
              type="button"
              onClick={() => setInput('')}
              className="inline-flex items-center gap-1 text-xs text-slate-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Temizle
            </button>
          </div>
        </div>

        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="CSV verinizi buraya yapıştırın..."
          className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs"
        />

        {csvData?.error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
            {csvData.error}
          </div>
        ) : (
          csvData &&
          csvData.headers.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={csvSearch}
                  onChange={(e) => setCsvSearch(e.target.value)}
                  placeholder="Tablo içinde ara..."
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs w-64"
                />
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  {csvData.rows.length} satır · {csvData.headers.length} sütun
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      {csvData.headers.map((h, i) => (
                        <th
                          key={i}
                          onClick={() => {
                            if (csvSortCol === i) setCsvSortAsc(!csvSortAsc);
                            else {
                              setCsvSortCol(i);
                              setCsvSortAsc(true);
                            }
                          }}
                          className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/50 whitespace-nowrap"
                        >
                          {h} {csvSortCol === i ? (csvSortAsc ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {csvData.rows.slice(0, 100).map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {csvData.headers.map((_, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300">
                            {row[cIdx] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  // ==================== STANDARD DEV TOOLS ====================
  return (
    <div className="space-y-6">
      {/* Options bar for JSON / URL / HTML */}
      {(slug === 'json-bicimlendirici' || slug === 'json-dogrulayici') && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 2, label: '2 Boşluk Girinti' },
              { id: 4, label: '4 Boşluk Girinti' },
              { id: 'minify', label: 'Sıkıştır (Minify)' },
            ].map((b) => (
              <button
                key={String(b.id)}
                type="button"
                onClick={() => setJsonIndent(b.id as 2 | 4 | 'minify')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  jsonIndent === b.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
            <label className="inline-flex items-center gap-2 text-xs ml-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sortKeys}
                onChange={(e) => setSortKeys(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Anahtarları A-Z Sırala</span>
            </label>
          </div>

          {jsonResult && (
            <div className="flex items-center gap-2 text-xs font-medium">
              {jsonResult.valid ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Geçerli JSON ({jsonResult.stats?.type} · {jsonResult.stats?.keysCount} anahtar · Derinlik {jsonResult.stats?.depth})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Hatalı JSON
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {slug === 'url-kodlayici' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUrlMode('component')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${
              urlMode === 'component'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            encodeURIComponent (Tüm Özel Karakterler)
          </button>
          <button
            type="button"
            onClick={() => setUrlMode('uri')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${
              urlMode === 'uri'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            encodeURI (Tam URL Yapısını Koru)
          </button>
        </div>
      )}

      {slug === 'html-entity-kodlayici' && (
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={encodeNonAscii}
            onChange={(e) => setEncodeNonAscii(e.target.checked)}
            className="rounded accent-blue-600"
          />
          <span>Tüm ASCII dışı (Türkçe/Unicode) karakterleri sayısal koda (`&#...;`) çevir</span>
        </label>
      )}

      {/* Error Alert */}
      {transformResult.error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{transformResult.error}</div>
            {jsonResult?.errorLine && (
              <div className="text-xs mt-1 font-mono">
                Tahmini Konum: Satır {jsonResult.errorLine}, Sütun {jsonResult.errorColumn}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="dev-input" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Giriş Verisi
            </label>
            <button
              type="button"
              onClick={() => setInput('')}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Temizle
            </button>
          </div>
          <textarea
            id="dev-input"
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Verinizi buraya girin..."
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              İşlenmiş Çıktı
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(transformResult.output)}
                disabled={!transformResult.output}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownload(
                    transformResult.output,
                    slug.includes('json') ? 'json' : 'txt'
                  )
                }
                disabled={!transformResult.output}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                İndir
              </button>
            </div>
          </div>
          <textarea
            readOnly
            rows={10}
            value={transformResult.output}
            aria-label="İşlenmiş geliştirici çıktısı"
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Copy, Check, RotateCcw, Download, Sparkles } from 'lucide-react';
import {
  analyzeTextStats,
  CaseMode,
  cleanText,
  CleanTextOptions,
  convertTextCase,
  generateLoremIpsum,
  generateSlug,
  LineSortMode,
  removeDuplicateLines,
  reverseText,
  sortLines,
} from '../../utils/toolEngines';

const SAMPLE_TURKISH_TEXT = `PRATIKBOX, dijital iş akışlarınızı hızlandıran modern ve ücretsiz bir online araçlar platformudur.
Tüm görsel, PDF, metin ve geliştirici araçları verilerinizi sunucuya göndermeden doğrudan kendi tarayıcınızda çalışır.

Gizlilik öncelikli mimarimiz sayesinde belgeleriniz cihazınızdan ayrılmaz ve işlemler saniyeler içinde tamamlanır.`;

export const TextToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [text, setText] = useState<string>(SAMPLE_TURKISH_TEXT);
  const [copied, setCopied] = useState<boolean>(false);

  // Case converter state
  const [caseMode, setCaseMode] = useState<CaseMode>('uppercase');

  // Duplicate line remover options
  const [dupCaseSensitive, setDupCaseSensitive] = useState<boolean>(true);
  const [dupTrim, setDupTrim] = useState<boolean>(true);
  const [dupRemoveEmpty, setDupRemoveEmpty] = useState<boolean>(true);

  // Text cleaner options
  const [cleanOpts, setCleanOpts] = useState<CleanTextOptions>({
    removeExtraSpaces: true,
    removeEmptyLines: true,
    trimEachLine: true,
    stripHtmlTags: true,
    removeLineBreaks: false,
    removePunctuation: false,
  });

  // Line sorter options
  const [sortMode, setSortMode] = useState<LineSortMode>('az');

  // Lorem ipsum options
  const [loremCount, setLoremCount] = useState<number>(3);
  const [loremUnit, setLoremUnit] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [loremHtml, setLoremHtml] = useState<boolean>(false);

  // Reverser options
  const [reverseMode, setReverseMode] = useState<'chars' | 'words' | 'each-word' | 'lines'>('chars');

  // Slug options
  const [slugSep, setSlugSep] = useState<'-' | '_'>('-');

  // Reading time WPM
  const [wpm, setWpm] = useState<number>(200);

  const stats = useMemo(() => analyzeTextStats(text, wpm), [text, wpm]);

  const outputText = useMemo(() => {
    switch (slug) {
      case 'harf-durumu-donusturucu':
        return convertTextCase(text, caseMode);
      case 'tekrarlayan-satir-temizleyici':
        return removeDuplicateLines(text, {
          caseSensitive: dupCaseSensitive,
          trimLines: dupTrim,
          removeEmpty: dupRemoveEmpty,
        }).result;
      case 'metin-temizleyici':
        return cleanText(text, cleanOpts);
      case 'satir-siralayici':
        return sortLines(text, sortMode, true);
      case 'lorem-ipsum-uretici':
        return generateLoremIpsum(loremCount, loremUnit, loremHtml);
      case 'metin-ters-cevirici':
        return reverseText(text, reverseMode);
      case 'slug-olusturucu':
        return generateSlug(text, slugSep);
      default:
        return text;
    }
  }, [
    slug,
    text,
    caseMode,
    dupCaseSensitive,
    dupTrim,
    dupRemoveEmpty,
    cleanOpts,
    sortMode,
    loremCount,
    loremUnit,
    loremHtml,
    reverseMode,
    slugSep,
  ]);

  const dupDetails = useMemo(
    () =>
      slug === 'tekrarlayan-satir-temizleyici'
        ? removeDuplicateLines(text, {
            caseSensitive: dupCaseSensitive,
            trimLines: dupTrim,
            removeEmpty: dupRemoveEmpty,
          })
        : null,
    [slug, text, dupCaseSensitive, dupTrim, dupRemoveEmpty]
  );

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDownloadTxt = (val: string) => {
    const blob = new Blob([val], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pratikbox-${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Statistics Grid for Word, Character, and Reading Time Calculators */}
      {(slug === 'kelime-sayaci' ||
        slug === 'karakter-sayaci' ||
        slug === 'okuma-suresi-hesaplayici') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Kelime Sayısı', value: stats.words },
            { label: 'Karakter (Boşluklu)', value: stats.charactersWithSpaces },
            { label: 'Karakter (Boşluksuz)', value: stats.charactersWithoutSpaces },
            { label: 'Cümle Sayısı', value: stats.sentences },
            { label: 'Paragraf Sayısı', value: stats.paragraphs },
            {
              label: 'Okuma Süresi',
              value:
                stats.readingTimeSeconds < 60
                  ? `${stats.readingTimeSeconds} sn`
                  : `${Math.floor(stats.readingTimeSeconds / 60)} dk ${stats.readingTimeSeconds % 60} sn`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Character Counter Social Limits */}
      {slug === 'karakter-sayaci' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'X (Twitter) Gönderisi', limit: 280 },
            { name: 'Standart SMS', limit: 160 },
            { name: 'Google Meta Description', limit: 160 },
          ].map((soc) => {
            const pct = Math.min(100, Math.round((stats.charactersWithSpaces / soc.limit) * 100));
            const over = stats.charactersWithSpaces > soc.limit;
            return (
              <div
                key={soc.name}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{soc.name}</span>
                  <span
                    className={`font-mono tabular-nums ${
                      over ? 'text-red-500 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {stats.charactersWithSpaces} / {soc.limit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${over ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reading Time WPM Slider */}
      {slug === 'okuma-suresi-hesaplayici' && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label htmlFor="wpm-slider" className="font-medium">
                Okuma Hızı (Kelime / Dakika)
              </label>
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {wpm} K/dk
              </span>
            </div>
            <input
              id="wpm-slider"
              type="range"
              min={100}
              max={350}
              step={10}
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500">Sessiz Okuma Süresi ({wpm} K/dk)</div>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {Math.floor(stats.readingTimeSeconds / 60)} dk {stats.readingTimeSeconds % 60} sn
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500">Sesli Sunum / Konuşma Süresi (135 K/dk)</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {Math.floor(stats.speakingTimeSeconds / 60)} dk {stats.speakingTimeSeconds % 60} sn
            </div>
          </div>
        </div>
      )}

      {/* Tool-specific Option Bars */}
      {slug === 'harf-durumu-donusturucu' && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'uppercase', label: 'TÜMÜ BÜYÜK HARF' },
            { id: 'lowercase', label: 'tümü küçük harf' },
            { id: 'titlecase', label: 'Başlık Düzeni (Her Kelime)' },
            { id: 'sentencecase', label: 'Cümle düzeni' },
            { id: 'camelcase', label: 'camelCase' },
            { id: 'snakecase', label: 'snake_case' },
            { id: 'kebabcase', label: 'kebab-case' },
            { id: 'alternating', label: 'aLtErNaTiF hArF' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setCaseMode(btn.id as CaseMode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                caseMode === btn.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {slug === 'tekrarlayan-satir-temizleyici' && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dupCaseSensitive}
                onChange={(e) => setDupCaseSensitive(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Büyük/küçük harf duyarlı</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dupTrim}
                onChange={(e) => setDupTrim(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Satır kenar boşluklarını kırp</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dupRemoveEmpty}
                onChange={(e) => setDupRemoveEmpty(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Boş satırları kaldır</span>
            </label>
          </div>
          {dupDetails && (
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
              Toplam: {dupDetails.originalCount} satır · Silinen: {dupDetails.removedCount} · Kalan:{' '}
              {dupDetails.uniqueCount}
            </div>
          )}
        </div>
      )}

      {slug === 'metin-temizleyici' && (
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">
          {[
            { key: 'removeExtraSpaces', label: 'Fazla boşlukları tek boşluğa indir' },
            { key: 'removeEmptyLines', label: 'Boş satırları sil' },
            { key: 'trimEachLine', label: 'Satır başı/sonu boşlukları kırp' },
            { key: 'stripHtmlTags', label: 'HTML etiketlerini (<p>, <div>) temizle' },
            { key: 'removeLineBreaks', label: 'Satır sonlarını boşluğa çevir' },
            { key: 'removePunctuation', label: 'Noktalama işaretlerini kaldır' },
          ].map((opt) => (
            <label key={opt.key} className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(cleanOpts[opt.key as keyof CleanTextOptions])}
                onChange={(e) =>
                  setCleanOpts((prev) => ({ ...prev, [opt.key]: e.target.checked }))
                }
                className="rounded accent-blue-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {slug === 'satir-siralayici' && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'az', label: 'Alfabetik (A → Z)' },
            { id: 'za', label: 'Ters Alfabetik (Z → A)' },
            { id: 'length-asc', label: 'Kısadan Uzuna' },
            { id: 'length-desc', label: 'Uzundan Kısaya' },
            { id: 'numeric-asc', label: 'Sayısal (Küçükten Büyüğe)' },
            { id: 'numeric-desc', label: 'Sayısal (Büyükten Küçüğe)' },
            { id: 'reverse', label: 'Mevcut Sırayı Ters Çevir' },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSortMode(b.id as LineSortMode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                sortMode === b.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {slug === 'lorem-ipsum-uretici' && (
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label htmlFor="lorem-count" className="text-sm font-medium">
              Miktar:
            </label>
            <input
              id="lorem-count"
              type="number"
              min={1}
              max={50}
              value={loremCount}
              onChange={(e) => setLoremCount(Number(e.target.value))}
              className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'paragraphs', label: 'Paragraf' },
              { id: 'sentences', label: 'Cümle' },
              { id: 'words', label: 'Kelime' },
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setLoremUnit(u.id as 'paragraphs' | 'sentences' | 'words')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  loremUnit === u.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={loremHtml}
              onChange={(e) => setLoremHtml(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>HTML `&lt;p&gt;` etiketleriyle sar</span>
          </label>
        </div>
      )}

      {slug === 'metin-ters-cevirici' && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'chars', label: 'Tüm Karakterleri Ters Çevir' },
            { id: 'words', label: 'Kelime Sırasını Ters Çevir' },
            { id: 'each-word', label: 'Her Kelimeyi Kendi İçinde Ters Çevir' },
            { id: 'lines', label: 'Satır Sırasını Ters Çevir' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setReverseMode(m.id as typeof reverseMode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium ${
                reverseMode === m.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {slug === 'slug-olusturucu' && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Ayırıcı Karakter:</span>
          <button
            type="button"
            onClick={() => setSlugSep('-')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              slugSep === '-' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Tire (-) Önerilen
          </button>
          <button
            type="button"
            onClick={() => setSlugSep('_')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              slugSep === '_' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Alt Çizgi (_)
          </button>
        </div>
      )}

      {/* Input & Output Areas */}
      {slug !== 'lorem-ipsum-uretici' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="text-tool-input" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Giriş Metni
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setText(
                    slug === 'tekrarlayan-satir-temizleyici' || slug === 'satir-siralayici'
                      ? 'İstanbul\nAnkara\nİzmir\nİstanbul\nBursa\nÇanakkale\nAnkara'
                      : SAMPLE_TURKISH_TEXT
                  )
                }
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Örnek Metin
              </button>
              <button
                type="button"
                onClick={() => setText('')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Temizle
              </button>
            </div>
          </div>
          <textarea
            id="text-tool-input"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Metninizi buraya yazın veya yapıştırın..."
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 focus:outline-none text-sm leading-relaxed"
          />
        </div>
      )}

      {/* Output Box for Transformation Tools */}
      {slug !== 'kelime-sayaci' &&
        slug !== 'karakter-sayaci' &&
        slug !== 'okuma-suresi-hesaplayici' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Dönüştürülmüş Çıktı
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(outputText)}
                  disabled={!outputText}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Panoya Kopyalandı' : 'Çıktıyı Kopyala'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTxt(outputText)}
                  disabled={!outputText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  .TXT İndir
                </button>
              </div>
            </div>
            <textarea
              readOnly
              rows={slug === 'slug-olusturucu' ? 2 : 6}
              value={outputText}
              aria-label="Dönüştürülmüş metin çıktısı"
              className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100"
            />
          </div>
        )}

      {/* Copy & Download for Counter tools */}
      {(slug === 'kelime-sayaci' ||
        slug === 'karakter-sayaci' ||
        slug === 'okuma-suresi-hesaplayici') && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {stats.topWords.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300 mr-2">
                  En Sık Geçen Kelimeler:
                </span>
                {stats.topWords.map((tw, idx) => (
                  <span key={tw.word}>
                    {idx > 0 && ' · '}
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{tw.word}</span>{' '}
                    <span className="font-mono tabular-nums">({tw.count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(text)}
              disabled={!text}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopyalandı' : 'Metni Kopyala'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

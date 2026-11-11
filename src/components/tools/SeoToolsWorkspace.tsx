import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Globe, Smartphone, Monitor } from 'lucide-react';
import {
  calculateKeywordDensity,
  estimateSerpPixelWidth,
  generateRobotsTxt,
  generateSitemapXml,
  generateSlug,
} from '../../utils/toolEngines';

export const SeoToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [copied, setCopied] = useState(false);

  // Shared SERP / Meta Title / Description / OG states
  const [title, setTitle] = useState(
    'PRATIKBOX – İşlerini Kolaylaştıran Ücretsiz Online Araçlar'
  );
  const [description, setDescription] = useState(
    'PDF birleştirme, görsel sıkıştırma, kelime sayacı, JSON biçimlendirici ve 50+ ücretsiz online araç. Dosyalarınız cihazınızdan ayrılmaz.'
  );
  const [url, setUrl] = useState('https://pratikbox.com/arac/gorsel-sikistirma');
  const [ogSiteName, setOgSiteName] = useState('PRATIKBOX');
  const [ogImageUrl, setOgImageUrl] = useState('https://pratikbox.com/og-kapak.png');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  // SEO Slug state
  const [slugInput, setSlugInput] = useState(
    '2026 Yılında Web Siteniz İçin En İyi ve Ücretsiz SEO Araçları Rehberi'
  );
  const [removeStops, setRemoveStops] = useState(true);
  const [maxSlugWords, setMaxSlugWords] = useState(6);

  // Keyword density state
  const [kdText, setKdText] = useState(
    `Ücretsiz online araçlar dijital pazarlama ve yazılım geliştirme süreçlerinde büyük zaman kazandırır. PRATIKBOX online araçlar platformu ile görsel sıkıştırma, PDF birleştirme ve SEO analizi işlemlerini doğrudan tarayıcınızda yapabilirsiniz. Güvenli online araçlar sayesinde dosyalarınız cihazınızdan ayrılmaz.`
  );
  const [ngramTab, setNgramTab] = useState<1 | 2 | 3>(1);

  // Robots.txt state
  const [robotsAgent, setRobotsAgent] = useState('*');
  const [robotsAllowAll, setRobotsAllowAll] = useState(true);
  const [robotsDisallow, setRobotsDisallow] = useState('/admin/\n/sepet/\n/hesabim/');
  const [robotsAllow, setRobotsAllow] = useState('/assets/');
  const [robotsSitemap, setRobotsSitemap] = useState('https://pratikbox.com/sitemap.xml');

  // Sitemap XML state
  const [sitemapUrls, setSitemapUrls] = useState(
    'https://pratikbox.com/\nhttps://pratikbox.com/arac/gorsel-sikistirma\nhttps://pratikbox.com/arac/pdf-birlestirme\nhttps://pratikbox.com/arac/kelime-sayaci'
  );
  const [sitemapFreq, setSitemapFreq] = useState<
    'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  >('weekly');
  const [sitemapPriority, setSitemapPriority] = useState('0.8');
  const [sitemapLastmod, setSitemapLastmod] = useState('2026-11-11');

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(u);
  };

  const titlePx = useMemo(() => estimateSerpPixelWidth(title, true), [title]);
  const descPx = useMemo(() => estimateSerpPixelWidth(description, false), [description]);
  const kdData = useMemo(() => calculateKeywordDensity(kdText), [kdText]);

  // 33 & 34 & 40: Meta Title, Meta Description, SERP Snippet Preview
  if (
    slug === 'meta-baslik-sayaci' ||
    slug === 'meta-aciklama-sayaci' ||
    slug === 'serp-snippet-onizleme'
  ) {
    const titleStatus =
      title.length === 0
        ? 'Başlık girilmedi'
        : title.length < 30
        ? 'Kısa (30-60 karakter önerilir)'
        : title.length <= 60 && titlePx <= 580
        ? 'İdeal Uzunlukta'
        : 'Çok Uzun (Arama sonuçlarında kesilebilir)';

    const descStatus =
      description.length === 0
        ? 'Açıklama girilmedi'
        : description.length < 70
        ? 'Kısa (120-158 karakter önerilir)'
        : description.length <= 160
        ? 'İdeal Uzunlukta'
        : 'Çok Uzun (160 karakter sınırı aşıldı)';

    const generatedMetaHtml = `<title>${title}</title>\n<meta name="description" content="${description.replace(/"/g, '&quot;')}" />`;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="seo-title-input" className="font-semibold text-slate-700 dark:text-slate-300">
                  Sayfa Başlığı (Meta Title)
                </label>
                <span className="font-mono tabular-nums text-slate-500">
                  {title.length} / 60 kr · ~{titlePx} / 580 px
                </span>
              </div>
              <input
                id="seo-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span
                  className={
                    title.length >= 30 && title.length <= 60
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-amber-600 dark:text-amber-400 font-medium'
                  }
                >
                  Durum: {titleStatus}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="seo-desc-input" className="font-semibold text-slate-700 dark:text-slate-300">
                  Meta Açıklama (Meta Description)
                </label>
                <span className="font-mono tabular-nums text-slate-500">
                  {description.length} / 160 kr · ~{descPx} / 960 px
                </span>
              </div>
              <textarea
                id="seo-desc-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
              />
              <div className="mt-1.5 text-xs">
                <span
                  className={
                    description.length >= 70 && description.length <= 160
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'text-amber-600 dark:text-amber-400 font-medium'
                  }
                >
                  Durum: {descStatus}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="seo-url-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sayfa URL Adresi
              </label>
              <input
                id="seo-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm font-mono"
              />
            </div>
          </div>

          {/* Live Google SERP Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Google Arama Sonucu (SERP) Simülasyonu
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSerpDevice('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                    serpDevice === 'desktop'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Masaüstü
                </button>
                <button
                  type="button"
                  onClick={() => setSerpDevice('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                    serpDevice === 'mobile'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobil
                </button>
              </div>
            </div>

            <div
              className={`p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
                serpDevice === 'mobile' ? 'max-w-sm' : 'w-full'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    PRATIKBOX
                  </div>
                  <div className="text-xs text-slate-500 truncate">{url}</div>
                </div>
              </div>
              <div className="text-lg font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug mb-1">
                {title.length > 62 ? title.slice(0, 60) + '...' : title || 'Örnek Sayfa Başlığı'}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {description.length > (serpDevice === 'mobile' ? 120 : 160)
                  ? description.slice(0, serpDevice === 'mobile' ? 118 : 158) + '...'
                  : description || 'Sayfa meta açıklaması burada görüntülenecektir.'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Hazır HTML Meta Etiketleri</span>
                <button
                  type="button"
                  onClick={() => handleCopy(generatedMetaHtml)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Kopyalandı' : 'HTML Kodunu Kopyala'}
                </button>
              </div>
              <pre className="text-xs font-mono overflow-x-auto text-slate-700 dark:text-slate-300">
                {generatedMetaHtml}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 35: SEO Slug Generator
  if (slug === 'seo-slug-olusturucu') {
    const seoSlug = generateSlug(slugInput, '-', {
      removeStopWords: removeStops,
      maxWords: maxSlugWords,
    });
    return (
      <div className="space-y-5">
        <div>
          <label htmlFor="seo-slug-title" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Sayfa veya Makale Başlığı
          </label>
          <input
            id="seo-slug-title"
            type="text"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={removeStops}
              onChange={(e) => setRemoveStops(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>Türkçe bağlaçları (ve, ile, için, bir vb.) otomatik çıkar</span>
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="max-slug-words" className="text-xs text-slate-500">
              Maksimum Kelime Sınırı:
            </label>
            <input
              id="max-slug-words"
              type="number"
              min={2}
              max={15}
              value={maxSlugWords}
              onChange={(e) => setMaxSlugWords(Number(e.target.value))}
              className="w-16 px-2.5 py-1 rounded bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono tabular-nums"
            />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
            /{seoSlug}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(seoSlug)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopyalandı' : 'Slug Kopyala'}
          </button>
        </div>
      </div>
    );
  }

  // 36: Keyword Density Calculator
  if (slug === 'anahtar-kelime-yogunlugu') {
    const activeList =
      ngramTab === 1 ? kdData.unigrams : ngramTab === 2 ? kdData.bigrams : kdData.trigrams;
    return (
      <div className="space-y-6">
        <div>
          <label htmlFor="kd-textarea" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Analiz Edilecek Sayfa Metni (Toplam {kdData.totalWords} kelime)
          </label>
          <textarea
            id="kd-textarea"
            rows={6}
            value={kdText}
            onChange={(e) => setKdText(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { n: 1, label: 'Tek Kelime (1-Gram)' },
            { n: 2, label: 'İkili Kelime Grubu (2-Gram)' },
            { n: 3, label: 'Üçlü Kelime Grubu (3-Gram)' },
          ].map((t) => (
            <button
              key={t.n}
              type="button"
              onClick={() => setNgramTab(t.n as 1 | 2 | 3)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium ${
                ngramTab === t.n
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs">
                <th className="py-2.5 px-4 font-semibold">Anahtar Kelime / İfade</th>
                <th className="py-2.5 px-4 font-semibold text-right">Tekrar Sayısı</th>
                <th className="py-2.5 px-4 font-semibold text-right">Yoğunluk (%)</th>
                <th className="py-2.5 px-4 font-semibold">Değerlendirme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {activeList.map((item) => (
                <tr key={item.phrase}>
                  <td className="py-2.5 px-4 font-medium">{item.phrase}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{item.count}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    %{item.densityPercent}
                  </td>
                  <td className="py-2.5 px-4 text-xs">
                    {item.densityPercent > 3.5 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        Yüksek (Aşırı optimizasyon riski)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Doğal Dağılım</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 37: Robots.txt Generator
  if (slug === 'robots-txt-olusturucu') {
    const robotsOut = generateRobotsTxt({
      userAgent: robotsAgent,
      allowAll: robotsAllowAll,
      disallowPaths: robotsDisallow.split('\n'),
      allowPaths: robotsAllow.split('\n'),
      sitemapUrl: robotsSitemap,
    });
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Bot (User-Agent)
              </label>
              <select
                value={robotsAgent}
                onChange={(e) => setRobotsAgent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
              >
                <option value="*">Tüm Botlar (*)</option>
                <option value="Googlebot">Googlebot</option>
                <option value="Bingbot">Bingbot</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Varsayılan Politika
              </label>
              <select
                value={robotsAllowAll ? 'allow' : 'disallow'}
                onChange={(e) => setRobotsAllowAll(e.target.value === 'allow')}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
              >
                <option value="allow">Taramaya İzin Ver</option>
                <option value="disallow">Tüm Siteyi Engelle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Engellenecek Dizinler (Disallow - Her satıra bir yol)
            </label>
            <textarea
              rows={3}
              value={robotsDisallow}
              onChange={(e) => setRobotsDisallow(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              İzin Verilecek Dizinler (Allow - Her satıra bir yol)
            </label>
            <textarea
              rows={2}
              value={robotsAllow}
              onChange={(e) => setRobotsAllow(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              XML Sitemap Adresi
            </label>
            <input
              type="text"
              value={robotsSitemap}
              onChange={(e) => setRobotsSitemap(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Üretilen robots.txt İçeriği
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(robotsOut)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Kopyala
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(robotsOut, 'robots.txt')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                robots.txt İndir
              </button>
            </div>
          </div>
          <textarea
            readOnly
            rows={12}
            value={robotsOut}
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs"
          />
        </div>
      </div>
    );
  }

  // 38: Sitemap XML Generator
  if (slug === 'sitemap-xml-olusturucu') {
    const xmlOut = generateSitemapXml({
      urls: sitemapUrls.split('\n'),
      changefreq: sitemapFreq,
      priority: sitemapPriority,
      lastmod: sitemapLastmod,
    });
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Sayfa URL Listesi (Her satıra bir adres)
            </label>
            <textarea
              rows={6}
              value={sitemapUrls}
              onChange={(e) => setSitemapUrls(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sıklık (changefreq)</label>
              <select
                value={sitemapFreq}
                onChange={(e) => setSitemapFreq(e.target.value as typeof sitemapFreq)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
              >
                <option value="daily">daily (Günlük)</option>
                <option value="weekly">weekly (Haftalık)</option>
                <option value="monthly">monthly (Aylık)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Öncelik (priority)</label>
              <select
                value={sitemapPriority}
                onChange={(e) => setSitemapPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs"
              >
                <option value="1.0">1.0</option>
                <option value="0.8">0.8</option>
                <option value="0.6">0.6</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tarih (lastmod)</label>
              <input
                type="date"
                value={sitemapLastmod}
                onChange={(e) => setSitemapLastmod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Üretilen sitemap.xml Kodu
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(xmlOut)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Kopyala
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(xmlOut, 'sitemap.xml')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                sitemap.xml İndir
              </button>
            </div>
          </div>
          <textarea
            readOnly
            rows={11}
            value={xmlOut}
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs"
          />
        </div>
      </div>
    );
  }

  // 39: Open Graph Social Preview
  const ogTagsCode = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${ogSiteName}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${ogImageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            og:title (Paylaşım Başlığı)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            og:description (Paylaşım Açıklaması)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              og:site_name
            </label>
            <input
              type="text"
              value={ogSiteName}
              onChange={(e) => setOgSiteName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              og:image URL (1200×630)
            </label>
            <input
              type="text"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="h-44 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 flex flex-col items-center justify-center p-6 text-center text-white">
            <span className="text-xs font-mono opacity-75 mb-1">1200 × 630 Sosyal Medya Görseli</span>
            <span className="font-display font-bold text-lg line-clamp-1">{ogSiteName}</span>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs text-slate-500 uppercase tracking-wider">{ogSiteName}</div>
            <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{title}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {description}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Graph Meta Etiketleri</span>
            <button
              type="button"
              onClick={() => handleCopy(ogTagsCode)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Kopyala
            </button>
          </div>
          <pre className="text-xs font-mono overflow-x-auto text-slate-700 dark:text-slate-300">
            {ogTagsCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

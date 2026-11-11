import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Star,
  ShieldCheck,
  Zap,
  Lock,
  ArrowUpRight,
  Sun,
  Moon,
  Clock,
  Sparkles,
  X,
  HelpCircle,
} from 'lucide-react';
import {
  TOOLS_REGISTRY,
  TOOL_CATEGORIES,
  getToolBySlug,
  getCategoryInfo,
} from './data/toolsRegistry';
import { ToolCategoryId, ToolDefinition } from './types/tools';
import { searchTools } from './utils/toolEngines';
import {
  getFavoriteSlugs,
  toggleFavoriteSlug,
  getRecentSlugs,
  recordRecentSlug,
  getStoredTheme,
  setStoredTheme,
} from './utils/storage';
import { ToolIcon } from './components/IconRenderer';
import { ToolPageView } from './components/ToolPageView';
import { SeoHeadUpdater } from './components/SeoHeadUpdater';
import { AdPlacementSlot } from './components/AdPlacementSlot';
import { PremiumRoadmapModal } from './components/PremiumRoadmapModal';

function resolveInitialSlugFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const match = path.match(/^\/arac\/([a-z0-9-]+)\/?$/i);
  if (match && getToolBySlug(match[1])) {
    return match[1];
  }
  const params = new URLSearchParams(window.location.search);
  const qTool = params.get('arac') || params.get('tool');
  if (qTool && getToolBySlug(qTool)) {
    return qTool;
  }
  const hash = window.location.hash.replace(/^#\/?/, '');
  const hashMatch = hash.match(/^arac\/([a-z0-9-]+)$/i);
  if (hashMatch && getToolBySlug(hashMatch[1])) {
    return hashMatch[1];
  }
  return null;
}

const HOMEPAGE_FAQS = [
  {
    q: 'PRATIKBOX üzerindeki araçlar gerçekten tamamen ücretsiz mi?',
    a: 'Evet. Platformumuzdaki görsel, PDF, metin, geliştirici, SEO, güvenlik ve tasarım kategorilerindeki 51 aracın tamamı ücretsizdir ve kayıt veya kredi kartı gerektirmez.',
  },
  {
    q: 'Yüklediğim PDF ve görsel dosyaları sunucunuza kaydediliyor mu?',
    a: 'Hayır! PRATIKBOX sunucusuz (client-side) mimariyle çalışır. Seçtiğiniz tüm dosyalar HTML5 File API, Canvas API ve WebAssembly/JavaScript kütüphaneleri ile doğrudan kendi tarayıcınızda işlenir; cihazınızdan dışarı çıkmaz.',
  },
  {
    q: 'İnternet bağlantım yavaşsa büyük dosyaları işleyebilir miyim?',
    a: 'Dosyalarınız internete yüklenmediği (upload edilmediği) için işlem hızı internet hızınıza değil, bilgisayarınızın veya telefonunuzun işlemci hızına bağlıdır ve saniyeler sürer.',
  },
  {
    q: 'Mobil telefon ve tabletlerde tüm araçlar çalışıyor mu?',
    a: 'Evet, PRATIKBOX mobil öncelikli (mobile-first) duyarlı arayüzle tasarlanmıştır. iOS ve Android tarayıcılarında tüm araçları sorunsuz kullanabilirsiniz.',
  },
];

export default function App() {
  const [activeToolSlug, setActiveToolSlug] = useState<string | null>(() =>
    resolveInitialSlugFromLocation()
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<
    ToolCategoryId | 'all' | 'favorites'
  >('all');
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>(() => getFavoriteSlugs());
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() => getRecentSlugs());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme());
  const [premiumModalOpen, setPremiumModalOpen] = useState<boolean>(false);

  // Sync theme with <html class="dark">
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setStoredTheme(theme);
  }, [theme]);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setActiveToolSlug(resolveInitialSlugFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const activeTool = useMemo(
    () => (activeToolSlug ? getToolBySlug(activeToolSlug) || null : null),
    [activeToolSlug]
  );

  const handleSelectTool = (slug: string) => {
    const tool = getToolBySlug(slug);
    if (!tool) return;
    setActiveToolSlug(slug);
    setRecentSlugs(recordRecentSlug(slug));
    try {
      window.history.pushState({ slug }, '', `/arac/${slug}`);
    } catch {
      // Fallback if pushState restricted in sandboxed iframe
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = (category?: ToolCategoryId | 'all') => {
    setActiveToolSlug(null);
    if (category) {
      setSelectedCategory(category);
    }
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // Ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (slug: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteSlugs(toggleFavoriteSlug(slug));
  };

  const filteredTools = useMemo(() => {
    if (selectedCategory === 'favorites') {
      const base = searchTools(searchQuery, 'all');
      return base.filter((t) => favoriteSlugs.includes(t.slug));
    }
    return searchTools(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, favoriteSlugs]);

  const popularTools = useMemo(
    () => TOOLS_REGISTRY.filter((t) => t.popular),
    []
  );

  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((s) => getToolBySlug(s))
        .filter((t): t is ToolDefinition => Boolean(t)),
    [recentSlugs]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      <SeoHeadUpdater activeTool={activeTool} />

      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single text element Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateHome('all');
            }}
            className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            PRATIKBOX
          </a>

          {/* Zone 2: 4–5 concise single-line text navigation links */}
          <nav
            aria-label="Ana Menü"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#tum-araclar"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateHome();
                setTimeout(() => {
                  document.getElementById('tum-araclar')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Araçlar
            </a>
            <a
              href="#kategoriler"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateHome();
                setTimeout(() => {
                  document.getElementById('kategoriler')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Kategoriler
            </a>
            <a
              href="#nasil-calisir"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateHome();
                setTimeout(() => {
                  document.getElementById('nasil-calisir')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Nasıl Çalışır
            </a>
            <a
              href="#gizlilik"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateHome();
                setTimeout(() => {
                  document.getElementById('gizlilik')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Gizlilik
            </a>
            <a
              href="#sss"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateHome();
                setTimeout(() => {
                  document.getElementById('sss')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              SSS
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                handleNavigateHome();
                setTimeout(() => {
                  document.getElementById('populer-araclar')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Popüler Araçlar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeTool ? (
          <div>
            {/* Workspace Utility Strip for Theme & Quick Switch */}
            <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  İhtiyacın olan bütün araçlar, tek yerde.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors whitespace-nowrap"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPremiumModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Pro Yol Haritası
                  </button>
                </div>
              </div>
            </div>

            <ToolPageView
              tool={activeTool}
              isFavorite={favoriteSlugs.includes(activeTool.slug)}
              onToggleFavorite={handleToggleFavorite}
              onNavigateHome={handleNavigateHome}
              onSelectTool={handleSelectTool}
            />
          </div>
        ) : (
          <div>
            {/* ==================== HERO SECTION ==================== */}
            <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white to-slate-50 dark:from-[#0F172A] dark:to-[#0B1120] py-14 sm:py-20 px-4 sm:px-6">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                {/* Top Utility Controls Row (Theme toggle & Tagline) */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    İhtiyacın olan bütün araçlar, tek yerde.
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>51 Ücretsiz Araç</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                    className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
                  </button>
                </div>

                <h1
                  style={{ textWrap: 'balance' }}
                  className="font-display text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
                >
                  İşlerini kolaylaştıran ücretsiz araçlar.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  PDF, görsel, metin, SEO ve daha fazlası. Hızlı, güvenli ve tamamen ücretsiz.
                </p>

                {/* Prominent Instant Search Bar */}
                <div className="max-w-2xl mx-auto pt-2">
                  <div className="relative flex items-center">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="İhtiyacın olan aracı ara..."
                      aria-label="İhtiyacın olan aracı ara"
                      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/90 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none text-base text-slate-900 dark:text-white shadow-sm transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Aramayı Temizle"
                        className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quick popular search suggestions */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Hızlı Erişim:</span>
                    {[
                      { name: 'Görsel Sıkıştırma', slug: 'gorsel-sikistirma' },
                      { name: 'PDF Birleştirme', slug: 'pdf-birlestirme' },
                      { name: 'Kelime Sayacı', slug: 'kelime-sayaci' },
                      { name: 'JSON Biçimlendirici', slug: 'json-bicimlendirici' },
                      { name: 'Şifre Oluşturucu', slug: 'sifre-olusturucu' },
                      { name: 'QR Kod Oluşturucu', slug: 'qr-kod-olusturucu' },
                    ].map((q, idx) => (
                      <React.Fragment key={q.slug}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <button
                          type="button"
                          onClick={() => handleSelectTool(q.slug)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors whitespace-nowrap"
                        >
                          {q.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Prominent Privacy Banner */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Dosyalarınız cihazınızdan ayrılmaz. İşlemler doğrudan tarayıcınızda gerçekleştirilir.
                  </span>
                </div>
              </div>
            </section>

            {/* Disabled-by-default Homepage Ad Placement */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <AdPlacementSlot position="homepage-banner" />
            </div>

            {/* ==================== MAIN DIRECTORY & FILTERS ==================== */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
              {/* Category Filter Bar */}
              <section id="kategoriler" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Araç Kategorileri
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      İhtiyacınız olan kategoriyi seçin veya anlık arama ile filtreleyin.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-500 tabular-nums">
                    Gösterilen: {filteredTools.length} / {TOOLS_REGISTRY.length} araç
                  </div>
                </div>

                {/* Interactive Segmented Category Tabs */}
                <div
                  role="tablist"
                  aria-label="Araç Kategorileri Filtresi"
                  className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === 'all'}
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    Tümü ({TOOLS_REGISTRY.length})
                  </button>

                  {TOOL_CATEGORIES.map((cat) => {
                    const count = TOOLS_REGISTRY.filter((t) => t.category === cat.id).length;
                    const active = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ToolIcon name={cat.iconName} className="w-3.5 h-3.5" />
                        <span>{cat.shortName}</span>
                        <span className="font-mono opacity-75 tabular-nums">({count})</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === 'favorites'}
                    onClick={() => setSelectedCategory('favorites')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === 'favorites'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Favorilerim ({favoriteSlugs.length})</span>
                  </button>
                </div>
              </section>

              {/* Recently Used Tools (if any and not actively searching) */}
              {!searchQuery && selectedCategory === 'all' && recentTools.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Son Kullandığınız Araçlar
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recentTools.slice(0, 4).map((tool) => (
                      <a
                        key={tool.slug}
                        href={`/arac/${tool.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectTool(tool.slug);
                        }}
                        className="group p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ToolIcon name={tool.iconName} className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {tool.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {getCategoryInfo(tool.category)?.name}
                            </div>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Popular & Featured Tools Section (when viewing All without search query) */}
              {!searchQuery && selectedCategory === 'all' && (
                <section id="populer-araclar" className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Popüler ve Öne Çıkan Araçlar
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Kullanıcıların her gün en çok tercih ettiği hızlı araçlar.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {popularTools.slice(0, 6).map((tool) => {
                      const isFav = favoriteSlugs.includes(tool.slug);
                      const catInfo = getCategoryInfo(tool.category);
                      return (
                        <article
                          key={tool.slug}
                          className="group relative p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                  <ToolIcon name={tool.iconName} className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  <span>{catInfo?.name}</span>
                                  <span className="mx-1.5" aria-hidden="true">
                                    ·
                                  </span>
                                  <span>Popüler</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(tool.slug, e)}
                                aria-label={`${tool.name} Favori Durumu`}
                                className="relative z-10 p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    isFav ? 'fill-amber-400 text-amber-500' : ''
                                  }`}
                                />
                              </button>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                <a
                                  href={`/arac/${tool.slug}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSelectTool(tool.slug);
                                  }}
                                  className="after:absolute after:inset-0 focus:outline-none"
                                >
                                  {tool.name}
                                </a>
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                {tool.shortDescription}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-medium text-blue-600 dark:text-blue-400">
                            <span>Aracı Aç</span>
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ==================== ALL TOOLS DIRECTORY ==================== */}
              <section id="tum-araclar" className="space-y-10">
                {filteredTools.length === 0 ? (
                  <div className="p-12 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-4">
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {selectedCategory === 'favorites'
                        ? 'Henüz favorilerinize bir araç eklemediniz.'
                        : `"${searchQuery}" aramasıyla eşleşen bir araç bulunamadı.`}
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {selectedCategory === 'favorites'
                        ? 'Araç kartlarının sağ üst köşesindeki yıldız ikonuna tıklayarak sık kullandığınız araçları buraya sabitleyebilirsiniz.'
                        : 'Farklı bir anahtar kelime deneyin veya tüm kategorileri görüntüleyin.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium"
                    >
                      Tüm 51 Aracı Göster
                    </button>
                  </div>
                ) : selectedCategory === 'all' && !searchQuery ? (
                  // Grouped by category for clean scanning of all 51 tools
                  <div className="space-y-14">
                    {TOOL_CATEGORIES.map((cat) => {
                      const catTools = TOOLS_REGISTRY.filter((t) => t.category === cat.id);
                      return (
                        <div key={cat.id} className="space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <ToolIcon name={cat.iconName} className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                  {cat.name}{' '}
                                  <span className="text-sm font-mono font-normal text-slate-500 tabular-nums">
                                    ({catTools.length})
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {cat.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {catTools.map((tool) => {
                              const isFav = favoriteSlugs.includes(tool.slug);
                              return (
                                <article
                                  key={tool.slug}
                                  className="group relative p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex flex-col justify-between gap-3"
                                >
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <ToolIcon name={tool.iconName} className="w-4 h-4" />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => handleToggleFavorite(tool.slug, e)}
                                        aria-label={`${tool.name} Favorilere Ekle`}
                                        className="relative z-10 p-1 text-slate-400 hover:text-amber-500"
                                      >
                                        <Star
                                          className={`w-4 h-4 ${
                                            isFav ? 'fill-amber-400 text-amber-500' : ''
                                          }`}
                                        />
                                      </button>
                                    </div>
                                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      <a
                                        href={`/arac/${tool.slug}`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleSelectTool(tool.slug);
                                        }}
                                        className="after:absolute after:inset-0 focus:outline-none"
                                      >
                                        {tool.name}
                                      </a>
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                      {tool.shortDescription}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 pt-2">
                                    <span>Kullan</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Filtered view
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Filtrelenen Araçlar ({filteredTools.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredTools.map((tool) => {
                        const isFav = favoriteSlugs.includes(tool.slug);
                        return (
                          <article
                            key={tool.slug}
                            className="group relative p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors flex flex-col justify-between gap-3"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                  <ToolIcon name={tool.iconName} className="w-4 h-4" />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavorite(tool.slug, e)}
                                  aria-label={`${tool.name} Favorilere Ekle`}
                                  className="relative z-10 p-1 text-slate-400 hover:text-amber-500"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      isFav ? 'fill-amber-400 text-amber-500' : ''
                                    }`}
                                  />
                                </button>
                              </div>
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                <a
                                  href={`/arac/${tool.slug}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSelectTool(tool.slug);
                                  }}
                                  className="after:absolute after:inset-0 focus:outline-none"
                                >
                                  {tool.name}
                                </a>
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {tool.shortDescription}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 pt-2">
                              <span>Aracı Aç</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* ==================== HOW IT WORKS SECTION ==================== */}
              <section
                id="nasil-calisir"
                className="pt-12 border-t border-slate-200 dark:border-slate-800 space-y-8"
              >
                <div className="max-w-2xl space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    PRATIKBOX Nasıl Çalışır?
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Kayıt olma, e-posta doğrulama veya sıra bekleme olmadan 3 adımda sonuç alın.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      num: '01.',
                      title: 'İhtiyacınız Olan Aracı Seçin',
                      desc: '7 ana kategorideki 51 araç arasından arama çubuğunu veya kategori filtrelerini kullanarak aracınızı açın.',
                    },
                    {
                      num: '02.',
                      title: 'Tarayıcı İçinde Anında İşleyin',
                      desc: 'Dosyanızı seçin veya metninizi yapıştırın. Verileriniz uzak bir sunucuya gitmeden doğrudan cihazınızın belleğinde işlenir.',
                    },
                    {
                      num: '03.',
                      title: 'Sonucu Kopyalayın veya İndirin',
                      desc: 'Sıkıştırılmış görselinizi, birleştirilmiş PDF belgenizi veya biçimlendirilmiş kodunuzu tek tıkla cihazınıza kaydedin.',
                    },
                  ].map((step) => (
                    <div
                      key={step.num}
                      className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        {step.num}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ==================== PRIVACY & SECURITY SECTION ==================== */}
              <section
                id="gizlilik"
                className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sıfır Sunucu Yüklemesi (Zero-Upload Mimarisi)</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    Dosyalarınız cihazınızdan ayrılmaz. İşlemler doğrudan tarayıcınızda gerçekleştirilir.
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Geleneksel online araç siteleri yüklediğiniz sözleşmeleri, fotoğrafları ve şifreleri kendi bulut sunucularına yükler. PRATIKBOX ise modern Web Crypto API, HTML5 Canvas ve yerel PDF motorlarını kullanarak tüm işlemleri bilgisayarınızın veya telefonunuzun kendi belleğinde yürütür.
                  </p>
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Lock,
                      title: 'Kriptografik Güvenlik',
                      desc: 'Şifre ve UUID üretimi `crypto.getRandomValues` ile yerel olarak yapılır ve asla saklanmaz.',
                    },
                    {
                      icon: Zap,
                      title: 'Sıfır Upload Beklemesi',
                      desc: 'Yüksek boyutlu PDF ve görseller internete yüklenmediği için anında açılır.',
                    },
                  ].map((box) => (
                    <div
                      key={box.title}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <box.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {box.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {box.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ==================== HOMEPAGE FAQ SECTION ==================== */}
              <section id="sss" className="space-y-6">
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Sıkça Sorulan Sorular
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {HOMEPAGE_FAQS.map((f, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{f.q}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {f.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-white dark:bg-[#080D1A] border-t border-slate-200 dark:border-slate-800/80 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
              PRATIKBOX
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              İhtiyacın olan bütün araçlar, tek yerde. Dosyalarınız cihazınızdan ayrılmaz; tüm işlemler doğrudan tarayıcınızda gerçekleştirilir.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
              Araç Kategorileri
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {TOOL_CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleNavigateHome(c.id)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
              En Çok Kullanılan Araçlar
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {popularTools.slice(0, 7).map((t) => (
                <li key={t.slug}>
                  <button
                    type="button"
                    onClick={() => handleSelectTool(t.slug)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
              Platform ve Mimari
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setPremiumModalOpen(true)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Gelecek Pro Yol Haritası
                </button>
              </li>
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-blue-600">
                  XML Site Haritası (sitemap.xml)
                </a>
              </li>
              <li>
                <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-blue-600">
                  Robots.txt Kuralları
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} PRATIKBOX. Tüm temel araçlar ücretsizdir.</span>
          <span>Tarayıcı İçi Yerel İşleme · Sıfır Sunucu Yüklemesi</span>
        </div>
      </footer>

      <PremiumRoadmapModal
        open={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
      />
    </div>
  );
}

import React from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { ToolDefinition, ToolCategoryId } from '../types/tools';
import {
  getCategoryInfo,
  getToolBySlug,
  getToolsByCategory,
} from '../data/toolsRegistry';
import { ToolIcon } from './IconRenderer';
import { AdPlacementSlot } from './AdPlacementSlot';
import { ImageToolsWorkspace } from './tools/ImageToolsWorkspace';
import { PdfToolsWorkspace } from './tools/PdfToolsWorkspace';
import { TextToolsWorkspace } from './tools/TextToolsWorkspace';
import { DeveloperToolsWorkspace } from './tools/DeveloperToolsWorkspace';
import { SeoToolsWorkspace } from './tools/SeoToolsWorkspace';
import { SecurityToolsWorkspace } from './tools/SecurityToolsWorkspace';
import { DesignToolsWorkspace } from './tools/DesignToolsWorkspace';

interface ToolPageViewProps {
  tool: ToolDefinition;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  onNavigateHome: (category?: ToolCategoryId) => void;
  onSelectTool: (slug: string) => void;
}

export const ToolPageView: React.FC<ToolPageViewProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onNavigateHome,
  onSelectTool,
}) => {
  const categoryInfo = getCategoryInfo(tool.category);

  const relatedTools = tool.relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is ToolDefinition => Boolean(t));

  const categorySiblings = getToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug && !tool.relatedSlugs.includes(t.slug))
    .slice(0, 3);

  const allSuggestions = [...relatedTools, ...categorySiblings].slice(0, 4);

  const renderWorkspace = () => {
    switch (tool.category) {
      case 'image':
        return <ImageToolsWorkspace slug={tool.slug} />;
      case 'pdf':
        return <PdfToolsWorkspace slug={tool.slug} />;
      case 'text':
        return <TextToolsWorkspace slug={tool.slug} />;
      case 'developer':
        return <DeveloperToolsWorkspace slug={tool.slug} />;
      case 'seo':
        return <SeoToolsWorkspace slug={tool.slug} />;
      case 'security':
        return <SecurityToolsWorkspace slug={tool.slug} />;
      case 'design':
        return <DesignToolsWorkspace slug={tool.slug} />;
    }
  };

  return (
    <article className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Sayfa Konumu (Breadcrumb)" className="flex flex-wrap items-center justify-between gap-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <li>
            <button
              type="button"
              onClick={() => onNavigateHome()}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Ana Sayfa
            </button>
          </li>
          <li>
            <ChevronRight className="w-3.5 h-3.5" />
          </li>
          {categoryInfo && (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateHome(categoryInfo.id)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {categoryInfo.name}
                </button>
              </li>
              <li>
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
            </>
          )}
          <li className="font-medium text-slate-900 dark:text-slate-200">{tool.name}</li>
        </ol>

        <button
          type="button"
          onClick={() => onNavigateHome()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </button>
      </nav>

      {/* Tool Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-1">
            <ToolIcon name={tool.iconName} className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{categoryInfo?.name}</span>
              <span aria-hidden="true">·</span>
              <span>{tool.englishName}</span>
              <span aria-hidden="true">·</span>
              <span>%100 Tarayıcı İçi Ücretsiz Araç</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {tool.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {tool.shortDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(tool.slug)}
            aria-label={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            {isFavorite ? 'Favorilerde' : 'Favorilere Ekle'}
          </button>
        </div>
      </header>

      {/* Privacy Guarantee Strip */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>
          <strong className="font-semibold text-slate-900 dark:text-white">Gizlilik Garantisi:</strong>{' '}
          Dosyalarınız cihazınızdan ayrılmaz. İşlemler doğrudan tarayıcınızda gerçekleştirilir.
        </span>
      </div>

      {/* Main Interactive Tool Workspace */}
      <section
        aria-label={`${tool.name} Çalışma Alanı`}
        className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        {renderWorkspace()}
      </section>

      {/* Disabled-by-default Ad Placement */}
      <AdPlacementSlot position="tool-page" />

      {/* Usage Steps & FAQ Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Step-by-step usage instructions */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {tool.name} Nasıl Kullanılır?
            </h2>
          </div>
          <ol className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
            {tool.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Frequently Asked Questions */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Sıkça Sorulan Sorular
            </h2>
          </div>
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {tool.faqs.map((faq, idx) => (
              <div key={idx} className={idx > 0 ? 'pt-4' : ''}>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Related Tools Section */}
      <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            İlgili ve Benzer Araçlar
          </h2>
          {categoryInfo && (
            <button
              type="button"
              onClick={() => onNavigateHome(categoryInfo.id)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Tüm {categoryInfo.name} ({getToolsByCategory(categoryInfo.id).length}) →
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allSuggestions.map((rel) => (
            <button
              key={rel.slug}
              type="button"
              onClick={() => onSelectTool(rel.slug)}
              className="group text-left p-5 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ToolIcon name={rel.iconName} className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {rel.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {rel.shortDescription}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </article>
  );
};

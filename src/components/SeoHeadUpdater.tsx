import { useEffect } from 'react';
import { ToolDefinition } from '../types/tools';
import { getCategoryInfo } from '../data/toolsRegistry';

export function SeoHeadUpdater({ activeTool }: { activeTool: ToolDefinition | null }) {
  useEffect(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://pratikbox.com';

    const title = activeTool
      ? activeTool.seoTitle
      : 'PRATIKBOX – İşlerini Kolaylaştıran Ücretsiz Online Araçlar';
    const description = activeTool
      ? activeTool.seoDescription
      : 'İhtiyacın olan bütün araçlar, tek yerde. PDF, görsel, metin, SEO, geliştirici, güvenlik ve tasarım araçları. Dosyalarınız cihazınızdan ayrılmaz, %100 ücretsiz.';
    const canonicalUrl = activeTool
      ? `${origin}/arac/${activeTool.slug}`
      : `${origin}/`;

    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);

    const canonicalEl = document.getElementById('canonical-link');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalUrl);
    }

    const schemaEl = document.getElementById('schema-jsonld');
    if (schemaEl) {
      if (activeTool) {
        const cat = getCategoryInfo(activeTool.category);
        const schemaObj = [
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: `${activeTool.name} – PRATIKBOX`,
            applicationCategory: cat?.name || 'UtilitiesApplication',
            operatingSystem: 'All',
            inLanguage: 'tr-TR',
            url: canonicalUrl,
            description: activeTool.seoDescription,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'TRY',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: activeTool.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ];
        schemaEl.textContent = JSON.stringify(schemaObj);
      } else {
        schemaEl.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PRATIKBOX',
          alternateName: 'PRATIKBOX Online Araçlar Platformu',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'All',
          inLanguage: 'tr-TR',
          url: canonicalUrl,
          description,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TRY',
          },
        });
      }
    }
  }, [activeTool]);

  return null;
}

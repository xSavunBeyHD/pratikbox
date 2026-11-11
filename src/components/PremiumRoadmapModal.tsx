import React from 'react';
import { X, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

interface PremiumRoadmapModalProps {
  open: boolean;
  onClose: () => void;
}

const PLANNED_PREMIUM_FEATURES = [
  {
    title: '50+ Görsel Toplu İşleme (Batch Processing)',
    desc: 'Yüzlerce ürün fotoğrafını tek seferde sıkıştırma, boyutlandırma ve ZIP olarak dışa aktarma.',
  },
  {
    title: 'Gelişmiş PDF İş Akışları',
    desc: 'Çoklu PDF şablon birleştirme, sayfa numaralandırma ve filigran ekleme otomasyonu.',
  },
  {
    title: 'Kayıtlı Ön Ayarlar (Saved Presets)',
    desc: 'Sık kullandığınız görsel boyutlarını, kırpma oranlarını ve SEO kurallarını tek tıkla uygulama.',
  },
  {
    title: 'Özel Çalışma Alanı Temaları & Gelişmiş Dışa Aktarım',
    desc: 'Ekip içi standart format şablonları ve özel rapor çıktıları.',
  },
];

export const PremiumRoadmapModal: React.FC<PremiumRoadmapModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="premium-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                PRATIKBOX Pro – Gelecek Yol Haritası
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tüm 51 temel aracımız şu anda ve her zaman %100 ücretsizdir.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Mevcut Sürüm Durumu:</strong> Platformdaki tüm 51 araç herhangi bir üyelik, kredi kartı veya kullanım sınırı olmadan tamamen ücretsiz ve açık durumdadır.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500">
            İleride Eklenecek Kurumsal Pro Özellikler (Henüz Aktif Değil):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANNED_PREMIUM_FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 opacity-80"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Ödeme altyapısı devreye alınana kadar Pro abonelik satışı kapalıdır.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            Ücretsiz Araçlara Dön
          </button>
        </div>
      </div>
    </div>
  );
};

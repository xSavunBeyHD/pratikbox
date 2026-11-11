import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, RefreshCw, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import {
  computeHashes,
  evaluatePasswordStrength,
  generateRandomStrings,
  generateSecurePassword,
  generateUuids,
} from '../../utils/toolEngines';

export const SecurityToolsWorkspace: React.FC<{ slug: string }> = ({ slug }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 41: Password Generator state (never persisted to storage)
  const [pwdLen, setPwdLen] = useState<number>(16);
  const [pwdUpper, setPwdUpper] = useState<boolean>(true);
  const [pwdLower, setPwdLower] = useState<boolean>(true);
  const [pwdNums, setPwdNums] = useState<boolean>(true);
  const [pwdSyms, setPwdSyms] = useState<boolean>(true);
  const [pwdNoAmbig, setPwdNoAmbig] = useState<boolean>(false);
  const [generatedPwd, setGeneratedPwd] = useState<string>('');

  // 42: Password Strength Checker state
  const [testPwd, setTestPwd] = useState<string>('PratikBox!2026#Guvenli');
  const [showTestPwd, setShowTestPwd] = useState<boolean>(true);

  // 43: Random String Generator state
  const [strLen, setStrLen] = useState<number>(16);
  const [strCount, setStrCount] = useState<number>(5);
  const [strCharset, setStrCharset] = useState<
    'alphanumeric' | 'uppercase-num' | 'hex' | 'numeric' | 'alphabetic'
  >('alphanumeric');
  const [strPrefix, setStrPrefix] = useState<string>('');
  const [randList, setRandList] = useState<string[]>([]);

  // 44: UUID Generator state
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidUpper, setUuidUpper] = useState<boolean>(false);
  const [uuidHyphens, setUuidHyphens] = useState<boolean>(true);
  const [uuidList, setUuidList] = useState<string[]>([]);

  // 45: Hash Generator state
  const [hashInput, setHashInput] = useState<string>('PRATIKBOX Kriptografik Hash Testi');
  const [hashes, setHashes] = useState<{
    sha1: string;
    sha256: string;
    sha384: string;
    sha512: string;
  } | null>(null);

  const regeneratePassword = () => {
    setGeneratedPwd(
      generateSecurePassword({
        length: pwdLen,
        uppercase: pwdUpper,
        lowercase: pwdLower,
        numbers: pwdNums,
        symbols: pwdSyms,
        excludeAmbiguous: pwdNoAmbig,
      })
    );
  };

  useEffect(() => {
    if (slug === 'sifre-olusturucu') {
      regeneratePassword();
    }
  }, [slug, pwdLen, pwdUpper, pwdLower, pwdNums, pwdSyms, pwdNoAmbig]);

  const regenerateStrings = () => {
    setRandList(
      generateRandomStrings({
        length: strLen,
        count: strCount,
        charset: strCharset,
        prefix: strPrefix,
      })
    );
  };

  useEffect(() => {
    if (slug === 'rastgele-metin-uretici') {
      regenerateStrings();
    }
  }, [slug, strLen, strCount, strCharset, strPrefix]);

  const regenerateUuids = () => {
    setUuidList(generateUuids(uuidCount, { uppercase: uuidUpper, hyphens: uuidHyphens }));
  };

  useEffect(() => {
    if (slug === 'uuid-uretici') {
      regenerateUuids();
    }
  }, [slug, uuidCount, uuidUpper, uuidHyphens]);

  useEffect(() => {
    if (slug === 'hash-olusturucu') {
      computeHashes(hashInput).then(setHashes);
    }
  }, [slug, hashInput]);

  const copyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const pwdStrength = useMemo(
    () =>
      evaluatePasswordStrength(slug === 'sifre-olusturucu' ? generatedPwd : testPwd),
    [slug, generatedPwd, testPwd]
  );

  // 41: Password Generator
  if (slug === 'sifre-olusturucu') {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-lg sm:text-xl tracking-wider break-all select-all">
            {generatedPwd}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={regeneratePassword}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Yenile
            </button>
            <button
              type="button"
              onClick={() => copyValue(generatedPwd, 'pwd')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-medium transition-colors"
            >
              {copiedKey === 'pwd' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedKey === 'pwd' ? 'Kopyalandı' : 'Şifreyi Kopyala'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <label htmlFor="pwd-length-slider" className="font-medium">
                  Şifre Uzunluğu
                </label>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {pwdLen} Karakter
                </span>
              </div>
              <input
                id="pwd-length-slider"
                type="range"
                min={6}
                max={64}
                value={pwdLen}
                onChange={(e) => setPwdLen(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Güvenlik Derecesi & Entropi:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {pwdStrength.label} ({pwdStrength.entropyBits} bit)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Büyük Harfler (A-Z)', val: pwdUpper, set: setPwdUpper },
              { label: 'Küçük Harfler (a-z)', val: pwdLower, set: setPwdLower },
              { label: 'Rakamlar (0-9)', val: pwdNums, set: setPwdNums },
              { label: 'Semboller (!@#$%)', val: pwdSyms, set: setPwdSyms },
              { label: 'Benzerleri Hariç Tut (0,O,1,l)', val: pwdNoAmbig, set: setPwdNoAmbig },
            ].map((item) => (
              <label key={item.label} className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) => item.set(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 42: Password Strength Checker
  if (slug === 'sifre-gucu-olcer') {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-blue-500',
      'bg-emerald-500',
    ];
    return (
      <div className="space-y-6">
        <div className="relative">
          <label htmlFor="pwd-test-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Analiz Edilecek Şifre (Hiçbir yere kaydedilmez)
          </label>
          <div className="relative">
            <input
              id="pwd-test-input"
              type={showTestPwd ? 'text' : 'password'}
              value={testPwd}
              onChange={(e) => setTestPwd(e.target.value)}
              placeholder="Şifrenizi test etmek için yazın..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-base"
            />
            <button
              type="button"
              onClick={() => setShowTestPwd(!showTestPwd)}
              aria-label={showTestPwd ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showTestPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Güvenlik Seviyesi</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {pwdStrength.label}
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all ${colors[pwdStrength.score]}`}
                style={{ width: `${Math.max(10, (pwdStrength.score + 1) * 20)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Matematiksel Entropi</div>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {pwdStrength.entropyBits} bit
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Tahmini Kırılma Süresi</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {pwdStrength.crackTimeLabel}
            </div>
          </div>
        </div>

        {pwdStrength.suggestions.length > 0 && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Güçlendirme Önerileri:
            </div>
            <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
              {pwdStrength.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // 43: Random String Generator
  if (slug === 'rastgele-metin-uretici') {
    const joined = randList.join('\n');
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Uzunluk</label>
            <input
              type="number"
              min={4}
              max={64}
              value={strLen}
              onChange={(e) => setStrLen(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Üretilecek Adet</label>
            <input
              type="number"
              min={1}
              max={50}
              value={strCount}
              onChange={(e) => setStrCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Karakter Kümesi</label>
            <select
              value={strCharset}
              onChange={(e) => setStrCharset(e.target.value as typeof strCharset)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm"
            >
              <option value="alphanumeric">Alfanümerik (A-Z, a-z, 0-9)</option>
              <option value="uppercase-num">Kupon Kodu (BÜYÜK + Rakam)</option>
              <option value="hex">HEX (0-9, a-f)</option>
              <option value="numeric">Yalnızca Rakam (PIN)</option>
              <option value="alphabetic">Yalnızca Harf</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ön Ek (Opsiyonel)</label>
            <input
              type="text"
              value={strPrefix}
              onChange={(e) => setStrPrefix(e.target.value)}
              placeholder="Örn: KUPON-"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Üretilen Rastgele Dizeler
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={regenerateStrings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Yeniden Üret
              </button>
              <button
                type="button"
                onClick={() => copyValue(joined, 'rand')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium"
              >
                {copiedKey === 'rand' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Tümünü Kopyala
              </button>
            </div>
          </div>
          <textarea
            readOnly
            rows={7}
            value={joined}
            className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm"
          />
        </div>
      </div>
    );
  }

  // 44: UUID v4 Generator
  if (slug === 'uuid-uretici') {
    const joined = uuidList.join('\n');
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <label htmlFor="uuid-count" className="text-xs font-medium">
                Adet:
              </label>
              <input
                id="uuid-count"
                type="number"
                min={1}
                max={50}
                value={uuidCount}
                onChange={(e) => setUuidCount(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono tabular-nums"
              />
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={uuidHyphens}
                onChange={(e) => setUuidHyphens(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Tire (-) kullan</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={uuidUpper}
                onChange={(e) => setUuidUpper(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>BÜYÜK HARF</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={regenerateUuids}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Yeni UUID Üret
            </button>
            <button
              type="button"
              onClick={() => copyValue(joined, 'uuid')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
            >
              {copiedKey === 'uuid' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Tümünü Kopyala
            </button>
          </div>
        </div>

        <textarea
          readOnly
          rows={7}
          value={joined}
          className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-sm"
        />
      </div>
    );
  }

  // 45: Hash Generator
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="hash-text-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
          Özetlenecek (Hash) Metin
        </label>
        <textarea
          id="hash-text-input"
          rows={3}
          value={hashInput}
          onChange={(e) => setHashInput(e.target.value)}
          className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm"
        />
      </div>

      {hashes && (
        <div className="space-y-3">
          {[
            { label: 'SHA-256 (256-bit Önerilen)', val: hashes.sha256, key: 'sha256' },
            { label: 'SHA-512 (512-bit)', val: hashes.sha512, key: 'sha512' },
            { label: 'SHA-384 (384-bit)', val: hashes.sha384, key: 'sha384' },
            { label: 'SHA-1 (160-bit Eski Uyumluluk)', val: hashes.sha1, key: 'sha1' },
          ].map((item) => (
            <div
              key={item.key}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => copyValue(item.val, item.key)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copiedKey === item.key ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedKey === item.key ? 'Kopyalandı' : 'Hash Kopyala'}
                </button>
              </div>
              <div className="font-mono text-xs break-all text-slate-900 dark:text-slate-100 select-all">
                {item.val}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

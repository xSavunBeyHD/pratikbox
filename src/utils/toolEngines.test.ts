import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import { TOOLS_REGISTRY, getToolBySlug, getToolsByCategory } from '../data/toolsRegistry';
import {
  searchTools,
  analyzeTextStats,
  convertTextCase,
  removeDuplicateLines,
  cleanText,
  sortLines,
  generateLoremIpsum,
  reverseText,
  generateSlug,
  processJson,
  encodeBase64Utf8,
  decodeBase64Utf8,
  encodeUrlText,
  decodeUrlText,
  encodeHtmlEntities,
  decodeHtmlEntities,
  computeLineDiff,
  estimateSerpPixelWidth,
  calculateKeywordDensity,
  generateRobotsTxt,
  generateSitemapXml,
  generateSecurePassword,
  evaluatePasswordStrength,
  generateRandomStrings,
  generateUuids,
  computeHashes,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
} from './toolEngines';
import {
  mergePdfBuffers,
  parsePageRangeString,
  extractPagesFromPdfBuffer,
  inspectPdfBuffer,
} from './pdfEngine';
import {
  calculateAspectRatioLabel,
  calculateProportionalDimensions,
  formatBytes,
} from './imageEngine';

test('Registry contains all 51 tools with unique slugs and non-duplicate SEO metadata', () => {
  assert.equal(TOOLS_REGISTRY.length, 51);
  const slugs = new Set(TOOLS_REGISTRY.map((t) => t.slug));
  const seoTitles = new Set(TOOLS_REGISTRY.map((t) => t.seoTitle));
  const seoDescs = new Set(TOOLS_REGISTRY.map((t) => t.seoDescription));

  assert.equal(slugs.size, 51, 'All 51 slugs must be unique');
  assert.equal(seoTitles.size, 51, 'All 51 SEO titles must be unique');
  assert.equal(seoDescs.size, 51, 'All 51 SEO descriptions must be unique');

  assert.equal(getToolsByCategory('image').length, 8);
  assert.equal(getToolsByCategory('pdf').length, 4);
  assert.equal(getToolsByCategory('text').length, 10);
  assert.equal(getToolsByCategory('developer').length, 10);
  assert.equal(getToolsByCategory('seo').length, 8);
  assert.equal(getToolsByCategory('security').length, 5);
  assert.equal(getToolsByCategory('design').length, 6);
});

test('Search and navigation lookup work with Turkish characters and categories', () => {
  const jsonTools = searchTools('JSON');
  assert.ok(jsonTools.length >= 2);
  assert.ok(jsonTools.some((t) => t.slug === 'json-bicimlendirici'));

  const sifreTools = searchTools('şifre');
  assert.ok(sifreTools.some((t) => t.slug === 'sifre-olusturucu'));

  const asciiSearch = searchTools('gorsel sikistirma');
  assert.equal(asciiSearch[0]?.slug, 'gorsel-sikistirma');

  const tool = getToolBySlug('pdf-birlestirme');
  assert.equal(tool?.name, 'PDF Birleştirme');
});

test('Image dimension, aspect ratio, and byte formatting math work accurately', () => {
  assert.equal(calculateAspectRatioLabel(1920, 1080), '16:9');
  assert.equal(calculateAspectRatioLabel(1080, 1080), '1:1');
  const resized = calculateProportionalDimensions(1920, 1080, 960, undefined);
  assert.deepEqual(resized, { width: 960, height: 540 });
  assert.equal(formatBytes(1024), '1.00 KB');
});

test('PDF merging, splitting, page extraction, and info inspection work via pdf-lib', async () => {
  const doc1 = await PDFDocument.create();
  doc1.setTitle('Test Belgesi');
  doc1.setAuthor('PRATIKBOX');
  doc1.addPage([595, 842]);
  doc1.addPage([595, 842]);
  const buf1 = await doc1.save();

  const doc2 = await PDFDocument.create();
  doc2.addPage([595, 842]);
  const buf2 = await doc2.save();

  // Merge 2-page PDF + 1-page PDF = 3-page PDF
  const mergedBuf = await mergePdfBuffers([buf1, buf2]);
  const mergedInfo = await inspectPdfBuffer(mergedBuf);
  assert.equal(mergedInfo.pageCount, 3);

  // Split range parsing
  const ranges = parsePageRangeString('1-2, 3', 3);
  assert.deepEqual(ranges, [[0, 1], [2]]);

  // Page extraction
  const extractedBuf = await extractPagesFromPdfBuffer(mergedBuf, [0, 2]);
  const extractedInfo = await inspectPdfBuffer(extractedBuf);
  assert.equal(extractedInfo.pageCount, 2);

  // Info viewer metadata
  const doc1Info = await inspectPdfBuffer(buf1);
  assert.equal(doc1Info.title, 'Test Belgesi');
  assert.equal(doc1Info.author, 'PRATIKBOX');
  assert.equal(doc1Info.firstPageWidthPt, 595);
});

test('JSON formatter and validator validate and format or report syntax errors', () => {
  const validRes = processJson('{"b":1,"a":[true,null]}', 2, true);
  assert.equal(validRes.valid, true);
  assert.ok(validRes.formatted?.includes('"a": ['));
  assert.equal(validRes.minified, '{"a":[true,null],"b":1}');

  const invalidRes = processJson('{"isim": "Ahmet",}', 2);
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.error?.includes('Geçersiz JSON'));
});

test('Base64, URL, and HTML Entity encoding/decoding preserve Turkish UTF-8 characters', () => {
  const original = 'İhtiyacın olan bütün araçlar, tek yerde! ğüşıöçĞÜŞİÖÇ';
  const b64 = encodeBase64Utf8(original);
  const decodedB64 = decodeBase64Utf8(b64);
  assert.equal(decodedB64.error, undefined);
  assert.equal(decodedB64.result, original);

  const urlEncoded = encodeUrlText('merhaba dünya & özel=değer');
  assert.ok(urlEncoded.includes('%26'));
  const urlDecoded = decodeUrlText(urlEncoded);
  assert.equal(urlDecoded.result, 'merhaba dünya & özel=değer');

  const htmlEnc = encodeHtmlEntities('<script>alert("Güvenlik & Test")</script>');
  assert.equal(htmlEnc, '&lt;script&gt;alert(&quot;Güvenlik &amp; Test&quot;)&lt;/script&gt;');
  assert.equal(decodeHtmlEntities(htmlEnc), '<script>alert("Güvenlik & Test")</script>');
});

test('Text tools (Word Counter, Case Converter, Duplicate Remover, Slug, Sorter, Diff)', () => {
  const stats = analyzeTextStats('Merhaba dünya. Bu ikinci cümledir.');
  assert.equal(stats.words, 5);
  assert.equal(stats.sentences, 2);

  assert.equal(convertTextCase('istanbul ve ısparta', 'uppercase'), 'İSTANBUL VE ISPARTA');
  assert.equal(convertTextCase('İSTANBUL VE ISPARTA', 'lowercase'), 'istanbul ve ısparta');

  const dedup = removeDuplicateLines('elma\narmut\nelma\nkiraz');
  assert.equal(dedup.uniqueCount, 3);
  assert.equal(dedup.removedCount, 1);

  assert.equal(generateSlug('İşlerini Kolaylaştıran Ücretsiz Araçlar!'), 'islerini-kolaylastiran-ucretsiz-araclar');
  assert.equal(
    generateSlug('Web Siteniz İçin En İyi ve Ücretsiz SEO Araçları', '-', { removeStopWords: true }),
    'web-siteniz-iyi-ucretsiz-seo-araclari'
  );

  assert.equal(cleanText('<p>Merhaba   dünya</p>', { stripHtmlTags: true, removeExtraSpaces: true }), 'Merhaba dünya');
  assert.equal(sortLines('Zeynep\nAhmet\nÇiğdem', 'az'), 'Ahmet\nÇiğdem\nZeynep');
  assert.equal(reverseText('PRATIKBOX', 'chars'), 'XOBKITARP');
  assert.ok(generateLoremIpsum(2, 'paragraphs').split('\n\n').length === 2);

  const diff = computeLineDiff('satir 1\nsatir 2', 'satir 1\nsatir 3');
  assert.ok(diff.some((d) => d.type === 'delete' && d.text === 'satir 2'));
  assert.ok(diff.some((d) => d.type === 'insert' && d.text === 'satir 3'));
});

test('SEO tools (Keyword density, Robots.txt, Sitemap XML, SERP width)', () => {
  const kd = calculateKeywordDensity('online araçlar ücretsiz online araçlar pratikbox');
  assert.equal(kd.unigrams[0]?.phrase, 'online');
  assert.equal(kd.unigrams[0]?.count, 2);

  const robots = generateRobotsTxt({
    userAgent: '*',
    allowAll: true,
    disallowPaths: ['/admin/'],
    allowPaths: [],
    sitemapUrl: 'https://pratikbox.com/sitemap.xml',
  });
  assert.ok(robots.includes('Disallow: /admin/'));
  assert.ok(robots.includes('Sitemap: https://pratikbox.com/sitemap.xml'));

  const sitemap = generateSitemapXml({
    urls: ['https://pratikbox.com/'],
    changefreq: 'daily',
    priority: '1.0',
  });
  assert.ok(sitemap.includes('<loc>https://pratikbox.com/</loc>'));
  assert.ok(estimateSerpPixelWidth('PRATIKBOX Ücretsiz Araçlar') > 100);
});

test('Security tools (Password generator, Strength, UUID v4, SHA-256 Hash)', async () => {
  const pwd = generateSecurePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  assert.equal(pwd.length, 20);
  const strength = evaluatePasswordStrength(pwd);
  assert.ok(strength.score >= 3);

  const uuids = generateUuids(3);
  assert.equal(uuids.length, 3);
  assert.match(uuids[0], /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

  const randStrings = generateRandomStrings({ length: 10, count: 2, charset: 'hex', prefix: 'PB-' });
  assert.equal(randStrings.length, 2);
  assert.equal(randStrings[0].length, 13);

  const hashes = await computeHashes('pratikbox');
  assert.equal(hashes.sha256.length, 64);
  assert.equal(hashes.sha512.length, 128);
});

test('Design tools (Color conversion and QR code generation)', async () => {
  const rgb = hexToRgb('#2563EB');
  assert.deepEqual(rgb, { r: 37, g: 99, b: 235 });
  assert.equal(rgbToHex(37, 99, 235), '#2563EB');
  const hsl = rgbToHsl(37, 99, 235);
  assert.ok(hsl.h >= 215 && hsl.h <= 225);

  const qrDataUrl = await QRCode.toDataURL('https://pratikbox.com', { width: 256, margin: 2 });
  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'));
});

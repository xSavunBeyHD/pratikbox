import { PDFDocument } from 'pdf-lib';

export interface PdfMetadataInfo {
  pageCount: number;
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  firstPageWidthPt: number;
  firstPageHeightPt: number;
  firstPageWidthMm: number;
  firstPageHeightMm: number;
}

export async function mergePdfBuffers(buffers: Uint8Array[]): Promise<Uint8Array> {
  if (buffers.length === 0) {
    throw new Error('Birleştirmek için en az bir PDF dosyası seçmelisiniz.');
  }
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < buffers.length; i++) {
    try {
      const srcDoc = await PDFDocument.load(buffers[i]);
      const indices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, indices);
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('encrypt')) {
        throw new Error(
          `${i + 1}. sıradaki PDF dosyası şifreli (korumalı) olduğu için birleştirilemiyor. Lütfen şifresiz bir PDF yükleyin.`
        );
      }
      throw new Error(`${i + 1}. sıradaki dosya geçerli bir PDF belgesi olarak okunamadı.`);
    }
  }

  return await mergedPdf.save();
}

export function parsePageRangeString(rangeStr: string, maxPages: number): number[][] {
  // Returns an array of 0-based page index groups, e.g. "1-3, 5" -> [[0,1,2], [4]]
  const parts = rangeStr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Lütfen geçerli bir sayfa aralığı girin (ör. 1-3, 4-6).');
  }

  const groups: number[][] = [];
  for (const part of parts) {
    if (part.includes('-')) {
      const [startRaw, endRaw] = part.split('-').map((s) => parseInt(s.trim(), 10));
      if (isNaN(startRaw) || isNaN(endRaw) || startRaw < 1 || endRaw > maxPages || startRaw > endRaw) {
        throw new Error(
          `Geçersiz sayfa aralığı "${part}". Sayfa numaraları 1 ile ${maxPages} arasında olmalıdır.`
        );
      }
      const group: number[] = [];
      for (let p = startRaw; p <= endRaw; p++) {
        group.push(p - 1);
      }
      groups.push(group);
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
        throw new Error(
          `Geçersiz sayfa numarası "${part}". Belgede toplam ${maxPages} sayfa bulunuyor.`
        );
      }
      groups.push([pageNum - 1]);
    }
  }
  return groups;
}

export async function extractPagesFromPdfBuffer(
  sourceBuffer: Uint8Array,
  zeroBasedIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(sourceBuffer);
  const total = srcDoc.getPageCount();
  const validIndices = zeroBasedIndices.filter((idx) => idx >= 0 && idx < total);
  if (validIndices.length === 0) {
    throw new Error('Çıkarılacak geçerli bir sayfa seçilmedi.');
  }

  const newDoc = await PDFDocument.create();
  const copied = await newDoc.copyPages(srcDoc, validIndices);
  for (const p of copied) {
    newDoc.addPage(p);
  }
  return await newDoc.save();
}

export async function inspectPdfBuffer(sourceBuffer: Uint8Array): Promise<PdfMetadataInfo> {
  const doc = await PDFDocument.load(sourceBuffer);
  const pageCount = doc.getPageCount();
  const firstPage = pageCount > 0 ? doc.getPage(0) : null;
  const size = firstPage ? firstPage.getSize() : { width: 0, height: 0 };

  const ptToMm = (pt: number) => Math.round((pt / 72) * 25.4 * 10) / 10;

  return {
    pageCount,
    title: doc.getTitle() || 'Belirtilmemiş',
    author: doc.getAuthor() || 'Belirtilmemiş',
    subject: doc.getSubject() || 'Belirtilmemiş',
    creator: doc.getCreator() || 'Belirtilmemiş',
    producer: doc.getProducer() || 'Belirtilmemiş',
    creationDate: doc.getCreationDate()?.toLocaleString('tr-TR') || 'Belirtilmemiş',
    modificationDate: doc.getModificationDate()?.toLocaleString('tr-TR') || 'Belirtilmemiş',
    firstPageWidthPt: Math.round(size.width),
    firstPageHeightPt: Math.round(size.height),
    firstPageWidthMm: ptToMm(size.width),
    firstPageHeightMm: ptToMm(size.height),
  };
}

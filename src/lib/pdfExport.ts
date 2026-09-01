import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  filename?: string;
  elementId?: string;
  element?: HTMLElement | null;
  onProgress?: (progress: boolean) => void;
  marginMm?: number;
  addPageNumbers?: boolean;
}

/**
 * Export a printable HTML document to A4 PDF.
 *
 * Unlike the old implementation, this slices the rendered canvas into real
 * A4-sized page chunks. That prevents long invoices/letters from being
 * vertically scaled into one giant image and gives predictable page breaks.
 */
export async function exportElementToPdf(options: ExportPdfOptions): Promise<void> {
  const {
    filename = 'Document.pdf',
    elementId,
    element: targetElement,
    onProgress,
    marginMm = 10,
    addPageNumbers = true,
  } = options;

  onProgress?.(true);

  try {
    const el = targetElement || (elementId ? document.getElementById(elementId) : null);
    if (!el) throw new Error('Elemen dokumen tidak ditemukan untuk diekspor ke PDF.');

    // 2x is a good balance between readable text and file size.
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(el.scrollWidth, el.clientWidth),
      windowHeight: Math.max(el.scrollHeight, el.clientHeight),
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginMm * 2;
    const contentHeight = pageHeight - marginMm * 2;

    // Convert the printable width to pixels, then derive the pixel height that
    // fits inside one A4 content area at the same aspect ratio.
    const pxPerMm = canvas.width / contentWidth;
    const pageSliceHeightPx = Math.max(1, Math.floor(contentHeight * pxPerMm));
    const totalPages = Math.ceil(canvas.height / pageSliceHeightPx);

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      if (pageIndex > 0) pdf.addPage();

      const sourceY = pageIndex * pageSliceHeightPx;
      const sourceHeight = Math.min(pageSliceHeightPx, canvas.height - sourceY);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sourceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) throw new Error('Browser tidak dapat menyiapkan canvas PDF.');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sourceHeight,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height,
      );

      const imageData = pageCanvas.toDataURL('image/jpeg', 0.94);
      const renderedHeightMm = sourceHeight / pxPerMm;
      pdf.addImage(imageData, 'JPEG', marginMm, marginMm, contentWidth, renderedHeightMm, undefined, 'FAST');

      if (addPageNumbers) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Halaman ${pageIndex + 1} dari ${totalPages}`, pageWidth - marginMm, pageHeight - 4, {
          align: 'right',
        });
      }
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    onProgress?.(false);
  }
}

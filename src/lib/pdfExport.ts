import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  filename?: string;
  elementId?: string;
  element?: HTMLElement | null;
  onProgress?: (progress: boolean) => void;
}

/**
 * Export an HTML element to a professional, high-resolution A4 PDF file using jsPDF & html2canvas
 */
export async function exportElementToPdf(options: ExportPdfOptions): Promise<void> {
  const {
    filename = 'Document.pdf',
    elementId,
    element: targetElement,
    onProgress,
  } = options;

  if (onProgress) onProgress(true);

  try {
    const el = targetElement || (elementId ? document.getElementById(elementId) : null);
    if (!el) {
      throw new Error('Elemen dokumen tidak ditemukan untuk diekspor ke PDF.');
    }

    // Capture using html2canvas with high scale for crisp print quality
    const canvas = await html2canvas(el, {
      scale: 2.5, // Crisp 300+ DPI simulation
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // A4 dimensions in mm are 210 x 297
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Multi-page handling if invoice overflows standard A4 height
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    // Save and trigger download
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (onProgress) onProgress(false);
  }
}

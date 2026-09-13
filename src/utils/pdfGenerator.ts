import { jsPDF } from 'jspdf';
import { ColoringBook } from '../types';

export async function generateColoringBookPDF(book: ColoringBook): Promise<Blob> {
  // Standard Letter page in portrait: 8.5 x 11 inches = 215.9 x 279.4 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12; // mm

  // Helper: Draw decorative border
  const drawPageBorder = (showStars = true) => {
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(1.2);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 4, 4);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin + 2.5, margin + 2.5, pageWidth - (margin + 2.5) * 2, pageHeight - (margin + 2.5) * 2, 3, 3);

    if (showStars) {
      // Corner accents
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text('★', margin + 4, margin + 8);
      doc.text('★', pageWidth - margin - 8, margin + 8);
      doc.text('★', margin + 4, pageHeight - margin - 4);
      doc.text('★', pageWidth - margin - 8, pageHeight - margin - 4);
    }
  };

  // Helper to load image as HTMLImageElement
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // ================= PAGE 1: COVER =================
  drawPageBorder(true);

  // Cover Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(20, 20, 20);

  const titleLines = doc.splitTextToSize(book.cover.title || `${book.childName}'s Coloring Book`, pageWidth - 40);
  doc.text(titleLines, pageWidth / 2, 28, { align: 'center' });

  let curY = 28 + titleLines.length * 9;
  if (book.cover.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(80, 80, 80);
    const subLines = doc.splitTextToSize(book.cover.subtitle, pageWidth - 40);
    doc.text(subLines, pageWidth / 2, curY, { align: 'center' });
    curY += subLines.length * 6;
  }

  // Cover Image
  const imgY = Math.max(curY + 3, 44);
  const imgW = 150;
  const imgH = 170;
  const imgX = (pageWidth - imgW) / 2;

  if (book.cover.imageUrl) {
    try {
      const img = await loadImage(book.cover.imageUrl);
      doc.addImage(img, 'PNG', imgX, imgY, imgW, imgH);
      // Border around cover art
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.6);
      doc.rect(imgX, imgY, imgW, imgH);
    } catch (e) {
      console.warn('Failed to load cover image for PDF', e);
      doc.rect(imgX, imgY, imgW, imgH);
      doc.setFontSize(12);
      doc.text('[Cover Illustration Ready for Coloring]', pageWidth / 2, imgY + imgH / 2, { align: 'center' });
    }
  } else {
    doc.rect(imgX, imgY, imgW, imgH);
    doc.setFontSize(12);
    doc.text('[Cover Illustration Ready for Coloring]', pageWidth / 2, imgY + imgH / 2, { align: 'center' });
  }

  // Cover Footer: "This Book Belongs To"
  const footerY = pageHeight - margin - 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`THIS COLORING BOOK BELONGS TO:`, pageWidth / 2, footerY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175); // Royal Blue accent
  doc.text(`★  ${book.childName.toUpperCase()}  ★`, pageWidth / 2, footerY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Custom AI Story Coloring Edition • Theme: ${book.theme}`, pageWidth / 2, pageHeight - margin - 5, { align: 'center' });

  // ================= PAGES 1-5: COLORING PAGES =================
  for (let i = 0; i < book.pages.length; i++) {
    const page = book.pages[i];
    doc.addPage();
    drawPageBorder(true);

    // Header: Title & Page number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text(`${page.pageNumber}. ${page.title}`, pageWidth / 2, 24, { align: 'center' });

    // Caption for kids to read / follow the story
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const captionLines = doc.splitTextToSize(page.caption, pageWidth - 44);
    doc.text(captionLines, pageWidth / 2, 32, { align: 'center' });

    const cImgY = 36 + captionLines.length * 5;
    const cImgW = 158;
    const cImgH = 188;
    const cImgX = (pageWidth - cImgW) / 2;

    if (page.imageUrl) {
      try {
        const img = await loadImage(page.imageUrl);
        doc.addImage(img, 'PNG', cImgX, cImgY, cImgW, cImgH);
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.5);
        doc.rect(cImgX, cImgY, cImgW, cImgH);
      } catch (e) {
        console.warn(`Failed to load page ${page.pageNumber} image for PDF`, e);
        doc.rect(cImgX, cImgY, cImgW, cImgH);
        doc.setFontSize(12);
        doc.text(`[Page ${page.pageNumber} Illustration]`, pageWidth / 2, cImgY + cImgH / 2, { align: 'center' });
      }
    } else {
      doc.rect(cImgX, cImgY, cImgW, cImgH);
      doc.setFontSize(12);
      doc.text(`[Page ${page.pageNumber} Illustration]`, pageWidth / 2, cImgY + cImgH / 2, { align: 'center' });
    }

    // Page Footer: Artist signature strip
    const pFooterY = pageHeight - margin - 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Colored by: ________________________   Date: ___________`, 24, pFooterY);
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${page.pageNumber} of ${book.pages.length}`, pageWidth - margin - 12, pFooterY, { align: 'right' });
  }

  // ================= BONUS PAGE: CERTIFICATE OF COMPLETION =================
  doc.addPage();
  drawPageBorder(true);

  // Certificate Header
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin + 5, margin + 5, pageWidth - (margin + 5) * 2, pageHeight - (margin + 5) * 2, 4, 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(180, 83, 9);
  doc.text('OFFICIAL ARTIST CERTIFICATE', pageWidth / 2, 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(70, 70, 70);
  doc.text('This special certificate is proudly awarded to', pageWidth / 2, 65, { align: 'center' });

  // Child Name Big Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(30, 58, 138);
  doc.text(book.childName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 60, 90, pageWidth / 2 + 60, 90);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  const certText = `For showing wonderful creativity, imagination, and artistic flair while coloring the entire 5-page "${book.theme}" adventure book!`;
  const certLines = doc.splitTextToSize(certText, pageWidth - 60);
  doc.text(certLines, pageWidth / 2, 105, { align: 'center' });

  // 5 Stars to color in
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(217, 119, 6);
  doc.text('★   ★   ★   ★   ★', pageWidth / 2, 135, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text('(Color these 5 stars when you finish every page!)', pageWidth / 2, 144, { align: 'center' });

  // Signatures
  const sigY = 200;
  doc.setDrawColor(120, 120, 120);
  doc.line(30, sigY, 95, sigY);
  doc.line(pageWidth - 95, sigY, pageWidth - 30, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text('Chief Coloring Buddy / Parent', 62.5, sigY + 6, { align: 'center' });
  doc.text('Master Artist Signature', pageWidth - 62.5, sigY + 6, { align: 'center' });

  return doc.output('blob');
}

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Certificate } from '../types';

/**
 * Generates an international-grade, English-only Landscape A4 PDF Certificate
 * regardless of the currently active website language.
 */
export async function downloadCertificatePdf(cert: Certificate): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background — Deep Navy Outer Frame + Crisp Ivory/White Inner Canvas
  doc.setFillColor(10, 15, 34); // #0A0F22
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Subtle violet/gold outer rule
  doc.setDrawColor(139, 92, 246); // #8B5CF6
  doc.setLineWidth(0.9);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner parchment/white card
  doc.setFillColor(250, 250, 252);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26, 'F');

  // Double gold/navy inner border
  doc.setDrawColor(196, 162, 82); // Refined Gold
  doc.setLineWidth(0.7);
  doc.rect(17, 17, pageWidth - 34, pageHeight - 34);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.rect(19.5, 19.5, pageWidth - 39, pageHeight - 39);

  // Corner geometric accents
  const corners = [
    [17, 17],
    [pageWidth - 17, 17],
    [17, pageHeight - 17],
    [pageWidth - 17, pageHeight - 17],
  ];
  doc.setFillColor(124, 58, 237);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.5, 'F');
  });

  // Top Brand Crest (Syntax Academy)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(pageWidth / 2 - 36, 25, 72, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('SYNTAX ACADEMY', pageWidth / 2, 32.2, { align: 'center' });

  // Main Certificate Heading
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 50, { align: 'center' });

  // Gold separator line
  doc.setDrawColor(196, 162, 82);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 48, 55, pageWidth / 2 + 48, 55);

  // Presentation line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('This certificate is proudly presented to', pageWidth / 2, 66, { align: 'center' });

  // Dynamic font sizing for long student names (prevents clipping/overflow)
  const studentName = cert.studentFullName.trim();
  let nameFontSize = 30;
  if (studentName.length > 26) nameFontSize = 24;
  if (studentName.length > 38) nameFontSize = 20;
  if (studentName.length > 50) nameFontSize = 17;

  doc.setFont('times', 'bold');
  doc.setFontSize(nameFontSize);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName, pageWidth / 2, 83, {
    align: 'center',
    maxWidth: pageWidth - 68,
  });

  // Name underline
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 78, 88, pageWidth / 2 + 78, 88);

  // Track completion line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('For successfully completing the', pageWidth / 2, 98, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(109, 40, 217); // #6D28D9 Deep Violet
  doc.text(cert.trackName, pageWidth / 2, 109, {
    align: 'center',
    maxWidth: pageWidth - 70,
  });

  // Achievement / Grade if provided
  let nextY = 120;
  if (cert.grade && cert.grade.trim().length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Achievement: ${cert.grade.trim()}`, pageWidth / 2, 118, { align: 'center' });
    nextY = 126;
  }

  // Recognition paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'In recognition of dedication, commitment, and successful completion of the learning program.',
    pageWidth / 2,
    nextY,
    { align: 'center', maxWidth: 205 }
  );

  // Metadata footer grid
  const footerTop = 148;

  // Left block: Instructor & Completion Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INSTRUCTOR', 34, footerTop);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.instructorName, 34, footerTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE OF COMPLETION', 34, footerTop + 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.completionDate, 34, footerTop + 23);

  // Center block: Authorized Signature
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 32, footerTop + 14, pageWidth / 2 + 32, footerTop + 14);
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Syntax Academy Board', pageWidth / 2, footerTop + 11, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED SIGNATURE', pageWidth / 2, footerTop + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Certificate ID: ${cert.certificateId}`, pageWidth / 2, footerTop + 26, {
    align: 'center',
  });

  // Right block: Verification QR Code
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://syntaxacademy.edu';
  const verifyUrl = `${origin}/verify-certificate/${encodeURIComponent(cert.certificateId)}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#0F172A', light: '#FAFAFC' },
    });
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 62, footerTop - 4, 28, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('SCAN TO VERIFY', pageWidth - 48, footerTop + 27, { align: 'center' });
  } catch {
    doc.setFontSize(8);
    doc.text(`Verify: ${cert.certificateId}`, pageWidth - 48, footerTop + 12, { align: 'center' });
  }

  const safeFile = cert.studentFullName.replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Syntax_Academy_Certificate_${safeFile}_${cert.certificateId}.pdf`);
}

import { Injectable } from '@nestjs/common';
import { jsPDF } from 'jspdf';

// Primary brand color (teal/green) - hsl(165, 100%, 15%)
const PRIMARY_COLOR = { r: 0, g: 77, b: 61 };

const LOCAL_LOGO_DATA_URL =
  'data:image/png;base64,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';

const getLogoDataUrl = async (): Promise<string | null> => {
  return LOCAL_LOGO_DATA_URL;
};

@Injectable()
export class TrainingCertificatePdfService {
  /**
   * Clean text for PDF rendering by handling unicode characters
   */
  private cleanTextForPDF(text: string): string {
    const strippedText = text
      .replace(/\u00AD/g, '')
      .replace(/[\u200B-\u200F]/g, '')
      .replace(/[\u202A-\u202E]/g, '')
      .replace(/[\u2060-\u206F]/g, '')
      .replace(/\uFEFF/g, '')
      .replace(/\uFFFD/g, '');

    const replacements: { [key: string]: string } = {
      '\u2018': "'",
      '\u2019': "'",
      '\u201C': '"',
      '\u201D': '"',
      '\u2013': '-',
      '\u2014': '-',
      '\u2026': '...',
      '\u00A0': ' ',
    };

    let cleanedText = strippedText;
    for (const [unicode, replacement] of Object.entries(replacements)) {
      cleanedText = cleanedText.replace(new RegExp(unicode, 'g'), replacement);
    }

    return cleanedText;
  }

  async generateHipaaCertificatePdf(params: {
    userName: string;
    organizationName: string;
    completedAt: Date;
  }): Promise<Buffer> {
    return this.generateCertificatePdf({
      ...params,
      title: 'HIPAA Security Awareness Training',
      subtitle: 'HIPAA Security Awareness Training program',
    });
  }

  async generateTrainingCertificatePdf(params: {
    userName: string;
    organizationName: string;
    completedAt: Date;
  }): Promise<Buffer> {
    return this.generateCertificatePdf({
      ...params,
      title: 'Security Awareness Training',
      subtitle: 'Security Awareness Training program',
    });
  }

  private async generateCertificatePdf(params: {
    userName: string;
    organizationName: string;
    completedAt: Date;
    title: string;
    subtitle: string;
  }): Promise<Buffer> {
    const { userName, organizationName, completedAt, title, subtitle } = params;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background - light cream/off-white
    doc.setFillColor(252, 251, 248);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative border using primary color
    doc.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

    // Inner decorative border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

    // Add Comp AI logo at top center
    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
      const logoWidth = 15;
      const logoHeight = 15;
      doc.addImage(
        logoDataUrl,
        'PNG',
        pageWidth / 2 - logoWidth / 2,
        22,
        logoWidth,
        logoHeight,
      );
    }

    // Certificate header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 48, {
      align: 'center',
    });

    // Main title in black
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(18, 18, 18);
    doc.text(this.cleanTextForPDF(title), pageWidth / 2, 62, {
      align: 'center',
    });

    // Decorative line with primary color
    doc.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 50, 68, pageWidth / 2 + 50, 68);

    // "This certifies that" text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('This is to certify that', pageWidth / 2, 82, { align: 'center' });

    // Employee name
    const cleanUserName = this.cleanTextForPDF(userName);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(18, 18, 18);
    doc.text(cleanUserName, pageWidth / 2, 95, { align: 'center' });

    // Underline for name with primary color
    const nameWidth = doc.getTextWidth(cleanUserName);
    doc.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    doc.setLineWidth(0.4);
    doc.line(
      pageWidth / 2 - nameWidth / 2 - 10,
      98,
      pageWidth / 2 + nameWidth / 2 + 10,
      98,
    );

    // Description
    const cleanOrgName = this.cleanTextForPDF(organizationName);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(
      'has successfully completed all modules of the',
      pageWidth / 2,
      110,
      {
        align: 'center',
      },
    );
    doc.text(this.cleanTextForPDF(subtitle), pageWidth / 2, 117, {
      align: 'center',
    });
    // "for" in normal, org name in bold - manually center
    doc.setFont('helvetica', 'normal');
    const forText = 'for ';
    const forWidth = doc.getTextWidth(forText);
    doc.setFont('helvetica', 'bold');
    const orgWidth = doc.getTextWidth(cleanOrgName);
    const totalWidth = forWidth + orgWidth;
    const startX = pageWidth / 2 - totalWidth / 2;

    doc.setFont('helvetica', 'normal');
    doc.text(forText, startX, 124);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 18, 18);
    doc.text(cleanOrgName, startX + forWidth, 124);
    doc.setFont('helvetica', 'normal');

    // Completion date with primary color
    const formattedDate = new Date(completedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(18, 18, 18);
    doc.text(`Completed on ${formattedDate}`, pageWidth / 2, 140, {
      align: 'center',
    });

    // Certified by section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Certified by', pageWidth / 2, 158, { align: 'center' });

    // Comp AI branding with logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(18, 18, 18);
    const compAiText = 'Comp AI';
    const compAiTextWidth = doc.getTextWidth(compAiText);
    const logoSize = 8;
    const gap = 3;
    const totalBrandWidth = logoSize + gap + compAiTextWidth;
    const brandStartX = pageWidth / 2 - totalBrandWidth / 2;

    // Add small logo next to text
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', brandStartX, 164, logoSize, logoSize);
    }
    doc.text(compAiText, brandStartX + logoSize + gap, 171);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('AI-powered compliance platform', pageWidth / 2, 178, {
      align: 'center',
    });
    const platformUrl = (
      process.env.NEXT_PUBLIC_APP_URL || 'https://app.comp.scalereal.tech'
    ).replace(/\/+$/, '');
    doc.text(platformUrl, pageWidth / 2, 183, { align: 'center' });

    // Get the PDF as a buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }
}

import { jsPDF } from 'jspdf';
import type { ProposalRecord, InvoiceRecord } from '../types/platform';

export function downloadProposalPdf(proposal: ProposalRecord): void {
  const doc = new jsPDF();
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SANJAY VAISHYA — PROJECT PROPOSAL', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Founder & Lead Full-Stack Developer | Independent Development Team', 14, y);
  y += 10;

  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${proposal.proposal_code}: ${proposal.title}`, 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Client: ${proposal.client_name || 'Client'} | Status: ${proposal.status.toUpperCase()}`, 14, y);
  y += 6;
  doc.text(`Estimated Timeline: ${proposal.timeline}`, 14, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Scope Summary:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const scopeLines = doc.splitTextToSize(proposal.scope_summary, 180) as string[];
  doc.text(scopeLines, 14, y);
  y += scopeLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Feature & Pricing Breakdown:', 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');

  for (const item of proposal.items) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.text(`• ${item.title} — INR ${item.amount_inr.toLocaleString('en-IN')}`, 16, y);
    y += 6;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total Quotation: INR ${proposal.total_amount_inr.toLocaleString('en-IN')}`, 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.text('Payment Schedule:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const schedLines = doc.splitTextToSize(proposal.payment_schedule || 'Per milestone schedule', 180) as string[];
  doc.text(schedLines, 14, y);
  y += schedLines.length * 5 + 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const termsLines = doc.splitTextToSize(proposal.terms || 'Standard development agreement applies.', 180) as string[];
  doc.text(termsLines, 14, y);

  doc.save(`${proposal.proposal_code}.pdf`);
}

export function downloadInvoicePdf(invoice: InvoiceRecord): void {
  const doc = new jsPDF();
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SANJAY VAISHYA — PAYMENT INVOICE', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Email: sanjayvaishya.dev@gmail.com | Phone: +91 9203251821', 14, y);
  y += 5;
  doc.text('Office: Jobgarh, Singrauli, Madhya Pradesh, India (486886)', 14, y);
  y += 10;

  doc.line(14, y, 196, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Issued Date: ${invoice.issued_at}`, 14, y);
  y += 6;
  doc.text(`Client: ${invoice.client_name || 'Client'}`, 14, y);
  y += 6;
  doc.text(`Project: ${invoice.project_title || 'Development Project'}`, 14, y);
  y += 6;
  doc.text(`Payment Reference: ${invoice.payment_code || '-'} (${invoice.razorpay_payment_id || 'Verified'})`, 14, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Amount Paid: INR ${invoice.amount_inr.toLocaleString('en-IN')}`, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, y);

  doc.save(`${invoice.invoice_number}.pdf`);
}

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Add the autoTable plugin to jsPDF
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export interface InvoiceData {
  invoiceNumber: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  serviceName: string;
  serviceDescription?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  basePrice: number;
  laborCost: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  notes?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  invoiceDate: string;
}

export const generateInvoicePDF = (data: InvoiceData): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const primaryBlue = [37, 99, 235] as const;
  const lightGray = [248, 250, 252] as const;
  const darkGray = [71, 85, 105] as const;
  const green = [34, 197, 94] as const;
  const red = [239, 68, 68] as const;
  const orange = [251, 146, 60] as const;
  
  let currentY = margin;
  
  // ===== HEADER SECTION =====
  // Main header background
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName, margin, 30);
  
  // Invoice title with background
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth - 80, 15, 60, 20, 'F');
  doc.setTextColor(...primaryBlue);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 75, 28);
  
  currentY = 65;
  
  // ===== COMPANY & INVOICE INFO SECTION =====
  doc.setTextColor(0, 0, 0);
  
  // Company details (left side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyAddress, margin, currentY);
  doc.text(`Phone: ${data.companyPhone}`, margin, currentY + 8);
  doc.text(`Email: ${data.companyEmail}`, margin, currentY + 16);
  
  // Invoice details (right side) - with background
  doc.setFillColor(...lightGray);
  doc.rect(pageWidth - 100, currentY - 5, 80, 35, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Invoice #:', pageWidth - 95, currentY + 5);
  doc.text('Invoice Date:', pageWidth - 95, currentY + 13);
  doc.text('Due Date:', pageWidth - 95, currentY + 21);
  
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoiceNumber, pageWidth - 60, currentY + 5);
  doc.text(data.invoiceDate, pageWidth - 60, currentY + 13);
  doc.text(data.invoiceDate, pageWidth - 60, currentY + 21);
  
  currentY += 50;
  
  // ===== BILL TO SECTION =====
  doc.setFillColor(...lightGray);
  doc.rect(margin, currentY, contentWidth, 35, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('BILL TO:', margin + 10, currentY + 12);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.customerName, margin + 10, currentY + 22);
  
  doc.setFont('helvetica', 'normal');
  if (data.customerAddress) {
    doc.text(data.customerAddress, margin + 10, currentY + 30);
  }
  
  // Customer contact info (right side of bill to section)
  doc.text(`Email: ${data.customerEmail}`, pageWidth - 120, currentY + 22);
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, pageWidth - 120, currentY + 30);
  }
  
  currentY += 50;
  
  // ===== SERVICE DETAILS TABLE =====
  // Table header
  doc.setFillColor(...primaryBlue);
  doc.rect(margin, currentY, contentWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE DESCRIPTION', margin + 5, currentY + 10);
  doc.text('DATE & TIME', margin + 85, currentY + 10);
  doc.text('DURATION', margin + 125, currentY + 10);
  doc.text('AMOUNT', margin + 155, currentY + 10);
  
  currentY += 15;
  
  // Table content
  const rowHeight = 25;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(margin, currentY, contentWidth, rowHeight);
  
  // Vertical lines
  doc.line(margin + 80, currentY, margin + 80, currentY + rowHeight);
  doc.line(margin + 120, currentY, margin + 120, currentY + rowHeight);
  doc.line(margin + 150, currentY, margin + 150, currentY + rowHeight);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Service name
  const serviceNameLines = doc.splitTextToSize(data.serviceName, 70);
  doc.text(serviceNameLines, margin + 5, currentY + 8);
  
  // Service description
  if (data.serviceDescription) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(data.serviceDescription, 70);
    doc.text(descLines, margin + 5, currentY + 15);
  }
  
  // Date and time
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(data.bookingDate, margin + 85, currentY + 8);
  doc.text(`${data.startTime} - ${data.endTime}`, margin + 85, currentY + 16);
  
  // Duration
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.duration}`, margin + 130, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('hours', margin + 130, currentY + 18);
  
  // Amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryBlue);
  doc.text(`$${data.totalAmount.toFixed(2)}`, margin + 155, currentY + 12);
  
  currentY += rowHeight + 20;
  
  // ===== COST BREAKDOWN SECTION =====
  const breakdownX = pageWidth - 120;
  const breakdownWidth = 100;
  
  // Background for breakdown
  doc.setFillColor(...lightGray);
  doc.rect(breakdownX, currentY, breakdownWidth, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(breakdownX, currentY, breakdownWidth, 45);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COST BREAKDOWN', breakdownX + 5, currentY + 10);
  
  // Base price
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Base Price:', breakdownX + 5, currentY + 20);
  doc.text(`$${data.basePrice.toFixed(2)}`, breakdownX + 70, currentY + 20);
  
  // Labor cost
  doc.text('Labor Cost:', breakdownX + 5, currentY + 28);
  doc.text(`$${data.laborCost.toFixed(2)}`, breakdownX + 70, currentY + 28);
  
  // Total line
  doc.setDrawColor(100, 100, 100);
  doc.line(breakdownX + 5, currentY + 32, breakdownX + 95, currentY + 32);
  
  // Total amount
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryBlue);
  doc.text('TOTAL:', breakdownX + 5, currentY + 40);
  doc.text(`$${data.totalAmount.toFixed(2)}`, breakdownX + 70, currentY + 40);
  
  currentY += 60;
  
  // ===== PAYMENT STATUS SECTION =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT STATUS:', margin, currentY);
  
  // Status badge
  let statusColor: readonly [number, number, number] = orange;
  if (data.paymentStatus === 'paid') statusColor = green;
  else if (data.paymentStatus === 'failed') statusColor = red;
  
  doc.setFillColor(...statusColor);
  doc.rect(margin + 80, currentY - 8, 40, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.paymentStatus.toUpperCase(), margin + 85, currentY - 2);
  
  currentY += 25;
  
  // ===== NOTES SECTION =====
  if (data.notes) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES:', margin, currentY);
    currentY += 10;
    
    doc.setFillColor(...lightGray);
    const notesHeight = Math.max(20, Math.ceil(data.notes.length / 80) * 8 + 10);
    doc.rect(margin, currentY, contentWidth, notesHeight, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY, contentWidth, notesHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(data.notes, contentWidth - 10);
    doc.text(splitNotes, margin + 5, currentY + 8);
    
    currentY += notesHeight + 15;
  }
  
  // ===== FOOTER SECTION =====
  const footerY = pageHeight - 40;
  
  // Footer background
  doc.setFillColor(...lightGray);
  doc.rect(0, footerY, pageWidth, 40, 'F');
  
  // Thank you message
  doc.setTextColor(...primaryBlue);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for your business!', margin, footerY + 15);
  
  // Generation info
  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, footerY + 25);
  
  // Company website/contact (right side)
  doc.text('For questions, contact us:', pageWidth - 80, footerY + 15);
  doc.text(data.companyEmail, pageWidth - 80, footerY + 23);
  doc.text(data.companyPhone, pageWidth - 80, footerY + 31);
  
  return doc.output('blob');
};

export const downloadInvoice = async (data: InvoiceData): Promise<void> => {
  try {
    const pdfBlob = generateInvoicePDF(data);
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${data.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw new Error('Failed to download invoice');
  }
};

export const previewInvoice = async (data: InvoiceData): Promise<void> => {
  try {
    const pdfBlob = generateInvoicePDF(data);
    const url = URL.createObjectURL(pdfBlob);
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error previewing invoice:', error);
    throw new Error('Failed to preview invoice');
  }
};

export const exportInvoiceAsImage = async (elementId: string, filename?: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Invoice element not found');
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `invoice-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting invoice as image:', error);
    throw new Error('Failed to export invoice as image');
  }
};
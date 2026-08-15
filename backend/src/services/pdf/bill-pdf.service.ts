import PDFDocument from 'pdfkit';
import { Bill, Party, BillTrip, Trip } from '@prisma/client';

type BillHierarchy = Bill & {
  party: Party;
  bill_trips: (BillTrip & { trip: Trip })[];
};

export class BillPdfService {
  static async generateBillPdf(
    bill: BillHierarchy,
    orientation: 'portrait' | 'landscape',
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const isLandscape = orientation === 'landscape';
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: isLandscape ? 'landscape' : 'portrait',
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawBill(doc, bill, isLandscape);

      doc.end();
    });
  }

  private static drawBill(doc: PDFKit.PDFDocument, bill: BillHierarchy, isLandscape: boolean) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;
    const isIndividual = bill.bill_type === 'INDIVIDUAL';

    let currentY = margin;

    // Helper for borders
    const drawBox = (x: number, y: number, w: number, h: number) => {
      doc.rect(x, y, w, h).stroke();
    };

    // --- 1. HEADER (Company Info) ---
    const headerHeight = 90;
    drawBox(margin, currentY, contentWidth, headerHeight);

    doc.font('Helvetica-Bold').fontSize(22).text('SHRI SANWARIYA ROAD LINES', margin, currentY + 10, {
      align: 'center',
      width: contentWidth,
    });
    
    doc.font('Helvetica').fontSize(10).text('FLEET OWNER & TRANSPORT CONTRACTOR', margin, currentY + 35, {
      align: 'center',
      width: contentWidth,
    });
    
    doc.fontSize(9).text('Plot No. 24, New Loha Mandi, Gopal Ganj Square, Dewas Naka, Indore - 452010', margin, currentY + 50, {
      align: 'center',
      width: contentWidth,
    });
    
    doc.text('Ph : 6260001228, 7089750836  Email : shrisanwariyaroadlines@gmail.com', margin, currentY + 62, {
      align: 'center',
      width: contentWidth,
    });

    doc.font('Helvetica-Bold').fontSize(10).text('PAN No. : FKRPR4579H', margin, currentY + 75, {
      align: 'center',
      width: contentWidth,
    });
    
    currentY += headerHeight;

    // --- 2. PARTY INFO & METADATA ---
    const metaHeight = 95;
    drawBox(margin, currentY, contentWidth, metaHeight);
    
    // Vertical line splitting party info and metadata
    const midX = margin + (contentWidth * 0.6);
    doc.moveTo(midX, currentY).lineTo(midX, currentY + metaHeight).stroke();

    // Left side: TO (Party)
    const partyPadX = margin + 10;
    let partyY = currentY + 10;
    doc.font('Helvetica-Bold').fontSize(10).text('PARTY NAME :', partyPadX, partyY);
    doc.font('Helvetica').text(bill.party_name_snapshot, partyPadX + 80, partyY, { width: midX - partyPadX - 85 });
    partyY += 15;
    
    doc.font('Helvetica').text(bill.billing_address_snapshot || '___________________________', partyPadX, partyY, { width: midX - partyPadX - 20 });
    const addressHeight = doc.heightOfString(bill.billing_address_snapshot || '___________________________', { width: midX - partyPadX - 20 });
    partyY += addressHeight + 10;
    
    doc.font('Helvetica-Bold').text(`Phone : `, partyPadX, partyY);
    doc.font('Helvetica').text('__________________', partyPadX + 50, partyY);
    
    partyY += 15;
    doc.font('Helvetica-Bold').text(`GST No. : `, partyPadX, partyY);
    doc.font('Helvetica').text(bill.gst_number_snapshot || '__________________', partyPadX + 55, partyY);
    
    // Right side: Bill Info
    const metaPadX = midX + 10;
    let metaY = currentY + 10;
    
    doc.font('Helvetica-Bold').text('Bill No', metaPadX, metaY, { width: 50 });
    doc.font('Helvetica').text(`: ${bill.bill_number}`, metaPadX + 50, metaY);
    metaY += 20;

    doc.font('Helvetica-Bold').text('Date', metaPadX, metaY, { width: 50 });
    doc.font('Helvetica').text(`: ${bill.bill_date.toLocaleDateString('en-GB')}`, metaPadX + 50, metaY);
    metaY += 20;

    doc.font('Helvetica-Bold').text('Branch', metaPadX, metaY, { width: 50 });
    doc.font('Helvetica').text(`: INDORE`, metaPadX + 50, metaY);
    metaY += 20;

    doc.font('Helvetica-Bold').text('State', metaPadX, metaY, { width: 50 });
    doc.font('Helvetica').text(`: MADHYA PRADESH`, metaPadX + 50, metaY);

    currentY += metaHeight + 10;

    // --- 3. TABLE DEFINITION ---
    // Columns depend on bill type and available width
    let columns = [];
    if (isIndividual) {
      columns = [
        { header: 'Sr. No.', key: 'sno', width: 40 },
        { header: 'Date', key: 'date', width: 60 },
        { header: 'Vehicle', key: 'vehicle', width: 80 },
        { header: 'Lr. No.', key: 'lr', width: 60 },
        { header: 'Invoice No.', key: 'invoice', width: 70 },
        { header: 'From', key: 'from', width: 0 }, // dynamic
        { header: 'To', key: 'to', width: 0 }, // dynamic
        { header: 'Freight', key: 'freight', width: 70 },
        { header: 'Detention', key: 'detention', width: 60 },
        { header: 'Net Freight', key: 'net', width: 80 },
      ];
    } else {
      columns = [
        { header: 'Sr. No.', key: 'sno', width: 40 },
        { header: 'Date', key: 'date', width: 60 },
        { header: 'Vehicle', key: 'vehicle', width: 80 },
        { header: 'Lr. No.', key: 'lr', width: 60 },
        { header: 'From', key: 'from', width: 0 }, // dynamic
        { header: 'To', key: 'to', width: 0 }, // dynamic
        { header: 'Unloading Amt.', key: 'unloading', width: 80 },
        { header: 'Freight', key: 'freight', width: 70 },
        { header: 'Detention', key: 'detention', width: 60 },
        { header: 'Net Freight', key: 'net', width: 80 },
      ];
    }

    // Distribute remaining width to 'From' and 'To'
    const fixedWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const dynamicWidth = (contentWidth - fixedWidth) / 2;
    columns.forEach(col => { if (col.width === 0) col.width = dynamicWidth; });

    // Helper to draw headers
    const drawHeaders = (startY: number) => {
      doc.font('Helvetica-Bold').fontSize(9);
      let cx = margin;
      doc.rect(margin, startY, contentWidth, 20).stroke(); // Header border
      
      columns.forEach((col) => {
        doc.text(col.header, cx, startY + 5, { width: col.width, align: 'center' });
        doc.moveTo(cx, startY).lineTo(cx, startY + 20).stroke(); // Vertical line
        cx += col.width;
      });
      return startY + 20;
    };

    currentY = drawHeaders(currentY);

    // --- 4. TABLE ROWS ---
    doc.font('Helvetica').fontSize(9);
    
    let totalFreight = 0;
    let totalDetention = 0;
    let totalNet = 0;
    const totalUnloading = 0;

    bill.bill_trips.forEach((bt, index) => {
      const t = bt.trip;
      
      const freight = Number(t.freight_rate) || 0;
      const detention = Number(t.detention) || 0;
      const net = freight + detention; // Assuming unloading is 0 for DB trips as it doesn't exist
      
      totalFreight += freight;
      totalDetention += detention;
      totalNet += net;

      const formatCurr = (val: number) => val ? `Rs. ${val.toLocaleString('en-IN')}` : '';

      let rowData: string[] = [];
      if (isIndividual) {
        rowData = [
          (index + 1).toString(),
          t.loading_date.toLocaleDateString('en-GB'),
          t.vehicle_number,
          t.lr_number || '-',
          '', // Invoice No (not in DB)
          t.from_city,
          t.to_city,
          formatCurr(freight),
          formatCurr(detention),
          formatCurr(net),
        ];
      } else {
        rowData = [
          (index + 1).toString(),
          t.loading_date.toLocaleDateString('en-GB'),
          t.vehicle_number,
          t.lr_number || '-',
          t.from_city,
          t.to_city,
          '', // Unloading Amt
          formatCurr(freight),
          formatCurr(detention),
          formatCurr(net),
        ];
      }

      // Check for page break
      let maxRowHeight = 15;
      columns.forEach((col, i) => {
        const h = doc.heightOfString(rowData[i], { width: col.width - 4 });
        if (h > maxRowHeight) maxRowHeight = h;
      });

      if (currentY + maxRowHeight > pageHeight - margin - 150) {
        // Draw bottom border for the current page table before breaking
        doc.moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke();
        
        doc.addPage({ margin: 30, size: 'A4', layout: isLandscape ? 'landscape' : 'portrait' });
        currentY = margin;
        currentY = drawHeaders(currentY);
        doc.font('Helvetica').fontSize(9);
      }

      let cx = margin;
      columns.forEach((col, i) => {
        const align = ['freight', 'detention', 'net', 'unloading'].includes(col.key) ? 'right' : 'center';
        // Add vertical line for this cell
        doc.moveTo(cx, currentY).lineTo(cx, currentY + maxRowHeight + 10).stroke();
        doc.text(rowData[i], cx + 2, currentY + 5, { 
          width: col.width - 4, 
          align: align as 'left' | 'center' | 'right' 
        });
        cx += col.width;
      });
      // Outer right border for the row
      doc.moveTo(cx, currentY).lineTo(cx, currentY + maxRowHeight + 10).stroke();
      
      currentY += maxRowHeight + 10;
      
      // Horizontal line between rows
      doc.moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke();
    });

    // --- 5. TOTALS ROW ---
    const formatCurr = (val: number) => val ? `Rs. ${val.toLocaleString('en-IN')}` : '';
    doc.font('Helvetica-Bold').fontSize(9);
    
    let cx = margin;
    let labelWidth = 0;
    
    // Span "TOTAL :" across the first several columns
    const totalCols = columns.length - 3; // freight, detention, net
    for(let i = 0; i < totalCols; i++) {
      labelWidth += columns[i].width;
    }
    
    // Draw vertical lines for the total row
    doc.moveTo(margin, currentY).lineTo(margin, currentY + 25).stroke(); // left outer
    doc.text('TOTAL :', margin, currentY + 7, { width: labelWidth - 10, align: 'right' });
    
    cx = margin + labelWidth;
    
    if (!isIndividual) {
       // Unloading Amt col
       doc.moveTo(cx, currentY).lineTo(cx, currentY + 25).stroke();
       doc.text(formatCurr(totalUnloading), cx + 2, currentY + 7, { width: columns[totalCols].width - 4, align: 'right' });
       cx += columns[totalCols].width;
    }

    // Freight col
    doc.moveTo(cx, currentY).lineTo(cx, currentY + 25).stroke();
    doc.text(formatCurr(totalFreight), cx + 2, currentY + 7, { width: columns[columns.length - 3].width - 4, align: 'right' });
    cx += columns[columns.length - 3].width;
    
    // Detention col
    doc.moveTo(cx, currentY).lineTo(cx, currentY + 25).stroke();
    doc.text(formatCurr(totalDetention), cx + 2, currentY + 7, { width: columns[columns.length - 2].width - 4, align: 'right' });
    cx += columns[columns.length - 2].width;
    
    // Net Freight col
    doc.moveTo(cx, currentY).lineTo(cx, currentY + 25).stroke();
    doc.text(formatCurr(totalNet), cx + 2, currentY + 7, { width: columns[columns.length - 1].width - 4, align: 'right' });
    
    // right outer
    doc.moveTo(margin + contentWidth, currentY).lineTo(margin + contentWidth, currentY + 25).stroke(); 
    
    currentY += 25;
    doc.moveTo(margin, currentY).lineTo(margin + contentWidth, currentY).stroke(); // bottom total border

    currentY += 15;

    // --- 6. BANK DETAILS & FOOTER ---
    if (currentY > pageHeight - margin - 80) {
      doc.addPage({ margin: 30, size: 'A4', layout: isLandscape ? 'landscape' : 'portrait' });
      currentY = margin;
    }

    if (isIndividual) {
      // Side-by-side box for Bank Details and Total Pay
      const footerHeight = 80;
      drawBox(margin, currentY, contentWidth, footerHeight);
      
      const midXFooter = margin + (contentWidth * 0.6);
      doc.moveTo(midXFooter, currentY).lineTo(midXFooter, currentY + footerHeight).stroke();
      
      // Left: Bank Details
      const bankX = margin + 10;
      let bankY = currentY + 10;
      doc.font('Helvetica-Bold').fontSize(10).text('BANK DETAILS', bankX, bankY);
      bankY += 15;
      doc.font('Helvetica').fontSize(9);
      doc.text('BANK : HDFC BANK', bankX, bankY);
      doc.text('A/C No : 502000XXXXXXXXX', bankX, bankY + 12);
      doc.text('IFSC : HDFC0009438', bankX, bankY + 24);
      doc.text('Branch : SNEHLATAGANJ, DRP SQUARE, INDORE', bankX, bankY + 36);

      // Right: Total Amount to Pay
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`Total Amount to Pay : Rs. ${totalNet.toLocaleString('en-IN')}/-`, midXFooter, currentY + (footerHeight / 2) - 6, {
        width: contentWidth - (contentWidth * 0.6),
        align: 'center'
      });
      
      currentY += footerHeight + 10;
    }

    // Signature Box
    const sigBoxHeight = 50;
    if (currentY + sigBoxHeight > pageHeight - margin) {
      doc.addPage({ margin: 30, size: 'A4', layout: isLandscape ? 'landscape' : 'portrait' });
      currentY = margin;
    }
    
    drawBox(margin, currentY, contentWidth, sigBoxHeight);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('For Shri Sanwariya Road Lines', margin, currentY + 30, { 
      align: 'right', 
      width: contentWidth - 10 
    });
  }
}

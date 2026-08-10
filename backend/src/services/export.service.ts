import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ExportService {
  static async generateExcel(
    columns: { header: string; key: string; width?: number }[],
    data: Record<string, unknown>[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = columns;
    worksheet.addRows(data);

    // Style headers
    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async generatePDF(title: string, columns: string[], data: unknown[][]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();

      const startX = 30;
      let y = doc.y;

      const colWidth = (doc.page.width - 60) / (columns.length || 1);

      // Draw headers
      doc.fontSize(10).font('Helvetica-Bold');
      columns.forEach((col, i) => {
        doc.text(col, startX + i * colWidth, y, { width: colWidth - 5, align: 'left' });
      });
      y += 15;

      doc
        .moveTo(startX, y)
        .lineTo(doc.page.width - 30, y)
        .stroke();
      y += 10;

      // Draw rows
      doc.font('Helvetica');
      data.forEach((row) => {
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
        let maxRowHeight = 15;
        row.forEach((cell, i) => {
          const text = String(cell || '');
          const height = doc.heightOfString(text, { width: colWidth - 5 });
          if (height > maxRowHeight) maxRowHeight = height;
          doc.text(text, startX + i * colWidth, y, { width: colWidth - 5, align: 'left' });
        });
        y += maxRowHeight + 5;
      });

      doc.end();
    });
  }
}

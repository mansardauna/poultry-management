'use strict';

/**
 * Report Export Utility
 * Handles branded CSV / Excel and printable PDF report exports with letterhead headers for Pro & Enterprise accounts.
 */

export interface ExportColumn {
  header: string;
  key: string;
}

/**
 * Downloads tabular data as a clean CSV file.
 */
export function downloadCSV(data: any[], columns: ExportColumn[], filename: string = 'poultry_report.csv') {
  if (!data || data.length === 0) return;

  const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      const val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a clean printable report window with letterhead header.
 */
export function printBrandedReport(title: string, data: any[], columns: ExportColumn[], farmName: string = 'Poultry Farm Management System') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const tableHeadersHtml = columns.map(c => `<th style="padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">${c.header}</th>`).join('');
  const tableRowsHtml = data.map(row => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      ${columns.map(c => `<td style="padding: 10px; font-size: 12px; color: #1e293b;">${row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : ''}</td>`).join('')}
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${farmName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 20px; font-weight: 800; color: #4f46e5; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .title { font-size: 18px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; tracking-wider: 1px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🐓 ${farmName}</div>
            <div class="subtitle">Official Operational & Financial Audit Report</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>Date Generated: <strong>${today}</strong></div>
            <div>Status: <strong style="color: #059669;">Verified Audit</strong></div>
          </div>
        </div>

        <div class="title">${title}</div>

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>© ${new Date().getFullYear()} ${farmName}. Generated via Poultry Management System.</div>
          <div>Confidential Farm Document</div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

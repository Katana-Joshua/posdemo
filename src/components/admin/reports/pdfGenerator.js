import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Utility to strip leading zeros
const stripLeadingZeros = num => {
  if (typeof num === 'number') return num;
  if (typeof num === 'string') return num.replace(/^0+(?!$)/, '');
  return num;
};

export const generatePDF = (sales, expenses) => {
  const doc = new jsPDF();
  let yPosition = 20;

  const paidSales = sales.filter(s => s.status === 'paid');
  const unpaidSales = sales.filter(s => s.status === 'unpaid');

  const totalRevenue = paidSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = paidSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const outstandingCredit = unpaidSales.reduce((sum, sale) => sum + sale.total, 0);
  const netProfit = totalProfit - totalExpenses;

  // Header
  doc.setFontSize(20);
  doc.text('Moon Land Financial Report', 14, yPosition);
  yPosition += 10;
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPosition);
  yPosition += 15;

  // Summary Table
  doc.setFontSize(14);
  doc.text('Financial Summary', 14, yPosition);
  yPosition += 8;
  doc.autoTable({
    startY: yPosition,
    theme: 'grid',
    head: [['Metric', 'Amount (UGX)']],
    body: [
      ['Total Revenue (Paid)', stripLeadingZeros(totalRevenue).toLocaleString()],
      ['Outstanding Credit', stripLeadingZeros(outstandingCredit).toLocaleString()],
      ['Total Cost of Goods (for Paid Sales)', stripLeadingZeros(totalRevenue - totalProfit).toLocaleString()],
      ['Gross Profit (on Paid Sales)', stripLeadingZeros(totalProfit).toLocaleString()],
      ['Total Expenses', `(${stripLeadingZeros(totalExpenses).toLocaleString()})`],
      ['Net Profit', stripLeadingZeros(netProfit).toLocaleString()],
    ],
    styles: {
      cellPadding: 2,
      fontSize: 10,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255
    },
    bodyStyles: {
      fillColor: [245, 245, 245]
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    }
  });
  yPosition = doc.autoTable.previous.finalY + 15;

  // Sales Details with Particulars
  if (sales.length > 0) {
    if (yPosition > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(14);
    doc.text('All Sales Details', 14, yPosition);
    yPosition += 8;
    
    const salesBody = sales.flatMap(sale => {
      // Ensure sale.items is always an array
      let items = [];
      if (Array.isArray(sale.items)) {
        items = sale.items;
      } else if (typeof sale.items === 'string') {
        try {
          items = JSON.parse(sale.items);
        } catch {
          items = [];
        }
      }
      const statusStyle = sale.status === 'unpaid' ? { textColor: [231, 76, 60] } : { textColor: [39, 174, 96] };
      const mainRow = [
        { content: new Date(sale.timestamp).toLocaleString(), styles: { fontStyle: 'bold' } },
        { content: sale.receiptNumber, styles: { fontStyle: 'bold' } },
        { content: `UGX ${stripLeadingZeros(sale.total).toLocaleString()}`, styles: { fontStyle: 'bold' } },
        { content: sale.status.toUpperCase(), styles: { fontStyle: 'bold', ...statusStyle } }
      ];
      const itemRows = items.map(item => ([
        { 
          content: `  - ${item.name} x${item.quantity}`, 
          colSpan: 2, 
          styles: { textColor: [100, 100, 100], cellPadding: {left: 4} } 
        },
        { 
          content: `UGX ${stripLeadingZeros(item.price * item.quantity).toLocaleString()}`,
          colSpan: 2,
          styles: { halign: 'right', textColor: [100, 100, 100], cellPadding: {right: 4} } 
        }
      ]));
      return [mainRow, ...itemRows];
    });

    doc.autoTable({
      startY: yPosition,
      theme: 'grid',
      head: [['Date', 'Receipt #', 'Total', 'Status']],
      body: salesBody,
    });
    yPosition = doc.autoTable.previous.finalY + 15;
  }
  
  // Expenses Details
  if (expenses.length > 0) {
    if (yPosition > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(14);
    doc.text('Expenses Details', 14, yPosition);
    yPosition += 8;
    doc.autoTable({
      startY: yPosition,
      theme: 'grid',
      head: [['Date', 'Description', 'Amount', 'Recorded By']],
      body: expenses.map(e => [
        new Date(e.created_at || e.timestamp).toLocaleString(),
        e.description,
        `UGX ${stripLeadingZeros(e.amount).toLocaleString()}`,
        e.cashier
      ]),
    });
  }

  doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
import { type ReviewCard } from '../types';
declare const jspdf: any;

const headers = [
  { key: 'source', label: 'Fuente' },
  { key: 'topic', label: 'Tema' },
  { key: 'participantRole', label: 'Rol (Docente/Estudiante)' },
  { key: 'evidenceType', label: 'Tipo de Evidencia' },
  { key: 'keyFindings', label: 'Hallazgos Clave' },
  { key: 'usageDetails', label: 'Uso Común vs Académico' },
  { key: 'summary', label: 'Resumen' },
  { key: 'comparativeNotes', label: 'Notas Comparativas' },
  { key: 'challengesOpportunities', label: 'Desafíos y Oportunidades' },
  { key: 'contextualFactors', label: 'Conocimiento (TPACK) y Ética' },
  { key: 'keyEvidence', label: 'Evidencia Directa' },
  { key: 'tags', label: 'Etiquetas' },
  { key: 'fullText', label: 'Texto Completo' },
] as const;

// Helper function to get value and handle different types
function getCardValue(card: ReviewCard, key: (typeof headers)[number]['key']): string {
    const value = card[key];
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return value || '';
}

export function exportToCSV(cards: ReviewCard[], filename: string) {
  const headerRow = headers.map(h => h.label).join(',');
  const dataRows = cards.map(card =>
    headers.map(header => `"${getCardValue(card, header.key).replace(/"/g, '""')}"`).join(',')
  );

  const csvContent = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
  const link = document.createElement('a');
  if (link.href) {
    URL.revokeObjectURL(link.href);
  }
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(cards: ReviewCard[], title: string) {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  
  doc.text(title, 14, 20);

  const tableColumn = headers.map(h => h.label);
  const tableRows: string[][] = [];

  cards.forEach(card => {
    const rowData = headers.map(header => getCardValue(card, header.key));
    tableRows.push(rowData);
  });
  
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    styles: {
        fontSize: 8,
        cellPadding: 2,
    },
    headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
    },
    alternateRowStyles: {
        fillColor: [245, 245, 245],
    },
  });

  doc.save(`${title.replace(/\s/g, '_')}.pdf`);
}
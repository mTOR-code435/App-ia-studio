
import { type ReviewCard } from '../types';

// Helper para obtener la instancia global de forma segura
const getJsPDF = () => {
  const global = window as any;
  return global.jspdf || global.jsPDF;
};

const headers = [
  { key: 'source', label: 'Fuente' },
  { key: 'topic', label: 'Tema' },
  { key: 'participantRole', label: 'Rol' },
  { key: 'evidenceType', label: 'Tipo' },
  { key: 'keyFindings', label: 'Hallazgos' },
  { key: 'usageDetails', label: 'Uso' },
  { key: 'summary', label: 'Resumen' },
  { key: 'comparativeNotes', label: 'Notas Comp.' },
  { key: 'challengesOpportunities', label: 'Desafíos' },
  { key: 'contextualFactors', label: 'TPACK/Ética' },
  { key: 'keyEvidence', label: 'Citas' },
  { key: 'tags', label: 'Etiquetas' },
  { key: 'conceptsDefinitions', label: 'Conceptos' },
  { key: 'theoreticalFoundation', label: 'Teoría' },
  { key: 'antecedents', label: 'Antecedentes' },
  { key: 'dimensionsVariables', label: 'Variables' },
  { key: 'methodologicalEvidence', label: 'Metodología' },
  { key: 'discussionReferences', label: 'Discusión' },
] as const;

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
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(cards: ReviewCard[], title: string) {
  const jspdfLib = getJsPDF();
  if (!jspdfLib) {
    alert("La librería PDF no está disponible. Intente recargar la página.");
    return;
  }
  
  const { jsPDF } = jspdfLib;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.text(title, 14, 20);

  const tableColumn = headers.map(h => h.label);
  const tableRows: string[][] = [];

  cards.forEach(card => {
    const rowData = headers.map(header => {
        let val = getCardValue(card, header.key);
        // Truncar textos muy largos para el PDF para evitar errores de renderizado masivo
        return val.length > 500 ? val.substring(0, 500) + '...' : val;
    });
    tableRows.push(rowData);
  });
  
  if ((doc as any).autoTable) {
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        styles: { fontSize: 6, cellPadding: 1 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
      });
  }

  doc.save(`${title.replace(/\s/g, '_')}.pdf`);
}

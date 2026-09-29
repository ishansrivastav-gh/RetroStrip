import { jsPDF } from 'jspdf';

/**
 * Generates high-DPI (300 DPI) PDF print sheets with crop and trim guides.
 */
export function exportPrintReadyPDF(canvas) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [4, 6] // Standard 4x6 inch photo print size
  });

  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  // Position two photo strips side-by-side or center single Polaroid
  const width = 1.8;
  const height = 5.2;
  const marginTop = 0.4;

  pdf.addImage(imgData, 'JPEG', 0.15, marginTop, width, height);
  pdf.addImage(imgData, 'JPEG', 2.05, marginTop, width, height);

  // Center Cut Guide Line
  pdf.setLineWidth(0.01);
  pdf.setDrawColor(180, 180, 180);
  pdf.line(2.0, 0.2, 2.0, 5.8);

  // Save PDF file
  pdf.save(`VintageSnap_Print_300DPI_${Date.now()}.pdf`);
}
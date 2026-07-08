/**
 * Ouvre la boîte de dialogue d'impression du navigateur avec une mise en page
 * optimisée pour le format A4 paysage. L'utilisateur peut alors choisir
 * "Enregistrer au format PDF" comme destination.
 */
export function printElementAsA4(elementId: string, documentTitle: string) {
  const source = document.getElementById(elementId);
  if (!source) {
    alert("Impossible de générer l'export : contenu introuvable.");
    return;
  }

  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres pop-up pour générer l'export PDF.");
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${documentTitle}</title>
        ${styles}
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: ui-sans-serif, system-ui, sans-serif;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-title {
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 12px;
            text-align: center;
          }
          table {
            font-size: 9px !important;
            width: 100% !important;
          }
          th, td {
            padding: 2px 4px !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-title">${documentTitle}</div>
        ${source.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 400);
}

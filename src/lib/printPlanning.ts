/**
 * Ouvre la boîte de dialogue d'impression du navigateur avec une mise en page
 * optimisée pour le format A4 paysage. L'utilisateur peut alors choisir
 * "Enregistrer au format PDF" comme destination.
 *
 * - Neutralise les conteneurs à défilement interne (overflow-auto / max-height)
 *   pour que l'intégralité du tableau soit visible dans l'export.
 * - Remplace chaque <select> par un texte statique reprenant l'option
 *   réellement sélectionnée, car la sélection d'un <select> est un état
 *   JavaScript qui ne survit pas à un clonage HTML (outerHTML/cloneNode).
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

  // Clone le contenu pour ne pas modifier l'affichage réel de la page.
  const clone = source.cloneNode(true) as HTMLElement;

  // Neutralise toute contrainte de hauteur/défilement sur le clone et ses enfants.
  const removeScrollConstraints = (el: HTMLElement) => {
    el.style.overflow = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        removeScrollConstraints(child);
      }
    });
  };
  removeScrollConstraints(clone);

  // Remplace chaque <select> du clone par un texte statique reprenant
  // l'option réellement sélectionnée dans le <select> d'origine (source),
  // car cette sélection est un état JS qui ne se sérialise pas dans le HTML.
  const originalSelects = source.querySelectorAll('select');
  const cloneSelects = clone.querySelectorAll('select');
  originalSelects.forEach((originalSelect, i) => {
    const cloneSelect = cloneSelects[i] as HTMLSelectElement | undefined;
    if (!cloneSelect) return;

    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
    const text = selectedOption && selectedOption.value ? selectedOption.text : '-';

    const replacement = document.createElement('div');
    replacement.textContent = text;
    replacement.style.width = '100%';
    replacement.style.height = '100%';
    replacement.style.display = 'flex';
    replacement.style.alignItems = 'center';
    replacement.style.justifyContent = 'center';
    replacement.style.fontWeight = '600';
    replacement.style.fontSize = '9px';
    replacement.style.color = '#334155';

    cloneSelect.parentElement?.replaceChild(replacement, cloneSelect);
  });

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
            margin: 8mm;
          }
          html, body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: ui-sans-serif, system-ui, sans-serif;
          }
          .print-title {
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 12px;
            text-align: center;
          }
          * {
            overflow: visible !important;
            max-height: none !important;
          }
          table {
            font-size: 9px !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 2px 4px !important;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-title">${documentTitle}</div>
        ${clone.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
}

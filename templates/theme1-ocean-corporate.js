/**
 * 🌊 THEME 1: OCEAN CORPORATE
 * ==========================
 * Deep blue professional theme with gradient-style headers
 * Perfect for: Enterprise documentation, corporate reports, technical specs
 */

const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType, 
  ShadingType, PageNumber, HeadingLevel, PageBreak 
} = require('docx');
const fs = require('fs');

// =============================================================================
// 🎨 THEME CONFIGURATION
// =============================================================================

const THEME = {
  name: "Ocean Corporate",
  colors: {
    primary: "0D3B66",      // Deep navy
    secondary: "1E5F8A",    // Ocean blue
    accent: "14A3C7",       // Bright teal
    text: "2C3E50",         // Dark slate
    lightBg: "E8F4F8",      // Ice blue
    mediumBg: "B8D4E3",     // Soft blue
    headerBg: "0D3B66",     // Navy for table headers
    border: "B8D4E3"        // Soft blue border
  },
  fonts: {
    heading: "Calibri Light",
    body: "Calibri",
    code: "Consolas"
  },
  sizes: {
    title: 56,
    h1: 36,
    h2: 28,
    h3: 24,
    body: 22,
    code: 18
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const title = (text) => new Paragraph({ 
  heading: HeadingLevel.TITLE,
  spacing: { after: 200 },
  children: [new TextRun({ text, bold: true, font: THEME.fonts.heading })] 
});

const subtitle = (text) => new Paragraph({ 
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
  children: [
    new TextRun({ text: "━".repeat(20) + "  ", color: THEME.colors.accent, size: 24 }),
    new TextRun({ text, size: 28, color: THEME.colors.secondary, font: THEME.fonts.heading }),
    new TextRun({ text: "  " + "━".repeat(20), color: THEME.colors.accent, size: 24 })
  ]
});

const h1 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  shading: { fill: THEME.colors.primary, type: ShadingType.CLEAR },
  children: [new TextRun({ text: "  " + text, bold: true, color: "FFFFFF", font: THEME.fonts.heading })] 
});

const h2 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: THEME.colors.accent } },
  children: [new TextRun({ text, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading })] 
});

const h3 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [
    new TextRun({ text: "▸ ", color: THEME.colors.accent, size: THEME.sizes.h3 }),
    new TextRun({ text, bold: true, color: THEME.colors.secondary, font: THEME.fonts.heading })
  ] 
});

const para = (text) => new Paragraph({ 
  spacing: { after: 120 },
  children: [new TextRun({ text, size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body })] 
});

const code = (text) => new Paragraph({
  spacing: { after: 60 },
  shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: THEME.colors.accent } },
  indent: { left: 200 },
  children: [new TextRun({ text, font: THEME.fonts.code, size: THEME.sizes.code, color: THEME.colors.text })]
});

const codeBlock = (lines) => lines.map(line => code(line));

const infoBox = (icon, title, text, type = "info") => {
  const colors = {
    info: { bg: "E3F2FD", border: THEME.colors.accent },
    warning: { bg: "FFF8E1", border: "F9A825" },
    success: { bg: "E8F5E9", border: "43A047" },
    danger: { bg: "FFEBEE", border: "E53935" }
  };
  const c = colors[type];
  return new Paragraph({
    shading: { fill: c.bg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 36, color: c.border } },
    spacing: { after: 200 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: icon + " " + title, bold: true, size: THEME.sizes.body }),
      new TextRun({ text: " " + text, size: THEME.sizes.body })
    ]
  });
};

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = () => new Paragraph({ spacing: { after: 200 }, children: [] });

// Table helpers
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const headerCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: THEME.colors.headerBg, type: ShadingType.CLEAR },
  children: [new Paragraph({ 
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: THEME.fonts.body })] 
  })]
});

const cell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: THEME.fonts.body })] })]
});

const table2Col = (h1, h2, rows, widths = [4680, 4680]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(h1, widths[0]), headerCell(h2, widths[1])] }),
    ...rows.map(([c1, c2]) => new TableRow({ children: [cell(c1, widths[0]), cell(c2, widths[1])] }))
  ]
});

// List helpers
const bullet = (text) => new Paragraph({ 
  numbering: { reference: "bullet-list", level: 0 }, 
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body })] 
});

const numbered = (text, ref = "numbered-list") => new Paragraph({ 
  numbering: { reference: ref, level: 0 }, 
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body })] 
});

// =============================================================================
// SAMPLE DOCUMENT CONTENT
// =============================================================================

const content = [
  title("OCEAN CORPORATE THEME"),
  subtitle("Professional Enterprise Documentation"),

  h1("Executive Summary"),
  para("This theme features deep navy blues and ocean-inspired accents, perfect for corporate documentation that needs to convey professionalism and trust."),
  
  infoBox("💡", "Pro Tip:", "Use this theme for technical specifications, API documentation, and enterprise reports.", "info"),
  infoBox("⚠️", "Note:", "Headers use inverted colors (white on navy) for maximum impact.", "warning"),

  h2("Color Palette"),
  table2Col("Element", "Color", [
    ["Primary (Headers)", "#0D3B66 - Deep Navy"],
    ["Secondary (Subheaders)", "#1E5F8A - Ocean Blue"],
    ["Accent (Highlights)", "#14A3C7 - Bright Teal"],
    ["Background", "#E8F4F8 - Ice Blue"]
  ]),

  h2("Code Examples"),
  h3("API Endpoint"),
  ...codeBlock([
    "GET /api/v1/reports/{reportId}",
    "Authorization: Bearer {token}",
    "Content-Type: application/json"
  ]),

  h2("Feature List"),
  bullet("Full-width navy headers with white text"),
  bullet("Teal accent borders on code blocks"),
  bullet("Soft blue backgrounds for highlighted content"),
  bullet("Professional Calibri font family"),

  pageBreak(),
  h1("Second Section"),
  para("The Ocean Corporate theme works beautifully across multiple pages, maintaining visual consistency throughout your document."),
  
  h3("Best Used For"),
  numbered("Technical documentation"),
  numbered("Enterprise specifications"),
  numbered("Corporate reports"),
  numbered("API references")
];

// =============================================================================
// DOCUMENT GENERATION
// =============================================================================

const doc = new Document({
  styles: {
    default: { document: { run: { font: THEME.fonts.body, size: THEME.sizes.body } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: THEME.sizes.title, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h1, bold: true, color: "FFFFFF", font: THEME.fonts.heading },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h2, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h3, bold: true, color: THEME.colors.secondary, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "●", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: THEME.colors.accent } },
        children: [
          new TextRun({ text: "OCEAN CORPORATE", size: 18, color: THEME.colors.primary, bold: true }),
          new TextRun({ text: "  |  ", size: 18, color: THEME.colors.border }),
          new TextRun({ text: "Documentation", size: 18, color: THEME.colors.secondary, italics: true })
        ]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "━━━  ", color: THEME.colors.accent, size: 16 }),
          new TextRun({ text: "Page ", size: 18, color: THEME.colors.text }), 
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: THEME.colors.primary, bold: true }), 
          new TextRun({ text: " of ", size: 18, color: THEME.colors.text }), 
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: THEME.colors.primary, bold: true }),
          new TextRun({ text: "  ━━━", color: THEME.colors.accent, size: 16 })
        ]
      })] })
    },
    children: content
  }]
});

const outputPath = process.argv[2] || "theme1-ocean-corporate.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Ocean Corporate theme created: ${outputPath}`);
});

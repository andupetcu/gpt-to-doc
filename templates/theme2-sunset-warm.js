/**
 * 🌅 THEME 2: SUNSET WARM
 * =======================
 * Warm coral and orange tones with elegant typography
 * Perfect for: Marketing docs, creative briefs, presentations
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
  name: "Sunset Warm",
  colors: {
    primary: "D84315",      // Deep orange
    secondary: "FF7043",    // Coral
    accent: "FFB74D",       // Amber
    text: "4E342E",         // Brown
    lightBg: "FFF3E0",      // Cream
    mediumBg: "FFCCBC",     // Peach
    headerBg: "BF360C",     // Dark orange
    border: "FFAB91"        // Light coral
  },
  fonts: {
    heading: "Georgia",
    body: "Segoe UI",
    code: "Cascadia Code"
  },
  sizes: { title: 52, h1: 34, h2: 26, h3: 22, body: 22, code: 18 }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const title = (text) => new Paragraph({ 
  heading: HeadingLevel.TITLE,
  spacing: { after: 100 },
  children: [new TextRun({ text, bold: true, font: THEME.fonts.heading, italics: true })] 
});

const subtitle = (text) => new Paragraph({ 
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
  children: [
    new TextRun({ text: "◆ ", color: THEME.colors.accent, size: 28 }),
    new TextRun({ text, size: 26, color: THEME.colors.secondary, font: THEME.fonts.body }),
    new TextRun({ text: " ◆", color: THEME.colors.accent, size: 28 })
  ]
});

const h1 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  border: { 
    top: { style: BorderStyle.SINGLE, size: 6, color: THEME.colors.accent },
    bottom: { style: BorderStyle.SINGLE, size: 18, color: THEME.colors.primary }
  },
  children: [new TextRun({ text, bold: true, font: THEME.fonts.heading })] 
});

const h2 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  children: [
    new TextRun({ text: "◈ ", color: THEME.colors.secondary, size: THEME.sizes.h2 }),
    new TextRun({ text, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading })
  ] 
});

const h3 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [
    new TextRun({ text: "› ", color: THEME.colors.accent, size: THEME.sizes.h3, bold: true }),
    new TextRun({ text, bold: true, color: THEME.colors.text, font: THEME.fonts.body })
  ] 
});

const para = (text) => new Paragraph({ 
  spacing: { after: 140, line: 300 },
  children: [new TextRun({ text, size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body })] 
});

const code = (text) => new Paragraph({
  spacing: { after: 60 },
  shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
  border: { 
    top: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border },
    left: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border },
    right: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border }
  },
  children: [new TextRun({ text: "  " + text, font: THEME.fonts.code, size: THEME.sizes.code, color: THEME.colors.text })]
});

const codeBlock = (lines) => lines.map(line => code(line));

const callout = (text, type = "default") => {
  const styles = {
    default: { bg: THEME.colors.lightBg, icon: "✦", color: THEME.colors.primary },
    tip: { bg: "E8F5E9", icon: "💡", color: "2E7D32" },
    warning: { bg: "FFF8E1", icon: "⚡", color: "F57F17" },
    note: { bg: "E3F2FD", icon: "📝", color: "1565C0" }
  };
  const s = styles[type];
  return new Paragraph({
    shading: { fill: s.bg, type: ShadingType.CLEAR },
    spacing: { after: 200, before: 100 },
    indent: { left: 400, right: 400 },
    children: [
      new TextRun({ text: s.icon + "  ", size: 24 }),
      new TextRun({ text, size: THEME.sizes.body, color: s.color, italics: true, font: THEME.fonts.body })
    ]
  });
};

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// Table helpers with warm styling
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

const cell = (text, width, highlight = false) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: highlight ? { fill: THEME.colors.lightBg, type: ShadingType.CLEAR } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: THEME.fonts.body })] })]
});

const table2Col = (h1, h2, rows, widths = [4680, 4680]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(h1, widths[0]), headerCell(h2, widths[1])] }),
    ...rows.map(([c1, c2], i) => new TableRow({ 
      children: [cell(c1, widths[0], i % 2 === 0), cell(c2, widths[1], i % 2 === 0)] 
    }))
  ]
});

const bullet = (text) => new Paragraph({ 
  numbering: { reference: "bullet-list", level: 0 }, 
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body })] 
});

// =============================================================================
// SAMPLE DOCUMENT CONTENT
// =============================================================================

const content = [
  title("Sunset Warm Theme"),
  subtitle("Elegant & Inviting Design"),

  h1("Welcome"),
  para("The Sunset Warm theme brings together rich coral tones and elegant Georgia typography to create documents that feel both professional and approachable."),
  
  callout("This theme is ideal for marketing materials, creative briefs, and client-facing documentation.", "tip"),

  h2("Design Philosophy"),
  para("Warm colors evoke feelings of energy, enthusiasm, and creativity. This palette works exceptionally well for brands that want to appear friendly and innovative."),

  h3("Key Characteristics"),
  bullet("Elegant serif headings with Georgia font"),
  bullet("Warm coral and orange accent colors"),
  bullet("Alternating row highlights in tables"),
  bullet("Decorative diamond separators"),

  h2("Color Palette"),
  table2Col("Element", "Color Code", [
    ["Primary", "#D84315 - Deep Orange"],
    ["Secondary", "#FF7043 - Coral"],
    ["Accent", "#FFB74D - Amber"],
    ["Text", "#4E342E - Warm Brown"],
    ["Background", "#FFF3E0 - Cream"]
  ]),

  h2("Code Styling"),
  ...codeBlock([
    "const theme = {",
    "  name: 'Sunset Warm',",
    "  mood: 'creative and inviting',",
    "  bestFor: ['marketing', 'creative', 'presentations']",
    "};"
  ]),

  callout("Notice the subtle border around code blocks - it adds definition without being harsh.", "note"),

  pageBreak(),
  h1("Use Cases"),
  
  h2("Marketing Documents"),
  para("The warm tones create an inviting atmosphere perfect for marketing collateral, brand guidelines, and promotional materials."),

  h2("Creative Briefs"),
  para("Georgia's elegant serifs combined with modern Segoe UI body text strikes the perfect balance between creativity and readability."),

  callout("Remember: warm colors increase engagement and are associated with action and enthusiasm!", "warning")
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
        run: { size: THEME.sizes.h1, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h2, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h3, bold: true, color: THEME.colors.text, font: THEME.fonts.body },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "◆", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "◆ ◇ ◆ ", color: THEME.colors.accent, size: 20 }),
          new TextRun({ text: "SUNSET WARM", size: 20, color: THEME.colors.primary, bold: true, font: THEME.fonts.heading }),
          new TextRun({ text: " ◆ ◇ ◆", color: THEME.colors.accent, size: 20 })
        ]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: THEME.colors.accent } },
        spacing: { before: 100 },
        children: [
          new TextRun({ text: "— ", color: THEME.colors.secondary, size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 20, color: THEME.colors.primary, bold: true }), 
          new TextRun({ text: " —", color: THEME.colors.secondary, size: 18 })
        ]
      })] })
    },
    children: content
  }]
});

const outputPath = process.argv[2] || "theme2-sunset-warm.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Sunset Warm theme created: ${outputPath}`);
});

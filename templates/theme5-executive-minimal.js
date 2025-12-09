/**
 * 💎 THEME 5: EXECUTIVE MINIMAL
 * =============================
 * Ultra-clean luxury minimalist design
 * Perfect for: Executive summaries, board reports, luxury brands
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
  name: "Executive Minimal",
  colors: {
    primary: "1A1A1A",      // Near black
    secondary: "4A4A4A",    // Dark gray
    accent: "C9A962",       // Gold
    accent2: "8B7355",      // Bronze
    text: "333333",         // Charcoal
    lightBg: "FAFAFA",      // Off-white
    mediumBg: "F0F0F0",     // Light gray
    headerBg: "1A1A1A",     // Black
    border: "E0E0E0"        // Silver
  },
  fonts: {
    heading: "Times New Roman",
    body: "Garamond",
    code: "Courier New",
    accent: "Arial"
  },
  sizes: { title: 48, h1: 30, h2: 24, h3: 20, body: 23, code: 18, small: 18 }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const title = (text) => new Paragraph({ 
  heading: HeadingLevel.TITLE,
  spacing: { after: 100, before: 200 },
  children: [new TextRun({ text: text.toUpperCase(), font: THEME.fonts.heading, letterSpacing: 80 })] 
});

const subtitle = (text) => new Paragraph({ 
  alignment: AlignmentType.CENTER,
  spacing: { after: 500 },
  children: [
    new TextRun({ text: "—  ", color: THEME.colors.accent, size: 24 }),
    new TextRun({ text, size: 22, color: THEME.colors.secondary, font: THEME.fonts.accent, italics: true }),
    new TextRun({ text: "  —", color: THEME.colors.accent, size: 24 })
  ]
});

const h1 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 500, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: THEME.colors.primary } },
  children: [new TextRun({ text: text.toUpperCase(), font: THEME.fonts.heading, letterSpacing: 40 })] 
});

const h2 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 350, after: 150 },
  children: [new TextRun({ text, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading })] 
});

const h3 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 250, after: 100 },
  children: [new TextRun({ text, italics: true, color: THEME.colors.secondary, font: THEME.fonts.body })] 
});

const para = (text) => new Paragraph({ 
  spacing: { after: 180, line: 340 },
  children: [new TextRun({ text, size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body })] 
});

const leadPara = (text) => new Paragraph({ 
  spacing: { after: 250, line: 360 },
  children: [new TextRun({ text, size: 26, color: THEME.colors.secondary, font: THEME.fonts.body, italics: true })] 
});

const divider = () => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 300, after: 300 },
  children: [new TextRun({ text: "◆        ◆        ◆", color: THEME.colors.accent, size: 16 })]
});

const goldBar = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 200 },
  shading: { fill: THEME.colors.primary, type: ShadingType.CLEAR },
  children: [new TextRun({ text: "  " + text.toUpperCase() + "  ", color: THEME.colors.accent, size: 18, bold: true, font: THEME.fonts.accent, letterSpacing: 60 })]
});

const code = (text) => new Paragraph({
  spacing: { after: 80 },
  border: { left: { style: BorderStyle.SINGLE, size: 6, color: THEME.colors.accent } },
  indent: { left: 300 },
  children: [new TextRun({ text, font: THEME.fonts.code, size: THEME.sizes.code, color: THEME.colors.secondary })]
});

const codeBlock = (lines) => lines.map(line => code(line));

const keyValue = (key, value) => new Paragraph({
  spacing: { after: 100 },
  children: [
    new TextRun({ text: key + ":  ", bold: true, size: THEME.sizes.body, color: THEME.colors.primary, font: THEME.fonts.accent }),
    new TextRun({ text: value, size: THEME.sizes.body, color: THEME.colors.secondary, font: THEME.fonts.body })
  ]
});

const highlightBox = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 200 },
  shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
  border: { 
    top: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.accent },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.accent }
  },
  children: [new TextRun({ text: "  " + text + "  ", size: THEME.sizes.body, color: THEME.colors.primary, font: THEME.fonts.body, italics: true })]
});

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = () => new Paragraph({ spacing: { after: 200 }, children: [] });

// Minimal table styling
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const headerCell = (text, width) => new TableCell({
  borders: { top: noBorder, bottom: { style: BorderStyle.SINGLE, size: 6, color: THEME.colors.primary }, left: noBorder, right: noBorder },
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({ 
    spacing: { after: 100 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 17, color: THEME.colors.primary, font: THEME.fonts.accent, letterSpacing: 30 })] 
  })]
});

const cell = (text, width, isLast = false) => new TableCell({
  borders: { top: noBorder, bottom: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border }, left: noBorder, right: noBorder },
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({ 
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 19, font: THEME.fonts.body, color: THEME.colors.text })] 
  })]
});

const table2Col = (h1, h2, rows, widths = [4680, 4680]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(h1, widths[0]), headerCell(h2, widths[1])] }),
    ...rows.map(([c1, c2], i) => new TableRow({ 
      children: [cell(c1, widths[0], i === rows.length - 1), cell(c2, widths[1], i === rows.length - 1)] 
    }))
  ]
});

const bullet = (text) => new Paragraph({ 
  numbering: { reference: "bullet-list", level: 0 }, 
  spacing: { after: 100 },
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body, color: THEME.colors.text })] 
});

const numbered = (text, ref = "numbered-list") => new Paragraph({ 
  numbering: { reference: ref, level: 0 }, 
  spacing: { after: 100 },
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body, color: THEME.colors.text })] 
});

// =============================================================================
// SAMPLE DOCUMENT CONTENT
// =============================================================================

const content = [
  title("Executive Minimal"),
  subtitle("Refined Elegance in Documentation"),

  leadPara("A theme designed for those who understand that true luxury lies in restraint. Clean lines, generous whitespace, and understated gold accents create documents of timeless sophistication."),

  divider(),

  h1("Design Philosophy"),
  para("The Executive Minimal theme embodies the principle that less is more. Every element serves a purpose. Typography takes center stage, with classic Times New Roman headlines and elegant Garamond body text creating a reading experience befitting the most discerning audiences."),

  highlightBox("Sophistication is not about what you add, but what you choose to leave out."),

  h2("Key Characteristics"),
  bullet("Uppercase headings with generous letter-spacing"),
  bullet("Classic serif typography throughout"),
  bullet("Subtle gold accents for understated luxury"),
  bullet("Minimalist table borders—lines only where needed"),
  bullet("Generous whitespace for elegant breathing room"),

  h2("Color Philosophy"),
  table2Col("Element", "Purpose", [
    ["Near Black #1A1A1A", "Authority and permanence"],
    ["Gold Accent #C9A962", "Subtle luxury indicator"],
    ["Charcoal #333333", "Comfortable reading"],
    ["Off-White #FAFAFA", "Clean, modern backgrounds"]
  ]),

  divider(),

  pageBreak(),

  h1("Applications"),
  
  goldBar("Executive Communications"),
  para("Board reports, investor updates, and C-suite communications demand a design language that conveys authority and trustworthiness. This theme delivers."),

  goldBar("Luxury Brand Documentation"),
  para("For brands where perception matters, document design must align with brand positioning. Executive Minimal speaks the visual language of premium quality."),

  goldBar("Professional Services"),
  para("Law firms, consulting practices, and financial advisors benefit from documentation that reinforces their expertise and attention to detail."),

  h2("Implementation Notes"),
  keyValue("Primary Font", "Times New Roman (headings)"),
  keyValue("Body Font", "Garamond"),
  keyValue("Accent Font", "Arial (labels and small text)"),
  keyValue("Recommended Paper", "Premium 100gsm+ white stock"),

  divider(),

  h2("The Details Matter"),
  para("Notice the subtle details: the thin gold border under headings, the generous line height for readability, the restrained use of bold text. These small choices compound into an overall impression of refined professionalism."),

  highlightBox("Excellence is in the details. Give attention to the details and excellence will come.")
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
        run: { size: THEME.sizes.h3, italics: true, color: THEME.colors.secondary, font: THEME.fonts.body },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "—", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "EXECUTIVE MINIMAL", size: 16, color: THEME.colors.secondary, font: THEME.fonts.accent, letterSpacing: 40 })
        ]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: THEME.colors.border } },
        spacing: { before: 200 },
        children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: THEME.colors.primary, font: THEME.fonts.body })
        ]
      })] })
    },
    children: content
  }]
});

const outputPath = process.argv[2] || "theme5-executive-minimal.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Executive Minimal theme created: ${outputPath}`);
});

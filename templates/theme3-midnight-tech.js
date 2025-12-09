/**
 * 🌙 THEME 3: MIDNIGHT TECH
 * =========================
 * Dark mode inspired tech theme with neon accents
 * Perfect for: Developer docs, tech startups, API documentation
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
  name: "Midnight Tech",
  colors: {
    primary: "6C5CE7",      // Electric purple
    secondary: "00CEC9",    // Cyan
    accent: "FD79A8",       // Pink
    accent2: "FDCB6E",      // Yellow
    text: "2D3436",         // Dark gray
    darkBg: "2D3436",       // Charcoal
    lightBg: "DFE6E9",      // Light gray
    codeBg: "636E72",       // Medium gray
    border: "B2BEC3"        // Silver
  },
  fonts: {
    heading: "Segoe UI",
    body: "Segoe UI",
    code: "Fira Code"
  },
  sizes: { title: 52, h1: 32, h2: 26, h3: 22, body: 21, code: 17 }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const title = (text) => new Paragraph({ 
  heading: HeadingLevel.TITLE,
  shading: { fill: THEME.colors.darkBg, type: ShadingType.CLEAR },
  spacing: { after: 0 },
  children: [
    new TextRun({ text: "{ ", color: THEME.colors.secondary, size: THEME.sizes.title, font: THEME.fonts.code }),
    new TextRun({ text, bold: true, color: "FFFFFF", font: THEME.fonts.heading }),
    new TextRun({ text: " }", color: THEME.colors.secondary, size: THEME.sizes.title, font: THEME.fonts.code })
  ] 
});

const subtitle = (text) => new Paragraph({ 
  alignment: AlignmentType.CENTER,
  shading: { fill: THEME.colors.darkBg, type: ShadingType.CLEAR },
  spacing: { after: 300 },
  children: [
    new TextRun({ text: "// ", color: THEME.colors.accent, size: 24, font: THEME.fonts.code }),
    new TextRun({ text, size: 24, color: THEME.colors.lightBg, font: THEME.fonts.code, italics: true })
  ]
});

const h1 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  children: [
    new TextRun({ text: "## ", color: THEME.colors.primary, size: THEME.sizes.h1, font: THEME.fonts.code }),
    new TextRun({ text, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading })
  ] 
});

const h2 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  children: [
    new TextRun({ text: "→ ", color: THEME.colors.secondary, size: THEME.sizes.h2 }),
    new TextRun({ text, bold: true, color: THEME.colors.text, font: THEME.fonts.heading })
  ] 
});

const h3 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [
    new TextRun({ text: "› ", color: THEME.colors.accent, size: THEME.sizes.h3 }),
    new TextRun({ text, bold: true, color: THEME.colors.text, font: THEME.fonts.body })
  ] 
});

const para = (text) => new Paragraph({ 
  spacing: { after: 140 },
  children: [new TextRun({ text, size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body })] 
});

// Terminal-style code block
const code = (text, isFirst = false, isLast = false) => new Paragraph({
  spacing: { after: 0, before: isFirst ? 100 : 0 },
  shading: { fill: THEME.colors.darkBg, type: ShadingType.CLEAR },
  children: [
    new TextRun({ text: isFirst ? "┌─ " : (isLast ? "└─ " : "│  "), color: THEME.colors.border, font: THEME.fonts.code, size: THEME.sizes.code }),
    new TextRun({ text, font: THEME.fonts.code, size: THEME.sizes.code, color: THEME.colors.lightBg })
  ]
});

const codeBlock = (lines) => lines.map((line, i) => code(line, i === 0, i === lines.length - 1));

// Syntax highlighted code (simulated)
const syntaxCode = (parts) => new Paragraph({
  spacing: { after: 60 },
  shading: { fill: THEME.colors.darkBg, type: ShadingType.CLEAR },
  children: [
    new TextRun({ text: "   ", font: THEME.fonts.code, size: THEME.sizes.code }),
    ...parts.map(p => new TextRun({ 
      text: p.text, 
      font: THEME.fonts.code, 
      size: THEME.sizes.code, 
      color: p.color || THEME.colors.lightBg 
    }))
  ]
});

const badge = (text, color = THEME.colors.primary) => new Paragraph({
  spacing: { after: 100 },
  children: [
    new TextRun({ text: " " + text + " ", bold: true, size: 18, color: "FFFFFF", shading: { fill: color, type: ShadingType.CLEAR } })
  ]
});

const statusBox = (label, value, status = "info") => {
  const colors = {
    info: THEME.colors.secondary,
    success: "00B894",
    warning: THEME.colors.accent2,
    error: "E17055"
  };
  return new Paragraph({
    spacing: { after: 100 },
    shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: colors[status] } },
    indent: { left: 200 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: THEME.sizes.body, color: THEME.colors.text }),
      new TextRun({ text: value, size: THEME.sizes.body, color: colors[status], font: THEME.fonts.code })
    ]
  });
};

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// Table with dark headers
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const headerCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: THEME.colors.darkBg, type: ShadingType.CLEAR },
  children: [new Paragraph({ 
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 19, color: THEME.colors.secondary, font: THEME.fonts.code })] 
  })]
});

const cell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({ children: [new TextRun({ text, size: 19, font: THEME.fonts.body })] })]
});

const codeCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
  children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: THEME.fonts.code, color: THEME.colors.primary })] })]
});

const table3Col = (h1, h2, h3, rows, widths = [2000, 3500, 4000]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(h1, widths[0]), headerCell(h2, widths[1]), headerCell(h3, widths[2])] }),
    ...rows.map(([c1, c2, c3]) => new TableRow({ 
      children: [codeCell(c1, widths[0]), cell(c2, widths[1]), cell(c3, widths[2])] 
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
  title("MIDNIGHT TECH"),
  subtitle("Developer-First Documentation"),

  h1("Overview"),
  para("The Midnight Tech theme brings the aesthetic of modern code editors to your documentation. Dark headers, syntax-inspired formatting, and neon accents create a distinctive developer-friendly look."),
  
  statusBox("Status", "Production Ready", "success"),
  statusBox("Version", "2.0.0", "info"),
  statusBox("License", "MIT", "info"),

  h2("API Reference"),
  table3Col("Method", "Endpoint", "Description", [
    ["GET", "/api/users", "Retrieve all users"],
    ["POST", "/api/users", "Create a new user"],
    ["PUT", "/api/users/:id", "Update existing user"],
    ["DELETE", "/api/users/:id", "Remove a user"]
  ]),

  h2("Code Example"),
  h3("Authentication Request"),
  ...codeBlock([
    "const response = await fetch('/api/auth', {",
    "  method: 'POST',",
    "  headers: { 'Content-Type': 'application/json' },",
    "  body: JSON.stringify({ apiKey: process.env.API_KEY })",
    "});"
  ]),

  h2("Features"),
  bullet("Terminal-style code blocks with box drawing"),
  bullet("Syntax highlighting simulation"),
  bullet("Status indicators with color coding"),
  bullet("Dark mode inspired table headers"),
  bullet("Neon accent colors (purple, cyan, pink)"),

  pageBreak(),
  h1("Configuration"),
  
  h2("Environment Variables"),
  ...codeBlock([
    "API_KEY=your-secret-key",
    "DATABASE_URL=postgres://localhost:5432/db",
    "NODE_ENV=production",
    "LOG_LEVEL=info"
  ]),

  statusBox("Warning", "Never commit API keys to version control", "warning"),

  h2("Response Codes"),
  h3("Success Responses"),
  bullet("200 OK — Request succeeded"),
  bullet("201 Created — Resource created"),
  bullet("204 No Content — Success with no body"),
  
  h3("Error Responses"),
  bullet("400 Bad Request — Invalid input"),
  bullet("401 Unauthorized — Authentication required"),
  bullet("404 Not Found — Resource doesn't exist"),
  bullet("500 Internal Error — Server-side issue")
];

// =============================================================================
// DOCUMENT GENERATION
// =============================================================================

const doc = new Document({
  styles: {
    default: { document: { run: { font: THEME.fonts.body, size: THEME.sizes.body } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: THEME.sizes.title, bold: true, color: "FFFFFF", font: THEME.fonts.heading },
        paragraph: { spacing: { before: 0, after: 0 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h1, bold: true, color: THEME.colors.primary, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h2, bold: true, color: THEME.colors.text, font: THEME.fonts.heading },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: THEME.sizes.h3, bold: true, color: THEME.colors.text, font: THEME.fonts.body },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "→", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        shading: { fill: THEME.colors.darkBg, type: ShadingType.CLEAR },
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: "  { ", color: THEME.colors.secondary, size: 18, font: THEME.fonts.code }),
          new TextRun({ text: "midnight_tech", size: 18, color: THEME.colors.lightBg, font: THEME.fonts.code }),
          new TextRun({ text: " } ", color: THEME.colors.secondary, size: 18, font: THEME.fonts.code }),
          new TextRun({ text: "// docs v2.0", color: THEME.colors.border, size: 16, font: THEME.fonts.code, italics: true })
        ]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "[ ", color: THEME.colors.border, size: 18, font: THEME.fonts.code }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: THEME.colors.primary, bold: true, font: THEME.fonts.code }), 
          new TextRun({ text: " / ", color: THEME.colors.border, size: 18, font: THEME.fonts.code }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: THEME.colors.secondary, font: THEME.fonts.code }),
          new TextRun({ text: " ]", color: THEME.colors.border, size: 18, font: THEME.fonts.code })
        ]
      })] })
    },
    children: content
  }]
});

const outputPath = process.argv[2] || "theme3-midnight-tech.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Midnight Tech theme created: ${outputPath}`);
});

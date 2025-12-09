/**
 * 🌲 THEME 4: FOREST NATURE
 * =========================
 * Earthy greens and organic design
 * Perfect for: Sustainability reports, eco brands, wellness docs
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
  name: "Forest Nature",
  colors: {
    primary: "2D5A27",      // Forest green
    secondary: "4A7C4E",    // Sage
    accent: "8BC34A",       // Lime
    accent2: "795548",      // Brown
    text: "33691E",         // Dark green
    lightBg: "F1F8E9",      // Mint cream
    mediumBg: "DCEDC8",     // Light green
    headerBg: "1B5E20",     // Deep forest
    border: "A5D6A7"        // Soft green
  },
  fonts: {
    heading: "Cambria",
    body: "Palatino Linotype",
    code: "Courier New"
  },
  sizes: { title: 50, h1: 32, h2: 26, h3: 22, body: 22, code: 18 }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const title = (text) => new Paragraph({ 
  heading: HeadingLevel.TITLE,
  spacing: { after: 100 },
  children: [
    new TextRun({ text: "❧ ", color: THEME.colors.accent, size: 40 }),
    new TextRun({ text, bold: true, font: THEME.fonts.heading }),
    new TextRun({ text: " ❧", color: THEME.colors.accent, size: 40 })
  ] 
});

const subtitle = (text) => new Paragraph({ 
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
  children: [
    new TextRun({ text: "─── ⋆⋅ ", color: THEME.colors.border, size: 22 }),
    new TextRun({ text, size: 26, color: THEME.colors.secondary, font: THEME.fonts.body, italics: true }),
    new TextRun({ text: " ⋅⋆ ───", color: THEME.colors.border, size: 22 })
  ]
});

const h1 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: THEME.colors.primary } },
  children: [
    new TextRun({ text: "✦ ", color: THEME.colors.accent, size: THEME.sizes.h1 }),
    new TextRun({ text, bold: true, font: THEME.fonts.heading })
  ] 
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
    new TextRun({ text: "• ", color: THEME.colors.accent, size: THEME.sizes.h3 }),
    new TextRun({ text, bold: true, color: THEME.colors.text, font: THEME.fonts.body })
  ] 
});

const para = (text) => new Paragraph({ 
  spacing: { after: 160, line: 320 },
  children: [new TextRun({ text, size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body })] 
});

const quote = (text, author = "") => new Paragraph({
  spacing: { after: 200, before: 200 },
  shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: THEME.colors.accent } },
  indent: { left: 400, right: 400 },
  children: [
    new TextRun({ text: '"' + text + '"', size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body, italics: true }),
    author ? new TextRun({ text: "\n— " + author, size: 20, color: THEME.colors.secondary, font: THEME.fonts.body }) : null
  ].filter(Boolean)
});

const code = (text) => new Paragraph({
  spacing: { after: 60 },
  shading: { fill: THEME.colors.mediumBg, type: ShadingType.CLEAR },
  children: [new TextRun({ text: "  " + text, font: THEME.fonts.code, size: THEME.sizes.code, color: THEME.colors.primary })]
});

const codeBlock = (lines) => lines.map(line => code(line));

const leafBox = (title, text) => [
  new Paragraph({
    spacing: { after: 0, before: 200 },
    shading: { fill: THEME.colors.headerBg, type: ShadingType.CLEAR },
    children: [
      new TextRun({ text: "  🌿 " + title, bold: true, size: 20, color: "FFFFFF", font: THEME.fonts.heading })
    ]
  }),
  new Paragraph({
    spacing: { after: 200 },
    shading: { fill: THEME.colors.lightBg, type: ShadingType.CLEAR },
    border: { 
      left: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border },
      right: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: THEME.colors.border }
    },
    children: [new TextRun({ text: "  " + text, size: THEME.sizes.body, color: THEME.colors.text, font: THEME.fonts.body })]
  })
];

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// Table with organic styling
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

const cell = (text, width, isAlt = false) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: isAlt ? { fill: THEME.colors.lightBg, type: ShadingType.CLEAR } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: THEME.fonts.body, color: THEME.colors.text })] })]
});

const table2Col = (h1, h2, rows, widths = [4680, 4680]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(h1, widths[0]), headerCell(h2, widths[1])] }),
    ...rows.map(([c1, c2], i) => new TableRow({ 
      children: [cell(c1, widths[0], i % 2 === 1), cell(c2, widths[1], i % 2 === 1)] 
    }))
  ]
});

const bullet = (text) => new Paragraph({ 
  numbering: { reference: "bullet-list", level: 0 }, 
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body, color: THEME.colors.text })] 
});

const numbered = (text, ref = "numbered-list") => new Paragraph({ 
  numbering: { reference: ref, level: 0 }, 
  children: [new TextRun({ text, size: THEME.sizes.body, font: THEME.fonts.body, color: THEME.colors.text })] 
});

// =============================================================================
// SAMPLE DOCUMENT CONTENT
// =============================================================================

const content = [
  title("Forest Nature Theme"),
  subtitle("Organic & Sustainable Design"),

  h1("Philosophy"),
  para("The Forest Nature theme draws inspiration from the natural world, using earthy greens and organic typography to create documents that feel grounded and authentic."),
  
  quote("In every walk with nature, one receives far more than he seeks.", "John Muir"),

  h2("Design Elements"),
  para("This theme features elegant Cambria headings paired with classic Palatino body text—a combination that evokes traditional print while remaining modern and readable."),

  h3("Color Inspiration"),
  bullet("Forest green from ancient woodland canopies"),
  bullet("Sage tones from Mediterranean herbs"),
  bullet("Lime accents from new spring growth"),
  bullet("Brown undertones from rich forest soil"),

  h2("Color Palette"),
  table2Col("Element", "Inspiration", [
    ["#2D5A27 Primary", "Deep forest shade"],
    ["#4A7C4E Secondary", "Sage and moss"],
    ["#8BC34A Accent", "Fresh spring leaves"],
    ["#795548 Brown", "Oak bark and earth"],
    ["#F1F8E9 Background", "Morning mist"]
  ]),

  ...leafBox("Eco-Friendly Tip", "This theme works beautifully when printed on recycled paper with soy-based inks."),

  pageBreak(),
  h1("Applications"),
  
  h2("Sustainability Reports"),
  para("The natural color palette reinforces environmental messaging and creates visual harmony with sustainability content."),

  h2("Wellness Documentation"),
  para("Calming greens and organic typography promote feelings of tranquility and well-being."),

  h2("Botanical Guides"),
  para("What better theme for plant-related documentation than one inspired by the forest itself?"),

  h2("Implementation Steps"),
  numbered("Import the theme configuration", "numbered-list"),
  numbered("Customize colors if needed", "numbered-list"),
  numbered("Apply to your content", "numbered-list"),
  numbered("Export as .docx", "numbered-list"),

  ...leafBox("Remember", "Great design serves the content. Let the forest theme enhance your message, not overshadow it.")
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
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "🌱", alignment: AlignmentType.LEFT,
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
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: THEME.colors.border } },
        spacing: { after: 100 },
        children: [
          new TextRun({ text: "🌲 ", size: 20 }),
          new TextRun({ text: "FOREST NATURE", size: 18, color: THEME.colors.primary, bold: true, font: THEME.fonts.heading }),
          new TextRun({ text: " 🌲", size: 20 })
        ]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "─ ❧ ", color: THEME.colors.border, size: 18 }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: THEME.colors.primary, font: THEME.fonts.body }), 
          new TextRun({ text: " ❧ ─", color: THEME.colors.border, size: 18 })
        ]
      })] })
    },
    children: content
  }]
});

const outputPath = process.argv[2] || "theme4-forest-nature.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Forest Nature theme created: ${outputPath}`);
});

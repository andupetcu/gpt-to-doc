/**
 * DOCX Generator Template
 * =======================
 * A reusable template for creating professional Word documents from structured content.
 * 
 * Features:
 * - Professional styling with Arial font family
 * - Proper heading hierarchy (Title, H1, H2, H3)
 * - Tables with headers and consistent borders
 * - Bullet and numbered lists
 * - Code blocks with monospace font
 * - Info/warning boxes with colored backgrounds
 * - Headers and footers with page numbers
 * - ASCII diagram support
 * 
 * Usage:
 *   1. Install docx: npm install docx
 *   2. Modify the content in the "DOCUMENT CONTENT" section
 *   3. Run: node docx-generator-template.js
 * 
 * Author: Generated with Claude
 */

const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType, 
  ShadingType, PageNumber, HeadingLevel, PageBreak 
} = require('docx');
const fs = require('fs');

// =============================================================================
// HELPER FUNCTIONS - Reusable components for building documents
// =============================================================================

/**
 * Creates a document title (centered, large, colored)
 */
const title = (text) => new Paragraph({ 
  heading: HeadingLevel.TITLE, 
  spacing: { after: 300 },
  children: [new TextRun({ text, bold: true })] 
});

/**
 * Creates a subtitle (centered, gray)
 */
const subtitle = (text) => new Paragraph({ 
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
  children: [new TextRun({ text, size: 28, color: "666666" })]
});

/**
 * Creates Heading 1 (large, bold, colored)
 */
const h1 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_1, 
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, bold: true })] 
});

/**
 * Creates Heading 2 (medium, bold, colored)
 */
const h2 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_2, 
  spacing: { before: 300, after: 150 },
  children: [new TextRun({ text, bold: true })] 
});

/**
 * Creates Heading 3 (small heading, bold)
 */
const h3 = (text) => new Paragraph({ 
  heading: HeadingLevel.HEADING_3, 
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, bold: true })] 
});

/**
 * Creates a normal paragraph
 */
const para = (text, opts = {}) => new Paragraph({ 
  spacing: { after: 120 },
  ...opts,
  children: [new TextRun(text)] 
});

/**
 * Creates a paragraph with bold prefix
 * Example: boldPara("Note: ", "This is important")
 */
const boldPara = (boldText, normalText) => new Paragraph({
  spacing: { after: 120 },
  children: [
    new TextRun({ text: boldText, bold: true }),
    new TextRun(normalText)
  ]
});

/**
 * Creates a single line of code (monospace, gray background)
 */
const code = (text) => new Paragraph({
  spacing: { after: 80 },
  shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
  children: [new TextRun({ text, font: "Courier New", size: 18 })]
});

/**
 * Creates a code block from array of lines
 * Useful for ASCII diagrams and multi-line code
 */
const codeBlock = (lines) => lines.map(line => code(line));

/**
 * Creates an info/warning box with colored background
 * Colors: 
 *   - Yellow warning: "FFF3CD"
 *   - Green success: "D4EDDA" 
 *   - Blue info: "E7F3FF"
 *   - Red danger: "F8D7DA"
 *   - Purple note: "E8DAEF"
 */
const infoBox = (prefix, text, bgColor = "E7F3FF") => new Paragraph({
  shading: { fill: bgColor, type: ShadingType.CLEAR },
  spacing: { after: 200 },
  children: [
    new TextRun({ text: prefix, bold: true }),
    new TextRun(text)
  ]
});

/**
 * Creates a page break
 */
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

/**
 * Empty paragraph for spacing
 */
const spacer = () => para("");

// =============================================================================
// TABLE HELPERS
// =============================================================================

// Standard table border style
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

/**
 * Creates a header cell (bold, gray background)
 */
const headerCell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })]
});

/**
 * Creates a normal table cell
 */
const cell = (text, width) => new TableCell({
  borders: cellBorders,
  width: { size: width, type: WidthType.DXA },
  children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })]
});

/**
 * Creates a simple 2-column table
 * @param {string} header1 - First column header
 * @param {string} header2 - Second column header  
 * @param {Array} rows - Array of [col1, col2] arrays
 * @param {Array} widths - Optional [width1, width2] in DXA (default: equal widths)
 */
const table2Col = (header1, header2, rows, widths = [4680, 4680]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(header1, widths[0]), headerCell(header2, widths[1])] }),
    ...rows.map(([c1, c2]) => new TableRow({ children: [cell(c1, widths[0]), cell(c2, widths[1])] }))
  ]
});

/**
 * Creates a simple 3-column table
 */
const table3Col = (header1, header2, header3, rows, widths = [3120, 3120, 3120]) => new Table({
  columnWidths: widths,
  rows: [
    new TableRow({ children: [headerCell(header1, widths[0]), headerCell(header2, widths[1]), headerCell(header3, widths[2])] }),
    ...rows.map(([c1, c2, c3]) => new TableRow({ children: [cell(c1, widths[0]), cell(c2, widths[1]), cell(c3, widths[2])] }))
  ]
});

// =============================================================================
// LIST HELPERS
// =============================================================================

/**
 * Creates a bullet list item
 * @param {string} text - Plain text
 * @param {string} listRef - Reference name for the list (use same ref to continue list)
 */
const bullet = (text, listRef = "bullet-list") => new Paragraph({ 
  numbering: { reference: listRef, level: 0 }, 
  children: [new TextRun(text)] 
});

/**
 * Creates a bullet item with bold prefix
 */
const bulletBold = (boldText, normalText, listRef = "bullet-list") => new Paragraph({ 
  numbering: { reference: listRef, level: 0 }, 
  children: [
    new TextRun({ text: boldText, bold: true }),
    new TextRun(normalText)
  ]
});

/**
 * Creates a numbered list item
 * @param {string} text - Plain text
 * @param {string} listRef - Reference name (different refs restart numbering at 1)
 */
const numbered = (text, listRef = "numbered-list") => new Paragraph({ 
  numbering: { reference: listRef, level: 0 }, 
  children: [new TextRun(text)] 
});

// =============================================================================
// DOCUMENT STYLES CONFIGURATION
// =============================================================================

const documentStyles = {
  default: { 
    document: { 
      run: { font: "Arial", size: 22 } // 11pt default
    } 
  },
  paragraphStyles: [
    { 
      id: "Title", name: "Title", basedOn: "Normal",
      run: { size: 48, bold: true, color: "1F4E79", font: "Arial" },
      paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } 
    },
    { 
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 32, bold: true, color: "1F4E79", font: "Arial" },
      paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 } 
    },
    { 
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, color: "2E75B6", font: "Arial" },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } 
    },
    { 
      id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, color: "404040", font: "Arial" },
      paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } 
    }
  ]
};

// List definitions - add more references if you need separate numbered lists
const numberingConfig = {
  config: [
    { 
      reference: "bullet-list",
      levels: [{ 
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
      }] 
    },
    { 
      reference: "numbered-list",
      levels: [{ 
        level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
      }] 
    },
    // Add more numbered list references if you need lists that restart at 1
    { 
      reference: "numbered-list-2",
      levels: [{ 
        level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } 
      }] 
    }
  ]
};

// =============================================================================
// DOCUMENT CONTENT - MODIFY THIS SECTION FOR YOUR DOCUMENT
// =============================================================================

const documentContent = [
  // TITLE PAGE
  title("YOUR DOCUMENT TITLE"),
  subtitle("Subtitle or description goes here"),

  // SECTION 1
  h1("Section 1: Introduction"),
  para("This is a normal paragraph. You can write your content here."),
  
  boldPara("Important: ", "This shows how to create a paragraph with bold prefix."),

  // Info boxes with different colors
  infoBox("💡 Tip: ", "This is a blue info box for tips and notes.", "E7F3FF"),
  infoBox("⚠️ Warning: ", "This is a yellow warning box.", "FFF3CD"),
  infoBox("✅ Success: ", "This is a green success box.", "D4EDDA"),
  infoBox("❌ Error: ", "This is a red error/danger box.", "F8D7DA"),

  // SECTION 2: Lists
  h1("Section 2: Lists"),
  
  h2("Bullet List"),
  bullet("First bullet point"),
  bullet("Second bullet point"),
  bullet("Third bullet point"),
  
  h2("Bullet List with Bold"),
  bulletBold("Feature 1: ", "Description of feature 1"),
  bulletBold("Feature 2: ", "Description of feature 2"),
  bulletBold("Feature 3: ", "Description of feature 3"),

  h2("Numbered List"),
  numbered("First step", "numbered-list"),
  numbered("Second step", "numbered-list"),
  numbered("Third step", "numbered-list"),
  
  spacer(),
  para("This starts a NEW numbered list (different reference):"),
  numbered("New first item", "numbered-list-2"),
  numbered("New second item", "numbered-list-2"),

  // PAGE BREAK
  pageBreak(),

  // SECTION 3: Tables
  h1("Section 3: Tables"),

  h2("Two-Column Table"),
  table2Col("Column 1", "Column 2", [
    ["Row 1, Cell 1", "Row 1, Cell 2"],
    ["Row 2, Cell 1", "Row 2, Cell 2"],
    ["Row 3, Cell 1", "Row 3, Cell 2"]
  ]),

  spacer(),

  h2("Three-Column Table"),
  table3Col("Name", "Type", "Description", [
    ["Item A", "Type 1", "Description of Item A"],
    ["Item B", "Type 2", "Description of Item B"],
    ["Item C", "Type 1", "Description of Item C"]
  ], [3000, 2000, 4500]),

  // SECTION 4: Code
  h1("Section 4: Code Examples"),

  h2("Inline Code"),
  para("Use this endpoint:"),
  code("GET /api/v1/users/{userId}"),

  h2("Code Block / ASCII Diagram"),
  para("System architecture:"),
  ...codeBlock([
    "┌─────────────┐     ┌─────────────┐     ┌─────────────┐",
    "│   Client    │────▶│   Server    │────▶│  Database   │",
    "└─────────────┘     └─────────────┘     └─────────────┘",
    "                           │",
    "                           ▼",
    "                    ┌─────────────┐",
    "                    │    Cache    │",
    "                    └─────────────┘"
  ]),

  h2("JSON Example"),
  ...codeBlock([
    '{',
    '  "id": "12345",',
    '  "name": "Example",',
    '  "status": "active",',
    '  "metadata": {',
    '    "created": "2025-01-15T10:00:00Z",',
    '    "updated": "2025-01-15T12:30:00Z"',
    '  }',
    '}'
  ]),

  // SECTION 5: Mixed Content
  pageBreak(),
  h1("Section 5: Putting It All Together"),

  h2("API Endpoint Documentation"),
  
  h3("Authentication"),
  para("All requests require authentication via Bearer token."),
  code("Authorization: Bearer {your-token}"),

  h3("Available Endpoints"),
  table3Col("Method", "Endpoint", "Description", [
    ["GET", "/api/users", "List all users"],
    ["POST", "/api/users", "Create new user"],
    ["GET", "/api/users/{id}", "Get user by ID"],
    ["PUT", "/api/users/{id}", "Update user"],
    ["DELETE", "/api/users/{id}", "Delete user"]
  ], [1500, 3500, 4500]),

  spacer(),
  
  infoBox("📝 Note: ", "All timestamps are in UTC format (ISO 8601).", "E7F3FF"),

  h3("Response Codes"),
  bullet("200 - Success"),
  bullet("201 - Created"),
  bullet("400 - Bad Request"),
  bullet("401 - Unauthorized"),
  bullet("404 - Not Found"),
  bullet("500 - Internal Server Error"),
];

// =============================================================================
// DOCUMENT GENERATION - Usually no need to modify below this line
// =============================================================================

const doc = new Document({
  styles: documentStyles,
  numbering: numberingConfig,
  sections: [{
    properties: {
      page: { 
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } // 0.75 inch margins
      }
    },
    // Header - appears on every page
    headers: {
      default: new Header({ 
        children: [new Paragraph({ 
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ 
            text: "Your Document Title", // Change this to your header text
            italics: true, 
            size: 18, 
            color: "666666" 
          })]
        })] 
      })
    },
    // Footer with page numbers
    footers: {
      default: new Footer({ 
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18 }), 
            new TextRun({ children: [PageNumber.CURRENT], size: 18 }), 
            new TextRun({ text: " of ", size: 18 }), 
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })
          ]
        })] 
      })
    },
    children: documentContent
  }]
});

// Generate and save the document
const outputPath = process.argv[2] || "output.docx";

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Document created: ${outputPath}`);
}).catch(err => {
  console.error("❌ Error creating document:", err);
});

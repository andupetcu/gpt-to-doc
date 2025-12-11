#!/usr/bin/env node
/**
 * Markdown to DOCX Converter with Theme Support
 * =============================================
 * Converts markdown content to styled DOCX using theme templates.
 *
 * Usage:
 *   node convert-with-theme.js <input.md> <output.docx> <theme>
 *
 * Themes:
 *   - plain: Basic conversion (default)
 *   - color: Professional with colors
 *   - ocean: Ocean Corporate (deep blue)
 *   - sunset: Sunset Warm (orange/coral)
 *   - midnight: Midnight Tech (dark modern)
 *   - forest: Forest Nature (green)
 *   - executive: Executive Minimal (black/white)
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageNumber, HeadingLevel, PageBreak
} = require('docx');
const { marked } = require('marked');
const fs = require('fs');

// =============================================================================
// THEME CONFIGURATIONS
// =============================================================================

const THEMES = {
  plain: {
    name: "Plain",
    colors: {
      primary: "000000",
      secondary: "333333",
      accent: "666666",
      text: "000000",
      lightBg: "F5F5F5",
      headerBg: "E8E8E8",
      border: "CCCCCC"
    },
    fonts: { heading: "Arial", body: "Arial", code: "Courier New" },
    sizes: { title: 48, h1: 32, h2: 26, h3: 24, body: 22, code: 18 }
  },
  color: {
    name: "Professional Color",
    colors: {
      primary: "1F4E79",
      secondary: "2E75B6",
      accent: "5B9BD5",
      text: "333333",
      lightBg: "E7F3FF",
      headerBg: "1F4E79",
      border: "CCCCCC"
    },
    fonts: { heading: "Arial", body: "Arial", code: "Courier New" },
    sizes: { title: 48, h1: 32, h2: 26, h3: 24, body: 22, code: 18 }
  },
  ocean: {
    name: "Ocean Corporate",
    colors: {
      primary: "0D3B66",
      secondary: "1E5F8A",
      accent: "14A3C7",
      text: "2C3E50",
      lightBg: "E8F4F8",
      headerBg: "0D3B66",
      border: "B8D4E3"
    },
    fonts: { heading: "Calibri Light", body: "Calibri", code: "Consolas" },
    sizes: { title: 56, h1: 36, h2: 28, h3: 24, body: 22, code: 18 }
  },
  sunset: {
    name: "Sunset Warm",
    colors: {
      primary: "D35400",
      secondary: "E67E22",
      accent: "F39C12",
      text: "2C3E50",
      lightBg: "FEF5E7",
      headerBg: "D35400",
      border: "F5CBA7"
    },
    fonts: { heading: "Georgia", body: "Georgia", code: "Consolas" },
    sizes: { title: 52, h1: 34, h2: 28, h3: 24, body: 22, code: 18 }
  },
  midnight: {
    name: "Midnight Tech",
    colors: {
      primary: "2C3E50",
      secondary: "34495E",
      accent: "3498DB",
      text: "2C3E50",
      lightBg: "ECF0F1",
      headerBg: "2C3E50",
      border: "BDC3C7"
    },
    fonts: { heading: "Segoe UI", body: "Segoe UI", code: "Fira Code" },
    sizes: { title: 52, h1: 34, h2: 28, h3: 24, body: 22, code: 18 }
  },
  forest: {
    name: "Forest Nature",
    colors: {
      primary: "1E8449",
      secondary: "27AE60",
      accent: "2ECC71",
      text: "1C2833",
      lightBg: "E8F8F5",
      headerBg: "1E8449",
      border: "A9DFBF"
    },
    fonts: { heading: "Cambria", body: "Cambria", code: "Consolas" },
    sizes: { title: 52, h1: 34, h2: 28, h3: 24, body: 22, code: 18 }
  },
  executive: {
    name: "Executive Minimal",
    colors: {
      primary: "1C1C1C",
      secondary: "4A4A4A",
      accent: "8B8B8B",
      text: "1C1C1C",
      lightBg: "F8F8F8",
      headerBg: "1C1C1C",
      border: "E0E0E0"
    },
    fonts: { heading: "Times New Roman", body: "Times New Roman", code: "Courier New" },
    sizes: { title: 48, h1: 32, h2: 26, h3: 24, body: 24, code: 20 }
  }
};

// =============================================================================
// MARKDOWN PARSER
// =============================================================================

function parseMarkdownToTokens(markdown) {
  const tokens = marked.lexer(markdown);
  return tokens;
}

// =============================================================================
// DOCX ELEMENT BUILDERS
// =============================================================================

function createDocxElements(tokens, themeName) {
  const T = THEMES[themeName] || THEMES.plain;
  const elements = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        elements.push(createHeading(token, T, themeName));
        break;
      case 'paragraph':
        elements.push(createParagraph(token, T));
        break;
      case 'list':
        elements.push(...createList(token, T));
        break;
      case 'code':
        elements.push(...createCodeBlock(token, T));
        break;
      case 'blockquote':
        elements.push(createBlockquote(token, T));
        break;
      case 'table':
        elements.push(createTable(token, T));
        break;
      case 'hr':
        elements.push(createHorizontalRule(T));
        break;
      case 'space':
        // Skip empty space tokens
        break;
      default:
        // For unknown types, try to extract text
        if (token.text) {
          elements.push(new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: token.text, size: T.sizes.body, font: T.fonts.body })]
          }));
        }
    }
  }

  return elements;
}

function createHeading(token, T, themeName) {
  const level = token.depth;
  const text = stripHtml(token.text);

  // Some themes use inverted header colors (white text on colored background)
  const useInvertedH1 = themeName === 'ocean' || themeName === 'midnight';

  const headingConfigs = {
    1: {
      heading: HeadingLevel.HEADING_1,
      size: T.sizes.h1,
      color: T.colors.primary,
      spacing: { before: 400, after: 200 },
      shading: useInvertedH1 ? { fill: T.colors.primary, type: ShadingType.CLEAR } : undefined,
      textColor: useInvertedH1 ? 'FFFFFF' : T.colors.primary
    },
    2: {
      heading: HeadingLevel.HEADING_2,
      size: T.sizes.h2,
      color: T.colors.secondary,
      spacing: { before: 300, after: 150 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: T.colors.accent } }
    },
    3: {
      heading: HeadingLevel.HEADING_3,
      size: T.sizes.h3,
      color: T.colors.secondary,
      spacing: { before: 200, after: 100 }
    }
  };

  const config = headingConfigs[level] || headingConfigs[3];

  const paragraphOptions = {
    heading: config.heading,
    spacing: config.spacing,
    children: [new TextRun({
      text,
      bold: true,
      size: config.size,
      color: config.textColor || config.color,
      font: T.fonts.heading
    })]
  };

  if (config.shading) {
    paragraphOptions.shading = config.shading;
  }
  if (config.border) {
    paragraphOptions.border = config.border;
  }

  return new Paragraph(paragraphOptions);
}

function createParagraph(token, T) {
  const runs = parseInlineTokens(token.tokens || [], T);

  return new Paragraph({
    spacing: { after: 120 },
    children: runs
  });
}

function parseInlineTokens(tokens, T) {
  const runs = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        runs.push(new TextRun({
          text: token.text,
          size: T.sizes.body,
          font: T.fonts.body,
          color: T.colors.text
        }));
        break;
      case 'strong':
        runs.push(new TextRun({
          text: token.text,
          bold: true,
          size: T.sizes.body,
          font: T.fonts.body,
          color: T.colors.text
        }));
        break;
      case 'em':
        runs.push(new TextRun({
          text: token.text,
          italics: true,
          size: T.sizes.body,
          font: T.fonts.body,
          color: T.colors.text
        }));
        break;
      case 'codespan':
        runs.push(new TextRun({
          text: token.text,
          font: T.fonts.code,
          size: T.sizes.code,
          shading: { fill: T.colors.lightBg, type: ShadingType.CLEAR }
        }));
        break;
      case 'link':
        runs.push(new TextRun({
          text: token.text,
          color: T.colors.accent,
          underline: {}
        }));
        break;
      default:
        if (token.raw) {
          runs.push(new TextRun({
            text: token.raw,
            size: T.sizes.body,
            font: T.fonts.body,
            color: T.colors.text
          }));
        }
    }
  }

  return runs;
}

function createList(token, T) {
  const elements = [];
  const listRef = token.ordered ? 'numbered-list' : 'bullet-list';

  for (const item of token.items) {
    const text = stripHtml(item.text);
    elements.push(new Paragraph({
      numbering: { reference: listRef, level: 0 },
      children: [new TextRun({
        text,
        size: T.sizes.body,
        font: T.fonts.body,
        color: T.colors.text
      })]
    }));
  }

  return elements;
}

function createCodeBlock(token, T) {
  const lines = token.text.split('\n');
  return lines.map(line => new Paragraph({
    spacing: { after: 40 },
    shading: { fill: T.colors.lightBg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: T.colors.accent } },
    indent: { left: 200 },
    children: [new TextRun({
      text: line || ' ',
      font: T.fonts.code,
      size: T.sizes.code,
      color: T.colors.text
    })]
  }));
}

function createBlockquote(token, T) {
  const text = stripHtml(token.text);
  return new Paragraph({
    shading: { fill: T.colors.lightBg, type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: T.colors.accent } },
    spacing: { after: 200 },
    indent: { left: 400 },
    children: [new TextRun({
      text,
      italics: true,
      size: T.sizes.body,
      font: T.fonts.body,
      color: T.colors.secondary
    })]
  });
}

function createTable(token, T) {
  const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: T.colors.border };
  const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

  const rows = [];

  // Header row
  if (token.header && token.header.length > 0) {
    const headerCells = token.header.map(cell => new TableCell({
      borders: cellBorders,
      shading: { fill: T.colors.headerBg, type: ShadingType.CLEAR },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: stripHtml(cell.text),
          bold: true,
          size: 20,
          color: 'FFFFFF',
          font: T.fonts.body
        })]
      })]
    }));
    rows.push(new TableRow({ children: headerCells }));
  }

  // Body rows
  for (const row of token.rows) {
    const cells = row.map(cell => new TableCell({
      borders: cellBorders,
      children: [new Paragraph({
        children: [new TextRun({
          text: stripHtml(cell.text),
          size: 20,
          font: T.fonts.body,
          color: T.colors.text
        })]
      })]
    }));
    rows.push(new TableRow({ children: cells }));
  }

  return new Table({ rows });
}

function createHorizontalRule(T) {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: T.colors.border } },
    children: []
  });
}

function stripHtml(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '');
}

// =============================================================================
// DOCUMENT GENERATION
// =============================================================================

function createDocument(markdown, themeName) {
  const theme = themeName || 'plain';
  const T = THEMES[theme] || THEMES.plain;

  const tokens = parseMarkdownToTokens(markdown);
  const content = createDocxElements(tokens, theme);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: T.fonts.body, size: T.sizes.body }
        }
      },
      paragraphStyles: [
        {
          id: "Title", name: "Title", basedOn: "Normal",
          run: { size: T.sizes.title, bold: true, color: T.colors.primary, font: T.fonts.heading },
          paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER }
        },
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: T.sizes.h1, bold: true, color: T.colors.primary, font: T.fonts.heading },
          paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 0 }
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: T.sizes.h2, bold: true, color: T.colors.secondary, font: T.fonts.heading },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: T.sizes.h3, bold: true, color: T.colors.secondary, font: T.fonts.heading },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
        }
      ]
    },
    numbering: {
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
        }
      ]
    },
    sections: [{
      properties: {
        page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: T.colors.accent } },
            children: [new TextRun({
              text: T.name,
              italics: true,
              size: 18,
              color: T.colors.secondary
            })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, color: T.colors.text }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: T.colors.primary, bold: true }),
              new TextRun({ text: " of ", size: 18, color: T.colors.text }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: T.colors.primary, bold: true })
            ]
          })]
        })
      },
      children: content
    }]
  });

  return doc;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node convert-with-theme.js <input.md> <output.docx> [theme]');
    console.error('Themes: plain, color, ocean, sunset, midnight, forest, executive');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];
  const theme = args[2] || 'plain';

  if (!THEMES[theme]) {
    console.error(`Unknown theme: ${theme}`);
    console.error('Available themes:', Object.keys(THEMES).join(', '));
    process.exit(1);
  }

  try {
    const markdown = fs.readFileSync(inputFile, 'utf-8');
    const doc = createDocument(markdown, theme);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputFile, buffer);
    console.log(`✅ Created ${outputFile} with theme: ${THEMES[theme].name}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();

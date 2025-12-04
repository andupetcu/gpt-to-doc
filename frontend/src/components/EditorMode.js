import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  ButtonGroup,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Clear,
  TextSnippet,
  Download,
  Description,
  Close,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight } from '@uiw/codemirror-theme-github';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AdvancedOptions from './AdvancedOptions';

const EditorContainer = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  height: '600px',
  marginBottom: theme.spacing(2),
  '& .cm-editor': {
    height: '100%',
  },
  '& .cm-scroller': {
    overflow: 'auto !important',
  },
}));

const PreviewDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '90vw',
    width: '1200px',
    height: '85vh',
  },
}));

const PreviewContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lineHeight: 1.6,
  height: '100%',
  overflow: 'auto',
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    color: theme.palette.text.primary,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  '& h1': {
    fontSize: '2em',
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  '& h2': {
    fontSize: '1.5em',
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(0.5),
  },
  '& pre': {
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    overflow: 'auto',
    margin: `${theme.spacing(2)} 0`,
  },
  '& code': {
    backgroundColor: theme.palette.grey[100],
    borderRadius: 3,
    padding: '2px 4px',
    fontSize: '85%',
  },
  '& pre code': {
    backgroundColor: 'transparent',
    padding: 0,
  },
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.grey[400]}`,
    margin: `${theme.spacing(2)} 0`,
    padding: `0 ${theme.spacing(2)}`,
    color: theme.palette.text.secondary,
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    margin: `${theme.spacing(2)} 0`,
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: theme.palette.grey[100],
    fontWeight: 'bold',
  },
}));

const AUTOSAVE_KEY = 'markdown_editor_draft';
const AUTOSAVE_INTERVAL = 2000;

const EditorMode = ({ showLoading, hideLoading, showMessage }) => {
  const [markdownText, setMarkdownText] = useState('');
  const [filename, setFilename] = useState('document');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    enableToc: false,
    numberedSections: false,
    customHeader: '',
    customFooter: '',
  });

  // Auto-save functionality
  useEffect(() => {
    const loadDraft = () => {
      const savedContent = localStorage.getItem(AUTOSAVE_KEY);
      const timestamp = localStorage.getItem(AUTOSAVE_KEY + '_timestamp');

      if (savedContent && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const ageHours = age / (1000 * 60 * 60);

        if (ageHours < 24 && !markdownText.trim()) {
          if (window.confirm('A draft was found. Would you like to restore it?')) {
            setMarkdownText(savedContent);
          }
        }
      }
    };

    loadDraft();
  }, [markdownText]);

  useEffect(() => {
    if (markdownText.trim()) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(AUTOSAVE_KEY, markdownText);
        localStorage.setItem(AUTOSAVE_KEY + '_timestamp', Date.now().toString());
      }, AUTOSAVE_INTERVAL);

      return () => clearTimeout(timeoutId);
    }
  }, [markdownText]);

  const clearEditor = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the editor? This action cannot be undone.')) {
      setMarkdownText('');
      localStorage.removeItem(AUTOSAVE_KEY);
      localStorage.removeItem(AUTOSAVE_KEY + '_timestamp');
    }
  }, []);

  const loadSample = useCallback(() => {
    const sampleMarkdown = `# Advanced Markdown Document

## Executive Summary

This **comprehensive document** demonstrates all advanced options available in the markdown converter. Enable different options in the *Advanced Options* section to see how they affect the preview.

## Table of Contents Features

When you enable "Table of Contents", this document will automatically generate a clickable table of contents based on all headings.

### Subsection 1.1
Content for subsection 1.1

### Subsection 1.2
Content for subsection 1.2

## Code Examples

**JavaScript:**
\`\`\`javascript
function calculateTotal(items) {
    return items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
}

const cart = [
    { name: "Laptop", price: 999, quantity: 1 },
    { name: "Mouse", price: 25, quantity: 2 }
];

console.log(\`Total: $\${calculateTotal(cart)}\`);
\`\`\`

## Advanced Features Table

| Feature | Purpose | Preview Effect |
|---------|---------|----------------|
| Table of Contents | Navigation | Adds clickable TOC at top |
| Numbered Sections | Organization | Numbers all headings |
| Custom Header | Branding | Document header bar |
| Custom Footer | Attribution | Document footer bar |

## Rich Content Examples

### Lists and Formatting

1. **Primary items** with *emphasis*
2. Secondary items with \`inline code\`
3. Nested content:
   - Bullet point one
   - Bullet point two
     - Sub-bullet with **bold text**
     - Sub-bullet with [link](https://example.com)

### Blockquotes

> This is a standard blockquote that demonstrates how quoted text appears in the preview.
>
> You can have multiple paragraphs in blockquotes, and they will be properly styled in both the preview and final document.

---

## Conclusion

This sample demonstrates all advanced options. Enable different combinations in the Advanced Options panel to see how they transform the document preview and final output.

**Pro Tip:** Try enabling multiple options together to see how they combine!`;

    setMarkdownText(sampleMarkdown);
  }, []);

  const togglePreview = useCallback(() => {
    setPreviewOpen(!previewOpen);
  }, [previewOpen]);

  const renderPreview = useCallback(() => {
    if (!markdownText.trim()) {
      return '<p><em>Start typing to see the preview...</em></p>';
    }

    try {
      let processedContent = markdownText;

      // Add custom headers/footers if enabled
      if (advancedOptions.customHeader || advancedOptions.customFooter) {
        if (advancedOptions.customHeader) {
          processedContent = `<div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; font-weight: bold; text-align: center; color: #495057; font-size: 14px;">${DOMPurify.sanitize(advancedOptions.customHeader)}</div>\n\n` + processedContent;
        }

        if (advancedOptions.customFooter) {
          processedContent = processedContent + `\n\n<div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-top: 20px; font-weight: bold; text-align: center; color: #495057; font-size: 14px;">${DOMPurify.sanitize(advancedOptions.customFooter)}</div>`;
        }
      }

      let html = marked.parse(processedContent);

      // Apply Table of Contents if enabled
      if (advancedOptions.enableToc) {
        html = addTableOfContents(html);
      }

      // Apply numbered sections if enabled
      if (advancedOptions.numberedSections) {
        html = addNumberedSections(html);
      }

      return DOMPurify.sanitize(html);
    } catch (error) {
      return `<p><em>Error rendering preview: ${error.message}</em></p>`;
    }
  }, [markdownText, advancedOptions]);

  const addTableOfContents = (html) => {
    const headings = [];
    const tocRegex = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    let headingIndex = 0;

    const processedHtml = html.replace(tocRegex, (fullMatch, tag, content) => {
      headingIndex++;
      const level = parseInt(tag.charAt(1));
      const headingId = `heading-${headingIndex}`;
      const cleanContent = content.replace(/<[^>]*>/g, '');

      headings.push({
        level: level,
        content: cleanContent,
        id: headingId
      });

      return `<${tag} id="${headingId}">${content}</${tag}>`;
    });

    if (headings.length === 0) {
      return html;
    }

    let tocHtml = '<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin-bottom: 24px;"><h2 style="margin-top: 0; margin-bottom: 16px; color: #495057; font-size: 18px; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;">Table of Contents</h2><ul style="list-style: none; padding-left: 0; margin: 0;">';

    headings.forEach(heading => {
      const indent = 16 * heading.level;
      tocHtml += `<li style="margin: 6px 0; padding-left: ${indent}px;"><a href="#${heading.id}" style="color: #0366d6; text-decoration: none; font-size: 14px; line-height: 1.4;">${heading.content}</a></li>`;
    });

    tocHtml += '</ul></div>';

    return tocHtml + processedHtml;
  };

  const addNumberedSections = (html) => {
    const counters = [0, 0, 0, 0, 0, 0];

    return html.replace(/<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, tag, content) => {
      const level = parseInt(tag.charAt(1)) - 1;

      for (let i = level + 1; i < counters.length; i++) {
        counters[i] = 0;
      }

      counters[level]++;

      const numbering = counters.slice(0, level + 1).filter(n => n > 0).join('.');

      return `<${tag}><span style="color: #0366d6; font-weight: bold; margin-right: 8px;">${numbering}.</span> ${content}</${tag}>`;
    });
  };

  const handleConvert = async (format) => {
    if (!markdownText.trim()) {
      showMessage('Please enter some markdown text to convert.', 'warning');
      return;
    }

    showLoading(`Converting your text to ${format.toUpperCase()}...`);

    try {
      const endpoint = format === 'pdf' ? '/convert-pdf' : '/convert-text-advanced';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: markdownText,
          options: advancedOptions
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'converted_document'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showMessage('Your document has been converted and downloaded successfully!', 'success');
    } catch (error) {
      console.error('Conversion error:', error);
      showMessage(`Error converting document: ${error.message}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleSaveMd = async () => {
    if (!markdownText.trim()) {
      showMessage('Please enter some markdown text to save.', 'warning');
      return;
    }

    showLoading('Saving as Markdown file...');

    try {
      const response = await fetch('/save-md', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown: markdownText })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'document'}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showMessage('Markdown file saved successfully!', 'success');
    } catch (error) {
      console.error('Save error:', error);
      showMessage(`Error saving file: ${error.message}`, 'error');
    } finally {
      hideLoading();
    }
  };

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Live Markdown Editor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Write and preview your markdown in real-time
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={previewOpen ? <VisibilityOff /> : <Visibility />}
          onClick={togglePreview}
        >
          {previewOpen ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Clear />}
          onClick={clearEditor}
        >
          Clear
        </Button>
        <Button
          variant="outlined"
          startIcon={<TextSnippet />}
          onClick={loadSample}
        >
          Load Sample
        </Button>
      </Box>

      <EditorContainer elevation={1}>
        <CodeMirror
          value={markdownText}
          onChange={(value) => setMarkdownText(value)}
          extensions={[markdown()]}
          theme={githubLight}
          placeholder="Start typing your markdown here..."
          style={{ height: '100%' }}
        />
      </EditorContainer>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="File Name"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="document"
            helperText="Without extension (will be added automatically)"
            size="small"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => handleConvert('docx')}
        >
          Convert to DOCX
        </Button>
        <Button
          variant="outlined"
          startIcon={<Description />}
          onClick={handleSaveMd}
        >
          Save as .md
        </Button>
      </Box>

      <AdvancedOptions
        options={advancedOptions}
        onChange={setAdvancedOptions}
      />

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth={false}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📖 Live Preview
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <PreviewContent dangerouslySetInnerHTML={{ __html: renderPreview() }} />
        </DialogContent>
      </PreviewDialog>
    </Box>
  );
};

export default EditorMode;
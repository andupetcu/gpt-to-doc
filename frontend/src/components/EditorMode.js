import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Clear,
  TextSnippet,
  Download,
  Description,
  ContentPaste,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { githubLight } from '@uiw/codemirror-theme-github';
import { oneDark } from '@uiw/codemirror-theme-oneDark';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import AdvancedOptions from './AdvancedOptions';
import ChatGPTImport from './ChatGPTImport';
import { trackConversion, trackEditorAction, EVENTS } from '../utils/analytics';

const EditorContainer = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  height: '600px',
  '& .cm-editor': { height: '100%' },
  '& .cm-scroller': { overflow: 'auto !important' },
}));

const PreviewPane = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lineHeight: 1.6,
  height: '600px',
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  '& h1, & h2, & h3, & h4, & h5, & h6': { color: theme.palette.text.primary, marginTop: theme.spacing(3), marginBottom: theme.spacing(2) },
  '& h1': { fontSize: '2em', borderBottom: `1px solid ${theme.palette.divider}`, paddingBottom: theme.spacing(1) },
  '& h2': { fontSize: '1.5em', borderBottom: `1px solid ${theme.palette.divider}`, paddingBottom: theme.spacing(0.5) },
  '& pre': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100], borderRadius: theme.shape.borderRadius, padding: theme.spacing(2), overflow: 'auto', margin: `${theme.spacing(2)} 0` },
  '& code': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100], borderRadius: 3, padding: '2px 4px', fontSize: '85%' },
  '& pre code': { backgroundColor: 'transparent', padding: 0 },
  '& blockquote': { borderLeft: `4px solid ${theme.palette.grey[400]}`, margin: `${theme.spacing(2)} 0`, padding: `0 ${theme.spacing(2)}`, color: theme.palette.text.secondary },
  '& table': { borderCollapse: 'collapse', width: '100%', margin: `${theme.spacing(2)} 0` },
  '& th, & td': { border: `1px solid ${theme.palette.divider}`, padding: theme.spacing(1), textAlign: 'left' },
  '& th': { backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100], fontWeight: 'bold' },
}));

const AUTOSAVE_KEY = 'markdown_editor_draft';
const AUTOSAVE_INTERVAL = 2000;

function extractFilenameFromHeading(text) {
  const match = text.match(/^#\s+(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 80) || null;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const EditorMode = ({ showLoading, hideLoading, showMessage, themeMode }) => {
  const [markdownText, setMarkdownText] = useState('');
  const [filename, setFilename] = useState('document');
  const [filenameManual, setFilenameManual] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    enableToc: false,
    numberedSections: false,
    customHeader: '',
    customFooter: '',
    theme: 'plain',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const filenameTimerRef = useRef(null);

  // Auto-save: load draft
  useEffect(() => {
    const savedContent = localStorage.getItem(AUTOSAVE_KEY);
    const timestamp = localStorage.getItem(AUTOSAVE_KEY + '_timestamp');
    if (savedContent && timestamp) {
      const ageHours = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
      if (ageHours < 24) {
        if (window.confirm('A draft was found. Would you like to restore it?')) {
          setMarkdownText(savedContent);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save: persist
  useEffect(() => {
    if (markdownText.trim()) {
      const id = setTimeout(() => {
        localStorage.setItem(AUTOSAVE_KEY, markdownText);
        localStorage.setItem(AUTOSAVE_KEY + '_timestamp', Date.now().toString());
      }, AUTOSAVE_INTERVAL);
      return () => clearTimeout(id);
    }
  }, [markdownText]);

  // Auto-extract filename from first heading (debounced)
  useEffect(() => {
    if (filenameManual) return;
    clearTimeout(filenameTimerRef.current);
    filenameTimerRef.current = setTimeout(() => {
      const extracted = extractFilenameFromHeading(markdownText);
      if (extracted) setFilename(extracted);
      else setFilename('document');
    }, 500);
    return () => clearTimeout(filenameTimerRef.current);
  }, [markdownText, filenameManual]);

  const handleFilenameChange = useCallback((e) => {
    setFilename(e.target.value);
    setFilenameManual(true);
  }, []);

  const clearEditor = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the editor?')) {
      setMarkdownText('');
      setFilenameManual(false);
      localStorage.removeItem(AUTOSAVE_KEY);
      localStorage.removeItem(AUTOSAVE_KEY + '_timestamp');
      trackEditorAction(EVENTS.CLEAR_EDITOR);
    }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMarkdownText(prev => prev ? prev + '\n' + text : text);
        showMessage('Pasted from clipboard!', 'success');
      } else {
        showMessage('Clipboard is empty.', 'info');
      }
    } catch (err) {
      showMessage('Could not read clipboard. Please paste manually (Ctrl+V).', 'warning');
    }
  }, [showMessage]);

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

### Blockquotes

> This is a standard blockquote that demonstrates how quoted text appears in the preview.

---

## Conclusion

This sample demonstrates all advanced options.`;
    setMarkdownText(sampleMarkdown);
    setFilenameManual(false);
    trackEditorAction(EVENTS.LOAD_SAMPLE);
  }, []);

  const togglePreview = useCallback(() => {
    if (!previewOpen) trackEditorAction(EVENTS.OPEN_PREVIEW);
    setPreviewOpen(p => !p);
  }, [previewOpen]);

  const renderPreview = useCallback(() => {
    if (!markdownText.trim()) return '<p><em>Start typing to see the preview...</em></p>';
    try {
      let processedContent = markdownText;
      if (advancedOptions.customHeader) {
        processedContent = `<div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px; font-weight: bold; text-align: center; color: #495057; font-size: 14px;">${DOMPurify.sanitize(advancedOptions.customHeader)}</div>\n\n` + processedContent;
      }
      if (advancedOptions.customFooter) {
        processedContent += `\n\n<div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-top: 20px; font-weight: bold; text-align: center; color: #495057; font-size: 14px;">${DOMPurify.sanitize(advancedOptions.customFooter)}</div>`;
      }
      let html = marked.parse(processedContent);
      if (advancedOptions.enableToc) html = addTableOfContents(html);
      if (advancedOptions.numberedSections) html = addNumberedSections(html);
      return DOMPurify.sanitize(html);
    } catch (error) {
      return `<p><em>Error rendering preview: ${error.message}</em></p>`;
    }
  }, [markdownText, advancedOptions]);

  const addTableOfContents = (html) => {
    const headings = [];
    let idx = 0;
    const processed = html.replace(/<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (m, tag, content) => {
      idx++;
      const level = parseInt(tag.charAt(1));
      const id = `heading-${idx}`;
      headings.push({ level, content: content.replace(/<[^>]*>/g, ''), id });
      return `<${tag} id="${id}">${content}</${tag}>`;
    });
    if (!headings.length) return html;
    let toc = '<div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin-bottom: 24px;"><h2 style="margin-top: 0; margin-bottom: 16px; color: #495057; font-size: 18px; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;">Table of Contents</h2><ul style="list-style: none; padding-left: 0; margin: 0;">';
    headings.forEach(h => { toc += `<li style="margin: 6px 0; padding-left: ${16 * h.level}px;"><a href="#${h.id}" style="color: #0366d6; text-decoration: none; font-size: 14px;">${h.content}</a></li>`; });
    toc += '</ul></div>';
    return toc + processed;
  };

  const addNumberedSections = (html) => {
    const counters = [0, 0, 0, 0, 0, 0];
    return html.replace(/<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (m, tag, content) => {
      const l = parseInt(tag.charAt(1)) - 1;
      for (let i = l + 1; i < counters.length; i++) counters[i] = 0;
      counters[l]++;
      const num = counters.slice(0, l + 1).filter(n => n > 0).join('.');
      return `<${tag}><span style="color: #0366d6; font-weight: bold; margin-right: 8px;">${num}.</span> ${content}</${tag}>`;
    });
  };

  const handleConvert = async (format) => {
    if (!markdownText.trim()) { showMessage('Please enter some markdown text to convert.', 'warning'); return; }
    const selectedTheme = advancedOptions.theme || 'plain';
    const themeName = selectedTheme !== 'plain' ? ` (${selectedTheme} theme)` : '';
    showLoading(`Converting your text to ${format.toUpperCase()}${themeName}...`);

    try {
      let endpoint, body;
      if (format === 'pdf') {
        endpoint = '/convert-pdf';
        body = { markdown: markdownText };
      } else if (selectedTheme !== 'plain') {
        endpoint = '/convert-themed';
        body = { markdown: markdownText, theme: selectedTheme };
      } else {
        endpoint = '/convert-text-advanced';
        body = { markdown: markdownText, options: advancedOptions };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      trackConversion(format, selectedTheme, true);
      showMessage(`Document converted and downloaded! (${formatFileSize(blob.size)})`, 'success');
    } catch (error) {
      console.error('Conversion error:', error);
      trackConversion(format, advancedOptions.theme || 'plain', false);
      showMessage(`Error converting document: ${error.message}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleSaveMd = async () => {
    if (!markdownText.trim()) { showMessage('Please enter some markdown text to save.', 'warning'); return; }
    showLoading('Saving as Markdown file...');
    try {
      const response = await fetch('/save-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: markdownText }),
      });
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to save file'); }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'document'}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      trackEditorAction(EVENTS.SAVE_MARKDOWN);
      showMessage(`Markdown file saved! (${formatFileSize(blob.size)})`, 'success');
    } catch (error) {
      console.error('Save error:', error);
      showMessage(`Error saving file: ${error.message}`, 'error');
    } finally {
      hideLoading();
    }
  };

  const handleImportMarkdown = useCallback((md) => {
    setMarkdownText(md);
    setFilenameManual(false);
    showMessage('ChatGPT conversation imported! Review and convert.', 'success');
  }, [showMessage]);

  const cmTheme = themeMode === 'dark' ? oneDark : githubLight;

  // Split pane: side-by-side on desktop, toggle on mobile
  const showSplitPreview = previewOpen && !isMobile;
  const showModalPreview = previewOpen && isMobile;

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>Live Markdown Editor</Typography>
        <Typography variant="body1" color="text.secondary">Write and preview your markdown in real-time</Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="contained" color="secondary" startIcon={<ContentPaste />} onClick={pasteFromClipboard}>
          Paste from Clipboard
        </Button>
        <Button variant="outlined" startIcon={previewOpen ? <VisibilityOff /> : <Visibility />} onClick={togglePreview}>
          {previewOpen ? 'Hide Preview' : 'Show Preview'}
        </Button>
        <Button variant="outlined" startIcon={<Clear />} onClick={clearEditor}>Clear</Button>
        <Button variant="outlined" startIcon={<TextSnippet />} onClick={loadSample}>Load Sample</Button>
      </Box>

      {/* Editor + Preview split pane */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: showSplitPreview ? 'row' : 'column' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <EditorContainer elevation={1}>
            <CodeMirror
              value={markdownText}
              onChange={(value) => setMarkdownText(value)}
              extensions={[markdown()]}
              theme={cmTheme}
              placeholder="Start typing your markdown here..."
              style={{ height: '100%' }}
            />
          </EditorContainer>
        </Box>
        {showSplitPreview && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <PreviewPane dangerouslySetInnerHTML={{ __html: renderPreview() }} />
          </Box>
        )}
      </Box>

      {/* Mobile preview: inline below editor */}
      {showModalPreview && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>📖 Preview</Typography>
          <PreviewPane dangerouslySetInnerHTML={{ __html: renderPreview() }} sx={{ height: '400px' }} />
        </Box>
      )}

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="File Name"
            value={filename}
            onChange={handleFilenameChange}
            placeholder="document"
            helperText="Auto-detected from first heading (edit to override)"
            size="small"
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<Download />} onClick={() => handleConvert('docx')}>Convert to DOCX</Button>
        <Button variant="outlined" startIcon={<Description />} onClick={handleSaveMd}>Save as .md</Button>
      </Box>

      <AdvancedOptions options={advancedOptions} onChange={setAdvancedOptions} />

      <ChatGPTImport onImport={handleImportMarkdown} />
    </Box>
  );
};

export default EditorMode;

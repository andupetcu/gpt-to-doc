import React, { useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import { ExpandMore, UploadFile } from '@mui/icons-material';

/**
 * Parse ChatGPT export JSON (conversations.json from the export ZIP)
 * into markdown text.
 */
function parseChatGPTJson(jsonData) {
  // Could be an array of conversations or a single conversation
  const conversations = Array.isArray(jsonData) ? jsonData : [jsonData];
  const parts = [];

  for (const conv of conversations) {
    const title = conv.title || 'Untitled Conversation';
    parts.push(`# ${title}\n`);

    if (!conv.mapping) continue;

    // Build ordered messages from the mapping tree
    const messages = [];
    const visited = new Set();

    function walk(nodeId) {
      if (!nodeId || visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = conv.mapping[nodeId];
      if (!node) return;
      if (node.message) {
        const msg = node.message;
        const role = msg.author?.role;
        const textParts = msg.content?.parts || [];
        const text = textParts.filter(p => typeof p === 'string').join('\n').trim();
        if (text && (role === 'user' || role === 'assistant')) {
          messages.push({ role, text });
        }
      }
      if (node.children) {
        for (const childId of node.children) {
          walk(childId);
        }
      }
    }

    // Find root nodes (nodes with no parent or parent is null)
    for (const [nodeId, node] of Object.entries(conv.mapping)) {
      if (!node.parent) {
        walk(nodeId);
      }
    }

    for (const msg of messages) {
      const label = msg.role === 'user' ? 'User' : 'Assistant';
      parts.push(`## ${label}:\n\n${msg.text}\n`);
    }

    parts.push('---\n');
  }

  return parts.join('\n');
}

const ChatGPTImport = ({ onImport }) => {
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    try {
      if (file.name.endsWith('.zip')) {
        // Handle ZIP file — look for conversations.json inside
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        const convFile = zip.file('conversations.json');
        if (!convFile) {
          throw new Error('No conversations.json found in ZIP. Is this a ChatGPT export?');
        }
        const text = await convFile.async('string');
        const data = JSON.parse(text);
        const md = parseChatGPTJson(data);
        onImport(md);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        const md = parseChatGPTJson(data);
        onImport(md);
      } else {
        throw new Error('Please upload a .json or .zip file from ChatGPT export.');
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  }, [onImport]);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <UploadFile sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography fontWeight={500}>Import ChatGPT JSON Export</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Alert severity="info" sx={{ mb: 2 }}>
          Go to <strong>ChatGPT → Settings → Data controls → Export data</strong>. You'll receive a ZIP file by email.
          Upload the <code>.zip</code> or the <code>conversations.json</code> file from inside it.
        </Alert>
        <Button variant="outlined" startIcon={<UploadFile />} onClick={() => fileInputRef.current?.click()}>
          Select ChatGPT Export File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default ChatGPTImport;

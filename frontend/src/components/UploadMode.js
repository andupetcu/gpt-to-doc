import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Delete,
  FilePresent,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdvancedOptions from './AdvancedOptions';
import { trackFileUpload, trackEvent, EVENTS } from '../utils/analytics';

const DropZone = styled(Paper)(({ theme, isDragOver }) => ({
  border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.grey[400]}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(5),
  textAlign: 'center',
  backgroundColor: isDragOver ? theme.palette.action.hover : theme.palette.grey[50],
  transition: theme.transitions.create(['border-color', 'background-color']),
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const HiddenInput = styled('input')({
  display: 'none',
});

const UploadMode = ({ showLoading, hideLoading, showMessage }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    enableToc: false,
    numberedSections: false,
    customHeader: '',
    customFooter: '',
  });

  const validateFiles = useCallback((files) => {
    const validExtensions = ['.md', '.markdown', '.txt'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

      if (!hasValidExtension) {
        errors.push(`Invalid file type: ${file.name}. Please upload only .md, .markdown, or .txt files`);
        return;
      }

      if (file.size > maxFileSize) {
        errors.push(`File too large: ${file.name}. Maximum size is 10MB per file`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  }, []);

  const handleFileSelect = useCallback((files) => {
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      showMessage(errors[0], 'error');
      return;
    }

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      const fileText = validFiles.length === 1 ? 'file' : 'files';
      showMessage(`${validFiles.length} ${fileText} selected`, 'success');
    }
  }, [validateFiles, showMessage]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      showMessage('Please select one or more files', 'warning');
      return;
    }

    const fileNames = selectedFiles.map(f => f.name).join(', ');
    showLoading(`Converting ${selectedFiles.length} file(s) to DOCX...`);

    try {
      const formData = new FormData();

      if (selectedFiles.length === 1) {
        // Single file conversion
        formData.append('file', selectedFiles[0]);
        formData.append('options', JSON.stringify(advancedOptions));

        const response = await fetch('/convert-advanced', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Conversion failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFiles[0].name.replace(/\.(md|markdown|txt)$/i, '.docx');
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        trackFileUpload(1);
        showMessage('File converted successfully!', 'success');
      } else {
        // Batch conversion
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('options', JSON.stringify(advancedOptions));

        const response = await fetch('/convert-batch', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Batch conversion failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
        a.download = `converted_files_${timestamp}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        trackFileUpload(selectedFiles.length);
        showMessage(`Successfully converted ${selectedFiles.length} files!`, 'success');
      }

      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      showMessage(`Error: ${error.message}`, 'error');
    } finally {
      hideLoading();
    }
  };

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Upload Markdown Files
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select one or more markdown files to convert
        </Typography>
      </Box>

      <DropZone
        elevation={1}
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag and drop your markdown files here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to browse
        </Typography>
        <Button variant="contained" component="span">
          Select Files
        </Button>
        <HiddenInput
          id="file-input"
          type="file"
          multiple
          accept=".md,.markdown,.txt"
          onChange={handleFileInputChange}
        />
      </DropZone>

      {selectedFiles.length > 0 && (
        <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Selected Files ({selectedFiles.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Delete />}
              onClick={clearFiles}
            >
              Clear All
            </Button>
          </Box>

          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </Button>
                }
              >
                <ListItemIcon>
                  <FilePresent />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                      <Chip
                        label={formatFileSize(file.size)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={file.type || 'text/plain'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Button
            variant="contained"
            size="large"
            startIcon={<Description />}
            onClick={handleConvert}
            sx={{ mt: 2 }}
            fullWidth
          >
            Convert Selected Files
          </Button>
        </Paper>
      )}

      <Alert severity="info" sx={{ mt: 2 }}>
        💡 You can select multiple files. Advanced options below apply to all uploads.
      </Alert>

      <Box sx={{ mt: 3 }}>
        <AdvancedOptions
          options={advancedOptions}
          onChange={setAdvancedOptions}
        />
      </Box>
    </Box>
  );
};

export default UploadMode;
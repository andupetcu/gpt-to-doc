# Markdown to DOCX Converter - API Documentation

## Overview

This API provides comprehensive Markdown to DOCX/PDF conversion capabilities with support for file uploads, text conversion, batch processing, and advanced formatting options.

**Base URL**: `https://gpt-to-doc.com`  
**Content-Type**: `application/json` (for text endpoints) or `multipart/form-data` (for file uploads)

## Rate Limits

- **File Uploads**: 10 requests per minute per IP
- **Text Conversion**: 20 requests per minute per IP  
- **General Requests**: 100 requests per hour per IP

## File Size Limits

- **Maximum file size**: 10MB
- **Maximum text length**: 10MB (10,485,760 bytes)

## Supported File Types

- `.md` (Markdown)
- `.markdown` (Markdown)
- `.txt` (Plain text)

---

## API Endpoints

### 1. Frontend Interface

#### GET `/`
Serves the main web interface.

**Response**: HTML page with the conversion interface

---

### 2. Basic File Upload Conversion

#### POST `/convert`
Converts a single Markdown file to DOCX format.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): Markdown file to convert

**Response**: DOCX file download

**Example using curl**:
```bash
curl -X POST \
  -F "file=@document.md" \
  https://gpt-to-doc.com/convert \
  --output converted.docx
```

**Error Responses**:
- `400`: No file uploaded, empty filename, or invalid file type
- `413`: File too large (>10MB)
- `429`: Rate limit exceeded
- `500`: Conversion failed

---

### 3. Advanced File Upload Conversion

#### POST `/convert-advanced`
Converts a single Markdown file to DOCX with advanced formatting options.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): Markdown file to convert
- `options` (optional): JSON string with conversion options

**Advanced Options**:
```json
{
  "enableToc": true,           // Enable table of contents
  "numberedSections": true,    // Number sections automatically
  "customHeader": "My Document Header",  // Custom header text
  "customFooter": "© 2024 Company Name"  // Custom footer text
}
```

**Example using curl**:
```bash
curl -X POST \
  -F "file=@document.md" \
  -F 'options={"enableToc":true,"numberedSections":true,"customHeader":"My Report"}' \
  https://gpt-to-doc.com/convert-advanced \
  --output advanced.docx
```

**Response**: DOCX file download with applied formatting options

---

### 4. Basic Text Conversion (Legacy)

#### POST `/convert-text`
Converts Markdown text to DOCX format (basic conversion).

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "markdown": "# My Document\n\nThis is **bold** text."
}
```

**Response**: DOCX file download named `converted.docx`

**Example using curl**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello World\n\nThis is a **test** document."}' \
  https://gpt-to-doc.com/convert-text \
  --output converted.docx
```

---

### 5. Advanced Text Conversion

#### POST `/convert-text-advanced`
Converts Markdown text to DOCX with advanced formatting options.

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "markdown": "# My Document\n\nThis is **bold** text with advanced formatting.",
  "options": {
    "enableToc": true,
    "numberedSections": true,
    "customHeader": "Document Title",
    "customFooter": "Page Footer"
  }
}
```

**Advanced Options**:
- `enableToc` (boolean): Generate table of contents with 3-level depth
- `numberedSections` (boolean): Automatically number sections
- `customHeader` (string): Text to appear in document header
- `customFooter` (string): Text to appear in document footer

**Response**: DOCX file download named `converted.docx`

**Example using JavaScript**:
```javascript
const response = await fetch('/convert-text-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    markdown: '# Report\n\n## Section 1\n\nContent here.',
    options: {
      enableToc: true,
      numberedSections: true,
      customHeader: 'Quarterly Report',
      customFooter: '© 2024 Company'
    }
  })
});

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.docx';
  a.click();
}
```

---

### 6. Batch File Conversion

#### POST `/convert-batch`
Converts multiple Markdown files to DOCX format and returns them in a ZIP archive.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `files` (required): Array of Markdown files to convert
- `options` (optional): JSON string with conversion options (applied to all files)

**Response**: ZIP file download containing all converted DOCX files

**Example using curl**:
```bash
curl -X POST \
  -F "files=@doc1.md" \
  -F "files=@doc2.md" \
  -F "files=@doc3.md" \
  -F 'options={"enableToc":true,"numberedSections":true}' \
  https://gpt-to-doc.com/convert-batch \
  --output batch_converted.zip
```

**Example using JavaScript**:
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('files', file3);
formData.append('options', JSON.stringify({
  enableToc: true,
  numberedSections: true
}));

const response = await fetch('/convert-batch', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const blob = await response.blob();
  // Handle ZIP download
}
```

---

### 7. PDF Conversion

#### POST `/convert-pdf`
Converts Markdown text to PDF format with Unicode support.

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "markdown": "# My PDF Document\n\nThis will be converted to PDF format."
}
```

**Response**: PDF file download named `converted.pdf`

**Features**:
- Uses XeLaTeX engine for better Unicode support
- A4 page size
- Arial font for compatibility
- Enhanced error handling for LaTeX issues

**Example using curl**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# PDF Report\n\n## Overview\n\nThis is a PDF document with **formatting**."}' \
  https://gpt-to-doc.com/convert-pdf \
  --output converted.pdf
```

---

### 8. Save Markdown File

#### POST `/save-md`
Saves Markdown text as a downloadable `.md` file.

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "markdown": "# My Markdown\n\nContent to save as .md file."
}
```

**Response**: Markdown file download named `document.md`

**Example using curl**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Saved Document\n\nThis content will be saved as a .md file."}' \
  https://gpt-to-doc.com/save-md \
  --output saved.md
```

---

## Response Formats

### Success Responses
All successful conversion endpoints return the converted file as a binary download with appropriate headers:

```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document (for DOCX)
Content-Type: application/pdf (for PDF)
Content-Type: text/markdown (for MD)
Content-Disposition: attachment; filename="filename.ext"
```

### Error Responses
All error responses return JSON with an error message:

```json
{
  "error": "Description of the error"
}
```

**Common Error Codes**:
- `400 Bad Request`: Invalid input, missing parameters, or malformed data
- `413 Payload Too Large`: File or text content exceeds size limits
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Conversion failed or server error

---

## Advanced Features

### Table of Contents Generation
When `enableToc: true` is specified:
- Automatically generates a table of contents
- Uses 3-level depth (H1, H2, H3)
- Placed at the beginning of the document

### Section Numbering  
When `numberedSections: true` is specified:
- Automatically numbers all headings
- Maintains hierarchical numbering (1, 1.1, 1.1.1)

### Custom Headers and Footers
- `customHeader`: Adds text to document header area
- `customFooter`: Adds text to document footer area
- Implemented via YAML frontmatter in the Markdown

### File Processing Features
- **Automatic Cleanup**: Temporary files are automatically deleted after configured time
- **Security**: Filenames are sanitized to prevent path traversal attacks
- **Logging**: All operations are logged for monitoring and debugging
- **UUID Naming**: Prevents filename conflicts with UUID-based temporary names

---

## Security Considerations

### File Upload Security
- File type validation (only .md, .markdown, .txt allowed)
- Filename sanitization to prevent path traversal
- File size limits to prevent resource exhaustion

### Rate Limiting
- IP-based rate limiting on all endpoints
- Different limits for different operation types
- Configurable limits via application configuration

### Input Validation
- Text length validation
- JSON schema validation for options
- Subprocess argument sanitization

---

## Configuration

The API behavior can be configured through environment variables or configuration files:

### Key Configuration Options
- `MAX_FILE_SIZE`: Maximum file size (default: 10MB)
- `RATE_LIMIT_UPLOADS`: Upload rate limit (default: "10 per minute")
- `RATE_LIMIT_TEXT`: Text conversion rate limit (default: "20 per minute")
- `FILE_CLEANUP_ENABLED`: Enable automatic file cleanup (default: true)
- `FILE_MAX_AGE`: Maximum file age before cleanup (default: 3600 seconds)
- `LOG_LEVEL`: Logging level (default: "INFO")

---

## Error Handling Examples

### Invalid File Type
```bash
curl -X POST -F "file=@document.pdf" http://localhost:5000/convert
```
Response:
```json
{
  "error": "Invalid file type. Only .md, .markdown, and .txt files are allowed"
}
```

### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded: 10 per 1 minute"
}
```

### File Too Large
```json
{
  "error": "File too large. Maximum size is 10MB."
}
```

### Conversion Failed
```json
{
  "error": "Conversion failed. Please check your markdown file."
}
```

---

## Usage Examples

### Python Example
```python
import requests

# Convert text to DOCX with advanced options
data = {
    "markdown": "# My Report\n\n## Introduction\n\nThis is a test document.",
    "options": {
        "enableToc": True,
        "numberedSections": True,
        "customHeader": "Company Report",
        "customFooter": "Confidential"
    }
}

response = requests.post(
    'https://gpt-to-doc.com/convert-text-advanced',
    json=data
)

if response.status_code == 200:
    with open('report.docx', 'wb') as f:
        f.write(response.content)
    print("Document converted successfully!")
else:
    print(f"Error: {response.json()['error']}")
```

### Node.js Example
```javascript
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function convertFile() {
    const form = new FormData();
    form.append('file', fs.createReadStream('document.md'));
    form.append('options', JSON.stringify({
        enableToc: true,
        numberedSections: true
    }));

    const response = await fetch('https://gpt-to-doc.com/convert-advanced', {
        method: 'POST',
        body: form
    });

    if (response.ok) {
        const buffer = await response.buffer();
        fs.writeFileSync('converted.docx', buffer);
        console.log('File converted successfully!');
    } else {
        const error = await response.json();
        console.error('Error:', error.error);
    }
}

convertFile();
```

---

## Monitoring and Logging

### Log Levels
- `INFO`: Normal operations, successful conversions
- `WARNING`: Non-critical issues, rate limits, validation failures  
- `ERROR`: Conversion failures, system errors
- `DEBUG`: Detailed debugging information

### Log Format
```
2024-01-15 10:30:45,123 - __main__ - INFO - Successfully converted document_abc123 to DOCX
2024-01-15 10:30:46,456 - __main__ - WARNING - Rate limit exceeded for IP 192.168.1.100
2024-01-15 10:30:47,789 - __main__ - ERROR - Pandoc conversion failed: LaTeX Error
```

### Health Monitoring
Monitor these metrics for production deployment:
- Conversion success/failure rates
- Average processing time
- Rate limit violations
- File cleanup operations
- Disk space usage in upload/output directories

---

This API provides a robust, scalable solution for Markdown to DOCX/PDF conversion with enterprise-grade features including rate limiting, security measures, batch processing, and comprehensive error handling.

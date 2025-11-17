# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Markdown to DOCX/PDF converter web application with a Flask backend and HTML/CSS/JavaScript frontend, containerized using Docker. The app converts Markdown files and text to Microsoft Word (DOCX) and PDF formats using Pandoc.

## Architecture

The application follows a simple client-server architecture:
- **Backend**: Flask API (Python 3.9) at `backend/app.py`
- **Frontend**: Vanilla HTML/CSS/JavaScript at `frontend/`
- **Converter**: Pandoc with XeLaTeX for document conversion
- **Containerization**: Docker with docker-compose for deployment

## Key Commands

### Development
```bash
# Run the application locally (without Docker)
cd backend
pip install -r requirements.txt
python app.py  # Serves on http://localhost:5000

# Run with Docker
docker-compose up --build

# Build Docker image only
docker build -t markdown-converter .
```

### Testing
No automated tests are currently configured. Test the application manually by:
1. Converting a markdown file via the file upload interface
2. Converting markdown text via the text input interface
3. Generating PDF output to test XeLaTeX configuration

## API Endpoints

- `GET /` - Serve frontend application
- `POST /convert` - Convert uploaded .md file to DOCX
- `POST /convert-text` - Convert markdown text (JSON) to DOCX
- `POST /convert-pdf` - Convert markdown text to PDF with Unicode support
- `POST /save-md` - Save markdown text as .md file

All conversion endpoints use Pandoc subprocess calls and return files as downloads.

## File Structure

- `backend/app.py` - Flask application with all API endpoints
- `backend/uploads/` - Temporary storage for uploaded/generated markdown files
- `backend/outputs/` - Storage for converted DOCX/PDF files
- `frontend/index.html` - Main UI with SEO optimization and Google Analytics
- `frontend/script.js` - Client-side logic for file uploads and API calls
- `frontend/style.css` - UI styling with responsive design

## Important Implementation Details

1. **File Handling**: Uses UUID for temporary filenames to prevent conflicts
2. **PDF Generation**: Configured with XeLaTeX engine, A4 paper, and Arial font for Unicode support
3. **Error Handling**: Basic try-catch blocks around subprocess calls
4. **No File Cleanup**: Temporary files persist after conversion (potential improvement area)
5. **No Input Validation**: Accepts any file as markdown without validation
6. **Security Considerations**: No rate limiting, file size limits, or authentication implemented
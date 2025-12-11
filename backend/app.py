from flask import Flask, request, send_file, jsonify, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import subprocess
import uuid
import logging
import threading
import time
import re
import json
import zipfile
from pathlib import Path
from datetime import datetime, timedelta
from config import Config

# Initialize Flask app
app = Flask(__name__, static_folder="build", static_url_path="/")
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE

# Enable CORS for Next.js frontend
CORS(app,
    resources={
        r"/convert*": {
            "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://192.168.68.50:3000", "http://192.168.68.50:3001"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
            "supports_credentials": True
        },
        r"/save-md": {
            "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://192.168.68.50:3000", "http://192.168.68.50:3001"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
            "supports_credentials": True
        }
    }
)

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[Config.RATE_LIMIT_DEFAULT],
    storage_uri="memory://"
)

# Create upload and output directories
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)

# Helper functions
def allowed_file(filename):
    """Check if file has allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def build_pandoc_command(md_path, docx_path, options):
    """Build Pandoc command with advanced options."""
    pandoc_args = ["pandoc", md_path, "-o", docx_path]
    
    # Table of Contents
    if options.get('enableToc'):
        pandoc_args.append("--toc")
        pandoc_args.extend(["--toc-depth", "3"])
        logger.info(f"TOC enabled: Adding --toc --toc-depth 3")
    
    # Numbered Sections
    if options.get('numberedSections'):
        pandoc_args.append("--number-sections")
    
    # Default to no syntax highlighting since option was removed
    pandoc_args.append("--no-highlight")
    
    # Store custom header/footer for metadata processing
    custom_header = options.get('customHeader', '').strip()
    custom_footer = options.get('customFooter', '').strip()
    
    # Add header and footer if provided
    if custom_header:
        pandoc_args.extend(["-V", f"header-title:{custom_header}"])
    
    if custom_footer:
        pandoc_args.extend(["-V", f"footer-left:{custom_footer}"])
    
    # Additional formatting options
    pandoc_args.extend([
        "--standalone",  # Create a standalone document
        "--wrap", "auto",  # Automatic text wrapping
    ])
    
    # Debug: Log the complete Pandoc command
    logger.info(f"Executing Pandoc command: {' '.join(pandoc_args)}")
    
    return pandoc_args

def process_markdown_with_headers_footers(md_path, options):
    """Add custom headers/footers to markdown content via YAML frontmatter."""
    custom_header = options.get('customHeader', '').strip()
    custom_footer = options.get('customFooter', '').strip()
    
    if not custom_header and not custom_footer:
        return  # Nothing to do
        
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Build YAML frontmatter for headers/footers
    yaml_lines = ['---']
    
    # For DOCX, we use title and subtitle for basic header/footer functionality
    if custom_header:
        yaml_lines.append(f'title: "{custom_header}"')
    
    if custom_footer:
        yaml_lines.append(f'subtitle: "{custom_footer}"')
    
    yaml_lines.append('---')
    yaml_lines.append('')  # Empty line after frontmatter
    
    # Check if content already has frontmatter
    if content.startswith('---'):
        # Find end of existing frontmatter
        lines = content.split('\n')
        frontmatter_end = -1
        for i, line in enumerate(lines[1:], 1):
            if line.strip() == '---':
                frontmatter_end = i
                break
        
        if frontmatter_end > 0:
            # Merge with existing frontmatter
            existing_frontmatter = lines[1:frontmatter_end]
            remaining_content = '\n'.join(lines[frontmatter_end + 1:])
            
            # Build new frontmatter
            new_frontmatter = ['---']
            new_frontmatter.extend(existing_frontmatter)
            
            # Add our header/footer fields if they don't exist
            has_title = any('title:' in line for line in existing_frontmatter)
            has_subtitle = any('subtitle:' in line for line in existing_frontmatter)
            
            if custom_header and not has_title:
                new_frontmatter.append(f'title: "{custom_header}"')
            if custom_footer and not has_subtitle:
                new_frontmatter.append(f'subtitle: "{custom_footer}"')
            
            new_frontmatter.append('---')
            new_frontmatter.append('')
            
            content = '\n'.join(new_frontmatter) + remaining_content
        else:
            # Invalid frontmatter, prepend our own
            content = '\n'.join(yaml_lines) + content
    else:
        # No existing frontmatter, prepend our own
        content = '\n'.join(yaml_lines) + content
    
    # Write updated content back to file
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)

def sanitize_filename(filename):
    """Sanitize filename to prevent path traversal attacks."""
    # Remove any path components
    filename = secure_filename(filename)
    # Remove any non-alphanumeric characters except dots, hyphens, and underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    return filename

def cleanup_old_files():
    """Remove files older than configured max age."""
    while Config.FILE_CLEANUP_ENABLED:
        try:
            current_time = datetime.now()
            
            # Clean upload folder
            for folder in [Config.UPLOAD_FOLDER, Config.OUTPUT_FOLDER]:
                for file_path in Path(folder).glob('*'):
                    if file_path.is_file():
                        file_age = current_time - datetime.fromtimestamp(file_path.stat().st_mtime)
                        if file_age > timedelta(seconds=Config.FILE_MAX_AGE):
                            file_path.unlink()
                            logger.info(f"Deleted old file: {file_path}")
            
        except Exception as e:
            logger.error(f"Error during file cleanup: {e}")
        
        time.sleep(Config.FILE_CLEANUP_INTERVAL)

# Start cleanup thread
if Config.FILE_CLEANUP_ENABLED:
    cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
    cleanup_thread.start()
    logger.info("File cleanup scheduler started")

@app.route("/health")
def health_check():
    """Health check endpoint for deployment platforms (Docker, Kubernetes, etc)."""
    return jsonify({"status": "healthy", "service": "markdown-converter-api"}), 200

@app.route("/")
def serve_frontend():
    """Serve the React frontend index.html page or return API info."""
    # Try to serve React build if it exists, otherwise return API info
    try:
        response = send_from_directory("build", "index.html")
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception:
        # If build directory doesn't exist (common in microservice deployments),
        # return API information instead
        return jsonify({
            "service": "Markdown to DOCX/PDF Converter API",
            "version": "2.0.0",
            "endpoints": {
                "health": "/health",
                "convert_text": "POST /convert-text",
                "convert_text_advanced": "POST /convert-text-advanced",
                "convert_file": "POST /convert",
                "convert_advanced": "POST /convert-advanced",
                "convert_batch": "POST /convert-batch",
                "convert_pdf": "POST /convert-pdf",
                "save_markdown": "POST /save-md"
            }
        }), 200

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve React build static files."""
    response = send_from_directory("build", filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/convert', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_UPLOADS)
def convert_md_to_docx():
    """Handles Markdown file uploads and converts them to DOCX."""
    try:
        # Validate file upload
        if 'file' not in request.files:
            logger.warning("No file uploaded in request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        if file.filename == '':
            logger.warning("Empty filename in upload request")
            return jsonify({"error": "No selected file"}), 400

        # Validate file type
        if not allowed_file(file.filename):
            logger.warning(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Invalid file type. Only .md, .markdown, and .txt files are allowed"}), 400

        # Sanitize filename
        original_filename = sanitize_filename(file.filename.rsplit('.', 1)[0])
        temp_id = str(uuid.uuid4())[:8]
        filename = f"{original_filename}_{temp_id}"
        
        md_path = os.path.join(Config.UPLOAD_FOLDER, f"{filename}.md")
        docx_path = os.path.join(Config.OUTPUT_FOLDER, f"{filename}.docx")

        # Save uploaded file
        file.save(md_path)
        logger.info(f"File uploaded: {md_path}")

        # Convert to DOCX
        result = subprocess.run(
            ["pandoc", md_path, "-o", docx_path],
            check=True,
            capture_output=True,
            text=True
        )
        
        logger.info(f"Successfully converted {filename} to DOCX")
        return send_file(docx_path, as_attachment=True, download_name=f"{original_filename}.docx")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Pandoc conversion failed: {e.stderr}")
        return jsonify({"error": "Conversion failed. Please check your markdown file."}), 500
    except Exception as e:
        logger.error(f"Unexpected error in convert_md_to_docx: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/convert-advanced', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_UPLOADS)
def convert_md_file_to_docx_advanced():
    """Handles Markdown file uploads and converts them to DOCX with advanced options."""
    try:
        # Validate file upload
        if 'file' not in request.files:
            logger.warning("No file uploaded in advanced request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        if file.filename == '':
            logger.warning("Empty filename in advanced upload request")
            return jsonify({"error": "No selected file"}), 400

        # Get advanced options
        options_json = request.form.get('options', '{}')
        try:
            options = json.loads(options_json)
        except json.JSONDecodeError:
            logger.warning("Invalid options JSON in upload request")
            options = {}

        # Validate file type
        if not allowed_file(file.filename):
            logger.warning(f"Invalid file type in advanced request: {file.filename}")
            return jsonify({"error": "Invalid file type. Only .md, .markdown, and .txt files are allowed"}), 400

        # Sanitize filename
        original_filename = sanitize_filename(file.filename.rsplit('.', 1)[0])
        temp_id = str(uuid.uuid4())[:8]
        filename = f"{original_filename}_{temp_id}"
        
        md_path = os.path.join(Config.UPLOAD_FOLDER, f"{filename}.md")
        docx_path = os.path.join(Config.OUTPUT_FOLDER, f"{filename}.docx")

        # Save uploaded file
        file.save(md_path)
        logger.info(f"File uploaded for advanced conversion: {md_path}")

        # Process headers/footers in markdown content
        process_markdown_with_headers_footers(md_path, options)

        # Build Pandoc command with advanced options
        pandoc_args = build_pandoc_command(md_path, docx_path, options)
        
        # Convert to DOCX with advanced options
        result = subprocess.run(
            pandoc_args,
            check=True,
            capture_output=True,
            text=True
        )
        
        logger.info(f"Successfully converted {filename} to DOCX with advanced options")
        return send_file(docx_path, as_attachment=True, download_name=f"{original_filename}.docx")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Pandoc advanced file conversion failed: {e.stderr}")
        return jsonify({"error": "Advanced conversion failed. Please check your file and options."}), 500
    except Exception as e:
        logger.error(f"Unexpected error in convert_md_file_to_docx_advanced: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/convert-text', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_TEXT)
def convert_md_text_to_docx():
    """Handles basic Markdown text conversion to DOCX (legacy endpoint)."""
    try:
        data = request.get_json()
        if not data or 'markdown' not in data:
            logger.warning("No markdown text in request")
            return jsonify({"error": "No Markdown text provided"}), 400

        markdown_text = data['markdown']
        
        # Validate text length
        if len(markdown_text) > Config.MAX_FILE_SIZE:
            logger.warning(f"Text too large: {len(markdown_text)} bytes")
            return jsonify({"error": "Text content too large"}), 400
        
        if not markdown_text.strip():
            logger.warning("Empty markdown text provided")
            return jsonify({"error": "Markdown text is empty"}), 400

        temp_filename = str(uuid.uuid4())
        md_path = os.path.join(Config.UPLOAD_FOLDER, f"{temp_filename}.md")
        docx_path = os.path.join(Config.OUTPUT_FOLDER, f"{temp_filename}.docx")

        with open(md_path, 'w', encoding='utf-8') as md_file:
            md_file.write(markdown_text)

        # Convert to DOCX
        result = subprocess.run(
            ["pandoc", md_path, "-o", docx_path],
            check=True,
            capture_output=True,
            text=True
        )
        
        logger.info(f"Successfully converted text to DOCX: {temp_filename}")
        return send_file(docx_path, as_attachment=True, download_name="converted.docx")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Pandoc conversion failed: {e.stderr}")
        return jsonify({"error": "Conversion failed. Please check your markdown text."}), 500
    except Exception as e:
        logger.error(f"Unexpected error in convert_md_text_to_docx: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/convert-text-advanced', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_TEXT)
def convert_md_text_to_docx_advanced():
    """Handles advanced Markdown text conversion to DOCX with options."""
    try:
        data = request.get_json()
        if not data or 'markdown' not in data:
            logger.warning("No markdown text in advanced request")
            return jsonify({"error": "No Markdown text provided"}), 400

        markdown_text = data['markdown']
        options = data.get('options', {})
        
        # Debug: Log the received options
        logger.info(f"Received options for text conversion: {options}")
        
        # Validate text length
        if len(markdown_text) > Config.MAX_FILE_SIZE:
            logger.warning(f"Text too large: {len(markdown_text)} bytes")
            return jsonify({"error": "Text content too large"}), 400
        
        if not markdown_text.strip():
            logger.warning("Empty markdown text provided")
            return jsonify({"error": "Markdown text is empty"}), 400

        temp_filename = str(uuid.uuid4())
        md_path = os.path.join(Config.UPLOAD_FOLDER, f"{temp_filename}.md")
        docx_path = os.path.join(Config.OUTPUT_FOLDER, f"{temp_filename}.docx")

        with open(md_path, 'w', encoding='utf-8') as md_file:
            md_file.write(markdown_text)

        # Process headers/footers in markdown content
        process_markdown_with_headers_footers(md_path, options)

        # Build Pandoc command with advanced options
        pandoc_args = build_pandoc_command(md_path, docx_path, options)
        
        # Convert to DOCX with advanced options
        result = subprocess.run(
            pandoc_args,
            check=True,
            capture_output=True,
            text=True
        )
        
        logger.info(f"Successfully converted text to DOCX with options: {temp_filename}")
        return send_file(docx_path, as_attachment=True, download_name="converted.docx")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Pandoc advanced conversion failed: {e.stderr}")
        return jsonify({"error": "Advanced conversion failed. Please check your options and markdown text."}), 500
    except Exception as e:
        logger.error(f"Unexpected error in convert_md_text_to_docx_advanced: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/convert-batch', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_UPLOADS)
def convert_batch_files_to_docx():
    """Handles batch Markdown file uploads and converts them to DOCX files in a ZIP."""
    try:
        # Validate files upload
        if 'files' not in request.files:
            logger.warning("No files uploaded in batch request")
            return jsonify({"error": "No files uploaded"}), 400

        files = request.files.getlist('files')
        if not files or len(files) == 0:
            logger.warning("Empty files list in batch request")
            return jsonify({"error": "No files selected"}), 400

        # Get advanced options
        options_json = request.form.get('options', '{}')
        try:
            options = json.loads(options_json)
        except json.JSONDecodeError:
            logger.warning("Invalid options JSON in batch request")
            options = {}

        # Validate each file
        for file in files:
            if file.filename == '':
                logger.warning("Empty filename in batch upload")
                return jsonify({"error": "One or more files have empty filenames"}), 400
            
            if not allowed_file(file.filename):
                logger.warning(f"Invalid file type in batch: {file.filename}")
                return jsonify({"error": f"Invalid file type: {file.filename}. Only .md, .markdown, and .txt files are allowed"}), 400

        # Process all files
        batch_id = str(uuid.uuid4())[:8]
        converted_files = []
        
        logger.info(f"Processing batch of {len(files)} files with ID: {batch_id}")
        
        for i, file in enumerate(files):
            try:
                # Sanitize filename
                original_filename = sanitize_filename(file.filename.rsplit('.', 1)[0])
                temp_id = f"{batch_id}_{i:03d}"
                filename = f"{original_filename}_{temp_id}"
                
                md_path = os.path.join(Config.UPLOAD_FOLDER, f"{filename}.md")
                docx_path = os.path.join(Config.OUTPUT_FOLDER, f"{filename}.docx")

                # Save uploaded file
                file.save(md_path)
                logger.info(f"Batch file saved: {md_path}")

                # Process headers/footers in markdown content
                process_markdown_with_headers_footers(md_path, options)

                # Build Pandoc command with advanced options
                pandoc_args = build_pandoc_command(md_path, docx_path, options)
                
                # Convert to DOCX with advanced options
                result = subprocess.run(
                    pandoc_args,
                    check=True,
                    capture_output=True,
                    text=True
                )
                
                converted_files.append({
                    'original_name': file.filename,
                    'docx_path': docx_path,
                    'docx_filename': f"{original_filename}.docx"
                })
                
                logger.info(f"Successfully converted batch file {i+1}/{len(files)}: {filename}")
                
            except subprocess.CalledProcessError as e:
                logger.error(f"Pandoc batch conversion failed for {file.filename}: {e.stderr}")
                return jsonify({"error": f"Conversion failed for {file.filename}. Please check the file format."}), 500
            except Exception as e:
                logger.error(f"Error processing batch file {file.filename}: {str(e)}")
                return jsonify({"error": f"Error processing {file.filename}"}), 500

        # Create ZIP file with all converted documents
        zip_filename = f"batch_converted_{batch_id}.zip"
        zip_path = os.path.join(Config.OUTPUT_FOLDER, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_info in converted_files:
                zipf.write(file_info['docx_path'], file_info['docx_filename'])
        
        logger.info(f"Successfully created batch ZIP: {zip_path} with {len(converted_files)} files")
        return send_file(zip_path, as_attachment=True, download_name=f"converted_files_{batch_id}.zip")
        
    except Exception as e:
        logger.error(f"Unexpected error in convert_batch_files_to_docx: {str(e)}")
        return jsonify({"error": "An unexpected error occurred during batch processing"}), 500

@app.route('/convert-pdf', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_TEXT)
def convert_md_to_pdf():
    """Converts Markdown text to PDF with Unicode support."""
    try:
        data = request.get_json()
        if not data or 'markdown' not in data:
            logger.warning("No markdown text in PDF request")
            return jsonify({"error": "No Markdown text provided"}), 400

        markdown_text = data['markdown']
        
        # Validate text length
        if len(markdown_text) > Config.MAX_FILE_SIZE:
            logger.warning(f"Text too large for PDF: {len(markdown_text)} bytes")
            return jsonify({"error": "Text content too large"}), 400
        
        if not markdown_text.strip():
            logger.warning("Empty markdown text for PDF")
            return jsonify({"error": "Markdown text is empty"}), 400

        temp_filename = str(uuid.uuid4())
        md_path = os.path.join(Config.UPLOAD_FOLDER, f"{temp_filename}.md")
        pdf_path = os.path.join(Config.OUTPUT_FOLDER, f"{temp_filename}.pdf")

        with open(md_path, 'w', encoding='utf-8') as md_file:
            md_file.write(markdown_text)

        # Convert to PDF using XeLaTeX for Unicode support
        result = subprocess.run([
            "pandoc", md_path, "-o", pdf_path,
            "--pdf-engine=xelatex",  # Use XeLaTeX for Unicode
            "--variable", "geometry:a4paper",  # Set A4 page size
            "--variable", "mainfont=Arial"  # Use a Unicode-compatible font
        ], check=True, capture_output=True, text=True)

        logger.info(f"Successfully converted text to PDF: {temp_filename}")
        return send_file(pdf_path, as_attachment=True, download_name="converted.pdf")
        
    except subprocess.CalledProcessError as e:
        logger.error(f"PDF conversion failed: {e.stderr}")
        return jsonify({"error": "PDF conversion failed. This might be due to Unicode issues or LaTeX errors."}), 500
    except Exception as e:
        logger.error(f"Unexpected error in convert_md_to_pdf: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


# =============================================================================
# THEMED DOCUMENT CONVERSION ENDPOINTS
# =============================================================================

# Available themes for styled DOCX export
AVAILABLE_THEMES = {
    'plain': 'Plain (Default)',
    'color': 'Professional Color',
    'ocean': 'Ocean Corporate',
    'sunset': 'Sunset Warm',
    'midnight': 'Midnight Tech',
    'forest': 'Forest Nature',
    'executive': 'Executive Minimal'
}

@app.route('/templates/<theme_name>.docx', methods=['GET'])
def get_template_preview(theme_name):
    """Serve template preview DOCX files for download."""
    # Map theme names to file names
    theme_files = {
        'color': 'theme0-color.docx',
        'ocean': 'theme1-ocean-corporate.docx',
        'sunset': 'theme2-sunset-warm.docx',
        'midnight': 'theme3-midnight-tech.docx',
        'forest': 'theme4-forest-nature.docx',
        'executive': 'theme5-executive-minimal.docx'
    }

    if theme_name not in theme_files:
        return jsonify({"error": f"Template '{theme_name}' not found. Available: {list(theme_files.keys())}"}), 404

    template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', theme_files[theme_name])

    if not os.path.exists(template_path):
        logger.error(f"Template file not found: {template_path}")
        return jsonify({"error": "Template file not found"}), 404

    logger.info(f"Serving template preview: {theme_name}")
    return send_file(template_path, as_attachment=True, download_name=f"template-{theme_name}.docx")

@app.route('/themes', methods=['GET'])
def get_available_themes():
    """Return list of available themes for the frontend."""
    return jsonify({
        "themes": AVAILABLE_THEMES,
        "default": "plain"
    })

@app.route('/convert-themed', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_TEXT)
def convert_md_text_to_themed_docx():
    """Convert markdown text to styled DOCX using theme templates."""
    try:
        data = request.get_json()
        if not data or 'markdown' not in data:
            logger.warning("No markdown text in themed request")
            return jsonify({"error": "No Markdown text provided"}), 400

        markdown_text = data['markdown']
        theme = data.get('theme', 'plain')

        # Validate theme
        if theme not in AVAILABLE_THEMES:
            logger.warning(f"Invalid theme requested: {theme}")
            return jsonify({"error": f"Invalid theme. Available: {list(AVAILABLE_THEMES.keys())}"}), 400

        # Validate text length
        if len(markdown_text) > Config.MAX_FILE_SIZE:
            logger.warning(f"Text too large for themed conversion: {len(markdown_text)} bytes")
            return jsonify({"error": "Text content too large"}), 400

        if not markdown_text.strip():
            logger.warning("Empty markdown text for themed conversion")
            return jsonify({"error": "Markdown text is empty"}), 400

        temp_filename = str(uuid.uuid4())
        md_path = os.path.join(Config.UPLOAD_FOLDER, f"{temp_filename}.md")
        docx_path = os.path.join(Config.OUTPUT_FOLDER, f"{temp_filename}.docx")

        # Write markdown to temp file
        with open(md_path, 'w', encoding='utf-8') as md_file:
            md_file.write(markdown_text)

        # Use plain pandoc for 'plain' theme, Node.js converter for others
        if theme == 'plain':
            # Use Pandoc for plain conversion
            result = subprocess.run(
                ["pandoc", md_path, "-o", docx_path],
                check=True,
                capture_output=True,
                text=True
            )
        else:
            # Use Node.js themed converter
            # In Docker, templates are at /app/templates, backend is at /app/backend
            templates_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates')
            converter_path = os.path.join(templates_dir, 'convert-with-theme.js')

            logger.info(f"Running themed converter: node {converter_path} {md_path} {docx_path} {theme}")
            logger.info(f"Templates directory: {templates_dir}")

            result = subprocess.run(
                ["node", converter_path, md_path, docx_path, theme],
                check=True,
                capture_output=True,
                text=True,
                cwd=templates_dir  # Run from templates directory where node_modules is installed
            )

            if result.stdout:
                logger.info(f"Converter output: {result.stdout}")

        logger.info(f"Successfully converted text to themed DOCX: {temp_filename} (theme: {theme})")
        return send_file(docx_path, as_attachment=True, download_name=f"converted-{theme}.docx")

    except subprocess.CalledProcessError as e:
        logger.error(f"Themed conversion failed - stderr: {e.stderr}")
        logger.error(f"Themed conversion failed - stdout: {e.stdout}")
        logger.error(f"Themed conversion failed - returncode: {e.returncode}")
        return jsonify({"error": f"Themed conversion failed: {e.stderr or 'Unknown error'}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in convert_md_text_to_themed_docx: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/save-md', methods=['POST'])
@limiter.limit(Config.RATE_LIMIT_TEXT)
def save_md_file():
    """Saves pasted Markdown text as a .md file."""
    try:
        data = request.get_json()
        if not data or 'markdown' not in data:
            logger.warning("No markdown text in save request")
            return jsonify({"error": "No Markdown text provided"}), 400

        markdown_text = data['markdown']
        
        # Validate text length
        if len(markdown_text) > Config.MAX_FILE_SIZE:
            logger.warning(f"Text too large to save: {len(markdown_text)} bytes")
            return jsonify({"error": "Text content too large"}), 400
        
        if not markdown_text.strip():
            logger.warning("Empty markdown text to save")
            return jsonify({"error": "Markdown text is empty"}), 400

        temp_filename = str(uuid.uuid4())
        md_path = os.path.join(Config.OUTPUT_FOLDER, f"{temp_filename}.md")

        with open(md_path, 'w', encoding='utf-8') as md_file:
            md_file.write(markdown_text)

        logger.info(f"Saved markdown file: {temp_filename}")
        return send_file(md_path, as_attachment=True, download_name="document.md")
        
    except Exception as e:
        logger.error(f"Error saving markdown file: {str(e)}")
        return jsonify({"error": "Failed to save markdown file"}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors."""
    logger.warning(f"File too large: {error}")
    return jsonify({"error": "File too large. Maximum size is 10MB."}), 413

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit errors."""
    logger.warning(f"Rate limit exceeded: {e}")
    return jsonify({"error": f"Rate limit exceeded: {e.description}"}), 429

if __name__ == '__main__':
    logger.info(f"Starting application on {Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)

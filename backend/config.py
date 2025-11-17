import os
from typing import Optional

class Config:
    """Application configuration from environment variables."""
    
    # Directory settings
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    OUTPUT_FOLDER = os.getenv('OUTPUT_FOLDER', 'outputs')
    
    # File upload settings
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 10 * 1024 * 1024))  # 10MB default
    ALLOWED_EXTENSIONS = {'md', 'markdown', 'txt'}
    
    # Rate limiting settings
    RATE_LIMIT_DEFAULT = os.getenv('RATE_LIMIT_DEFAULT', '500/hour')
    RATE_LIMIT_UPLOADS = os.getenv('RATE_LIMIT_UPLOADS', '100/hour')
    RATE_LIMIT_TEXT = os.getenv('RATE_LIMIT_TEXT', '200/hour')
    
    # File cleanup settings
    FILE_CLEANUP_ENABLED = os.getenv('FILE_CLEANUP_ENABLED', 'true').lower() == 'true'
    FILE_CLEANUP_INTERVAL = int(os.getenv('FILE_CLEANUP_INTERVAL', 3600))  # 1 hour
    FILE_MAX_AGE = int(os.getenv('FILE_MAX_AGE', 3600))  # 1 hour
    
    # Logging settings
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'app.log')
    
    # Flask settings
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    PORT = int(os.getenv('FLASK_PORT', 5000))
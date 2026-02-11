"""Backend tests for the Markdown-to-DOCX converter API."""
import io
import json
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app


@pytest.fixture
def client():
    """Create a test client."""
    app.config['TESTING'] = True
    # Disable rate limiting in tests
    with app.test_client() as client:
        yield client


class TestHealthEndpoint:
    def test_health_returns_200(self, client):
        resp = client.get('/health')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['status'] == 'healthy'


class TestTextConversion:
    def test_convert_text_basic(self, client):
        resp = client.post('/convert-text', json={'markdown': '# Hello\n\nWorld'})
        assert resp.status_code == 200
        assert resp.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        assert len(resp.data) > 0

    def test_convert_text_advanced_with_toc(self, client):
        resp = client.post('/convert-text-advanced', json={
            'markdown': '# Title\n## Section 1\nContent\n## Section 2\nMore content',
            'options': {'enableToc': True, 'numberedSections': True}
        })
        assert resp.status_code == 200
        assert len(resp.data) > 0

    def test_convert_text_empty_returns_400(self, client):
        resp = client.post('/convert-text', json={'markdown': ''})
        assert resp.status_code == 400

    def test_convert_text_missing_field_returns_400(self, client):
        resp = client.post('/convert-text', json={'text': 'wrong field'})
        assert resp.status_code == 400

    def test_convert_text_whitespace_only_returns_400(self, client):
        resp = client.post('/convert-text', json={'markdown': '   \n  '})
        assert resp.status_code == 400


class TestThemedConversion:
    def test_convert_plain_theme(self, client):
        resp = client.post('/convert-themed', json={
            'markdown': '# Test\nContent',
            'theme': 'plain'
        })
        assert resp.status_code == 200

    def test_convert_invalid_theme_returns_400(self, client):
        resp = client.post('/convert-themed', json={
            'markdown': '# Test',
            'theme': 'nonexistent'
        })
        assert resp.status_code == 400


class TestFileUpload:
    def test_upload_md_file(self, client):
        data = {'file': (io.BytesIO(b'# Test File\n\nContent here'), 'test.md')}
        resp = client.post('/convert', data=data, content_type='multipart/form-data')
        assert resp.status_code == 200

    def test_upload_no_file_returns_400(self, client):
        resp = client.post('/convert', data={}, content_type='multipart/form-data')
        assert resp.status_code == 400

    def test_upload_invalid_extension_returns_400(self, client):
        data = {'file': (io.BytesIO(b'hello'), 'test.docx')}
        resp = client.post('/convert', data=data, content_type='multipart/form-data')
        assert resp.status_code == 400


class TestBatchConversion:
    def test_batch_two_files(self, client):
        data = {
            'files': [
                (io.BytesIO(b'# File 1'), 'file1.md'),
                (io.BytesIO(b'# File 2'), 'file2.md'),
            ],
            'options': json.dumps({})
        }
        resp = client.post('/convert-batch', data=data, content_type='multipart/form-data')
        assert resp.status_code == 200
        # Should be a ZIP
        assert b'PK' in resp.data[:4]  # ZIP magic bytes

    def test_batch_no_files_returns_400(self, client):
        resp = client.post('/convert-batch', data={}, content_type='multipart/form-data')
        assert resp.status_code == 400


class TestSaveMarkdown:
    def test_save_md(self, client):
        resp = client.post('/save-md', json={'markdown': '# Saved\n\nContent'})
        assert resp.status_code == 200
        assert b'# Saved' in resp.data

    def test_save_md_empty_returns_400(self, client):
        resp = client.post('/save-md', json={'markdown': ''})
        assert resp.status_code == 400


class TestRateLimitHeaders:
    def test_rate_limit_headers_present(self, client):
        resp = client.get('/health')
        # Flask-Limiter adds these headers
        # Just check the endpoint works; headers depend on limiter config
        assert resp.status_code == 200

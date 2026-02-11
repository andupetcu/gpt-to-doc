import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock CodeMirror since it uses ESM and doesn't work with Jest
jest.mock('@uiw/react-codemirror', () => {
  return function MockCodeMirror(props) {
    return <textarea data-testid="codemirror" value={props.value} onChange={e => props.onChange(e.target.value)} />;
  };
});
jest.mock('@codemirror/lang-markdown', () => ({ markdown: () => [] }));
jest.mock('@uiw/codemirror-theme-github', () => ({ githubLight: {} }));
jest.mock('@uiw/codemirror-theme-vscode', () => ({ vscodeDark: {} }));
jest.mock('jszip', () => jest.fn());

// Mock analytics
jest.mock('./utils/analytics', () => ({
  trackConversion: jest.fn(),
  trackEditorAction: jest.fn(),
  trackFileUpload: jest.fn(),
  trackEvent: jest.fn(),
  trackThemeSelection: jest.fn(),
  trackTemplatePreviewDownload: jest.fn(),
  trackOptionChange: jest.fn(),
  EVENTS: {},
}));

describe('App', () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() => null);
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/ChatGPT to Word/i)).toBeInTheDocument();
  });

  test('has two tabs', () => {
    render(<App />);
    expect(screen.getByText('📝 Live Editor')).toBeInTheDocument();
    expect(screen.getByText('📁 File Upload')).toBeInTheDocument();
  });

  test('tab switching works', () => {
    render(<App />);
    expect(screen.getByText('Live Markdown Editor')).toBeInTheDocument();
    fireEvent.click(screen.getByText('📁 File Upload'));
    expect(screen.getByText('Upload Markdown Files')).toBeInTheDocument();
  });

  test('dark mode toggle exists', () => {
    render(<App />);
    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode|switch to light mode/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  test('editor mode renders paste button', () => {
    render(<App />);
    expect(screen.getByText('Paste from Clipboard')).toBeInTheDocument();
  });
});

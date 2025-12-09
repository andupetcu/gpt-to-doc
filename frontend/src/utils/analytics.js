/**
 * Analytics utility for tracking user events
 * Supports both Google Analytics 4 (GA4) and Umami
 */

/**
 * Track an event to both GA4 and Umami
 * @param {string} eventName - Name of the event (e.g., 'convert_docx')
 * @param {object} params - Additional parameters for the event
 */
export const trackEvent = (eventName, params = {}) => {
  // Google Analytics 4
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  // Umami Analytics
  if (typeof window.umami === 'object' && typeof window.umami.track === 'function') {
    window.umami.track(eventName, params);
  }
};

// Pre-defined events for consistency
export const EVENTS = {
  // Conversion events
  CONVERT_DOCX: 'convert_docx',
  CONVERT_DOCX_THEMED: 'convert_docx_themed',
  CONVERT_PDF: 'convert_pdf',
  SAVE_MARKDOWN: 'save_markdown',

  // File upload events
  UPLOAD_FILE: 'upload_file',
  UPLOAD_BATCH: 'upload_batch',

  // Editor events
  LOAD_SAMPLE: 'load_sample',
  CLEAR_EDITOR: 'clear_editor',
  OPEN_PREVIEW: 'open_preview',

  // Theme events
  SELECT_THEME: 'select_theme',
  DOWNLOAD_TEMPLATE_PREVIEW: 'download_template_preview',

  // Options events
  TOGGLE_TOC: 'toggle_toc',
  TOGGLE_NUMBERED_SECTIONS: 'toggle_numbered_sections',
  SET_CUSTOM_HEADER: 'set_custom_header',
  SET_CUSTOM_FOOTER: 'set_custom_footer',
};

// Convenience functions for common events
export const trackConversion = (format, theme = 'plain', success = true) => {
  const eventName = format === 'pdf'
    ? EVENTS.CONVERT_PDF
    : (theme !== 'plain' ? EVENTS.CONVERT_DOCX_THEMED : EVENTS.CONVERT_DOCX);

  trackEvent(eventName, {
    format,
    theme,
    success,
  });
};

export const trackThemeSelection = (theme) => {
  trackEvent(EVENTS.SELECT_THEME, { theme });
};

export const trackTemplatePreviewDownload = (theme) => {
  trackEvent(EVENTS.DOWNLOAD_TEMPLATE_PREVIEW, { theme });
};

export const trackFileUpload = (fileCount = 1) => {
  const eventName = fileCount > 1 ? EVENTS.UPLOAD_BATCH : EVENTS.UPLOAD_FILE;
  trackEvent(eventName, { file_count: fileCount });
};

export const trackEditorAction = (action) => {
  trackEvent(action);
};

export const trackOptionChange = (option, value) => {
  trackEvent(`option_${option}`, { value });
};

// Test the filename extraction utility
function extractFilenameFromHeading(text) {
  const match = text.match(/^#\s+(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 80) || null;
}

describe('extractFilenameFromHeading', () => {
  test('extracts simple heading', () => {
    expect(extractFilenameFromHeading('# My Document')).toBe('My_Document');
  });

  test('returns null for no heading', () => {
    expect(extractFilenameFromHeading('Just some text')).toBeNull();
  });

  test('strips special characters', () => {
    expect(extractFilenameFromHeading('# Hello: World!')).toBe('Hello_World');
  });

  test('uses first heading only', () => {
    expect(extractFilenameFromHeading('# First\n## Second')).toBe('First');
  });

  test('returns null for empty heading', () => {
    expect(extractFilenameFromHeading('# ')).toBeNull();
  });

  test('truncates long headings', () => {
    const longHeading = '# ' + 'A'.repeat(100);
    const result = extractFilenameFromHeading(longHeading);
    expect(result.length).toBeLessThanOrEqual(80);
  });
});

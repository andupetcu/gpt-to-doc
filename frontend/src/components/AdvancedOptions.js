import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Download, ExpandMore, Settings } from '@mui/icons-material';
import { trackThemeSelection, trackTemplatePreviewDownload, trackOptionChange } from '../utils/analytics';

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: 500,
}));

const OptionGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const THEMES = {
  plain: { name: 'Plain (Default)', description: 'Simple, clean output', color: '#666' },
  color: { name: 'Professional Color', description: 'Blue professional styling', color: '#1F4E79' },
  ocean: { name: 'Ocean Corporate', description: 'Deep navy enterprise look', color: '#0D3B66' },
  sunset: { name: 'Sunset Warm', description: 'Orange/coral warm tones', color: '#D35400' },
  midnight: { name: 'Midnight Tech', description: 'Dark modern tech style', color: '#2C3E50' },
  forest: { name: 'Forest Nature', description: 'Green natural theme', color: '#1E8449' },
  executive: { name: 'Executive Minimal', description: 'Classic black/white elegance', color: '#1C1C1C' },
};

const AdvancedOptions = ({ options, onChange }) => {
  const handleCheckboxChange = (field) => (event) => {
    const checked = event.target.checked;
    onChange(prev => ({ ...prev, [field]: checked }));
    trackOptionChange(field, checked);
  };

  const handleTextChange = (field) => (event) => {
    onChange(prev => ({ ...prev, [field]: event.target.value }));
    if (event.target.value.trim()) trackOptionChange(field, 'set');
  };

  const handleThemeChange = (event) => {
    const newTheme = event.target.value;
    onChange(prev => ({ ...prev, theme: newTheme }));
    trackThemeSelection(newTheme);
  };

  const handlePreviewClick = (theme) => {
    trackTemplatePreviewDownload(theme);
  };

  const selectedTheme = options.theme || 'plain';

  return (
    <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Settings sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography fontWeight={500}>Document Theme &amp; Advanced Options</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <SectionTitle variant="h6" component="h3">
          Document Theme
        </SectionTitle>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="theme-select-label">Export Theme</InputLabel>
              <Select
                labelId="theme-select-label"
                value={selectedTheme}
                label="Export Theme"
                onChange={handleThemeChange}
              >
                {Object.entries(THEMES).map(([key, theme]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: theme.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                      <Typography variant="body2">{theme.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                {THEMES[selectedTheme]?.description}
              </Typography>
              {selectedTheme !== 'plain' && (
                <Link
                  href={`/templates/${selectedTheme}.docx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handlePreviewClick(selectedTheme)}
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', ml: 1 }}
                >
                  <Download sx={{ fontSize: 14 }} />
                  Preview
                </Link>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <SectionTitle variant="h6" component="h3">
          Advanced Options
        </SectionTitle>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <OptionGroup>
              <FormControlLabel
                control={<Checkbox checked={options.enableToc} onChange={handleCheckboxChange('enableToc')} color="primary" />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>Table of Contents</Typography>
                    <Typography variant="caption" color="text.secondary">Generate automatic table of contents</Typography>
                  </Box>
                }
              />
            </OptionGroup>
          </Grid>
          <Grid item xs={12} md={6}>
            <OptionGroup>
              <FormControlLabel
                control={<Checkbox checked={options.numberedSections} onChange={handleCheckboxChange('numberedSections')} color="primary" />}
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={500}>Numbered Sections</Typography>
                    <Typography variant="caption" color="text.secondary">Automatically number headings (1.1, 1.2, etc.)</Typography>
                  </Box>
                }
              />
            </OptionGroup>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <SectionTitle variant="h6" component="h4">
          Custom Headers &amp; Footers
        </SectionTitle>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Header Text"
              value={options.customHeader}
              onChange={handleTextChange('customHeader')}
              placeholder="e.g., Company Name - Document Title"
              helperText="Text to appear at the top of each page"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Footer Text"
              value={options.customFooter}
              onChange={handleTextChange('customFooter')}
              placeholder="e.g., Page $page$ of $total$"
              helperText="Text to appear at the bottom of each page"
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default AdvancedOptions;

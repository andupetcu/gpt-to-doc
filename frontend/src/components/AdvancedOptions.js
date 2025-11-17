import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const OptionsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: 500,
}));

const OptionGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const AdvancedOptions = ({ options, onChange }) => {
  const handleCheckboxChange = (field) => (event) => {
    onChange(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleTextChange = (field) => (event) => {
    onChange(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <OptionsContainer elevation={1}>
      <SectionTitle variant="h6" component="h3">
        Advanced Options
      </SectionTitle>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <OptionGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.enableToc}
                  onChange={handleCheckboxChange('enableToc')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Table of Contents
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Generate automatic table of contents
                  </Typography>
                </Box>
              }
            />
          </OptionGroup>
        </Grid>

        <Grid item xs={12} md={6}>
          <OptionGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.numberedSections}
                  onChange={handleCheckboxChange('numberedSections')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    Numbered Sections
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically number headings (1.1, 1.2, etc.)
                  </Typography>
                </Box>
              }
            />
          </OptionGroup>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <SectionTitle variant="h6" component="h4">
        Custom Headers & Footers
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
    </OptionsContainer>
  );
};

export default AdvancedOptions;
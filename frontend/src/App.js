import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Backdrop,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditorMode from './components/EditorMode';
import UploadMode from './components/UploadMode';
import LoadingOverlay from './components/LoadingOverlay';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  minHeight: '100vh',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiTab-root': {
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 500,
  },
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mode-tabpanel-${index}`}
      aria-labelledby={`mode-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const showLoading = useCallback((message = 'Converting your document...') => {
    setLoadingMessage(message);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  const showMessage = useCallback((message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <StyledContainer maxWidth="lg">
      {/* Buy Me a Coffee button container */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <a href="https://www.buymeacoffee.com/andreipetcu" target="_blank" rel="noopener noreferrer">
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            style={{ height: '40px', width: 'auto' }}
          />
        </a>
      </Box>

      <Typography variant="h1" component="h1" align="center" gutterBottom>
        ChatGPT to Word (DOCX) Converter — Free & Private
      </Typography>

      <StyledPaper elevation={2}>
        <StyledTabs
          value={currentTab}
          onChange={handleTabChange}
          centered
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label="📝 Live Editor"
            id="mode-tab-0"
            aria-controls="mode-tabpanel-0"
          />
          <Tab
            label="📁 File Upload"
            id="mode-tab-1"
            aria-controls="mode-tabpanel-1"
          />
        </StyledTabs>

        <TabPanel value={currentTab} index={0}>
          <EditorMode
            showLoading={showLoading}
            hideLoading={hideLoading}
            showMessage={showMessage}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <UploadMode
            showLoading={showLoading}
            hideLoading={hideLoading}
            showMessage={showMessage}
          />
        </TabPanel>
      </StyledPaper>

      {/* Buy Me a Coffee button at bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <a href="https://www.buymeacoffee.com/andreipetcu" target="_blank" rel="noopener noreferrer">
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            style={{ height: '40px', width: 'auto' }}
          />
        </a>
      </Box>

      {/* Contact Me - X/Twitter button */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Contact Me
        </Typography>
        <Button
          variant="contained"
          href="https://x.com/andupetcu"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            backgroundColor: '#000000',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            '&:hover': {
              backgroundColor: '#333333',
            },
          }}
          startIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          }
        >
          Reach out on X
        </Button>
      </Box>

      <LoadingOverlay
        open={loading}
        message={loadingMessage}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StyledContainer>
  );
}

export default App;
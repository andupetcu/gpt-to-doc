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
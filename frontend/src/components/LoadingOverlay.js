import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: '#fff',
}));

const LoadingContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  backgroundColor: 'white',
  color: theme.palette.text.primary,
  maxWidth: 300,
  width: '90%',
}));

const LoadingOverlay = ({ open, message = 'Converting your document...' }) => {
  return (
    <StyledBackdrop open={open}>
      <LoadingContent elevation={8}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="body1" component="div">
          {message}
        </Typography>
      </LoadingContent>
    </StyledBackdrop>
  );
};

export default LoadingOverlay;
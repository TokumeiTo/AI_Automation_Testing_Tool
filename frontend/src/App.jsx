import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TestWorkspace from './pages/TestWorkspace';

// Establish a highly clean developer blueprint theme override context
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f172a' },     // Slate 900
    secondary: { main: '#475569' },   // Slate 600
    success: { main: '#059669' },     // Emerald 600
    background: { default: '#f1f5f9' } // Slate 100 base
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", Arial, sans-serif'
  }
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TestWorkspace />
    </ThemeProvider>
  );
}
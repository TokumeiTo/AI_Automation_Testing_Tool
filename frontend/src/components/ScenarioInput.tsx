import React from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface ScenarioInputProps {
  scenarioText: string;
  setScenarioText: (val: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  errorMsg: string;
}

export default function ScenarioInput({
  scenarioText,
  setScenarioText,
  onGenerate,
  isLoading,
  errorMsg,
}: ScenarioInputProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
        1. Define Integration Scenario
      </Typography>
      
      <TextField
        label="Human Intent Prompt"
        multiline
        rows={6}
        placeholder="Type user flow description sequence... (e.g., Go to register page, create account with unique email...)"
        variant="outlined"
        fullWidth
        value={scenarioText}
        onChange={(e) => setScenarioText(e.target.value)}
        disabled={isLoading}
      />

      <Button
        variant="contained"
        color="success"
        size="large"
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
        onClick={onGenerate}
        disabled={isLoading || !scenarioText.trim()}
        sx={{ py: 1.5, fontWeight: 'bold' }}
      >
        {isLoading ? 'Orchestrating Steps...' : 'Generate Automation Steps'}
      </Button>

      {errorMsg && (
        <Alert severity="error" variant="outlined" sx={{ mt: 1 }}>
          {errorMsg}
        </Alert>
      )}
    </Box>
  );
}
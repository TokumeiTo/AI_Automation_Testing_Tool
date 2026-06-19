import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';

export default function InteractiveDataView({ steps = [], onStepsChange }) {
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState('');

  // Synchronize internal text state whenever parent array changes natively
  useEffect(() => {
    setJsonString(JSON.stringify(steps, null, 2));
    setError('');
  }, [steps]);

  const handleTextChange = (val) => {
    setJsonString(val);
  };

  // Parse modified JSON back into structural schema array state layers
  const handleSaveChanges = () => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        throw new Error('Root structure layer must be a sequential Array data block.');
      }
      setError('');
      onStepsChange(parsed);
    } catch (err) {
      setError(`Invalid JSON Structure: ${err.message}`);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER UTILITY ACTION BAR */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary' }}>
          2. Playwright Executable Steps Array (JSON データビュー)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyToClipboard}
            sx={{ textTransform: 'none', borderRadius: '4px', borderColor: '#cbd5e1', color: '#334155' }}
          >
            Copy JSON
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSaveChanges}
            sx={{ textTransform: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Apply Changes
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography variant="caption" color="error.main" sx={{ mb: 1, fontWeight: 'bold' }}>
          ⚠️ {error}
        </Typography>
      )}

      {/* RAW TERMINAL MONOSPACE CODE EDITOR BLOCK */}
      <Paper variant="outlined" sx={{ flexGrow: 1, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
        <TextField
          fullWidth
          multiline
          rows={18}
          value={jsonString}
          onChange={(e) => handleTextChange(e.target.value)}
          variant="outlined"
          slotProps={{
            input: {
              style: {
                fontFamily: '"Fira Code", Consolas, Monaco, monospace',
                fontSize: '0.85rem',
                backgroundColor: '#0f172a', // Clean slate terminal look
                color: '#38bdf8', // Cyberpunk cyan syntax style
                lineHeight: '1.5'
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              p: 1.5,
              '& fieldset': { border: 'none' }
            }
          }}
        />
      </Paper>
    </Box>
  );
}
import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Button, Select, MenuItem, TextField
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';

const getActionChipColor = (action) => {
  switch (action) {
    case 'goto': return { bg: '#e3f2fd', color: '#0d47a1' };
    case 'fill': return { bg: '#fff3e0', color: '#e65100' };
    case 'click': return { bg: '#f3e5f5', color: '#4a148c' };
    case 'keyboard': return { bg: '#e0f7fa', color: '#006064' };
    case 'select': return { bg: '#fef3c7', color: '#d97706' };
    case 'clear_storage': return { bg: '#ffe4e6', color: '#9f1239' };
    case 'wait': return { bg: '#f1f5f9', color: '#475569' };
    case 'assert': return { bg: '#dcfce7', color: '#166534' };
    default: return { bg: '#e8f5e9', color: '#1b5e20' };
  }
};

export default function InteractiveGrid({ steps = [], onStepsChange }) {

  // Update cell property
  const handleUpdateStep = (id, field, value) => {
    const updated = steps.map(step =>
      step.id === id ? { ...step, [field]: value } : step
    );
    onStepsChange(updated);
  };

  // Add new empty instruction row at the end
  const handleAddStep = () => {
    const nextId = steps.length > 0 ? Math.max(...steps.map(s => s.id)) + 1 : 1;
    const newStep = {
      id: nextId,
      step: 'New action instruction',
      action: 'click',
      target: '',
      value: ''
    };
    onStepsChange([...steps, newStep]);
  };

  // Delete a specific step and re-index sequential IDs
  const handleDeleteStep = (id) => {
    const filtered = steps.filter(step => step.id !== id);
    // Re-index steps cleanly so sequential arrays do not break
    const reIndexed = filtered.map((step, idx) => ({
      ...step,
      id: idx + 1
    }));
    onStepsChange(reIndexed);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>

      {/* HEADER SECTION WITH COMPACT ADD BUTTON */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}>
          2. Playwright Executable Steps Array (編集可能)
        </Typography>
        {steps.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddStep}
            sx={{
              borderRadius: '2px',
              borderColor: '#cbd5e1',
              color: '#334155',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.75rem',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
            }}
          >
            行追加 (Add Row)
          </Button>
        )}
      </Box>

      {steps.length === 0 ? (
        <Box sx={{
          flexGrow: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', p: 6,
          border: '2px dashed #cbd5e1', borderRadius: '4px', bgcolor: '#f8fafc'
        }}>
          <CodeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            No active automation instructions loaded.<br /> Invoke the prompt builder to fetch execution frames.
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStep}
            sx={{ bgcolor: '#1e3a8a', textTransform: 'none', borderRadius: '2px' }}
          >
            最初のステップを追加
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} square variant="outlined" sx={{ border: '1px solid #cbd5e1' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 700, width: 50, color: '#334155' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155', width: '30%' }}>Logical Action Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155', width: 110 }}>Trigger</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155', width: '35%' }}>DOM Selector / Target</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#334155', width: '20%' }}>Data Value</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 50, color: '#334155' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {steps.map((step) => {
                const badge = getActionChipColor(step.action);
                return (
                  <TableRow key={step.id} hover sx={{ '&:hover .delete-btn': { opacity: 1 } }}>

                    {/* ID COLUMN */}
                    <TableCell align="center" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' }}>
                      {step.id}
                    </TableCell>

                    {/* DESCRIPTION TEXT FIELD */}
                    <TableCell>
                      <TextField
                        fullWidth
                        variant="standard"
                        value={step.step}
                        onChange={(e) => handleUpdateStep(step.id, 'step', e.target.value)}
                        slotProps={{
                          input: { disableUnderline: true }
                        }}
                        sx={{ input: { fontSize: '0.85rem', fontWeight: 500, p: '4px 0', color: '#0f172a' } }}
                      />
                    </TableCell>

                    {/* TRIGGER ACTION SELECTOR DROP DOWN */}
                    <TableCell>
                      <Select
                        value={step.action}
                        onChange={(e) => handleUpdateStep(step.id, 'action', e.target.value)}
                        variant="standard"
                        disableUnderline
                        IconComponent={() => null} // Hides down arrow for a cleaner look
                        sx={{
                          fontSize: '0.7rem',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          width: '100%'
                        }}
                      >
                        {['goto', 'fill', 'click', 'keyboard', 'select', 'clear_storage', 'wait', 'assert'].map((act) => {
                          const c = getActionChipColor(act);
                          return (
                            <MenuItem key={act} value={act} sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                              <Chip
                                label={act.toUpperCase()}
                                size="small"
                                sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, borderRadius: '2px', height: 18, fontSize: '0.65rem' }}
                              />
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </TableCell>

                    {/* DOM TARGET SELECTOR TEXT FIELD */}
                    <TableCell>
                      {step.action === 'clear_storage' || step.action === 'wait' ? (
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', pl: 0.5 }}>
                          {step.action === 'wait' ? 'global execution delay' : 'global browser context'}
                        </Typography>
                      ) : (
                        <TextField
                          fullWidth variant="standard" value={step.target}
                          placeholder={
                            step.action === 'goto' ? 'http://...' :
                              step.action === 'assert' ? 'css/xpath selector or "url"' : 'xpath=... or css=...'
                          } // 🟩 UPDATED placeholder for assert target guidance
                          onChange={(e) => handleUpdateStep(step.id, 'target', e.target.value)}
                          slotProps={{ input: { disableUnderline: true } }}
                          sx={{ input: { fontSize: '0.8rem', fontFamily: 'monospace', color: '#475569', p: '4px 0' } }}
                        />
                      )}
                    </TableCell>

                    {/* PAYLOAD DATA VALUE TEXT FIELD */}
                    <TableCell>
                      {/* 🟩 UPDATED: Make sure 'assert' is NOT included in this conditional hide block, 
                          as assert needs the value column to hold expected string text values */}
                      {step.action === 'goto' || step.action === 'click' || step.action === 'clear_storage' ? (
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', pl: 0.5 }}>
                          none
                        </Typography>
                      ) : (
                        <TextField
                          fullWidth variant="standard" value={step.value || ''}
                          placeholder={
                            step.action === 'wait' ? 'e.g., 3000 (ms)' :
                              step.action === 'keyboard' ? 'e.g., Enter' :
                                step.action === 'select' ? 'Option label text...' :
                                  step.action === 'assert' ? 'Expected text/url value...' : 'Text payload...'
                          } // 🟩 UPDATED placeholder to document dynamic assertion checking values
                          onChange={(e) => handleUpdateStep(step.id, 'value', e.target.value)}
                          slotProps={{ input: { disableUnderline: true } }}
                          sx={{
                            input: {
                              fontSize: '0.8rem', fontFamily: 'monospace',
                              // 🟩 UPDATED: Added a distinctive text color match layout rule for assertion targets
                              color: step.action === 'wait' ? '#475569' :
                                step.action === 'select' ? '#d97706' :
                                  step.action === 'keyboard' ? '#006064' :
                                    step.action === 'assert' ? '#1b5e20' : '#047857',
                              fontWeight: 600, p: '4px 0'
                            }
                          }}
                        />
                      )}
                    </TableCell>

                    {/* MINIMAL INLINE ACTIONS (DELETE) */}
                    <TableCell align="center">
                      <IconButton
                        className="delete-btn"
                        size="small"
                        onClick={() => handleDeleteStep(step.id)}
                        sx={{
                          opacity: 0.3, // Keeps it hidden until row hover
                          transition: 'opacity 0.2s',
                          color: '#ef4444',
                          p: 0.25
                        }}
                      >
                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
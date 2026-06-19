import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function TimelineAccordion({ reportStep, activeRunId, backendUrl }) {
  // Safe helper to format micro-duration strings elegantly
  const formatDuration = (ms) => (ms / 1000).toFixed(2) + 's';

  return (
    <Accordion variant="outlined" sx={{ borderRadius: '12px !important', mb: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <Chip label={`Step ${reportStep.id}`} size="small" sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#475569' }} />
          <Typography sx={{ fontWeight: 600, flexGrow: 1, color: '#1e293b', fontSize: '0.95rem' }}>
            {reportStep.stepDescription}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mr: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatDuration(reportStep.durationMs)}</Typography>
          </Box>
          <Chip label={reportStep.status} color={reportStep.status === 'PASSED' ? 'success' : 'error'} size="small" sx={{ fontWeight: 'bold', minWidth: 70 }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>

          {/* Highlight Frame Panel Box */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
              <ImageIcon fontSize="small" /> Red Element-Highlight Action Capture
            </Typography>
            {reportStep.standardScreenshot ? (
              <Box
                component="img"
                // Removed the manual 'screenshots/' text since the property already includes it!
                src={`${backendUrl}/evidence/${activeRunId}/${reportStep.standardScreenshot}`}
                alt="Target action highlight frame view"
                sx={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 2, border: '1px solid #cbd5e1', bgcolor: '#fff' }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">No interactive element targeted in this step.</Typography>
            )}
          </Box>

          {/* Full Page Reference View Box */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: '#475569' }}>
              <ImageIcon fontSize="small" /> Full Page Layout Benchmark
            </Typography>
            <Box
              component="img"
              // Cleaned up here too
              src={`${backendUrl}/evidence/${activeRunId}/${reportStep.fullPageScreenshot || reportStep.emergencyScreenshot}`}
              alt="Full viewport layout snapshot verification"
              sx={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 2, border: '1px solid #cbd5e1', bgcolor: '#fff' }}
            />
          </Box>
        </Box>

        {reportStep.errorLogDetail && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fee2e2' }}>
            <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>System Stack Exception Log:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#991b1b', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{reportStep.errorLogDetail}</Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
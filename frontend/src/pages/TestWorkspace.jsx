import React, { useState } from 'react';
import { Container, Box, Typography, Paper, Button, MenuItem, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import ScenarioInput from '../components/ScenarioInput';
import InteractiveGrid from '../components/InteractiveGrid';
import EvidenceDashboard from '../components/EvidenceDashboard'; // 🟩 Imported clean view container
import { generateAutomationSteps, executePlaywrightPlayback } from '../apis/aiEngineApi';

export default function TestWorkspace() {
  const [scenarioText, setScenarioText] = useState('');
  const [testSteps, setTestSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedBrowser, setSelectedBrowser] = useState('Chrome');
  const [playbackResult, setPlaybackResult] = useState(null);
  const [activeRunId, setActiveRunId] = useState('');
  const [activeVideoFile, setActiveVideoFile] = useState(null);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8000";

  const handleGenerationTrigger = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setPlaybackResult(null);
    try {
      const response = await generateAutomationSteps(scenarioText);
      if (response.success) setTestSteps(response.data);
      else setErrorMsg(response.detail || 'Failed processing response targets.');
    } catch (err) {
      setErrorMsg(err.message || 'API connection fault encountered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePlayback = async () => {
    if (testSteps.length === 0) return;
    setIsExecuting(true);
    setErrorMsg('');
    setPlaybackResult(null);

    try {
      const response = await executePlaywrightPlayback(testSteps, selectedBrowser, 'default');
      if (response.success) {
        setActiveRunId(response.run_id);
        setActiveVideoFile(response.video_filename); // 🟩 Save the dynamic filename
        setPlaybackResult(response.report);
      } else {
        setErrorMsg('Failed to trigger the backend execution process.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to the automation execution runner.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, minHeight: '100vh', px: { xs: 2, sm: 4 } }}>
      <Box sx={{ mb: 4, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', letterSpacing: '-0.03em' }}>
          🛠️ AI Automation Testing Workspace
        </Typography>
        {errorMsg && <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 'bold' }}>⚠️ Error: {errorMsg}</Typography>}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'stretch', mb: 2 }}>
        <Box sx={{ width: { xs: '100%', lg: '33.33%' }, flexShrink: 0 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', bgcolor: '#f8fafc' }}>
            <ScenarioInput scenarioText={scenarioText} setScenarioText={setScenarioText} onGenerate={handleGenerationTrigger} isLoading={isLoading} errorMsg={errorMsg} />
          </Paper>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {testSteps.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
              <TextField select label="Target Runtime" value={selectedBrowser} onChange={(e) => setSelectedBrowser(e.target.value)} size="small" sx={{ width: 180 }}>
                <MenuItem value="Chrome">Google Chrome</MenuItem>
                <MenuItem value="Microsoft_Edge">Microsoft Edge</MenuItem>
                <MenuItem value="Firefox">Mozilla Firefox</MenuItem>
                <MenuItem value="Webkit">Apple WebKit</MenuItem>
              </TextField>
              <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={handleExecutePlayback} disabled={isExecuting} sx={{ fontWeight: 'bold' }}>
                {isExecuting ? 'Running Playwright...' : 'Run Playwright Test'}
              </Button>
            </Paper>
          )}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, flexGrow: 1 }}>
            <InteractiveGrid steps={testSteps} onStepsChange={setTestSteps} />
          </Paper>
        </Box>
      </Box>

      {/* 🟩 Clean, Delegated UI Evidence Feed Section */}
      <EvidenceDashboard
        playbackResult={playbackResult}
        activeRunId={activeRunId}
        videoFilename={activeVideoFile}
        backendUrl={BACKEND_BASE_URL}
      />
    </Container>
  );
}
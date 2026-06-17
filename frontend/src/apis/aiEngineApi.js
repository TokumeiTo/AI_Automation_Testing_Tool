export const generateAutomationSteps = async (scenarioText) => {
  const response = await fetch('http://127.0.0.1:8000/api/ai/generate-testcase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ scenario_text: scenarioText }),
  });

  if (!response.ok) {
    throw new Error(`Server returned code validation fault: ${response.status}`);
  }

  return response.json();
};

export const executePlaywrightPlayback = async (steps, browser, device = 'default') => {
  const response = await fetch('http://127.0.0.1:8000/api/automation/run-playback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      browser: browser,
      device: device,
      steps: steps
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution dispatch fault checklist code: ${response.status}`);
  }

  return response.json();
};
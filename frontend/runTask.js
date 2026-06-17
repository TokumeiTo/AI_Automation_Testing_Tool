import { runWorkspaceSteps } from './src/automation/runWorkspaceSteps.js';

// Receive arguments sent down from the UI
const args = process.argv.slice(2);
const rawStepsData = args[0];
const targetBrowser = args[1] || 'Chrome';
const targetDevice = args[2] || 'default';

if (!rawStepsData) {
  console.error("❌ No automation step array was received for execution.");
  process.exit(1);
}

try {
  const steps = JSON.parse(rawStepsData);
  
  console.log(`🚀 Task Worker started for Browser: [${targetBrowser}] | Device: [${targetDevice}]`);
  
  // Launch your proven Playwright pipeline loop
  // Let it handle its own internal try/catch so browser contexts can close cleanly!
  await runWorkspaceSteps(steps, targetBrowser, targetDevice);
  
} catch (error) {
  console.error("❌ Task Worker crashed during execution pipeline:", error.message);
  // Remove process.exit(1) from here to ensure the stack unwinds normally if needed, 
  // or rely entirely on runWorkspaceSteps' safety loop.
}
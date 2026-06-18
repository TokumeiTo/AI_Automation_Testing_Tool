import { chromium, firefox, webkit } from "playwright";
import chalk from "chalk";
import fs from "fs";
import path from "path";

export async function runWorkspaceSteps(stepsArray, browserName = "Chrome", deviceType = "default") {
  console.log(chalk.bold("\n⚡ Initializing Synchronized Evidence Pipeline..."));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runOutputDir = path.resolve(`./playwright-evidence/run_${timestamp}`);
  const screenshotsDir = path.join(runOutputDir, "screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browserMap = {
    Chrome: (headless) => chromium.launch({ headless }),
    Firefox: (headless) => firefox.launch({ headless }),
    Webkit: (headless) => webkit.launch({ headless }),
    Microsoft_Edge: (headless) => chromium.launch({ channel: 'msedge', headless })
  };

  const browser = await browserMap[browserName](false);

  // 🎥 FIXED: recordVideo options injected directly into the browser context creation layout
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: runOutputDir, // 📂 Forces the video payload to write directly into the root of your dynamic run folder
      size: { width: 1280, height: 720 }
    },
    recordVideoCodec: "h264"
  });
  
  const page = await context.newPage();

  // Helper to resolve CSS or XPath elements cleanly
  const getElementBySelector = async (targetPage, selectorStr) => {
    return await targetPage.evaluateHandle((selector) => {
      if (selector.startsWith("xpath=") || selector.startsWith("//")) {
        const cleanXpath = selector.replace("xpath=", "");
        return document.evaluate(cleanXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }
      return document.querySelector(selector);
    }, selectorStr);
  };

  // Inject beautiful highlighting
  const injectHighlight = async (targetPage, selectorStr) => {
    try {
      await targetPage.evaluate((selector) => {
        let element;
        if (selector.startsWith("xpath=") || selector.startsWith("//")) {
          const cleanXpath = selector.replace("xpath=", "");
          element = document.evaluate(cleanXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } else {
          element = document.querySelector(selector);
        }
        if (element) {
          element.style.outline = "4px solid #ef4444";
          element.style.outlineOffset = "3px";
          element.style.boxShadow = "0 0 12px #ef4444";
          element.scrollIntoView({ block: "center", inline: "nearest" });
        }
      }, selectorStr);
      await targetPage.waitForTimeout(100); // Allow browser thread to paint the red frame
    } catch (e) { }
  };

  // 🧼 Explicit cleanup script to erase highlights right after actions finish
  const removeHighlight = async (targetPage, selectorStr) => {
    try {
      await targetPage.evaluate((selector) => {
        let element;
        if (selector.startsWith("xpath=") || selector.startsWith("//")) {
          const cleanXpath = selector.replace("xpath=", "");
          element = document.evaluate(cleanXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } else {
          element = document.querySelector(selector);
        }
        if (element) {
          element.style.outline = "";
          element.style.outlineOffset = "";
          element.style.boxShadow = "";
        }
      }, selectorStr);
    } catch (e) { }
  };

  const executionReport = {
    timestamp: new Date().toISOString(),
    browser: browserName,
    status: "PASSED",
    totalDurationMs: 0,
    stepsTrack: []
  };

  const globalStartTime = performance.now();

  try {
    for (const step of stepsArray) {
      console.log(chalk.cyan(`➡️ Executing Step ${step.id}: ${step.step}`));
      const stepStartTime = performance.now();

      let cleanSelector = (step.target || '').trim();
      let stepMeta = {
        id: step.id,
        action: step.action,
        stepDescription: step.step,
        status: "PASSED",
        durationMs: 0
      };

      const standardPath = path.join(screenshotsDir, `step_${step.id}_standard.png`);
      const fullPagePath = path.join(screenshotsDir, `step_${step.id}_fullpage.png`);

      try {
        switch (step.action.toLowerCase()) {
          case 'goto':
            await page.goto(step.value || step.target, { waitUntil: "commit" });
            await page.waitForLoadState("domcontentloaded");

            // 🟩 FIX 1: For goto steps, snap the initial viewport as the standard view!
            await page.screenshot({ path: standardPath });
            break;

          case 'fill':
            await page.waitForSelector(cleanSelector, { timeout: 5000, state: "visible" });
            await page.fill(cleanSelector, step.value);     // 1. Fill the text first
            await injectHighlight(page, cleanSelector);     // 2. Inject red border over the filled value
            await page.screenshot({ path: standardPath });  // 3. Snap the action capture image
            await removeHighlight(page, cleanSelector);     // 4. Strip the border before full-page fires
            break;

          case 'click':
            await page.waitForSelector(cleanSelector, { timeout: 5000, state: "visible" });
            await injectHighlight(page, cleanSelector);
            await page.screenshot({ path: standardPath });

            await Promise.all([
              page.click(cleanSelector),
              page.waitForLoadState("domcontentloaded").catch(() => { }) // Ensures the browser thread accepts the new page
            ]);

            await removeHighlight(page, cleanSelector);
            await page.waitForTimeout(500); // Gives React 500ms to cleanly paint the header buttons
            break;
        }

        // Wait a brief tick for elements to settle before taking a clean verification full-page capture
        await page.waitForTimeout(100);
        await page.screenshot({ path: fullPagePath, fullPage: true });

        stepMeta.durationMs = Math.round(performance.now() - stepStartTime);
        stepMeta.standardScreenshot = `screenshots/step_${step.id}_standard.png`;
        stepMeta.fullPageScreenshot = `screenshots/step_${step.id}_fullpage.png`;
        executionReport.stepsTrack.push(stepMeta);

      } catch (stepError) {
        const emergencyPath = path.join(screenshotsDir, `step_${step.id}_CRASH_ERROR.png`);
        await page.screenshot({ path: emergencyPath, fullPage: true });

        stepMeta.status = "FAILED";
        stepMeta.durationMs = Math.round(performance.now() - stepStartTime);
        stepMeta.errorLogDetail = stepError.message;
        stepMeta.emergencyScreenshot = `screenshots/step_${step.id}_CRASH_ERROR.png`;
        executionReport.stepsTrack.push(stepMeta);

        executionReport.status = "FAILED";
        executionReport.failureReason = stepError.message;
        throw stepError;
      }
    }
  } catch (globalLoopBreak) {
    // Escapes sequence cleanly on failure scenarios
  } finally {
    executionReport.totalDurationMs = Math.round(performance.now() - globalStartTime);
    
    // 🟩 Explicitly closing context triggers Playwright to flush and write the .webm file 
    // to the `runOutputDir` folder before the script drops out.
    await context.close();
    await browser.close();

    const manifestPath = path.join(runOutputDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(executionReport, null, 2), "utf-8");
  }
}
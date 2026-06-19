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
    // 🟩 Uses the client's locally installed Google Chrome application natively
    Chrome: (headless) => chromium.launch({ channel: 'chrome', headless }),

    // 🟩 Uses the client's locally installed Microsoft Edge application natively
    Microsoft_Edge: (headless) => chromium.launch({ channel: 'msedge', headless }),

    // ⚠️ Firefox/WebKit cannot easily use channel defaults and typically require ms-playwright
    Firefox: (headless) => firefox.launch({ headless }),
    Webkit: (headless) => webkit.launch({ headless })
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
          case 'keyboard':
            const keyStr = step.value || '';

            // 1. Focus target element if provided
            if (cleanSelector) {
              await page.waitForSelector(cleanSelector, { timeout: 5000, state: "visible" });
              await page.focus(cleanSelector);
              await injectHighlight(page, cleanSelector);
            }

            // 2. Split dynamically by '+' character (e.g., "Ctrl + Shift + R")
            const keys = keyStr.split("+").map(k => k.trim());

            // Your complete translation dictionary
            const keyMap = {
              "enter": "Enter",
              "tab": "Tab",
              "del": "Delete",
              "delete": "Delete",
              "esc": "Escape",
              "escape": "Escape",
              "backspace": "Backspace",
              "arrowup": "ArrowUp",
              "arrowdown": "ArrowDown",
              "arrowleft": "ArrowLeft",
              "arrowright": "ArrowRight",
              "ctrl": "Control",
              "control": "Control",
              "cmd": "Meta",
              "command": "Meta",
              "meta": "Meta",
              "shift": "Shift",
              "alt": "Alt"
            };

            // 3. Map all keys dynamically. 
            // If it's a modifier or special key, map it. If it's a regular key, keep its exact casing or capitalize it for shortcuts.
            const mappedKeys = keys.map(k => {
              const lowerKey = k.toLowerCase();
              if (keyMap[lowerKey]) return keyMap[lowerKey];
              // For standard alphanumeric shortcut keys, uppercase them to conform with Playwright specs (e.g., 'r' -> 'R')
              return k.length === 1 ? k.toUpperCase() : k;
            });

            // 4. Action Capture Screenshot right before key triggers
            await page.screenshot({ path: standardPath });

            // 5. 🔄 DYNAMIC BROWSER SHORTCUT INTERCEPTION LAYER
            // We join the cleanly mapped keys back together to inspect what the combo evaluates to
            const evaluatedCombo = mappedKeys.join("+");

            // Intercept Refresh: Handles Ctrl+R, Control+R, Meta+R (Cmd+R), or F5 dynamically
            if (evaluatedCombo === "Control+R" || evaluatedCombo === "Meta+R" || evaluatedCombo === "F5") {
              console.log(chalk.yellow(`🔄 Intercepted dynamic refresh shortcut (${evaluatedCombo}). Triggering native page reload...`));
              await Promise.all([
                page.reload({ waitUntil: "commit" }),
                page.waitForLoadState("domcontentloaded").catch(() => { })
              ]);
              if (cleanSelector) await removeHighlight(page, cleanSelector);
              break;
            }

            // Intercept DevTools: Handles Ctrl+Shift+I, Meta+Shift+I, F12 dynamically
            if (evaluatedCombo === "Control+Shift+I" || evaluatedCombo === "Meta+Shift+I" || evaluatedCombo === "F12") {
              console.log(chalk.yellow(`🛠️ Intercepted dynamic DevTools shortcut (${evaluatedCombo}). Skipping execution to prevent engine freeze.`));
              if (cleanSelector) await removeHighlight(page, cleanSelector);
              break;
            }

            // Intercept History Back: Handles Alt+ArrowLeft or Meta+ArrowLeft dynamically
            if (evaluatedCombo === "Alt+ArrowLeft" || evaluatedCombo === "Meta+ArrowLeft") {
              console.log(chalk.yellow(`⬅️ Intercepted browser back shortcut (${evaluatedCombo}). Triggering native page goBack...`));
              await Promise.all([
                page.goBack({ waitUntil: "commit" }),
                page.waitForLoadState("domcontentloaded").catch(() => { })
              ]);
              if (cleanSelector) await removeHighlight(page, cleanSelector);
              break;
            }

            // 6. 🔥 ALL OTHER COMBINATIONS PASS THROUGH DYNAMICALLY
            if (mappedKeys.length === 1) {
              // Single key press (e.g., "Enter", "Tab", "ArrowDown")
              await page.keyboard.press(mappedKeys[0]);
            } else if (mappedKeys.length > 1) {
              // Multi-key combo engine (e.g., "Control+A", "Control+Shift+Right")
              const combo = mappedKeys.slice(0, -1);
              const lastKey = mappedKeys[mappedKeys.length - 1];

              // Hold down all modifiers in order
              for (const key of combo) {
                await page.keyboard.down(key);
              }

              // Strike final key
              await page.keyboard.press(lastKey);

              // Release modifiers in reverse order (LIFO)
              for (const key of combo.reverse()) {
                await page.keyboard.up(key);
              }
            }

            // 7. Clean up highlights
            if (cleanSelector) {
              await removeHighlight(page, cleanSelector);
            }
            break;

          case 'select':
            await page.waitForSelector(cleanSelector, { timeout: 5000, state: "visible" });
            await injectHighlight(page, cleanSelector);

            // Snapshot the highlight status before shifting values 
            await page.screenshot({ path: standardPath });

            const optionValue = (step.value || '').trim();
            try {
              // Try selection via text label display values first
              await page.selectOption(cleanSelector, { label: optionValue });
            } catch (labelError) {
              // Fallback to absolute value selection if label matching misses
              await page.selectOption(cleanSelector, optionValue);
            }

            await removeHighlight(page, cleanSelector);
            await page.waitForTimeout(200); // Allow option mutation frame adjustments to paint
            break;

          // 🟩 NEW: DYNAMIC STATE PURGE ENGINE
          case 'clear_storage':
            console.log(chalk.cyan(`🧹 Purging local storage, session storage, and cookies for strict test isolation...`));

            // Take an evidence snapshot of the viewport right before clearing state
            await page.screenshot({ path: standardPath });

            // Execute client-side storage wipe natively in the window context
            await page.evaluate(() => {
              window.localStorage.clear();
              window.sessionStorage.clear();
            });

            // Clear context cookies to drop server-side session associations
            const context = page.context();
            await context.clearCookies();

            console.log(chalk.green(`✅ Storage cleared. Initiating 3-second stabilization delay...`));

            // Wait for 3 seconds as requested to let the app adapt or redirect
            await page.waitForTimeout(3000);
            break;

          case 'wait':
            const msValue = parseInt(step.value || "3000", 10) || 3000;
            if (msValue <= 0) break;

            console.log(chalk.cyan(`⏳ Initiating explicit execution pause...`));

            // Take an initial screenshot before entering the execution pause state
            await page.screenshot({ path: standardPath });

            const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            let spinnerIndex = 0;

            // Start standard output stream tracking spinner
            const waitInterval = setInterval(() => {
              process.stdout.write(`\r${chalk.blue(spinnerFrames[spinnerIndex])} Testing pipeline suspended. Waiting for ${msValue}ms...`);
              spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
            }, 120);

            // Execute the actual asynchronous thread pause via Playwright
            await page.waitForTimeout(msValue);

            // Tear down interval handle and overwrite clean terminal confirmation strings
            clearInterval(waitInterval);
            process.stdout.write(`\r\x1b[K${chalk.greenBright('✔ Wait sequence completed successfully!')}\n`);
            break;
          case 'assert':
            const rawTarget = (step.target || '').trim();
            const expectedVal = (step.value || '').trim();
            const lowerTarget = rawTarget.toLowerCase();

            // 1. Capture current baseline screenshot before starting assertions
            await page.screenshot({ path: standardPath });

            // -------------------------------------------------------------
            // 📍 CONDITION 1: STAY CHECK (Verifying URL didn't change)
            // -------------------------------------------------------------
            if (lowerTarget === 'stay') {
              console.log(chalk.cyan(`🔍 Asserting: Verifying page remained on the same URL...`));

              // Note: currentUrlBefore needs to be tracked or passed into the step loop execution scope
              const stayed = page.url() === currentUrlBefore;

              if (!stayed) {
                await page.screenshot({ path: standardPath.replace('.png', '_error_stay.png') });
                throw new Error(`Assertion Failed: Expected to stay on same page, but URL changed to "${page.url()}"`);
              }
              console.log(chalk.greenBright(`✔ URL Assertion Passed: Safely stayed on the same page.`));
              break;
            }

            // -------------------------------------------------------------
            // 📍 CONDITION 2: URL CONTAINS CHECK
            // -------------------------------------------------------------
            if (lowerTarget === 'url') {
              const currentUrl = page.url();
              console.log(chalk.cyan(`🔍 Asserting URL: Expecting route string context to contain "${expectedVal}"...`));

              if (!currentUrl.includes(expectedVal)) {
                await page.screenshot({ path: standardPath.replace('.png', '_error_url.png') });
                throw new Error(`Assertion Failed: Expected URL to contain "${expectedVal}", but current URL is "${currentUrl}"`);
              }
              console.log(chalk.greenBright(`✔ URL Assertion Passed! Current route matches: ${currentUrl}`));
              break;
            }

            // -------------------------------------------------------------
            // 📍 CONDITION 3: APPEAR TEXT / ELEMENT VISIBILITY CHECK
            // -------------------------------------------------------------
            console.log(chalk.cyan(`🔍 Asserting UI State visibility for target pattern: "${rawTarget}"...`));

            try {
              // If target starts with a common CSS identifier, look for the element locator, 
              // otherwise natively handle it as a body 'text=' look up exactly like your old engine!
              const isSelector = rawTarget.startsWith('.') || rawTarget.startsWith('#') || rawTarget.includes('=') || rawTarget.includes('[');
              const locatorString = isSelector ? rawTarget : `text=${rawTarget}`;

              // Enforce a strict 5000ms visibility wait just like your reference engine code
              await page.waitForSelector(locatorString, { timeout: 5000, state: "visible" });

              // Highlight the visible target on screen for clean visual logs
              await injectHighlight(page, locatorString);
              await page.screenshot({ path: standardPath }); // Overwrite standardPath with highlighted version
              await removeHighlight(page, locatorString);

              // If a secondary validation value was provided for a selector, verify text content matching
              if (expectedVal && isSelector) {
                const element = page.locator(locatorString);
                const visibleText = await element.textContent();

                if (!visibleText.includes(expectedVal)) {
                  throw new Error(`Text Content Mismatch: Found text content "${visibleText.trim()}" but expected pattern "${expectedVal}"`);
                }
              }

              console.log(chalk.greenBright(`✔ UI State Assertion Passed: target verified visible on viewport.`));
            } catch (err) {
              // Take failure screenshot for immediate triage report compilation
              await page.screenshot({ path: standardPath.replace('.png', '_error_visibility.png') });
              throw new Error(`Assertion Failed: Target UI state "${rawTarget}" was not met. Trace: ${err.message}`);
            }
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
import { AllureRuntime, ContentType } from "allure-js-commons";
import path from "path";
import fs from "fs";

export async function writeAllureResults(testResults, suiteName = "Excel Automation Suite") {
    // 1. Initialize runtime storage directory (defaults to ./allure-results)
    const runtime = new AllureRuntime({ resultsDir: "allure-results" });

    for (const t of testResults) {
        // Create a unique execution block container for this iteration
        const currentTest = runtime.startTest({
            name: t.testCase,
            start: Date.now() - (t.duration * 1000), // Approximate start time based on duration
        });

        // Set structural metadata details
        currentTest.fullName = `${suiteName} - ${t.testCase}`;
        currentTest.stage = "finished";
        
        // Map execution status cleanly
        if (t.result.toLowerCase() === "pass") {
            currentTest.status = "passed";
        } else if (t.result.toLowerCase() === "fail") {
            currentTest.status = "failed";
            currentTest.statusDetails = { message: t.outcome };
        } else {
            currentTest.status = "skipped";
        }

        // Attach Device Name Information as a tracking parameter label
        currentTest.addLabel("device", t.deviceNames || "Desktop Chrome");

        // 2. Process and embed screen capture files directly into the report
        if (t.screenshots && t.screenshots.length > 0) {
            for (const shotPath of t.screenshots) {
                if (fs.existsSync(shotPath)) {
                    const screenshotBuffer = fs.readFileSync(shotPath);
                    const attachmentName = shotPath.includes("ERROR") ? "Error Screen State" : "Execution Capture";
                    
                    // This embeds the actual image directly inside the interactive UI timeline
                    runtime.writeAttachment(attachmentName, screenshotBuffer, ContentType.PNG);
                }
            }
        }

        // 3. Process the custom detailed Network Logs as an attached text structure
        if (t.networkLog && t.networkLog.length > 0) {
            const formattedLog = t.networkLog.map(net => 
                `[${net.ActionType || "STEP"}] ${net.Method || "GET"} -> Status: ${net.NetworkStatus || "N/A"} | URL: ${net.URL || ""}`
            ).join("\n");

            runtime.writeAttachment("Network Traffic Log", formattedLog, ContentType.TEXT);
        }

        // Complete recording for this individual element
        currentTest.endTest(Date.now());
    }
}
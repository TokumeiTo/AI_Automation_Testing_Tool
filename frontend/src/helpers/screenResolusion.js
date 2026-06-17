export async function getBrowserScreenResolution(browser) {
    try {
        // Opens a temporary, completely silent background context to look at the monitor dimensions
        const tempContext = await browser.newContext();
        const tempPage = await tempContext.newPage();
        const dimensions = await tempPage.evaluate(() => {
            return {
                width: window.screen.width,
                height: window.screen.height
            };
        });
        await tempContext.close();
        return dimensions;
    } catch (e) {
        // Safe corporate fallback layout if anything breaks
        return { width: 1920, height: 1080 };
    }
}
const puppeteer = require('puppeteer');

async function joinZoom(meetingUrl, meetingId, password) {
    const browser = await puppeteer.launch({
        headless: false, // We need to use non-headless mode for Zoom
        args: ['--use-fake-ui-for-media-stream', '--disable-notifications']
    });

    try {
        const page = await browser.newPage();
        
        // Grant permissions for media
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'permissions', {
                value: {
                    query: async () => ({ state: 'granted' })
                }
            });
        });

        // If direct meeting URL is provided
        if (meetingUrl) {
            await page.goto(meetingUrl, { waitUntil: 'networkidle0' });
        } else if (meetingId) {
            // If meeting ID is provided, go to Zoom join page
            await page.goto('https://zoom.us/join', { waitUntil: 'networkidle0' });
            
            // Input meeting ID
            await page.type('#join-confno', meetingId);
            await page.click('#btnSubmit');
            
            // Wait for the page to load
            await page.waitForTimeout(3000);
        }

        // If password is required and provided
        if (password) {
            try {
                // Wait for password input field and enter password
                await page.waitForSelector('#password', { timeout: 5000 });
                await page.type('#password', password);
                await page.click('#btnSubmit');
            } catch (error) {
                console.log('No password field found or already passed password stage');
            }
        }

        // Wait for the "Join Audio" button and click it
        try {
            await page.waitForSelector('[aria-label="join audio"]', { timeout: 10000 });
            await page.click('[aria-label="join audio"]');
            
            // Wait for and click "Join with Computer Audio" button
            await page.waitForSelector('[aria-label="join by computer audio"]', { timeout: 5000 });
            await page.click('[aria-label="join by computer audio"]');
        } catch (error) {
            console.log('Audio joining elements not found or already joined audio');
        }

        // Keep the browser open for the meeting
        return browser;

    } catch (error) {
        await browser.close();
        throw new Error(`Failed to join Zoom meeting: ${error.message}`);
    }
}

module.exports = { joinZoom };

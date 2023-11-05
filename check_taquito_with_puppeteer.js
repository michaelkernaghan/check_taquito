const puppeteer = require('puppeteer');

async function checkForTaquito(url) {

    let usesTaquito = false;  // Initialize variable

    const browser = await puppeteer.launch({
        headless: 'new',
        // `headless: true` (default) enables old Headless;
        // `headless: 'new` enables new Headless;
        // `headless: false` enables “headful” mode.
    });
    const page = await browser.newPage();

    // Begin intercepting network requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (request.url().includes('taquito')) {
            console.log(`Taquito found in request: ${request.url()}`);
            usesTaquito = true;  // Update variable if 'taquito' is found
        }
        request.continue();
    });

    await page.goto(url);
    await browser.close();

    return usesTaquito;  // Return the result
}

async function checkWebsites(websites) {
    for (const website of websites) {
        const usesTaquito = await checkForTaquito(website);
        console.log(`Website ${website} uses Taquito: ${usesTaquito}`);
    }
}

// List of websites to check
const websites = ['https://taquito-test-dapp.netlify.app/','https://de.fi/', 'https://ctez.app/'];

checkWebsites(websites);

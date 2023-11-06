// modify the script so that if there is an error reaching one of the websites there is a message printed in red letters that says "the website (name) was unreachable"


const puppeteer = require('puppeteer');
const parser = require('@babel/parser');
const estraverse = require('estraverse');
const fetch = require('node-fetch');

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
    page.on('request', async (request) => {
        if (request.url().includes('.js')) {
            const response = await fetch(request.url());
            const js = await response.text();

            // Parse the JavaScript
            const parsedJs = parser.parse(js, {
                sourceType: 'module',
                plugins: ['jsx', 'flow', 'classProperties', 'privateMethods']
            });

            // Check if 'taquito' is in the parsed JavaScript
            const { default: traverse } = require('@babel/traverse');

            traverse(parsedJs, {
                enter(path) {
                    if (path.isIdentifier({ name: 'taquito' })) {
                        console.log('Found taquito');
                    }
                }
            });
        }
        request.continue();
    });

    try {
        await page.goto(url);
    } catch (error) {
        console.error(`The website ${url} was unreachable.`);
    }

    await browser.close();

    return usesTaquito;  // Return the result
}

async function checkWebsites(websites) {
    for (const website of websites) {
        const usesTaquito = await checkForTaquito(website);
        console.log(`Website ${website} uses Taquito: ${usesTaquito}`);
    }
}

async function getWebsitesFromAPI() {
    const response = await fetch('https://api.dappradar.com/4tsxo4vuhotaojtl/dapps?chain=tezos', {
        headers: {
            'X-BLOBR-KEY': 's4EffmiM6cAfls40XwNj0PC2S9TxD4Vt'
        }
    });
    const data = await response.json();
    // console.log(data);  // Log the entire data object
    const websites = data.results.map(dapp => dapp.website);
    return websites;
}

async function main() {
    const websites = await getWebsitesFromAPI();
    console.log(`Dapp Radar Top 25 Tezos Websites:\n`);
    await checkWebsites(websites);
}

main();
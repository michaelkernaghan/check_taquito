
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fetch = require('node-fetch');

async function checkForTaquito(url) {
    let result = {
        website: url,
        reachable: true,
        usesTaquito: false
    };

    const browser = await puppeteer.launch({
        headless: 'new',
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', async (request) => {
        if (request.url().includes('.js')) {
            const response = await fetch(request.url());
            const js = await response.text();

            if (js.includes('taquito')) {
                result.usesTaquito = true;
            }
        }
        request.continue();
    });

    try {
        await page.goto(url);
    } catch (error) {
        console.error(chalk.red(`${error}`));
        result.reachable = false;
    }

    await browser.close();

    return result;
}

async function checkWebsites(websites) {
    let results = [];

    for (const website of websites) {
        const result = await checkForTaquito(website);
        results.push(result);
    }

    console.table(results);
}

async function getWebsitesFromAPI() {
    const response = await fetch('https://api.dappradar.com/4tsxo4vuhotaojtl/dapps?chain=tezos', {
        headers: {
            'X-BLOBR-KEY': 's4EffmiM6cAfls40XwNj0PC2S9TxD4Vt'
        }
    });
    const data = await response.json();
    const websites = data.results.map(dapp => dapp.website);
    return websites;
}

async function main() {
    console.log(`Looking for Taquito in the top 25 Tezos Dapps`);
    const websites = await getWebsitesFromAPI();
    await checkWebsites(websites);
}

main();
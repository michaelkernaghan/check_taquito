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
        headless: `new`,
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', async (request) => {
        if (request.url().includes('.js')) {
            try {
                const response = await fetch(request.url());
                const js = await response.text();

                if (js.includes('taquito')) {
                    result.usesTaquito = true;
                    console.log(chalk.green(`Found Taquito on ${url} in file ${request.url()}`));
                }
            } catch (error) {
                console.error(chalk.red(`Failed to fetch ${request.url()}: ${error}`));
            }
        }
        request.continue();
    });

    try {
        await page.goto(url);
        console.log(chalk.blue(`Checking ${url} ...`));
    } catch (error) {
        console.error(chalk.red(`Failed to reach ${url}: ${error}`));
        result.reachable = false;
    }

    await browser.close();

    return result;
}

async function checkWebsites(websites) {
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(5); // limit to 5 concurrent tasks

    const tasks = websites.map(website => limit(() => checkForTaquito(website)));
    const results = await Promise.all(tasks);
    console.table(results);
}

async function getWebsitesFromAPI() {
    try {
        const response = await fetch('https://api.dappradar.com/4tsxo4vuhotaojtl/dapps?chain=tezos', {
            headers: {
                'X-BLOBR-KEY': 's4EffmiM6cAfls40XwNj0PC2S9TxD4Vt'
            }
        });
        const data = await response.json();
        const websites = data.results.map(dapp => dapp.website);
        return websites;
    } catch (error) {
        console.error(chalk.red(`Failed to fetch websites from API: ${error}`));
        return [];
    }
}

async function main() {
    console.log(chalk.yellow(`Looking for Taquito in the top 25 Tezos Dapps`));
    const websites = await getWebsitesFromAPI();
    await checkWebsites(websites);
}

main();
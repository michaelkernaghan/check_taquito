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

    // Calculate and log the percentages
    const reachableWebsites = results.filter(result => result.reachable).length;
    const websitesUsingTaquito = results.filter(result => result.usesTaquito).length;
    const reachableWebsitesUsingTaquito = results.filter(result => result.reachable && result.usesTaquito).length;
    console.log(`Top 25 Tezos Dapps reachable sites: ${reachableWebsites / websites.length * 100}%`);
    console.log(`Top 25 Tezos Dapps that use Taquito: ${websitesUsingTaquito / websites.length * 100}%`);
    console.log(`Top 25 Tezos Dapps reachable sites that Taquito: ${(reachableWebsitesUsingTaquito / reachableWebsites * 100).toFixed(2)}%`);
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
    console.log(chalk.yellow(`Checking Site Connectivity ...`));
    const websites = await getWebsitesFromAPI();
    await checkWebsites(websites);
}

main();
require('dotenv').config();
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");
const Table = require('cli-table3');
const fs = require('fs/promises');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

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
                    //console.log(chalk.green(`Found Taquito on ${url} in file ${request.url()}`));
                }
            } catch (error) {
                //console.error(chalk.red(`Failed to fetch ${request.url()}: ${error}`));
            }
        }
        request.continue();
    });

    try {
        await page.goto(url);
        //console.log(chalk.blue(`Checking ${url} ...`));
    } catch (error) {
        //console.error(chalk.red(`Failed to reach ${url}: ${error}`));
        result.reachable = false;
    }

    await browser.close();

    return result;
}

async function checkWebsites(websites) {
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(5); // limit to 5 concurrent tasks

    try {
        const tasks = websites.map(website => limit(() => checkForTaquito(website)));
        const results = await Promise.all(tasks);

        //console.log('Results from checkWebsites:', results); // Debugging log

        return results.map(result => ({
            website: result.website,
            reachable: result.reachable ? '✔' : '✖',
            usesTaquito: result.usesTaquito ? '✔' : '✖'
        }));
    } catch (error) {
        console.error(chalk.red(`Error in checkWebsites: ${error}`));
        return []; // Return an empty array in case of error
    }
}


async function searchGitHubForTaquito(name) {
    const query = `org:${name} taquito`;
    try {
        const response = await octokit.request('GET /search/code', { q: query });
        return response.data.total_count > 0; // Check if there are results
    } catch (error) {
        if (error.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
            const resetTime = parseInt(error.response.headers['x-ratelimit-reset']) * 1000;
            const delay = resetTime - Date.now() + 1000; // Adding a 1-second buffer
            const delayInSeconds = Math.round(delay / 1000); // Convert milliseconds to seconds
            console.log(`Rate limit exceeded. Waiting for ${delayInSeconds} seconds (until ${new Date(resetTime).toISOString()}) to resume.`);
            await sleep(delay);
            return searchGitHubForTaquito(name);
        } else {
            console.error(`Error searching GitHub for ${name}:`, error);
            return false;
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// async function getWebsitesFromAPI() {
//     try {
//         const response = await fetch('https://api.dappradar.com/4tsxo4vuhotaojtl/dapps?chain=tezos', {
//             headers: {
//                 'X-BLOBR-KEY': 's4EffmiM6cAfls40XwNj0PC2S9TxD4Vt'
//             }
//         });
//         const data = await response.json();
//         console.log(data);
//         const websites = data.results.map(dapp => dapp.website);
//         return websites;

//     } catch (error) {
//         console.error(chalk.red(`Failed to fetch websites from API: ${error}`));
//         return [];
//     }
// }

async function getWebsitesFromCombinedFile() {
    try {
        const data = await fs.readFile('site_data.json', 'utf8'); // Read the file with UTF-8 encoding
        const json = JSON.parse(data); // Parse the JSON content

        // Extract just the website URLs from the combined data
        const websites = json.combined.map(item => item.website);
        return websites;
    } catch (error) {
        console.error(chalk.red(`Failed to read websites from combined file: ${error}`));
        return [];
    }
}

async function main() {
    console.log(chalk.blue('\nChecking websites... hang on for a bit.'));
    const combinedData = JSON.parse(await fs.readFile('site_data.json', 'utf8')).combined;
    const websiteResults = await checkWebsites(combinedData.map(item => item.website));

    if (!Array.isArray(websiteResults)) {
        throw new Error('websiteResults is not an array');
    }

    const table = new Table({
        head: ['Name', 'Website', 'Reachable', 'Uses Taquito on Website', 'Uses Taquito on GitHub'],
        colWidths: [15, 30, 15, 25, 25]
    });

    for (const item of combinedData) {
        const websiteResult = websiteResults.find(w => w.website === item.website);

        // Debug: log the matching result
        //console.log(`Matching result for ${item.name}:`, websiteResult);

        const reachable = websiteResult.reachable;
        const usesTaquitoOnWebsite = websiteResult.usesTaquito;

        const foundOnGitHub = await searchGitHubForTaquito(item.name);
        table.push([item.name, item.website, reachable, usesTaquitoOnWebsite, foundOnGitHub ? '✔' : '✖']);
    }

    console.log(table.toString());
}

main();

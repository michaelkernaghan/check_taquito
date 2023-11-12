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

    try {
        const tasks = websites.map(website => limit(() => checkForTaquito(website)));
        const results = await Promise.all(tasks);

        console.log('Results from checkWebsites:', results); // Debugging log

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
            console.log(`Rate limit exceeded. Waiting until ${new Date(resetTime).toISOString()} to resume.`);
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

async function getWebsitesFromAPI() {
    try {
        const response = await fetch('https://api.dappradar.com/4tsxo4vuhotaojtl/dapps?chain=tezos', {
            headers: {
                'X-BLOBR-KEY': 's4EffmiM6cAfls40XwNj0PC2S9TxD4Vt'
            }
        });
        const data = await response.json();
        console.log(data);
        const websites = data.results.map(dapp => dapp.website);
        return websites;

    } catch (error) {
        console.error(chalk.red(`Failed to fetch websites from API: ${error}`));
        return [];
    }
}

async function getWebsitesFromFile() {
    try {
        const data = await fs.readFile('website_addresses.json', 'utf8'); // Read the file with UTF-8 encoding
        const json = JSON.parse(data); // Parse the JSON content

        // Assuming the JSON file has a "websites" array
        const websites = json.websites;
        return websites;
    } catch (error) {
        console.error(chalk.red(`Failed to read websites from file: ${error}`));
        return [];
    }
}


async function main() {

    const websites = await getWebsitesFromFile();
    console.log('websites:', websites);
    const websiteResults = await checkWebsites(websites);
    console.log('websiteResults:', websiteResults); // Check the output

    if (!Array.isArray(websiteResults)) {
        throw new Error('websiteResults is not an array');
    }
    try {
        const namesData = await fs.readFile('names.json', 'utf8');
        const names = JSON.parse(namesData).names;

        if (!Array.isArray(websiteResults)) {
            throw new Error('websiteResults is not an array');
        }

        if (!Array.isArray(names)) {
            throw new Error('names is not an array');
        }

        const table = new Table({
            head: ['Name', 'Reachable', 'Uses Taquito on Website', 'Uses Taquito on GitHub'],
            colWidths: [30, 10, 20, 25]
        });

        for (const name of names) {
            const websiteResult = websiteResults.find(w => w.website === name);
            const reachable = websiteResult ? '✔' : '✖';
            const usesTaquitoOnWebsite = websiteResult && websiteResult.usesTaquito ? '✔' : '✖';

            const foundOnGitHub = await searchGitHubForTaquito(name);
            table.push([name, reachable, usesTaquitoOnWebsite, foundOnGitHub ? '✔' : '✖']);
        }

        console.log(table.toString());
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();

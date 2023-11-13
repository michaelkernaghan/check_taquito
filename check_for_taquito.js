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

    let remainingWebsites = websites.length; // Initialize with the total number of websites

    try {
        const tasks = websites.map(website => limit(async () => {
            const result = await checkForTaquito(website);
            remainingWebsites--; // Decrement the count after checking each website
            console.log(chalk.yellow(`Checking ${website}... ${remainingWebsites} websites left.`)); // Print the countdown
            return result;
        }));

        const results = await Promise.all(tasks);

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
        console.log(chalk.blue(`Searching ${name} on GitHub...`));
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

async function main() {
    console.log(chalk.blue('\nChecking websites... hang on for a bit.'));
    const combinedData = JSON.parse(await fs.readFile('site_data.json', 'utf8')).combined;
    const websiteResults = await checkWebsites(combinedData.map(item => item.website));

    if (!Array.isArray(websiteResults)) {
        throw new Error('websiteResults is not an array');
    }

    // Initialize summary data
    let reachableWebsites = [];
    let websitesUsingTaquito = [];
    let githubReposUsingTaquito = [];

    for (const item of combinedData) {
        const websiteResult = websiteResults.find(w => w.website === item.website);
        
        if (websiteResult.reachable === '✔') {
            reachableWebsites.push(item.website);
        }
        if (websiteResult.usesTaquito === '✔') {
            websitesUsingTaquito.push(item.website);
        }

        const foundOnGitHub = await searchGitHubForTaquito(item.name);
        if (foundOnGitHub) {
            githubReposUsingTaquito.push(item.name);
        }
    }

    // Print summary
    console.log(chalk.green(`\nSummary of Results:`));
    console.log(chalk.green(`Reachable Websites: ${reachableWebsites.length}`));
    reachableWebsites.forEach(site => console.log(site));

    console.log(chalk.green(`\nWebsites Using Taquito: ${websitesUsingTaquito.length}`));
    websitesUsingTaquito.forEach(site => console.log(site));

    console.log(chalk.green(`\nGitHub Repos Using Taquito: ${githubReposUsingTaquito.length}`));
    githubReposUsingTaquito.forEach(repo => console.log(repo));
}

main();
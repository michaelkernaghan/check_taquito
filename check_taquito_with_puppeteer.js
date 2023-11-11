const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");
const octokit = new Octokit({ auth: `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` });

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

const Table = require('cli-table3');

async function checkWebsites(websites) {
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(5); // limit to 5 concurrent tasks

    const tasks = websites.map(website => limit(() => checkForTaquito(website)));
    const results = await Promise.all(tasks);

    // Create a new table
    const table = new Table({
        head: ['Website', 'Reachable', 'Uses Taquito'],
        chars: { 'true': chalk.green('✔'), 'false': chalk.red('✖') }
    });

    // Add each result to the table
    results.forEach(result => {
        table.push([result.website, result.reachable ? '✔' : '✖', result.usesTaquito ? '✔' : '✖']);
    });

    console.log(table.toString());


    // Calculate and log the percentages
    const reachableWebsites = results.filter(result => result.reachable).length;
    const websitesUsingTaquito = results.filter(result => result.usesTaquito).length;
    const reachableWebsitesUsingTaquito = results.filter(result => result.reachable && result.usesTaquito).length;
    console.log(`Top 25 Tezos Dapps reachable sites: ${reachableWebsites / websites.length * 100}%`);
    console.log(`Top 25 Tezos Dapps that have Taquito: ${websitesUsingTaquito / websites.length * 100}%`);
    console.log(`Top 25 Tezos Dapps reachable sites that have Taquito: ${(reachableWebsitesUsingTaquito / reachableWebsites * 100).toFixed(2)}%`);
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

async function searchGitHubRepositories(dappName) {
    try {
        const query = dappName.replace(/ /g, '+') + '+in:name';
        const response = await octokit.request('GET /search/repositories', { q: query });

        const checks = await Promise.all(response.data.items.map(async (repo) => {
            console.log('Checking repository:', repo);
            const usesTaquito = await checkIfRepoUsesTaquito(repo.html_url);
            return { ...repo, usesTaquito };
        }));

        return checks.filter(repo => repo.usesTaquito).map(repo => ({ name: repo.name, url: repo.html_url }));
    } catch (error) {
        console.error(chalk.red(`GitHub search failed for ${dappName}: ${error}`));
        return [];
    }
}

function extractNameFromURL(url) {
    try {
        const urlObj = new URL(url);
        console.log(urlObj.hostname);
        console.log(urlObj.hostname.replace('www.', '').split('.')[0]);
        return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch (error) {
        console.error(chalk.red(`Error extracting name from URL: ${url}`));
        return null;
    }
}

//  async function checkGitHubRepository(name) {
//      const repoUrl = `https://github.com/${name}`;
//      try {
//          const response = await fetch(repoUrl);
//          if (response.ok) {
//              console.log(chalk.green(`Repository found: ${repoUrl}`));
//              return { name, url: repoUrl, exists: true };
//          } else {
//              console.log(chalk.yellow(`Repository not found or private: ${repoUrl}`));
//              return { name, url: repoUrl, exists: false };
//          }
//      } catch (error) {
//          console.error(chalk.red(`Error checking repository for ${name}: ${error}`));
//          return { name, url: repoUrl, exists: false };
//      }
//  }

async function checkIfRepoUsesTaquito(repo) {
    try {
        // Validate that the repo object and its properties are defined
        if (!repo || !repo.contents_url || repo.private) {
            console.log(chalk.yellow(`Invalid repository data or repository is private: ${JSON.stringify(repo)}`));
            return false;
        }

        // Construct the URL for package.json
        const packageJsonUrl = repo.contents_url.replace('{+path}', 'package.json');
        const response = await octokit.request('GET ' + packageJsonUrl);

        // Check for a successful response and that dependencies include 'taquito'
        if (response.status === 200) {
            const packageJsonContent = Buffer.from(response.data.content, 'base64').toString();
            const packageJson = JSON.parse(packageJsonContent);
            return packageJson.dependencies && packageJson.dependencies['taquito'];
        }
    } catch (error) {
        if (error.status === 404) {
            console.log(chalk.yellow(`package.json not found in ${repo.html_url}`));
        } else {
            console.error(chalk.red(`Error checking repository for Taquito: ${error}`));
        }
    }
    return false;
}

async function main() {
    console.log(chalk.yellow(`Looking for Taquito in the top 25 Tezos Dapps`));
    console.log(chalk.yellow(`Checking Site Connectivity and GitHub Repositories...`));
    const websites = await getWebsitesFromAPI();

    for (const website of websites) {
        const name = website.name || extractNameFromURL(website);
        if (name) {
            const reposUsingTaquito = await searchGitHubRepositories(name);
            if (reposUsingTaquito.length > 0) {
                console.log(`Taquito-using repositories for ${name}:`, reposUsingTaquito);
            } else {
                console.log(`No Taquito-using repositories found for ${name}`);
            }
        } else {
            console.log('Failed to determine name for website:', website);
        }
    }

    await checkWebsites(websites);
}

main();
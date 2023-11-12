require('dotenv').config();
const fs = require('fs');
const { Octokit } = require("@octokit/core");
const Table = require('cli-table3');
console.log(process.env.GITHUB_TOKEN);
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

async function main() {
    const namesData = fs.readFileSync('names.json', 'utf8');
    const names = JSON.parse(namesData).names;

    if (!Array.isArray(names)) {
        throw new Error('names is not an array');
    }

    const table = new Table({
        head: ['Name', 'Contains Taquito'],
        colWidths: [30, 20]
    });

    for (const name of names) {
        const found = await searchGitHubForTaquito(name);
        table.push([name, found ? '✔' : '✖']);
    }

    console.log(table.toString());
}

main();

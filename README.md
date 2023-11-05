# Taquito Checker

This repository contains a script that uses Puppeteer to check whether a list of websites makes any network requests that include the word 'taquito'. 

## Description

The script launches a headless browser for each website in the list, intercepts all network requests, and checks if the URL of each request includes the word 'taquito'. The results are logged to the console.

## Installation

To use this script, you will need Node.js and npm installed. You can then install the required dependencies with:

```
npm install puppeteer
```

## Usage

To use the script, you can add the websites you want to check to the `websites` array at the bottom of the `index.js` file. Then run the script with:

```
node index.js
```

The script will log a message for each website in the format `Website [URL] uses Taquito: [true/false]`.

## Code

Here is the main part of the script:

```javascript
const puppeteer = require('puppeteer');

async function checkForTaquito(URL) {
    let usesTaquito = false;
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (request.url().includes('taquito')) {
            console.log(`Taquito found in request: ${request.url()}`);
            usesTaquito = true;
        }
        request.continue();
    });

    await page.goto(url);
    await browser.close();
    return usesTaquito;
}

async function checkWebsites(websites) {
    for (const website of websites) {
        const usesTaquito = await checkForTaquito(website);
        console.log(`Website ${website} uses Taquito: ${usesTaquito}`);
    }
}

const websites = ['https://de.fi/', 'https://ctez.app/'];
checkWebsites(websites);
```

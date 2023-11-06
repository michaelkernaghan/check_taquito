# Dapp Radar Taquito Checker

This script checks the top 25 Tezos websites on Dapp Radar for usage of the Taquito JavaScript library. If there is an error reaching a website, a message is printed in red letters indicating that the website was unreachable, and the script will skip to the next website.

## How it works

The script uses Puppeteer to launch a headless browser and navigate to each website. It intercepts all network requests made by the page, and if any of the requests contain 'taquito' in the URL, it is assumed that the website is using the Taquito JavaScript library.

The script also fetches and parses JavaScript files from the intercepted requests using Babel's parser. It then traverses the parsed JavaScript code to look for usage of the 'taquito' identifier. If 'taquito' is found, a message is printed to the console.

## Usage

1. Install the required dependencies:

    ```bash
    npm install puppeteer @babel/parser estraverse node-fetch
    ```

2. Run the script:

    ```bash
    node check_taquito.js
    ```

## Note

This script provides a basic check and might not catch all uses of the Taquito library, especially if the library is bundled or obfuscated in some way that removes or changes the 'taquito' string in the request URLs or the JavaScript code. For a more thorough check, you might need to analyze the website's JavaScript code directly.
# Taquito Website Checker

This program checks the top 25 Tezos Dapps for the usage of Taquito, a TypeScript library suite for development on the Tezos blockchain. It uses Puppeteer to launch a headless browser, fetch JavaScript files from each website, and checks if these files contain the string 'taquito'.

## Features

- Fetches a list of top 25 Tezos Dapps from an API
- Checks each website for the usage of Taquito
- Logs whether each website is reachable and if it uses Taquito
- Handles async tasks concurrently for improved performance
- Limits the number of concurrent tasks to prevent exceeding the maximum number of listeners
- Provides detailed logging, including progress of the checks and which JavaScript file contained 'taquito' if it was found
- Includes error handling for fetch requests

## How to Use

1. Install the required Node.js modules:

```bash
npm install puppeteer chalk node-fetch p-limit
```

2. Run the program:

```bash
node check_taquito.js
```

The program will output a table in the console with the website URL, whether it is reachable, and whether it uses Taquito. It will also log the progress of the checks and which JavaScript file contained 'taquito' if it was found.

## Code Overview

The program consists of four main functions:

- `checkForTaquito(url)`: Launches a headless browser, navigates to the provided URL, and checks if any JavaScript files on the page contain the string 'taquito'. Returns an object with the website URL, whether it is reachable, and whether it uses Taquito. Includes error handling for fetch requests and logs the progress of the checks and which JavaScript file contained 'taquito' if it was found.

- `checkWebsites(websites)`: Maps over an array of website URLs, runs `checkForTaquito()` for each one, and logs the results in a table. Uses the `p-limit` module to limit the number of concurrent tasks and prevent exceeding the maximum number of listeners.

- `getWebsitesFromAPI()`: Fetches a list of top 25 Tezos Dapps from an API and returns an array of website URLs. Includes error handling for the fetch request.

- `main()`: The main function of the program. Logs a couple of introductory messages, then runs `getWebsitesFromAPI()` and `checkWebsites()`.

## Potential Improvements

This program could be further improved by adding more detailed logging, such as logging the progress of the fetch requests, or logging the details of any errors encountered. It could also benefit from a more sophisticated system for handling errors and retries, such as using an exponential backoff strategy for retrying failed requests.
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

The Taquito Checker Program is a useful tool for checking whether specific websites are using the Taquito library. However, for improvement:

1. **Error Handling:** While the code does have some error handling in place, it could be more robust. For example, it could handle more specific types of errors, or retry failed operations a certain number of times before giving up.

2. **Performance:** The program checks each website one by one, which could be slow if there are many websites to check. It could be improved by checking multiple websites concurrently. However, this must be done carefully to avoid exceeding the maximum number of listeners.

3. **Output:** The program outputs the results as a console table, which is not the most user-friendly or accessible format. It could be improved by providing the option to output the results in different formats, such as a CSV file or a JSON file.

4. **Testing:** The program does not appear to have any tests. It could be improved by adding unit tests, integration tests, and end-to-end tests to ensure that it works correctly and to catch any regressions.

5. **Documentation:** The program could benefit from more detailed comments and documentation, explaining what each part of the code does and why it does it. This would make the program easier to understand and maintain.

6. **Configurability:** Currently, the program is hard-coded to check the top 25 Tezos Dapps. It could be improved by making it more configurable, allowing the user to specify which websites to check, how many to check, etc.

7. **Security:** The API key is hard-coded into the program, which is a potential security risk. It would be better to store it in a secure way, such as using environment variables. 

8. **Code Organisation:** The code could be better organized. For example, it could be split into separate modules, each responsible for a specific part of the functionality (fetching the websites, checking a website, etc.). This would make the code more modular, easier to understand and maintain.
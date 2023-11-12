
---

# Taquito Library Checker

## Introduction
Taquito Library Checker is a Node.js application designed to check various websites and GitHub repositories for the usage of the Taquito JavaScript library, commonly used in Tezos blockchain applications. The program scans the specified websites and repositories, identifying where the Taquito library is being utilized.

## Features
- Check multiple websites for the presence of Taquito.
- Verify the use of Taquito in GitHub repositories.
- Present a comprehensive report in a tabular format.

## Installation

Before installation, ensure you have Node.js and npm (Node Package Manager) installed on your system.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/taquito-library-checker.git
   cd taquito-library-checker
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Setup Environment Variables:**
   Create a `.env` file in the root directory and add your GitHub token:
   ```plaintext
   GITHUB_TOKEN=your_github_token
   ```

## Usage

To run the program, execute the following command in the terminal:

```bash
node check_for_taquito.js
```

The program will read the list of websites and repository names from a predefined JSON file and output the results in a table format.

The table is derived from DappRadar Top 25 Tezos Dapps API, and can be recreated live from there, but rate limits play havoc.

## Contributing

Contributions to the Taquito Library Checker are welcome. Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature.
3. Commit your changes.
4. Push to the branch.
5. Create a new Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

---

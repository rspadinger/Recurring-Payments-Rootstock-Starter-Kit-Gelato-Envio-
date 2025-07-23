require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

const { RSK_MAINNET_RPC_URL, RSK_TESTNET_RPC_URL, WALLET_PRIVATE_KEY } = process.env

module.exports = {
    solidity: {
        version: "0.8.25",
        settings: {
            optimizer: { enabled: true, runs: 200 },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        rskMainnet: {
            url: RSK_MAINNET_RPC_URL,
            chainId: 30,
            gasPrice: 60000000,
            accounts: [WALLET_PRIVATE_KEY],
        },
        rskTestnet: {
            url: RSK_TESTNET_RPC_URL,
            chainId: 31,
            gasPrice: 60000000,
            accounts: [WALLET_PRIVATE_KEY],
        },
    },
    //npx hardhat verify --network rskTestnet CONTRACT_ADDRESS "constructor argument"
    etherscan: {
        apiKey: {
            // Is not required by blockscout. Can be any non-empty string
            rskTestnet: "your API key",
            rskMainnet: "your API key",
        },
        customChains: [
            {
                network: "rskTestnet",
                chainId: 31,
                urls: {
                    apiURL: "https://rootstock-testnet.blockscout.com/api/",
                    browserURL: "https://rootstock-testnet.blockscout.com/",
                },
            },
            {
                network: "rskMainnet",
                chainId: 30,
                urls: {
                    apiURL: "https://rootstock.blockscout.com/api/",
                    browserURL: "https://rootstock.blockscout.com/",
                },
            },
        ],
    },
}

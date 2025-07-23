<img src="rootstock-logo.jpg" alt="RSK Logo" style="width:100%; height: auto;" />

# App Description

This dApp lets users create secure, on-chain inheritance plans by assigning tokens to heirs with a chosen due date. Heirs can connect to see their future allocations and claim them once the plan becomes executable—automatically or manually.

# Getting Started

## 1. Clone the Repository

## 2. Install Dependencies

Install for both the frontend (`ui`) and smart contracts (`sc`) folders:

```bash
cd ui
npm install

cd ../sc
npm install
```

## 3. Set Environment Variables

Update the `.env.example` files in both folders and rename them to `.env`.

You’ll need:

-   Your **Privy app ID**
-   Any RPC URLs or chain-specific configs

### 4. Deploy Smart Contracts

Use Hardhat to deploy the contracts in the `sc` folder:

```bash
cd sc
npx hardhat run scripts/deployVerify.js --network <your_network>
```

Ensure the contract addresses are updated in your frontend config.

### 5. Run the Frontend

```bash
cd ../ui
npm run dev
```

Visit `http://localhost:3000` to access the dApp.

## Rootstock Hardhat Starterkit Configuration

## Supported Networks

-   Hardhat Network (localhost)
-   Rootstock Mainnet
-   Rootstock Testnet

#### 1. Install Dependencies

```shell
npm install
```

#### 2. Compile Contracts

```shell
npm run compile
```

#### 3. Environment Setup

To set up your environment, follow these steps:

1. Create a `.env` file and add your environment variables. You can use `.env.example` as a template.

Ensure you include the following variables:

-   `PRIVATE_KEY`: Your private key (e.g., found in account details on Metamask).
-   `RSK_MAINNET_RPC_URL`
-   `RSK_TESTNET_RPC_URL`

2. Obtain RPC URLs for the testnet and mainnet:

-   For public RPC URLs, visit the [Rootstock Developer Portal](https://dev.rootstock.io/develop/wallet/use/metamask/).
-   For hosted RPC URLs, you can find them at [GetBlock](https://getblock.io/nodes/rsk/).

These URLs will be used to configure your `.env` file for accessing the RSK network.

#### 1. Deploy Contract

```shell
npx hardhat run scripts/deploy.js
```

### Verify

```
npx hardhat verify --network rskTestnet DEPLOYED_CONTRACT_ADDRESS "Constructor arguments"
```

### Testing

#### Run Tests

```shell
npm run test
```

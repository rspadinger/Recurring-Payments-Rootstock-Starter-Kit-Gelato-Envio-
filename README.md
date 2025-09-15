<img src="rootstock-logo.jpg" alt="RSK Logo" style="width:100%; height: auto;" />

# Recurring Payments dApp

A decentralized application that enables users to set up and manage **on-chain recurring payments**. With this dApp, you can schedule RBTC transfers at fixed intervals, ensuring seamless automated payouts without manual intervention.

-   **Automation**: Payments are executed automatically at each interval via Gelato (since Chainlink Automation is not supported on Rootstock).
-   **Transparency**: Both senders and recipients can track upcoming and past payments directly on-chain.
-   **Indexing**: All payment events are captured and made queryable through Envio for analytics and reporting.

This project is built on **Rootstock (RSK)** and includes smart contracts, a Next.js frontend, and an Envio indexer.

---

## Features

-   ✅ Create recurring payment schedules with flexible intervals
-   ✅ Automatic execution via Gelato on Rootstock
-   ✅ Dashboard for senders and recipients to track payments
-   ✅ Envio indexer for querying historical and upcoming payments
-   ✅ Built-in support for Rootstock testnet and mainnet

---

## Project Structure

```
root/
 ├── indexer/   # Envio HyperIndex project for event indexing & querying
 ├── sc/        # Smart contracts (Hardhat)
 ├── ui/        # Frontend (Next.js + Tailwind + Shadcn + Wagmi)
 └── README.md
```

---

## Supported Networks

-   ✅ Hardhat (localhost)
-   ✅ Rootstock Testnet
-   ✅ Rootstock Mainnet

---

## Tech Stack

-   **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
-   **Frontend**: Next.js, TailwindCSS, Shadcn, Wagmi, Privy
-   **Indexing**: Envio HyperIndex (GraphQL + Hasura)
-   **Automation**: Gelato

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/rspadinger/Recurring-Payments-Rootstock-Starter-Kit-Gelato-Envio-.git
cd <repo>
```

---

### 2. Install Dependencies

Install dependencies for all three projects:

```bash
# Frontend
cd ui
npm install

# Smart Contracts
cd ../sc
npm install

# Indexer
cd ../indexer
pnpm install
```

---

### 3. Set Environment Variables

Copy `.env.example` to `.env` in both `ui` and `sc` folders.

For the **frontend (`ui`)**, you’ll need:

-   `NEXT_PUBLIC_PRIVY_APP_ID_RSKTEST` – your Privy app ID
-   `NEXT_PUBLIC_ALCHEMY_RPC_RSKTEST` – RPC URL
-   `NEXT_PUBLIC_PAYMENT_FACTORY_ADDRESS_31` – the address of the RecurringPaymentFactory contract

For the **smart contracts (`sc`)**, you’ll need:

-   `PRIVATE_KEY` – your wallet’s private key (use a dev/test key, not your main wallet)
-   `RSK_TESTNET_RPC_URL` – RPC URL

📌 You can find RPC URLs from the [Rootstock Developer Portal](https://dev.rootstock.io/develop/wallet/use/metamask/) or use a provider like [Alchemy](https://www.alchemy.com/).

---

### 4. Compile, Deploy & Verify Smart Contracts

#### Compile Contracts

```bash
cd sc
npm run compile
```

#### Run Tests

```bash
cd sc
npm run test
```

#### Deploy Contracts

```bash
cd sc
npm run deploy
```

#### Verify Contract

```bash
npm run verify
```

Update the deployed factory address in the ui/.env file as well as in the indexer/config.yaml file if you want to use your own indexer.

---

### 5. Deploy the Indexer

#### Local Indexing

We use **Envio HyperIndex** for event indexing. To initialize indexing files:

```bash
pnpm envio init
```

This generates:

-   `config.yaml` – project config
-   `schema.graphql` – GraphQL schema
-   `src/EventHandlers.ts` – event handler mappings

If you update these files, regenerate types with:

```bash
pnpm codegen
```

Start a local indexer (requires Docker):

```bash
pnpm dev
```

Access Hasura at [http://localhost:8080](http://localhost:8080).

📌 More info: [Envio Quickstart Guide](https://docs.envio.dev/docs/HyperIndex/contract-import).

#### Hosted Deployment

You can deploy the indexer easily via [Envio](https://envio.dev/app/login).
Docs: [Hosted Service Deployment](https://docs.envio.dev/docs/HyperIndex/hosted-service-deployment).

---

### 6. Run the Frontend

```bash
cd ../ui
npm run dev
```

Visit `http://localhost:3000` to access the dApp.

---

## Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open a PR or start a discussion in Issues.

---

## License

This project is licensed under the **MIT License**.

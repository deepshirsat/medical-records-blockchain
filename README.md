# MedLedger — Blockchain-Based Medical Records

A full-fledged educational mini project based on the original assignment. It includes a Solidity smart contract, browser frontend, provider authorization, deployment script, automated tests, and setup instructions.

## Features

- Add a medical record with a generated numeric record ID.
- Retrieve a record and view its timestamp and submitting wallet.
- Track total records registered.
- Owner-controlled provider authorization and revocation.
- Reject unauthorized writers, empty fields, and invalid record IDs.
- Emit an event when a record is registered.
- Browser UI for wallet connection, record submission, lookup, provider access, and transaction feedback.
- Automated smart-contract tests using Hardhat.

## Important privacy limitation

This is a classroom demonstration, not a production healthcare system. Data written to a blockchain can be visible to network participants and may be permanent. **Use fictional sample data only.** Do not enter real patient names, diagnoses, treatments, patient identifiers, or other personal/health information. Production designs generally keep encrypted health data off-chain and put only carefully designed hashes/pointers/permissions on-chain, with proper security and legal review. The provider authorization in this demo controls who can write through this contract; it does not make stored data private or restrict public reads.

## Requirements

- Node.js 18 or newer
- npm
- MetaMask browser extension (for the browser UI)
- Modern browser

## 1. Install dependencies

From the project root:

```bash
npm install
```

## 2. Compile and test

```bash
npm run compile
npm test
```

The tests cover ownership, provider authorization, unauthorized writes, empty fields, valid record creation, and missing record IDs.

## 3. Start a local blockchain

In terminal 1:

```bash
npm run node
```

Keep this terminal open. Hardhat prints development accounts and a local JSON-RPC endpoint (usually `http://127.0.0.1:8545`).

## 4. Deploy the contract locally

In terminal 2:

```bash
npm run deploy:local
```

Copy the deployed contract address from the terminal.

### Connect MetaMask to the local chain

In MetaMask, add/select a local network:
- Network name: Hardhat Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

For a local demo, import one of the development private keys printed by Hardhat into MetaMask. These keys are public test keys and must never be used for real funds.

## 5. Configure the frontend

Open `frontend/app.js` and paste the deployed address into:

```js
const CONTRACT_ADDRESS = "PASTE_DEPLOYED_ADDRESS_HERE";
```

The ABI is already included. Keep the local Hardhat node running.

## 6. Run the frontend

Serve the `frontend` directory using any static web server. For example, with Python installed:

```bash
cd frontend
python -m http.server 5500
```

Open `http://localhost:5500` in your browser, connect MetaMask, and ensure MetaMask is on the Hardhat Local network.

You can also open the folder with VS Code and use a static-server extension. Avoid opening `index.html` as a `file://` URL if your browser blocks wallet interactions.

## 7. Use the application

1. Connect the owner wallet.
2. Submit fictional data in **Register a record** and confirm the MetaMask transaction.
3. Look up the record using ID `1` (or the ID returned by the current record count).
4. To authorize a second wallet, paste its address in **Authorize a provider**.
5. Switch MetaMask to that provider wallet and submit a sample record.
6. Revoke access from the owner wallet when testing is complete.

The contract owner is the wallet that deploys the contract. Only the owner can authorize/revoke provider wallets. Reading a record is public by design in this demo.

## Alternative: Remix IDE

You can also paste `contracts/MedicalRecords.sol` into Remix, select compiler `0.8.24`, compile, and deploy using Remix VM. The frontend is designed for a deployed contract address and a browser wallet network; for the easiest first test, follow the Hardhat setup above.

## Project structure

```text
medical-records-blockchain/
├── contracts/
│   └── MedicalRecords.sol
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scripts/
│   └── deploy.js
├── test/
│   └── MedicalRecords.js
├── hardhat.config.js
├── package.json
└── README.md
```

## Smart-contract design summary

- `owner`: deployer address; can manage provider permissions.
- `authorizedProvider`: indicates which wallets can write records.
- `MedicalRecord`: record ID, demo patient fields, timestamp, and submitting wallet.
- `addMedicalRecord`: validates required fields, creates a sequential ID, stores the record, and emits an event.
- `getMedicalRecord`: returns a record by ID or reverts if it does not exist.
- `getRecordCount`: returns the number of records created.
- `setProviderAuthorization`: owner-only permission management.

## Limitations and future improvements

- Replace all on-chain personal data with encrypted off-chain storage and a privacy-preserving on-chain verification design.
- Add patient consent and revocation workflows.
- Add a production-grade identity and key recovery strategy.
- Add audit logging, rate limiting, monitoring, and a formal security audit.
- Add a backend and standards-based integration only after a privacy and threat-model review.
- Current UI loads ethers.js from a CDN, so the first page load requires internet access.

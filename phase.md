# Current Phase: Phase 1 — Core Protocol Wiring

## Status: 🚀 In Progress
**Objective**: Transition from mock interfaces to live Algorand Testnet interactions for the Borrowing flow and establish testing infrastructure.

### 📋 Checklist

#### 1. On-Chain Borrowing
- [ ] Import `useInitiateLoan` in `app/borrow/page.tsx`.
- [ ] Map UI form fields (Amount, Asset) to contract arguments.
- [ ] Implement atomic group handling (Collateral + Loan Call).
- [ ] Add success/error toast notifications for live transactions.

#### 2. Automated Faucet
- [ ] Create API route `/api/faucet`.
- [ ] Securely use `FAUCET_MNEMONIC` via environment variables.
- [ ] Automate sending 10 ALGO and 100 USDC to requested addresses.
- [ ] Wire the "Request Assets" button in `app/faucet/page.tsx`.

#### 3. Real-Time Pool Stats
- [ ] Fetch data from `LendingPoolClient.get_pool_stats`.
- [ ] Update `/pools` page state with live liquidity balances.
- [ ] Replace mock APY percentages with calculated values from the contract.

---

### 🛠️ Technical Context
- **Contract**: `BNPLCredit.algo.ts` & `LendingPool.algo.ts`
- **Network**: Algorand Testnet
- **Database**: MongoDB (Profile updates on sync)

# Irion Protocol Roadmap

## 🎯 Vision
To build a state-of-the-art, undercollateralized lending protocol on Algorand that leverages on-chain credit scoring and real-time risk assessment.

## 📍 Current Status: 85% Complete
We have successfully migrated the backend to MongoDB and wired the core "Savings" and "Repayment" logic.

---

## 🏗️ Phase 1: Core Protocol Wiring (ACTIVE)
*Timeline: Current Turn*
- **Objective**: Functional end-to-end borrowing and testing infrastructure.
- [ ] Wire `borrow/page.tsx` to `BNPLCredit.initiateLoan`.
- [ ] Activate `app/faucet` with mnemonic-based automated distribution.
- [ ] Align `Pools` dashboard with real-time `LendingPool` state.

## 📊 Phase 2: Visibility & Data Integrity
*Timeline: Next Objective*
- **Objective**: Real-time transparency and score tracking.
- [ ] Implement `Transaction` model indexing for Activity Ledger.
- [ ] Refine background sync for MongoDB profile accuracy.
- [ ] Functional Credit Score dashboard with risk metrics.

## ✨ Phase 3: UX Excellence & Handover
*Timeline: Final Polish*
- **Objective**: Premium feel and production-readiness.
- [ ] Framer Motion animations & Loading Skeletons.
- [ ] Advanced Error Handling (Slippage, Wallet errors).
- [ ] Documentation finalization and Testnet release.

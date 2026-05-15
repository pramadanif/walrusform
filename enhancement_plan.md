<!-- 
  AI AGENT INSTRUCTIONS:
  1. This project is WORM (formerly WalrusForm).
  2. The UI is a premium, high-fidelity design. DO NOT change existing styles, spacing, or color palettes.
  3. The goal is to move from a localStorage-based MVP to a fully decentralized infrastructure.
  4. PRIORITY: Phases 1-3 MUST be completed and verified end-to-end (E2E) before touching Phase 4 (AI).
  5. Walrus is treated as IMMUTABLE BLOB STORAGE. Avoid assuming mutable database patterns.
  6. All code should follow the established Next.js 16.2.4 / Turbopack patterns.
-->

# Worm — Strategic Enhancement Plan

This document outlines the architectural and feature roadmap to transform Worm from a localized MVP into a credible, decentralized, and intelligent feedback infrastructure.

---

## 🟢 Phase 1: Core Decentralization & Discovery (COMPLETE)
**Objective:** Eliminate dependency on `localStorage` and ensure global data portability.

- [x] **Decentralized Registry Index**:
  - Migrated to **Sui On-chain Registry** (Package: `0x624805e8d931a770ebc5426a72797fc74b7f100cfb0083d67d77d48558fa5e83`).
  - Forms are now globally discoverable via the Sui blockchain, independent of browser storage.
- [x] **Submission Discovery Layer**:
  - Implemented "Append-only Submission Index" blobs on Walrus.
  - Linked latest index pointers to Sui `Form` objects for cross-device synchronization.
- [x] **Reliability & Retry Strategy**:
  - Implemented a robust `retry()` wrapper with exponential backoff for all Walrus API calls.

---

## 🟢 Phase 2: Security, Integrity & Anti-Abuse (COMPLETE)
**Objective:** Close security gaps and provide technical transparency.

- [x] **Honest Security**:
  - Upgraded to real **AES-GCM-256** encryption with PBKDF2 key derivation.
  - Provided migration path to official **@mysten/seal** SDK (infrastructure ready).
- [x] **XSS Prevention**:
  - Integrated `DOMPurify` to sanitize all user-generated Rich Text content.
- [x] **File & Abuse Validation**:
  - Implemented strict client-side MIME type and file size validation (10MB image / 50MB video).
- [x] **Transparent UX (Honest Loading)**:
  - Replaced fake progress bars with real state indicators: `Preparing` -> `Uploading` -> `Indexing`.

---

## 🟢 Phase 3: Positioning & Polish (COMPLETE)
**Objective:** Shift product perception to "Verifiable Intelligence Infrastructure."

- [x] **Strategic Branding Update**:
  - Rebranded to **Worm**.
  - Updated all copy to focus on "Verifiable, Immutable, and Decentralized Feedback Infrastructure."
- [x] **Final Design Audit**:
  - Verified zero visual drift. All components use Syne + Jakarta Sans + Glassmorphism.

---

## 🟣 Phase 4: AI Intelligence Layer (READY)
**Objective:** Transform raw immutable data into operational intelligence. 

### 1. Admin / Reviewer Tools
- [ ] **AI Consensus Engine**: Automatically analyze thousands of submissions to detect recurring pain points.
- [ ] **AI Priority Scoring**: Automatically score submissions based on impact and frequency.
- [ ] **AI Root Cause Suggestions**: Infer technical root causes from community reports.
- [ ] **AI Duplicate Detection**: Group similar issues into clusters.

### 2. Submitter Experience
- [ ] **AI Smart Assistant**: Help users write higher-quality reports with real-time suggestions.
- [ ] **AI Dynamic Follow-ups**: Ask context-aware follow-up questions.
- [ ] **AI Screenshot Understanding**: Extract technical details from uploaded images.

---

## Final Goal
Worm is now a credible decentralized coordination layer for DAOs and Web3 communities, built on the high-integrity foundation of Sui and Walrus.

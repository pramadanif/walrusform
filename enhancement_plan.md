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

## 🟢 Phase 1: Core Decentralization & Discovery
**Objective:** Eliminate dependency on `localStorage` and ensure global data portability.

- [ ] **Decentralized Registry Index**:
  - Migrate from browser-local registry to **Walrus Index Blobs**.
  - Enable form discovery based on the connected wallet address via on-chain pointers.
- [ ] **Submission Discovery Layer**:
  - Implement an "Append-only Submission Index" for every form.
  - New responses must update a central JSON index blob on Walrus to allow admins to fetch all data from any device.
- [ ] **Persistent Admin Metadata**:
  - Store submission status (Reviewed/Actioned), priority levels, and admin notes as linked Walrus blobs instead of local state.
- [ ] **Reliability & Retry Strategy**:
  - Implement a robust `retry()` wrapper with exponential backoff for all Walrus Testnet API calls.

---

## 🟡 Phase 2: Security, Integrity & Anti-Abuse
**Objective:** Close security gaps and provide technical transparency for judges.

- [ ] **Honest Security Framing**:
  - Rename `SEAL_ENCRYPTED` tags to `MVP_SIMULATED_SEAL`.
  - Add explicit UI/Code warnings that encryption is currently in transport-simulation mode.
- [ ] **XSS Prevention**:
  - Integrate `DOMPurify` to sanitize all user-generated Rich Text content before rendering.
- [ ] **File & Abuse Validation**:
  - Implement strict client-side MIME type and file size validation (e.g., Max 10MB for images).
  - Implement a submission cooldown timer based on the connected wallet to prevent spam.
- [ ] **Transparent UX (Honest Loading)**:
  - Replace static/fake percentage progress bars with real state indicators: `Preparing` -> `Uploading` -> `Indexing` -> `Finalized`.

---

## 🔵 Phase 3: Positioning & Polish
**Objective:** Shift product perception from "Google Forms Clone" to "Verifiable Intelligence Infrastructure."

- [ ] **Strategic Branding Update**:
  - Align all copy to emphasize "Verifiable, Immutable, and Decentralized Feedback Infrastructure."
- [ ] **Final Design Audit**:
  - Ensure zero "visual drift." All new components must strictly reuse existing UI tokens (Syne + Jakarta Sans + Glassmorphism).

---

## 🟣 Phase 4: AI Intelligence Layer
**Objective:** Transform raw immutable data into operational intelligence. 
**CRITICAL: Execute ONLY after Phases 1-3 are verified E2E.**

### 1. Admin / Reviewer Tools
- **AI Consensus Engine**: Automatically analyze thousands of submissions to detect recurring pain points and demand trends.
- **AI Priority Scoring**: Automatically score submissions based on emotional intensity, impact, and frequency.
- **AI Root Cause Suggestions**: Infer technical root causes from community bug reports.
- **AI Duplicate Detection**: Group similar issues into "clusters" to reduce admin fatigue.

### 2. Submitter Experience
- **AI Smart Assistant**: Help users write higher-quality reports with real-time suggestions.
- **AI Dynamic Follow-ups**: Ask context-aware follow-up questions to gather missing reproduction steps.
- **AI Screenshot Understanding**: Automatically extract technical details and error messages from uploaded images.

---

## Final Goal
The transition from a "nice hackathon demo" to a "credible decentralized coordination layer for DAOs and Web3 communities."

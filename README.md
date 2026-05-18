<div align="center">
  <img src="./wormlogo.png" alt="Worm Logo" width="180" />

  <h1>Worm — Decentralized Feedback Infrastructure</h1>

  <p>
    <strong>Build. Deploy. Collect. Verify.</strong><br/>
    A fully decentralized form builder and feedback coordination platform powered by <strong>Sui</strong>, <strong>Walrus</strong>, and <strong>Seal</strong>.
  </p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2.4-black?style=flat-square&logo=next.js" alt="Next.js" /></a>
    <a href="https://sui.io/"><img src="https://img.shields.io/badge/Sui-Testnet-4a2e8c?style=flat-square&logo=sui" alt="Sui" /></a>
    <a href="https://walrus.site/"><img src="https://img.shields.io/badge/Walrus-Storage-blue?style=flat-square" alt="Walrus" /></a>
    <a href="https://sdk.mystenlabs.com/seal"><img src="https://img.shields.io/badge/Seal-Threshold%20Encryption-amber?style=flat-square" alt="Seal" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  </p>
</div>

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [System Architecture Diagram](#system-architecture-diagram)
4. [User Flow Diagram](#user-flow-diagram)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Smart Contract Architecture](#smart-contract-architecture)
7. [Contract Deployment Addresses](#contract-deployment-addresses)
8. [Smart Contract Functions Reference](#smart-contract-functions-reference)
9. [Security Model](#security-model)
10. [Features](#features)
11. [Tech Stack](#tech-stack)
12. [Project Structure](#project-structure)
13. [Getting Started](#getting-started)
14. [Environment Variables](#environment-variables)
15. [Move Package Deployment](#move-package-deployment)
16. [End-to-End Testing](#end-to-end-testing)
17. [How Seal Encryption Works](#how-seal-encryption-works)
18. [Roadmap](#roadmap)
19. [Contributing](#contributing)

---

## Overview

**Worm** is not just a form builder. It is a **verifiable feedback coordination infrastructure** built entirely on decentralized primitives.

Every form, submission, and response index lives on the **Walrus decentralized blob storage** network, with ownership and discovery enforced by a **Sui Move smart contract**. Sensitive submissions are protected by **@mysten/seal**, a threshold encryption protocol where decryption keys are distributed across Sui validators — not held by any single server.

### Why Worm?

| Traditional Forms | Worm |
|---|---|
| Data on company servers | Data on Walrus (immutable, decentralized) |
| Centralized indexer required | Client-side Sui event-based discovery |
| Trust the platform for privacy | Cryptographic guarantee via Seal |
| Device-dependent dashboard | Wallet-based, fully portable |
| Vulnerable to censorship | Immutable + chain-anchored |

---

## Core Architecture

Worm is built on three decentralized layers:

```
┌─────────────────────────────────────────────────────┐
│                   WORM PLATFORM                      │
│                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐ │
│  │  Sui Network │  │    Walrus     │  │   Seal   │ │
│  │  (Registry & │  │  (Immutable  │  │(Threshold│ │
│  │  Discovery)  │  │   Storage)   │  │ Encrypt) │ │
│  └──────────────┘  └───────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
```

1. **Sui Network**: Stores form metadata as shared objects. Emits `FormCreated` events for global discovery. Enforces the Seal access control policy via `seal_approve`.

2. **Walrus**: Stores the actual form definitions and submissions as immutable blobs. Maintains an append-only submission index per form.

3. **Seal SDK**: Provides threshold encryption for private submissions. Keys are distributed across the Sui validator set — no single point of compromise.

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph FE["🎨 Frontend Layer (Next.js 16.2.4)"]
        B["Builder Page<br/>(Form Designer)"]
        D["Dashboard Page<br/>(Admin Panel)"]
        F["Public Form Page<br/>(Respondent UI)"]
        S["Settings Page<br/>(Encryption Config)"]
        T["Templates Page<br/>(Pre-built Forms)"]
    end

    subgraph SDK["🔐 SDK Integration Layer"]
        SS["seal.ts<br/>(Threshold Encryption)"]
        WS["walrus.ts<br/>(Blob Storage)"]
        SA["suiActions.ts<br/>(On-chain Registry)"]
    end

    subgraph INFRA["🏗️ Web3 Infrastructure"]
        SUI["Sui Testnet<br/>(Form Objects<br/>& Events)"]
        WALRUS["Walrus Storage<br/>(Immutable Blobs)"]
        VALIDATORS["Sui Validators<br/>(Key Servers)"]
    end

    subgraph STORAGE["💾 Data Storage"]
        FB["Form Blobs<br/>(Walrus)"]
        IB["Index Blobs<br/>(Submission Lists)"]
        SB["Submission Blobs<br/>(Encrypted)"]
    end

    FE -->|Create Form| SDK
    FE -->|Submit Response| SDK
    FE -->|Read Forms| SDK
    
    SS -->|Encrypt| VALIDATORS
    WS -->|Upload/Read| WALRUS
    SA -->|Register/Query| SUI
    
    WALRUS --> STORAGE
    SUI -->|Events| FE
    
    VALIDATORS -->|Decryption Keys| SDK
```

---

## User Flow Diagram

```mermaid
flowchart TD
    Start([User Visit]) --> Auth{Wallet<br/>Connected?}
    Auth -->|No| Connect["Connect Sui Wallet"]
    Auth -->|Yes| Landing["Landing Page"]
    Connect --> Landing
    
    Landing --> Choice{User Action?}
    
    Choice -->|Create Form| Builder["Form Builder"]
    Choice -->|View Forms| Dashboard["Admin Dashboard"]
    Choice -->|Join Form| Public["Public Form"]
    
    Builder --> Design["Design Form<br/>(Add Fields)"]
    Design --> Config["Configure<br/>(Seal Encryption)"]
    Config --> Deploy["Deploy to Walrus<br/>& Sui"]
    Deploy --> Share["Share Form Link"]
    Share --> GetResponses["Monitor Responses"]
    
    Dashboard --> Sync["Sync from Sui<br/>(Event Discovery)"]
    Sync --> View["View Responses"]
    View --> Decrypt{Encrypted?}
    Decrypt -->|Yes| SealDecrypt["Seal Decryption"]
    Decrypt -->|No| Show["Display Data"]
    SealDecrypt --> Show
    Show --> Export["Export to CSV"]
    
    Public --> Fill["Fill Form Fields"]
    Fill --> Encrypt{Encryption<br/>Enabled?}
    Encrypt -->|Yes| SealEncrypt["Seal Encryption"]
    Encrypt -->|No| Store["Store Plaintext"]
    SealEncrypt --> Upload["Upload to Walrus"]
    Store --> Upload
    Upload --> UpdateIndex["Update Index<br/>on Sui"]
    UpdateIndex --> Confirm["Submission Confirmed"]
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User as User (Wallet)
    participant Frontend as Next.js Frontend
    participant Seal as Seal SDK<br/>(Threshold Encrypt)
    participant Walrus as Walrus Storage
    participant Sui as Sui Blockchain
    participant Validators as Sui Validators<br/>(Key Servers)

    User->>Frontend: 1. Create Form
    Frontend->>Frontend: 2. Generate FormDefinition
    Frontend->>Walrus: 3. uploadToWalrus(form)
    Walrus-->>Frontend: 4. blobId
    Frontend->>Sui: 5. create_form tx<br/>(title, blobId)
    Sui->>Sui: 6. Create Form object
    Sui-->>User: 7. formId (object address)
    
    User->>Frontend: 8. Submit Response
    Frontend->>Seal: 9. seal.encrypt(data,<br/>formId, packageId)
    Seal->>Validators: 10. Get public keys
    Validators-->>Seal: 11. Threshold keys
    Seal-->>Frontend: 12. encryptedObject
    Frontend->>Walrus: 13. uploadToWalrus(encrypted)
    Walrus-->>Frontend: 14. submissionBlobId
    Frontend->>Sui: 15. update_submission_index<br/>(formId, newBlobId)
    Sui->>Sui: 16. Emit SubmissionIndexUpdated
    
    User->>Frontend: 17. View Dashboard
    Frontend->>Sui: 18. queryEvents(FormCreated)
    Sui-->>Frontend: 19. All forms (global discovery)
    Frontend->>Walrus: 20. readFromWalrus(indexBlobId)
    Walrus-->>Frontend: 21. Submission list
    Frontend->>Walrus: 22. readFromWalrus(submissionBlobId)
    Walrus-->>Frontend: 23. Encrypted blob
    
    User->>Frontend: 24. Authorize Decryption
    Frontend->>Sui: 25. seal_approve tx
    Sui->>Validators: 26. Check approval
    Validators-->>Seal: 27. Key shares
    Seal-->>Frontend: 28. Decrypted plaintext
```

---

## Smart Contract Architecture

```mermaid
classDiagram
    class Form {
        +UID id
        +String title
        +String form_blob_id
        +String latest_submission_index_blob_id
        +address creator
        +vector address team_members
        
        create_form()
        update_submission_index()
        add_team_member()
        remove_team_member()
    }

    class FormCreated {
        +address form_id
        +address creator
        +String form_blob_id
        
        emitted_on Form creation
    }

    class SubmissionIndexUpdated {
        +address form_id
        +String new_index_blob_id
        
        emitted_on index update
    }

    class IncentivePool {
        +Balance SUI balance
        +u64 reward_per_response
        +u64 max_responses
        +u64 current_responses
        
        store_incentive()
        distribute_reward()
    }

    class SubmissionMeta {
        +String status
        +String note
        +u8 rank
        
        update_meta()
    }

    class SealApproval {
        +UID id
        +address form_id
        +vector address approved_decryptors
        
        seal_approve()
    }

    Form "1" --> "0..*" FormCreated : emits
    Form "1" --> "0..*" SubmissionIndexUpdated : emits
    Form "1" --> "1" IncentivePool : manages
    Form "1" --> "0..*" SubmissionMeta : tracks
    Form "1" --> "0..*" SealApproval : authorizes
```

---

## Contract Deployment Addresses

### 📍 Mainnet Deployment

| Component | Address | Chain | Status |
|---|---|---|---|
| **Move Package** | `0x49b039b07d3738244258afac14c90364f89d3f68c1ded39a267fdf9c65819156` | Sui Mainnet | ✅ Live |
| **Upgrade Capability** | `0x4a1086b92b794c7e717b4045f1e1b971f454fd9305478089ee9b3abfffbcdd28` | Sui Mainnet | 🔐 Controlled |
| **Module** | `worm` | Sui Mainnet | ✅ Active |

### 🧪 Testnet Deployment

| Component | Address | Chain | Status |
|---|---|---|---|
| **Move Package** | `0x9752e3c1a621d17526b1bbe75ee0098151b3f392ce71035f39c0b835fc7a665b` | Sui Testnet | ✅ Live |
| **Upgrade Capability** | `0xb88863798d6e7295540cff9c6c7048f8288e98159cac49567a06d90768ca078a` | Sui Testnet | 🔐 Controlled |
| **Module** | `worm` | Sui Testnet | ✅ Active |
| **Seal Key Server** | `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75` | Sui Testnet | 🔐 Threshold Keys |

### 🔧 Build Configuration

```toml
[package.manifest]
name = "move_worm_v2"
version = "1.0.0"
edition = "2024"

[package.dependencies.Sui]
version = "1.70.2"
```

---

## Smart Contract Functions Reference

### Core Functions

#### `create_form`
Creates a new form on the Sui blockchain.

**Parameters:**
- `title: String` — Form title/name
- `form_blob_id: String` — Walrus blob ID containing form definition (JSON)
- `submission_index_blob_id: String` — Walrus blob ID for submission index (append-only)
- `ctx: &mut TxContext` — Transaction context

**Returns:**
- Shared `Form` object with unique address
- Emits `FormCreated` event

**Example:**
```move
create_form(
    b"Customer Feedback Survey".to_string(),
    b"Es7i4iw1l3xkak2o1buw2bz3j7bcj6wn1q9jfb3v".to_string(),
    b"Es7i4iw1l3xkak2o1buw2bz3j7bcj6wn1q9jfb3w".to_string(),
    &mut ctx
)
```

**On-Chain Result:**
- Form object stored in Sui state
- Globally discoverable via `FormCreated` event
- Creator holds rights to modify form and submissions

---

#### `update_submission_index`
Updates the submission index pointer on-chain after new submissions are added to Walrus.

**Parameters:**
- `form_id: address` — Address of the Form object
- `new_index_blob_id: String` — New Walrus blob ID containing updated submission index
- `ctx: &mut TxContext` — Transaction context

**Returns:**
- Updated Form object with new `latest_submission_index_blob_id`
- Emits `SubmissionIndexUpdated` event

**Example:**
```move
update_submission_index(
    0xabcd1234...,
    b"Es7i4iw1l3xkak2o1buw2bz3j7bcj6wn1q9jfb3x".to_string(),
    &mut ctx
)
```

**Event Emission:**
```move
event::emit(SubmissionIndexUpdated {
    form_id: @0xabcd1234,
    new_index_blob_id: b"Es7i4iw1l3xkak2o1buw2bz3j7bcj6wn1q9jfb3x",
})
```

---

#### `seal_approve`
Creates a Seal approval object for threshold-encrypted submissions. Authorizes specific addresses to decrypt submissions using Seal SDK.

**Parameters:**
- `form_id: address` — Address of the Form object
- `approved_decryptors: vector<address>` — Addresses authorized to decrypt submissions
- `ctx: &mut TxContext` — Transaction context

**Returns:**
- `SealApproval` object with list of authorized decryptors
- Stored as dynamic field on Form object

**Example:**
```move
seal_approve(
    0xabcd1234...,
    vector[0xdecrypt1, 0xdecrypt2],
    &mut ctx
)
```

**Security Note:**
- Only form creator can call this function
- Decryptors must have valid Sui addresses
- Threshold-encrypted submissions cannot be read without Seal approval

---

### Team & Access Control Functions

#### `add_team_member`
Adds a team member as co-owner of a form.

**Parameters:**
- `form_id: address` — Form object address
- `member_address: address` — Address to add
- `ctx: &mut TxContext` — Transaction context

**Security:**
- Only creator or existing team members can call
- New members gain full form management rights

---

#### `remove_team_member`
Removes a team member from form co-ownership.

**Parameters:**
- `form_id: address` — Form object address
- `member_address: address` — Address to remove
- `ctx: &mut TxContext` — Transaction context

---

### Incentive Pool Functions

#### `store_incentive`
Deposits SUI as rewards for form respondents.

**Parameters:**
- `form_id: address` — Form object address
- `coins: Coin<SUI>` — Coins to deposit
- `reward_per_response: u64` — Reward amount per submission
- `max_responses: u64` — Maximum responses to reward
- `ctx: &mut TxContext` — Transaction context

**Example:**
```move
// Deposit 1 SUI (1,000,000,000 in MIST) for 10 responses @ 100M MIST each
store_incentive(
    0xabcd1234,
    coin_1_sui,
    100000000,  // 0.1 SUI per response
    10,
    &mut ctx
)
```

---

#### `distribute_reward`
Distributes rewards to a respondent after submission.

**Parameters:**
- `form_id: address` — Form object address
- `recipient: address` — Respondent address
- `ctx: &mut TxContext` — Transaction context

**Returns:**
- `Coin<SUI>` with reward amount transferred to recipient

---

### Metadata Management

#### `update_submission_meta`
Updates status, notes, and rank for a specific submission.

**Parameters:**
- `form_id: address` — Form object address
- `submission_blob_id: String` — Submission Walrus blob ID
- `status: String` — Status (e.g., "New", "In Review", "Actioned")
- `note: String` — Internal notes from form creator
- `rank: u8` — Priority rank (0-255)

**Emitted Event:**
```move
event::emit(MetaUpdated {
    form_id: @0xabcd1234,
    submission_blob_id: b"Es7i4iw1l3xkak2o1buw2bz3j7bcj6wn1q9jfb3y",
    status: b"In Review".to_string(),
    note: b"High priority bug report".to_string(),
    rank: 5,
})
```

---

### Events Reference

```rust
/// Emitted when a form is created
public struct FormCreated has copy, drop {
    form_id: address,
    creator: address,
    form_blob_id: String,
}

/// Emitted when submission index is updated
public struct SubmissionIndexUpdated has copy, drop {
    form_id: address,
    new_index_blob_id: String,
}

/// Emitted when submission metadata changes
public struct MetaUpdated has copy, drop {
    form_id: address,
    submission_blob_id: String,
    status: String,
    note: String,
    rank: u8,
}

/// Emitted when team is registered
public struct TeamCreated has copy, drop {
    form_id: address,
    team_id: address,
    members: vector<address>,
}

/// Emitted when pool is created
public struct PoolCreated has copy, drop {
    form_id: address,
    pool_id: address,
}
```

---

## Security Model

```mermaid
flowchart TD
    S1[Submission Data] --> E1{Is Encryption Enabled?}
    E1 -->|Yes| S2[Seal SDK: seal.encrypt]
    E1 -->|No| S3[Plaintext Blob on Walrus]

    S2 --> S4["Threshold Key Split<br/>across Sui Validators"]
    S4 --> S5[WORM_SEAL_SDK_V1 Blob on Walrus]

    S5 --> D1{Read Request}
    D1 --> D2[wallet.sign session key]
    D2 --> D3[seal_approve tx on Sui]
    D3 --> D4{Threshold Met?}
    D4 -->|≥ threshold validators| D5[Decrypted Plaintext]
    D4 -->|< threshold| D6[Access Denied]

    S3 --> R1[Readable by anyone with blobId]
```

### Security Layers

| Layer | Technology | Protection |
|---|---|---|
| **Encryption** | @mysten/seal (threshold) + AES-GCM-256 | Submission data encrypted before Walrus upload |
| **Key Distribution** | Sui Validators | No single server holds decryption keys |
| **Access Control** | Move `seal_approve` | On-chain ACL enforces allowed decryptors |
| **Content Safety** | DOMPurify | XSS prevention on rich text rendering |
| **Storage Integrity** | Walrus (immutable blobs) | Submissions cannot be tampered with post-upload |

---

## Features

### 🏗️ Form Builder
- **Drag-to-reorder** fields with Framer Motion Reorder
- **9 field types**: Text, Rich Text, Dropdown, Checkbox, Star Rating, Screenshot, Video, URL, Confirmation
- **Settings tab**: Configure Seal encryption policy, authorized decryptors, wallet requirements
- **Live preview**: Switch between builder and preview modes
- **Glassmorphism UI**: Premium design with Syne + Jakarta Sans typography

### 📡 Decentralized Deployment
- Form definitions uploaded as **immutable Walrus blobs**
- Registered on **Sui Testnet** via `create_form` Move function
- Generates a shareable link: `/form/{walrusBlobId}`
- **Real-time Activity Log** shows Seal → Walrus → Sui stages

### 📝 Public Form Submission
- Form definition fetched directly from Walrus (no backend)
- Submissions encrypted by Seal SDK before storage
- Immutable submission blob uploaded to Walrus
- Submission index updated on-chain via `update_submission_index`
- **Progress stages**: `Seal: Securing...` → `Walrus: Storing...` → `Walrus: Indexing...`

### 📊 Admin Dashboard
- **Global discovery** via Sui event queries — no indexer server needed
- **Sync status indicators**: Sui Sync → Walrus Sync → Seal Decrypting → Verified
- Filter responses by form, search by content
- **Slide-over detail panel** with decrypted answers
- **Status management**: New → In Review → Actioned → Archived
- **Internal notes** (local, encrypted at rest)
- **CSV export** via PapaParse
- **"View on Walrus"** link for each response blob

### 🔐 Seal Encryption
- Uses `@mysten/seal` v1.1.3 SDK
- Key server: `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75`
- AES-GCM-256 fallback when formObjectId is unavailable
- Dual-prefix detection: `WORM_SEAL_SDK_V1` and `WORM_AES_GCM_V1`

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16.2.4 (App Router, Turbopack) |
| **Language** | TypeScript 5.x |
| **Blockchain** | Sui Testnet (Move language) |
| **Storage** | Walrus Testnet |
| **Encryption** | @mysten/seal v1.1.3 + WebCrypto AES-GCM-256 |
| **Wallet** | @mysten/dapp-kit v1.0.6 |
| **Sui SDK** | @mysten/sui v2.16.2 |
| **Rich Text** | Tiptap v3 |
| **Animations** | Framer Motion v12 |
| **Content Safety** | DOMPurify v3 |
| **CSV Export** | PapaParse v5 |
| **Styling** | Tailwind CSS v4 + Vanilla CSS |

---

## Project Structure

```
walrusform/
├── move_worm/                    # Sui Move smart contract
│   └── sources/
│       └── worm.move             # Form registry + Seal approval
│
├── src/
│   ├── app/
│   │   ├── builder/page.tsx      # Form builder with activity log
│   │   ├── dashboard/page.tsx    # Admin dashboard with sync status
│   │   ├── form/[id]/page.tsx    # Public submission form
│   │   ├── settings/page.tsx     # Platform settings
│   │   ├── onboarding/page.tsx   # First-time user experience
│   │   └── templates/page.tsx    # Form templates
│   │
│   ├── components/
│   │   ├── ui/                   # GlassCard, Button, Badge, Input
│   │   ├── inputs/               # RichTextInput, FileUploadInput
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── FeaturesSection.tsx
│   │   └── AppBackground.tsx
│   │
│   └── lib/
│       ├── suiActions.ts         # Sui RPC: createFormTx, getAllForms, getFormByBlobId
│       ├── walrus.ts             # uploadToWalrus, readFromWalrus (with retry)
│       ├── seal.ts               # encryptWithSeal, decryptWithSeal (Seal SDK + AES fallback)
│       ├── formStorage.ts        # FormDefinition, saveFormDefinition, loadFormDefinition
│       ├── walrusRegistry.ts     # Decentralized index: append, load, merge
│       ├── submissionStorage.ts  # submitForm, getSubmissionsForForm
│       ├── contracts.ts          # Package ID, module, function constants
│       ├── csvExport.ts          # exportSubmissionsToCSV
│       └── e2e-autonomous.ts     # Autonomous E2E verification script
│
├── public/                       # Static assets (logo, mascot)
├── enhancement_plan.md           # Strategic roadmap
├── progress.md                   # Implementation progress log
└── WALRUSFORM_AGENT_PROMPT.md    # AI agent context file
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Sui CLI** (for Move deployment)
- **Walrus CLI** (for local testing)
- A **Sui wallet** (Slush, Sui Wallet) with Testnet SUI

### Install Dependencies

```bash
git clone https://github.com/your-org/walrusform.git
cd walrusform
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

---

## Environment Variables

No environment variables are required for basic operation. The app uses public testnet endpoints:

| Endpoint | URL |
|---|---|
| Sui Testnet RPC | `https://fullnode.testnet.sui.io:443` |
| Walrus Publisher | `https://publisher.walrus-testnet.walrus.space` |
| Walrus Aggregator | `https://aggregator.walrus-testnet.walrus.space` |
| Seal Key Server | `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75` |

For production, you may configure custom RPC and Walrus endpoints by editing `src/lib/walrus.ts` and `src/lib/suiActions.ts`.

---

## Move Package Deployment

The Move smart contract is already deployed to Sui Testnet. To re-deploy or deploy to another network:

```bash
# Navigate to move package
cd move_worm

# Build the package
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000

# Note the published package ID and update src/lib/contracts.ts
```

Update `src/lib/contracts.ts` with your new package ID:

```typescript
export const WORM_PACKAGE_ID = "0x<your_new_package_id>";
```

### Move Module Summary

| Function | Description |
|---|---|
| `create_form` | Registers a new form on Sui, emits `FormCreated` event |
| `update_submission_index` | Updates the Walrus index pointer on-chain |
| `seal_approve` | Creates a `SealApproval` object for threshold decryption |

---

## End-to-End Testing

Worm includes an autonomous E2E verification script that tests the entire stack using the local Sui CLI and Walrus CLI:

```bash
npx tsx src/lib/e2e-autonomous.ts
```

**What it tests:**

1. ✅ Form Definition creation (TypeScript layer)
2. ✅ Walrus Upload (Publisher API)
3. ✅ Walrus Read (Aggregator API)
4. ✅ Sui Registration (`create_form` on-chain)
5. ✅ Seal Encryption (AES-GCM + SDK)
6. ✅ Submission upload to Walrus
7. ✅ Index update (on-chain pointer)
8. ✅ Global Discovery (event-based, no VPS)
9. ✅ Decryption Integrity

**Dashboard & Settings Test:**

```bash
npx tsx src/lib/verify-dashboard-settings.ts
```

---

## How Seal Encryption Works

```mermaid
sequenceDiagram
    participant Creator as Form Creator
    participant SealSDK as @mysten/seal SDK
    participant Validators as Sui Validators (Key Servers)
    participant Walrus as Walrus Storage
    participant Reviewer as Authorized Reviewer

    Creator->>SealSDK: encrypt(data, packageId, formId)
    SealSDK->>Validators: Request public keys
    Validators-->>SealSDK: Threshold public keys
    SealSDK-->>Creator: encryptedObject (WORM_SEAL_SDK_V1)
    Creator->>Walrus: Store encrypted blob

    Reviewer->>SealSDK: decrypt(encryptedObject, sessionKey, txBytes)
    SealSDK->>Validators: fetchKeys (with seal_approve tx)
    Validators->>Validators: Verify on-chain approval
    Validators-->>SealSDK: Key shares (≥ threshold)
    SealSDK-->>Reviewer: Decrypted plaintext
```

**Key Properties:**
- **Threshold**: 1-of-N by default (configurable)
- **Identity namespace**: `formObjectId` — keys are bound to a specific form
- **Fallback**: AES-GCM-256 (PBKDF2) when `formObjectId` is unavailable
- **Session keys**: Generated per browser session, never persisted

---

## Roadmap

```mermaid
gantt
    title Worm Development Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 - Decentralization
    Sui On-chain Registry       :done, 2025-01-01, 2025-02-01
    Walrus Submission Index     :done, 2025-02-01, 2025-03-01
    Client-side Discovery       :done, 2025-03-01, 2025-04-01
    section Phase 2 - Security
    AES-GCM-256 Encryption      :done, 2025-04-01, 2025-04-15
    Seal SDK Integration        :done, 2025-04-15, 2025-05-01
    DOMPurify + File Validation :done, 2025-05-01, 2025-05-10
    section Phase 3 - Polish
    UI Transparency Layer       :done, 2025-05-10, 2025-05-16
    Vercel Deployment           :active, 2025-05-16, 2025-05-20
    section Phase 4 - AI Layer
    AI Consensus Engine         :2025-06-01, 2025-07-01
    AI Priority Scoring         :2025-07-01, 2025-08-01
    AI Screenshot Understanding :2025-08-01, 2025-09-01
```

### Phase 4 — AI Intelligence Layer (Planned)

| Feature | Description |
|---|---|
| **AI Consensus Engine** | Analyze thousands of submissions to detect recurring pain points |
| **AI Priority Scoring** | Automatically score submissions by impact and frequency |
| **AI Root Cause Analysis** | Infer technical causes from community reports |
| **AI Duplicate Detection** | Cluster similar feedback into groups |
| **AI Smart Assistant** | Help respondents write higher-quality reports |
| **AI Screenshot Understanding** | Extract technical details from uploaded images |

---

## Self-Hosted Walrus Infrastructure

To ensure absolute independence and high reliability on the Mainnet, we have deployed our own dedicated Walrus Publisher and Aggregator nodes. This allows our platform to operate without relying on public community nodes that may be rate-limited or unavailable.

### Proof of Deployment & Operation

Here is the proof of a successful blob upload to our self-hosted Mainnet publisher:

```bash
$ curl -X PUT "https://walrus.********.site/v1/blobs?epochs=1" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "hello walrus mainnet"

{
  "newlyCreated": {
    "blobObject": {
      "id": "0xdcb53a5651d570e7910bde9e3002607474b49be469a8c791e3f8a880d3cc82e4",
      "registeredEpoch": 30,
      "blobId": "oPZg5tuyn1UD_xK4Fqknv2DhtkXATJxjk4VdCC3F_EQ",
      "size": 20,
      "encodingType": "RS2",
      "certifiedEpoch": null,
      "storage": {
        "id": "0x15ef24bd2141273fb130ff94b9ff253c964a2103a27bc37d993a42740bc75042",
        "startEpoch": 30,
        "endEpoch": 31,
        "storageSize": 66034000
      },
      "deletable": true
    },
    "resourceOperation": {
      "registerFromScratch": {
        "encodedLength": 66034000,
        "epochsAhead": 1
      }
    },
    "cost": 5250294
  }
}
```

> [!NOTE]
> The private key used by the publisher to sign storage transactions is kept secret and secured on our VPS for security. Domain names are masked in this public documentation to prevent abuse.

### Endpoints

Our custom infrastructure can be accessed at:
- **Publisher**: `https://walrus.********.site/v1/blobs`
- **Aggregator**: `https://walrus.********.site/v1/blobs/<blob_id>`
- **API Docs**: `https://walrus.********.site/v1/api`

---

## Contributing

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feat/your-feature`
3. Make changes following the established patterns in `src/lib/`
4. Run the E2E verification: `npx tsx src/lib/e2e-autonomous.ts`
5. Open a **Pull Request**

### Code Conventions

- **No mocks in production paths** — all lib functions must call real Walrus/Sui endpoints
- **Type safety first** — avoid `any` in production code
- **Decentralized by default** — use Sui events for discovery, not localStorage
- **UI consistency** — use existing `GlassCard`, `Button`, `Badge` components only

---

<div align="center">
  <p>
    Built with ❤️ on <strong>Sui</strong> + <strong>Walrus</strong> + <strong>Seal</strong><br/>
    <em>Verifiable. Immutable. Decentralized.</em>
  </p>
  <img src="./wormlogo.png" alt="Worm" width="60" />
</div>

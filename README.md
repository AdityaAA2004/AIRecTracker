# Expensare — AI-Powered Receipt Tracker

Stop manually logging every purchase. Expensare lets you drop in a PDF receipt and instantly get back a clean, structured expense record — merchant name, date, total, line items, and more — all extracted automatically by AI. No data entry, no spreadsheets, no guesswork.

Whether you're a freelancer tracking business expenses, a small team managing reimbursements, or just someone who hates sorting through receipts at tax time, Expensare turns a pile of PDFs into an organized expense history in seconds.

---

## What It Does

- **Upload receipts as PDFs** — drag and drop or click to upload; no manual typing required
- **AI extracts everything** — merchant info, transaction date, subtotal, tax, total, and individual line items are all pulled out automatically
- **Browse and manage expenses** — view all your receipts in one place with processing status, filter by date, and drill into any receipt for full details
- **Download or delete** — grab the original PDF at any time or remove records you no longer need
- **Usage-tiered plans** — a free tier for occasional use, with paid plans for higher scan volumes and advanced features

---

## How It Works

1. You upload a PDF receipt through the app
2. The file is securely stored and a background workflow is triggered
3. An AI agent (powered by Claude) reads and parses the PDF, extracting structured expense data
4. A second AI agent saves the extracted data to your account's database and records the scan event
5. The receipt appears in your dashboard, fully processed and ready to view

The entire pipeline runs asynchronously — you can navigate away and come back to find everything ready.

---

## Pricing

| Plan    | Monthly Scans | Price      | Features                          |
|---------|--------------|------------|-----------------------------------|
| Free    | 2            | $0         | Basic extraction                  |
| Starter | 50           | $4.99/mo   | All extractions + AI summaries    |
| Pro     | 300          | $9.99/mo   | Everything + advanced exports     |

Feature access and scan limits are enforced at runtime via Schematic feature flags tied to the user's active subscription.

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Framework          | Next.js 15 (App Router, React 19, TypeScript)   |
| Styling            | Tailwind CSS 4 + shadcn/ui + Radix UI           |
| Backend / Database | Convex (serverless functions + real-time DB)    |
| Authentication     | Clerk                                           |
| AI Orchestration   | Inngest + Inngest Agent Kit                     |
| AI Models          | Claude 3.7 Sonnet (extraction), GPT-4o-mini (DB agent) |
| Feature Flags      | Schematic (usage metering + billing portal)     |
| File Uploads       | Convex file storage                             |

---

## Architecture

### Database Schema

The `expenseFiles` table (Convex) stores one record per uploaded receipt:

```
expenseFiles {
  userId          string    // Clerk user ID
  fileName        string
  fileSize        number
  mimeType        string
  uploadedAt      number    // Unix timestamp
  status          "pending" | "processed" | "error"

  // AI-extracted fields
  merchantName    string?
  merchantAddress string?
  transactionDate string?
  transactionId   string?
  subtotal        string?
  tax             string?
  total           string?
  currency        string?
  paymentMethod   string?
  items           Array<{ description, quantity, unitPrice, totalPrice }>
  summary         string?   // AI-generated plain-English summary
}
```

### AI Agent Pipeline (`inngest/`)

The extraction workflow is a two-agent network orchestrated by Inngest Agent Kit:

**1. `expenseFileScanningAgent`**
- Triggered by the `extract-data-from-pdf-and-save-to-db` Inngest event
- Downloads the PDF from Convex storage
- Sends it to Claude 3.7 Sonnet with a structured extraction prompt
- Returns typed JSON matching the database schema

**2. `databaseAgent`**
- Receives the extracted data from the scanning agent
- Calls `updateExpenseFileWithAIExtractedData` Convex mutation to persist it
- Calls Schematic's track API to record a `scan` event for usage metering
- Updates the receipt status to `"processed"` or `"error"`

Both agents run inside an `AgentNetwork` that routes between them until the workflow is complete.

### Server Actions (`actions/`)

| Action                  | What it does                                                       |
|-------------------------|--------------------------------------------------------------------|
| `uploadPDF`             | Validates file type/size, stores in Convex, triggers Inngest event |
| `deleteExpenseFile`     | Removes the Convex record and the stored file                       |
| `getFileDownloadUrl`    | Returns a signed URL for downloading the original PDF               |

### Feature Gating (Schematic)

- `scan` flag — checked before upload; blocks if the user has hit their monthly limit
- `summary` flag — controls whether the AI summary is visible on the detail page
- The `/plan/manage` page embeds Schematic's customer billing portal component for plan upgrades

### Authentication (Clerk + Convex)

Clerk handles sign-in/sign-up. A JWT template in Clerk issues tokens that Convex validates via `CLERK_JWT_ISSUER_DOMAIN`. All Convex queries and mutations resolve the user identity from the JWT, so every record is scoped to the authenticated user.

### Route Protection (Middleware)

`middleware.ts` uses Clerk's Next.js middleware to protect all routes under `/receipts` and `/receipt/[id]`. Unauthenticated requests are redirected to the sign-in page.

---

## Project Structure

```
/
├── app/
│   ├── page.tsx                  # Landing page (hero, features, pricing)
│   ├── receipts/page.tsx         # Receipts dashboard + upload
│   ├── receipt/[id]/page.tsx     # Individual receipt detail view
│   └── plan/manage/page.tsx      # Subscription management
├── actions/
│   ├── uploadPDF.ts              # Upload + trigger workflow
│   ├── deleteExpenseFile.ts      # Delete record + file
│   └── getFileDownloadUrl.ts     # Signed download URL
├── components/
│   ├── PDFDropComponent.tsx      # Drag-and-drop upload UI
│   ├── ReceiptList.tsx           # Receipts table
│   ├── Header.tsx                # Nav with auth + plan link
│   └── schematic/               # Billing portal embed
├── convex/
│   ├── schema.ts                 # Database schema
│   ├── expenses.ts               # Queries and mutations
│   └── auth.config.ts            # Clerk JWT config
└── inngest/
    ├── agent.ts                  # Agent network orchestration
    ├── client.ts                 # Inngest client
    ├── constants.ts              # Event name enum
    └── agents/
        ├── expenseFileScanningAgent.ts   # Claude extraction agent
        └── databaseAgent.ts             # GPT DB-write agent
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account
- An [Inngest](https://inngest.com) account
- A [Schematic](https://schematichq.com) account
- Anthropic and OpenAI API keys

### Installation

```bash
git clone https://github.com/adityaaa2004/airectracker.git
cd airectracker
npm install
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex ↔ Clerk JWT
CLERK_JWT_ISSUER_DOMAIN=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# AI Models
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Schematic
SCHEMATIC_API_KEY=
NEXT_PUBLIC_SCHEMATIC_KEY=
NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID=
```

### Running Locally

```bash
npm run dev
```

This starts both the Next.js frontend and the Convex backend in parallel. Open [http://localhost:3000](http://localhost:3000) to view the app.

To process AI workflows locally, also run the Inngest dev server:

```bash
npx inngest-cli@latest dev
```

### Production Build

```bash
npm run build
npm run start
```

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

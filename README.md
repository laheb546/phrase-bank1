# English Phrase Bank

A personal English-learning web application that helps you build a bank of collocations, chunks, and natural expressions based on your own mistakes and speaking experience.

**Core philosophy:** Don't memorize more English. Build a bank of English you actually use.

## Features (MVP)

- **Dashboard** — Overview of total phrases, collocations, chunks, active problems, due reviews
- **Phrase Bank** — Searchable, filterable library of all saved expressions
- **Add Phrase** — Save collocations or chunks with original mistake, meaning, pattern, example
- **Recurring Problems** — Track repeated mistakes with mistake/success counts
- **Active Recall Review** — Fill-in-blank, multiple choice, recall, personal sentence
- **Simple Spaced Repetition** — Again (1d), Hard (2d), Good (4d), Easy (7d)
- **Status tracking** — New → Learning → Improving → Mastered

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB (via Mongoose)

## Getting Started

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### 2. Install

```bash
cd english-phrase-bank
npm install
```

### 3. Configure

```bash
cp .env.example .env.local
# Edit .env.local with your MongoDB URI
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (phrases, reviews, stats)
│   ├── add/           # Add phrase form
│   ├── phrases/       # Phrase bank + detail pages
│   ├── problems/      # Recurring problems
│   ├── review/        # Active recall review system
│   ├── settings/
│   ├── layout.tsx
│   └── page.tsx       # Dashboard
├── components/
│   ├── Navbar.tsx
│   └── PhraseCard.tsx
├── lib/
│   └── db.ts          # MongoDB connection
├── models/
│   ├── Phrase.ts
│   └── Review.ts
└── types/
    └── index.ts
```

## Data Model

**Phrase:** phrase, type (collocation/chunk), meaning, pattern, example, originalMistake, category, notes, status, mistakeCount, successfulUseCount, review scheduling fields.

**Review:** phraseId, result (again/hard/good/easy), reviewType, userAnswer.

## Future (not in MVP)

- Speech-to-text + AI detection of unnatural expressions
- Speaking practice sessions
- Automatic comparison with existing phrase bank

## License

Personal use.

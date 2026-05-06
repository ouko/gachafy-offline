# Database Migration Guide

## Overview

GachaFi is a **client-side DApp with no database dependency**. All application state is either:

- **On-chain** — wallet balances, NFT badges, transaction history (Radix DLT)
- **Local device** — streaks, offline queue, PWA state (IndexedDB / localStorage)

This guide documents backend options **if you choose to add server-side features later**
(e.g., cross-device sync, leaderboards, user profiles, analytics).

## Current State: No Database Needed

| Feature | Implementation | Location |
|---------|---------------|----------|
| Wallet & balances | Radix Gateway API + user wallet | On-chain |
| NFT badges | Scrypto smart contract | On-chain |
| Streak tracking | `localStorage` | Local device |
| Offline queue | IndexedDB | Local device |
| Push notifications | OneSignal client SDK | Third-party SaaS |
| Error tracking | Sentry client SDK | Third-party SaaS |

**You can deploy immediately without any database.**

---

## Future Backend Options

If you later need server-side persistence, here are recommended paths:

### Option 1: Supabase (PostgreSQL + Edge Functions)
**Best for:** Full-featured backend with auth, real-time, and storage

**Pros:**
- Built-in auth, realtime, storage
- Generous free tier
- PostgreSQL compatible
- Easy to scale

**Cost:** Free up to 500MB DB, $25/mo for Pro

**Setup:**
```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

### Option 2: Firebase (Google)
**Best for:** Real-time features, mobile apps, fast prototyping

**Migration Steps:**
1. Install Firebase:
```bash
npm install firebase
```

2. Create client:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Cost:** Free tier generous, pay-as-you-go after

---

### Option 3: MongoDB Atlas
**Best for:** Flexible schema, document storage, global distribution

**Migration Steps:**
1. Install MongoDB driver:
```bash
npm install mongodb
```

2. Create connection utility:
```typescript
// src/lib/mongodb.ts
import { MongoClient } from 'mongodb';

const uri = import.meta.env.VITE_MONGODB_URI;
const client = new MongoClient(uri);

export async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db(import.meta.env.VITE_MONGODB_DB);
}
```

**Cost:** Free tier 512MB, $9+/mo for dedicated

---

### Option 4: Self-Hosted PostgreSQL
**Best for:** Full control, compliance requirements, cost optimization

**Migration Steps:**
1. Set up PostgreSQL server (AWS RDS, DigitalOcean, etc.)

2. Install Prisma or pg:
```bash
npm install @prisma/client pg
```

3. Use Prisma:
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient({
  datasources: {
    db: { url: import.meta.env.VITE_DATABASE_URL }
  }
});
```

**Cost:** $5-50+/mo depending on hosting

---

### Option 5: Serverless/Edge Databases

| Provider | Type | Install |
|----------|------|---------|
| Cloudflare D1 | SQLite | `@cloudflare/workers-types` |
| Turso | Edge SQLite | `@libsql/client` |
| Neon | Serverless Postgres | `@neondatabase/serverless` |

**Cost:** Most have generous free tiers

---

## When to Add a Backend

Consider adding a database when you need:

| Feature | Why It Needs a Backend |
|---------|----------------------|
| Cross-device sync | `localStorage` is device-bound |
| Global leaderboards | Needs centralized, tamper-proof scores |
| User profiles | Persistent identity beyond wallet address |
| Server-side analytics | Client-side tracking is easily blocked |
| Scheduled push notifications | OneSignal requires a server cron |
| Rate limiting / abuse prevention | Client-side limits are bypassable |
| Social features | Friends, chat, marketplace |

---

## Recommendation

**For now:** Deploy without a database. The app is designed as a pure client-side DApp.

**When ready:** Add Supabase if you want an all-in-one backend (auth, DB, Edge Functions).
It's the fastest path from zero to full backend for a React app.

Focus on deploying to production first. Add a backend only when a specific feature
legitimately requires server-side persistence.

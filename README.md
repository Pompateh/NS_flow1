# Moodboard

A web-based Project Moodboard Management App built with Next.js (App Router), Tailwind CSS, Prisma, Neon Postgres, NextAuth, and Vercel Blob.

## Features

- **Admin** can create/archive projects, add/edit/delete/reorder steps, upload images and files
- **Member** can view assigned projects and download assets
- Role-based access control (ADMIN / MEMBER)
- Multiple image upload at once
- Vercel Blob for asset storage

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- Prisma (with `@prisma/adapter-neon` for Neon Postgres)
- NextAuth (Credentials provider)
- Vercel Blob

## Environment Variables

Create a `.env` file in the project root with:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-string"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

- **DATABASE_URL**: Your Neon Postgres connection string
- **NEXTAUTH_SECRET**: Any random 32+ character string
- **BLOB_READ_WRITE_TOKEN**: From Vercel Blob (Project Settings → Storage)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run database migrations:

```bash
npx prisma migrate dev --name init
```

4. Seed the database (creates admin + member accounts):

```bash
npx prisma db seed
```

5. Start the dev server:

```bash
npm run dev
```

6. Open [http://localhost:3000/login](http://localhost:3000/login)

## Seeded Accounts

| Role   | Username      | Password  |
|--------|---------------|-----------|
| ADMIN  | newstalgia39  | justdoit  |
| MEMBER | nsgstaff      | justdo    |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel Project Settings
4. Deploy

Prisma migrations run automatically via `postinstall` or you can run them manually in the Vercel build command.

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin pages
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── project/            # Project + step pages
│   └── _components/        # Shared components
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   ├── session.ts          # Session helpers
│   └── access.ts           # Access control
└── types/
    └── next-auth.d.ts      # NextAuth type extensions
prisma/
├── schema.prisma           # Database schema
├── seed.ts                 # Seed script
└── migrations/             # Migration files
```

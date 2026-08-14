<!-- Deployed on Vercel, backed by Postgres. -->
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), backed by Postgres via [Drizzle ORM](https://orm.drizzle.team).

## Getting Started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (any Postgres instance - local, [Neon](https://neon.tech), [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), etc.) and `SESSION_SECRET`.
2. Push the schema and seed demo data:

   ```bash
   npm run db:push
   npm run db:seed
   ```
3. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Login

The app is behind auth. Demo accounts (seeded in `src/db/seed.ts`):

| Email | Password |
| --- | --- |
| alice@company.com | alice123 |
| ravi@company.com | ravi123 |

Sessions are signed with `SESSION_SECRET` - set it as an environment variable before deploying anywhere real. Without it, a hardcoded dev-only fallback is used (see `src/lib/session.ts`).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new) - Vercel will auto-deploy on every push to the connected branch.
2. Provision a Postgres database (the Vercel Postgres or Neon integration from the Storage tab both work) and connect it to the project. That sets `POSTGRES_URL` automatically; the app also accepts `DATABASE_URL` if you'd rather point at a database provisioned elsewhere.
3. In Project Settings → Environment Variables, set `SESSION_SECRET` (generate with `openssl rand -hex 32`) and, optionally, `CRON_SECRET` (same command) to authenticate the scheduled stale-deal check described below.
4. Push the schema and seed data against that database - either run `npm run db:push && npm run db:seed` locally with `DATABASE_URL` pointed at it, or from the Vercel CLI with `vercel env pull` first.
5. Redeploy (or trigger the first deploy) once the schema exists.

Deals with no logged activity for 5+ days are flagged as "stale" by an hourly check. In a normal Node process this runs via an in-process interval (`src/instrumentation.ts`); on Vercel's serverless functions that can't be relied on to stay alive between requests, so `vercel.json` also registers `/api/cron/stale-check` as a [Vercel Cron Job](https://vercel.com/docs/cron-jobs) that hits it hourly instead.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

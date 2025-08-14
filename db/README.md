# Database setup (optional for MVP)

This app can run entirely in-memory. To enable PostgreSQL + PostGIS:

1. Install PostgreSQL and PostGIS extension
2. Create a database and enable `postgis` extension
3. Apply schema

```sql
-- connect to your DB, then run:
CREATE EXTENSION IF NOT EXISTS postgis;
\i db/schema.sql
```

4. Configure environment

Create `.env` in the repo root:

```
USE_DB=true
DATABASE_URL=postgres://user:password@localhost:5432/aads
```

5. Restart the dev server

```
npm run dev
```

Note: API routes still default to the in-memory store for writes in MVP. Read repositories are provided in `src/lib/repo.ts` to illustrate how to fetch from the database. In Phase 2, we will migrate API routes to use the repository and fall back to in-memory when DB is disabled.


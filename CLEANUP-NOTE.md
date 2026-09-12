# BillingFlow — Repository Cleanup

This repository has been cleaned to separate production source from historical documentation and manual/concurrency test SQL.

- `src/`, `api/`, `public/`, `supabase/migration*.sql`, and package/build files are active project material.
- Historical changelogs and old release notes are under `docs/archive/`.
- Manual/race-test SQL and the unfinished bank migration are under `supabase/archive/`.
- `bun.lock` was removed; `package-lock.json` is the canonical Node lockfile.
- The unused root `types/database.ts` re-export was removed; `src/types/database.ts` remains canonical.
- An unreferenced `public/foto-conak.jpg` asset was removed.

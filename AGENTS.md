# Project architecture

- Keep the exhausted-free-credit prompt rule in `src/lib/creditUpgrade.ts` and test it with the existing Bun contract tests; a loaded balance can suggest an upgrade but must not lock the dashboard.
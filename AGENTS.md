# Project architecture

- Keep the exhausted-free-credit prompt rule in `src/lib/creditUpgrade.ts` and test it with the existing Bun contract tests; a loaded balance can suggest an upgrade but must not lock the dashboard.
- Keep remote agent tools in `src/lib/mcp` and scope their reads to verified OAuth callers; register browser tools separately on the pages that own the visible data.
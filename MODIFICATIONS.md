# Modification notice

This is an unofficial derivative of NASA's Earthdata Download, based on upstream commit `35d6269` (EDD-91: Update dependencies). Original copyright and Apache-2.0 license notices are retained in `LICENSE` and source notices. Upstream authorship and provenance are documented in `ATTRIBUTION.md`; the public derivative uses a fresh repository history.

Changes developed with assistance from OpenAI Codex on October 14, 2026:

- Automatic retries for interrupted transfers and temporary failures, with delays capped at one minute; Pause and Cancel stop retries.
- File-extension selection in Settings, stored per download.
- Persistent download checkpoint metadata and partial-file backups for Pause/quit/reopen/Resume.
- SQLite migration and focused tests for retries, filtering and persistence.
- Separate application identity and data folder, disabled upstream automatic updates, and Windows-compatible build/test scripts.

Publication documentation and local-state exclusions were added on October 16, 2026.

## Validation and limitations

Fifty focused automated tests passed locally. Source compilation and portable-package content checks passed. The full upstream test suite has not been revalidated.

The real Electron two-process recovery test initially restarted the download instead of requesting the saved byte range. A subsequent checkpoint-race fix was implemented, but the final real Electron test remains unverified. Windows installer creation remains incomplete; a local portable ZIP exists. These limitations must remain visible for this preview release.

Earthdata authentication and dataset EULA requirements still apply. Resuming an existing partial file depends on server behavior; a fresh transfer may be required.

This modification is not endorsed by NASA. No Earthdata tokens, local download databases, downloaded datasets, local tooling or application binaries are included in the source publication.

# Earthdata Download Modified — Windows x64 portable preview

Unofficial derivative of [NASA Earthdata Download](https://github.com/nasa/earthdata-download), based on upstream commit `35d6269945e0cceaf4f7f24af633cdfbfd614a55`. Original copyright and Apache-2.0 license are retained. This is not an official NASA or OpenAI release.

## Windows download

Download `Earthdata-Download-Modified-windows-x64-preview.zip`, extract the entire archive, then run `Earthdata Download Modified.exe`. This is a **portable ZIP, not an installer**. Only Windows x64 binaries are provided. No new build or GitHub Actions run was performed for this publication; the existing Windows portable package was uploaded.

`SHA256SUMS-WINDOWS.txt` contains the ZIP checksum. SHA-256: `4446d0b19ffe5949b87a6a6006afcf0c57da5c76946fd0de75cbace6edb99c68`.

## Changes

- Automatic retries for temporary failures and interrupted downloads, with delays of 5, 10, 20, 40 and then 60 seconds; Pause/Cancel suppress retries.
- File-extension selection in Settings, including `.hdf` for MODIS MOD11/MYD11.
- Experimental checkpoint persistence for Pause/quit/reopen/Resume.
- Familiar original interface and a separate application data directory.

## Credits

- NASA and the original Earthdata Download contributors created the base application and interface. Their copyright, Apache-2.0 license and source notices remain applicable. See `ATTRIBUTION.md` in the source repository.
- Likkung supplied the research use case, requirements, direction and user feedback.
- OpenAI Codex assisted with implementation, focused tests, documentation and packaging under Likkung’s direction.

## Preview limitations

Previously, 50 focused automated tests passed locally; the production source build and package content checks passed. The full upstream test suite was not revalidated. Final real-Electron byte-range recovery across two launches remains unverified after a checkpoint-race fix. Resuming depends on server support and valid Earthdata login/EULA acceptance. The package is unsigned. No Linux build or Windows installer is included.

The repository was republished with fresh Git history; the portable executable was not rebuilt. Source documentation and workflow changes made for republication are therefore not compiled into the executable. The ZIP includes the original license and modification/AI-assistance credits.

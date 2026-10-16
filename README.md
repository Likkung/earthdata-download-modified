# Earthdata Download Modified

An unofficial modification of [NASA Earthdata Download](https://github.com/nasa/earthdata-download), keeping the original interface with automatic retries, extension filtering, and persistent download checkpoints. This project is not an official NASA release and is not endorsed by NASA.

## Windows download

Download the [Windows x64 portable preview](https://github.com/Likkung/earthdata-download-modified/releases/tag/v1.0.9-modified.1-preview.1), extract the entire ZIP, then run `Earthdata Download Modified.exe`. This is a portable application, not an installer. Only Windows binaries are published; no new build was run for this publication.

## Development credits

- **Original application:** NASA Earthdata Download and its upstream contributors. Their original copyright, license and attribution notices are retained. See [ATTRIBUTION.md](ATTRIBUTION.md) for the exact upstream source.
- **Modified version — direction and user testing:** Likkung, who specified the requirements and tested the application in use.
- **AI-assisted development:** OpenAI Codex helped inspect the upstream code, implement the modifications, write focused automated tests, prepare documentation, and set up Windows/Linux packaging. Likkung directed this work.

This is an independently published derivative with a new repository history, rather than a GitHub fork. A fresh history does not change the authorship or ownership of the upstream code. NASA and the original contributors created the base application; they did not participate in developing these modifications. This project is not an official release of NASA or OpenAI.

## Changes in this version

- Automatically retry interrupted downloads and temporary network/server failures until successful or paused/cancelled. Retry delays increase from 5 seconds to a maximum of 60 seconds.
- Select file extensions for new downloads in Settings, for example `.hdf` for MODIS MOD11/MYD11, or `.hdf, .nc, .tif`.
- Experimentally save partial-file checkpoints when pausing or closing the application, to support resuming after reopening (final real-Electron verification remains incomplete).
- Keep application state separate from the original app and disable upstream automatic updates so they do not overwrite these modifications.

**Preview status:** 50 focused automated tests passed locally, including database persistence and retry behavior. Real Electron byte-range recovery across two application launches has not yet passed final verification. The Windows portable ZIP was built; an installer has not yet been completed. Server support and valid Earthdata authorization are required for resuming downloads.

See [the Thai usage guide](README-MODIFIED.md) and [modification notes](MODIFICATIONS.md). Portable builds, when published, belong in this repository's Releases rather than the source tree.

The original project's development instructions follow below. Its full test suite and release workflow have not been revalidated for this preview.

---

# Original Earthdata Download documentation


**Interested in integrating your application with Earthdata Download? [Look at the docs](docs/USE_EDD.md)!

This README briefly describes how to bootstrap the Earthdata Download project. For more information about Earthdata Download, check out the `/docs` directory.

## Development

Ensure you are using the NodeJS version defined in `.nvmrc`

To install dependencies:

    npm install

In order to run the project locally you need to run:

    npm start

To run the Jest tests:

    npm test

To build the jsdoc documentation:

    npm run docs

    # Outputs documentation in the `docs/jsdoc` directory

The SQLite database file used in Earthdata Download can be found in the `app.getPath('userData')` directory. [app.getPath documentation](https://www.electronjs.org/docs/latest/api/app#appgetpathname)

## Building

To build the installers run one of the following, matching your operating system:

    npm run dist:mac
    npm run dist:win
    npm run dist:linux

## Original upstream release process (historical reference)

To create a new release, first ensure you bump the `version` in [package.json](package.json) and run `npm install` as part of your pull request.

After your PR has been merged, create a new tag that matches your package.json `version`, prepended by the letter `v`

    git tag -a "v1.4.2" -m "v1.4.2 Release"

And push that tag to GitHub

    git push --tags

The paragraph above describes the original upstream process. In this modified repository, workflows are manual only; pushes, tags and publishing a release do not start builds. The current Windows release uses an existing portable ZIP without a new build.

## Database Migrations

 Run `npx knex migrate:make <migration_name>` this will create a new file under `/migrations` directory. Fill in the `up` and `down` functions with the appropriate logic for your use-case.

## Documentation

- [Introduction](docs/README.md)
- [Use Earthdata Download for Your Application](docs/USE_EDD.md)

## Run Download Report

You can run a generate a report on EDD downloads by running

    npm run download-report

## License

> Copyright © 2007-2023 United States Government as represented by the Administrator of the National Aeronautics and Space Administration. All Rights Reserved.
>
> Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
>
> <http://www.apache.org/licenses/LICENSE-2.0>
>
>Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
>WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

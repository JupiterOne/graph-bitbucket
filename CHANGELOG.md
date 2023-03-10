# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## Changed

- Upgraded SDK dependencies to v8
- Updated use of `getTime` → `parseTimePropertyValue`
- Updated build.yml
- Updated package.json main, types, and files to work with updated build.yml
- Updated project [README.md](http://README.md '‌')
- Added jupiterone/questions/questions.yaml file
- Upgraded package.json scripts to match an `integration-template`
- Updated tests to use latest patterns

## 2021-07-02 - 1.2.2

### Fixed

- [#42](https://github.com/JupiterOne/integrations/issues/42) Duplicate key in
  fetch-users step

## 2021-06-30 - 1.2.1

### Fixed

- MISSING_MODULE error in bundled package

## 2021-06-30 - 1.2.0

### Added

- [Ingest user groups](https://github.com/JupiterOne/integrations/issues/29)

### Changed

- Upgraded to `@jupiterone/integration-sdk-*@6.7.0`

## 2021-06-22 - v1.1.0

### Added

- New config variable enrichedPrs that toggles pulling PRs individually in order
  to get Reviewer data.
- Scope checking to the access token validation.

### Changed

- ingestPullRequests config variable now uses the getStartStepStates pattern, so
  that the step doesn't run at all if ingestPullRequests is false.

## 2021-05-28 - v1.0.0

### Changed

- Moved integration to GitHub and migrated latest SDK

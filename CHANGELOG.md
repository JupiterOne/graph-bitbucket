# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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

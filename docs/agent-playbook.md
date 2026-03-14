# Agent Playbook

## Source Of Truth
- `README.md` for public API, runtime expectations, and test prerequisites.
- `package.json` for canonical scripts and dependency constraints.

## Repository Map
- `src/` driver implementation.
- `test/` integration-style test suite.
- Root docs define runtime and local database assumptions.

## Change Workflow
1. Confirm whether the change affects protocol behavior, query APIs, or documentation only.
2. Preserve existing method signatures and error paths unless a breaking change is explicitly intended.
3. Keep both callback and promise examples accurate when behavior changes.
4. Run tests against a local or containerized CUBRID instance when touching connection and query code.

## Validation
- `npm install`
- `npm test`
- `npm run coverage`
- Use the Docker workflow from `README.md` if a local CUBRID server is not already running

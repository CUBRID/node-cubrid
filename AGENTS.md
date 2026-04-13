# AGENTS.md

## Purpose
`node-cubrid` is a legacy Node.js driver for CUBRID with callback and promise APIs.

## Read First
- `README.md`
- `docs/agent-playbook.md`

## Working Rules
- Preserve backward compatibility unless the task explicitly targets a breaking change.
- Keep callback and promise examples aligned with the implementation.
- Avoid modernizing runtime assumptions casually; this repository still documents legacy Node support.
- Update README when connection, query, or transaction contracts change.

## Validation
- `npm test`
- `npm run lint`
- `npm run coverage`

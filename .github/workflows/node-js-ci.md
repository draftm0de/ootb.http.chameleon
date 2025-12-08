# Node JS CI Workflow

Protects DraftMode Node repositories by enforcing semantic version checks, linting, Prettier formatting, badge regeneration, and tests on every pull request/manual run.

## When It Runs

- `pull_request` events targeting `main` (opened, synchronized, reopened, ready for review)
- Manual invocations via `workflow_dispatch`
- Reusable via `workflow_call` so other repos can `uses:` it directly
- Jobs auto-skip inside `draftm0de/github.workflows` (template repo) and `draftm0de/flutter.clone`

## Job Overview

1. **verify-version-tag** — Checks out the repository with full history and executes `node-js-auto-tagging` to compare the `package.json` version against existing tags.
2. **tests** — Repeats the checkout in a fresh runner, then calls `node-js-test` to install dependencies, run lint/Prettier/badge scripts, and execute the test suite with whatever npm script names you configure.

## How to Use

Reference the workflow from your repository so you inherit updates automatically:

```yaml
# .GitHub/workflows/node-js-ci.yml inside your repo
name: Node JS CI

on:
  pull_request:

jobs:
  draftmode-node-ci:
    uses: draftm0de/github.workflows/.github/workflows/node-js-ci.yml@main
    secrets: inherit
    with:
      node-version: '22'
      lint-script: 'lint'
      prettier-script: 'format:check'
      badges-script: 'badges'
      test-script: 'test'
```

Override any `with` inputs to match the npm scripts your project exposes. Leave a script blank (`''`) to skip that gate entirely.

## Inputs

- `node-version` _(default `22`)_ — Forwarded to `actions/setup-node`.
- `lint-script` _(default `lint`)_ — npm script name used for linting before tests.
- `prettier-script` _(default `format:check`)_ — npm script used to run Prettier in check mode.
- `badges-script` _(default `badges`)_ — npm script that refreshes README/coverage badges.
- `test-script` _(default `test`)_ — npm script that executes the main test suite.

## Local Parity

```bash
npm ci        # or npm install
npm run lint
npm run format:check
npm run badges   # when applicable
npm test
```

Use [`act`](https://github.com/nektos/act) with `node-js-ci.yml` to dry-run the workflow. Bump `package.json` with `npm version --no-git-tag-version 0.0.1`, add throwaway tags (`git tag v0.0.1`) so the tag gate has realistic data, and clean them up afterwards.

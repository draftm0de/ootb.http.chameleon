# node-js-test Action

Composite action that installs Node.js dependencies, runs linting/formatting/badge scripts, and finishes with the repository’s test suite so pull requests mirror DraftMode’s Node CI workflow.

## Inputs

- `node-version` _(default `22`)_ — Version passed to `actions/setup-node`.
- `lint-script` _(default `lint`)_ — Name of the npm script that lints the project. Set to empty to skip.
- `prettier-script` _(default `format:check`)_ — npm script responsible for running Prettier in check mode. Leave empty to skip.
- `badges-script` _(default `badges`)_ — npm script that updates README/coverage badges. Leave empty to skip.
- `test-script` _(default `test`)_ — npm script that runs the test suite. Leave empty to skip (not recommended).

## Behavior

1. Checks out the caller repo and installs the requested Node.js version (with npm cache warming).
2. Runs `npm ci` when `package-lock.json` exists, otherwise uses `npm install`.
3. Executes the configured lint, Prettier, badge, and test scripts—failing with actionable errors when scripts are missing.
4. Records checklist entries in the GitHub step summary so consuming workflows get clear status indicators.

## Local Parity

Run the same commands locally before opening a PR:

```bash
npm ci        # or npm install
npm run lint
npm run format:check
npm run badges   # when applicable
npm test
```

Use [`act`](https://github.com/nektos/act) to dry-run `.github/workflows/node-js-ci.yml` if you need to see the workflow plumbing end-to-end.

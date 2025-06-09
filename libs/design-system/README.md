# design-system

This library is an incremental mirror of [@recidiviz/design-system](https://github.com/Recidiviz/web-libraries/tree/main/packages/design-system).
It currently contains a slightly updated palette.

To access this library, you can import it from anywhere in this repo as `"~design-system"`. e.g.
```typescript
import { palette } from '~design-system';
```

There is a lint rule in `eslint.config.mjs` which prevents any parts already implemented locally being from imported from `@recidiviz/design-system`.

## Running unit tests

Run `nx test design-system` to execute the unit tests via [Vitest](https://vitest.dev/).
There are currently no tests configured for this library.

---
paths:
  - "apps/staff/**"
  - "apps/jii/**"
  - "libs/@*/client/**"
  - "libs/*-client/**"
  - "libs/design-system/**"
---

# Frontend Rules

## Imports

Use the `~` alias for importing from workspace libraries. Never use relative paths to reach into `libs/`.

```typescript
// Correct
import { something } from "~datatypes";
import { Component } from "~@jii/common-ui";

// Wrong
import { something } from "../../libs/datatypes/src";
```

## Styling

Use `styled-components` for any shared or reusable components. Tailwind exists only in the JII app for a specific legacy integration — do not use it for new work.

## MobX

Any React component that reads MobX observable values must be wrapped with `observer` from `mobx-react-lite`. Forgetting this is the most common MobX mistake — the component renders once and never re-renders on state changes.

```typescript
import { observer } from "mobx-react-lite";

const MyComponent = observer(function MyComponent() {
  const store = useStore();
  return <div>{store.someObservableValue}</div>;
});
```

Library modules must define a `RootStore` TypeScript interface for the shape they need from the host app — never import directly from the host app's store. This keeps the library decoupled.

```typescript
// In the library: define what you need from the host app
export interface RootStore {
  userStore: {
    getToken?: () => Promise<string>;
    stateCode: string;
  };
  analyticsStore: { track: (event: string) => void };
}
```

## tRPC Client

The frontend tRPC client attaches the Auth0 bearer token to every request. Always use `superjson` as the transformer — it must match the server.

```typescript
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "~@domain/trpc-types";

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env["VITE_API_URL"],
      async headers() {
        const token = await userStore.getToken?.();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      transformer: superjson,
    }),
  ],
});
```

See `libs/sentencing-client/src/api/APIClient.ts` for a full working example.

## Testing

Use MSW (`msw`), `fetchMock`, or Vitest mocking for API calls. Never make real network requests in unit tests.

## License Header

Every new `.ts`/`.tsx` file must start with the GPL-3.0 license header with the current year. ESLint enforces this.

| Don't                                               | Do                                                     |
| --------------------------------------------------- | ------------------------------------------------------ |
| Component reads MobX observables without `observer` | Wrap with `observer` from `mobx-react-lite`            |
| Library imports directly from host app store        | Define a `RootStore` interface in the library          |
| Tailwind for new shared/reusable components         | Use `styled-components`                                |
| Relative import paths to libs (`../../libs/`)       | Use `~` alias: `import { x } from "~datatypes"`        |
| Real network requests in unit tests                 | Use MSW, `fetchMock`, or Vitest mocking                |
| Missing license header on a new file                | GPL-3.0 header with current year. ESLint enforces this |

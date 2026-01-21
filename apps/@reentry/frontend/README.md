This is a [Next.js](https://nextjs.org) project bootstrapped with create-next-app.

## Setup
If you followed the setup instructions for the monorepo, there should not be any further actions required.
You can modify your local environment in `.env.local`

Run the frontend server: (from the root of the repo ideally)

```bash
nx dev @reentry/frontend
```

## Testing

```
yarn vitest (for unit-tests)
```

```
yarn vitest --watch=false --config vitest.integration.config.mts integration-tests/sentry.integration.test.ts (for integration-tests)
```

## Auth0 Integration

**How to use:**

1. Configure Auth0 settings in your frontend environment (in local you can create a .env.local in the root of the frontend):

```
AUTH0_DOMAIN=domain.auth0.com
AUTH0_CLIENT_ID=client-id
AUTH0_AUDIENCE=api-audience
```

2. To protect a view in the frontend it is enough adding the component ```<ProtectedRoute> </ProtectedRoute>```
or create the page into the app/(protected) folder.

3. Now we can use the hook useAuth();  it returns the current user logged, login, logout , getAccessToken, and refresh token functions.

```
import { useAuth } from "~@reentry/frontend/lib/auth";

const { state, login, logout, getAccessToken, refreshToken } = useAuth();
```

4. Data allowed in the  state
```
state = {
  isAuthorized: bool,
  isLoading: bool,
  user: User,
  emailVerified: bool,
  error: String,
}
```

## Staging API Proxy (Local Development)

To run the frontend against the staging backend (which has CORS restrictions) you can use the local proxy server defined in `proxy-staging.js`.

1. In `apps/@reentry/frontend` create or update `.env` with the `.env.staging` env vars:

```bash
# Points the frontend API calls at the local proxy instead of directly at staging
NEXT_PUBLIC_API_URL=http://localhost:3001
# The actual staging backend base URL you want to reach (no trailing slash)
PROXY_TARGET=https://staging-api.example.com
```

Replace the example URL with the real staging API base URL.

1. Start the proxy + Next.js app together:

```bash
nx dev:with-staging-proxy @reentry/frontend
```

This runs the proxy on port 3001 and the frontend on port 3000.

Visit `http://localhost:3000` as usual. All requests to `NEXT_PUBLIC_API_URL` will be transparently forwarded to `PROXY_TARGET` with CORS handled.


### Troubleshooting

- 401 / auth errors: Confirm your Auth0 settings and that the access token is being attached (see Auth0 section above).
- CORS errors still appear: Make sure the browser is hitting `http://localhost:3001` (check the Network tab for request URLs) and that `PROXY_TARGET` is correct.
- Mixed content / HTTPS warnings: Ensure `PROXY_TARGET` uses `https://`.

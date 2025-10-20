This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


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

**Things to improve**

- I've attempted several approaches to encapsulate the API client within a hook (useApiClient) to manage the authorization token dynamically, but none have worked as expected. The main issue is that the Authorization header is not being sent correctly when retrieving the token. Centralizing the API client in a hook would improve reusability and avoid manually passing the token in each request, but this needs further investigation to ensure proper token handling.


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

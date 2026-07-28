# @jii/server

Backend for the Opportunities app.

## Simulating Edovo logins locally

The only live Edovo environment we have access to is prod. However, this project contains a local simulator that lets us test the Edovo auth flow in the dev environment.

If you aren't already, you'll need to be running the standard JII dev environment (`nx dev jii`). That command will start both this server and a local JWKS server (`nx jwks-sim @jii/server`).

This server simulates the Edovo endpoint we hit to retrive the public key for verifying their signed tokens. Requests are redirected to this server by environment variables in development.

To use this simulator, run the `edovo-test-token` script (e.g. `nx edovo-test-token @jii/server --state XX --id RES001`, but pass `-h` or see the script file for more details). This script generates a URL containing a token with the specified payload contents that can be run through the same auth flow locally as the real tokens would be in production; it should ultimately redirect you to the homepage of the specified resident and replicate the Edovo user experience.

## Troubleshooting with encrypted tokens

In the case of Edovo auth failures (both errors and denials), encrypted tokens are the only identifying information we have for those requests. (Unencrypted tokens contain PII and cannot be sent to Segment or Sentry.)

We have two scripts that you can run on demand to identify the affected users by decrypting the tokens.

For one-off operations, you can use the `decode-token` script in this project. Copy the token in question and pass it to `nx decode-token @jii/server --token <token>`; the script will print the decoded payload, which contains `facility_state` (which translates to `stateCode`) and `inmate_id` (which translates to `externalId`) along with a number of other fields that may be useful for troubleshooting (useful mainly to Edovo, in case we need to reach out to them for assistance).

For bulk operations, use the `decrypt-edovo-tokens` script instead: `nx decrypt-edovo-tokens @jii/server --input path/to/file.csv --output path/to/another/file.csv`. The input CSV must include the token in a column named `encrypted_edovo_token`, and the output CSV will contain the payload fields appended as new columns. This is useful for, e.g., pulling Segment events from BigQuery tables, which not coincidentally contain a column named `encrypted_edovo_token`.

These scripts use the production encryption key by default. If you need to decrypt tokens from staging, use the `staging` configuration by including a `-c staging` argument in your command.

## Testing the Auth0 roster check endpoint against staging or production

`/api/v1/auth0-roster-check` (`src/server/routes.ts`) is called by Auth0 Actions (`retrieve-user-profile.js`/`gate-registration.js` in `libs/@jii/auth`) during login/registration to look up a user's permissions. Data platform permissions prevent us from running this endpoint locally, so to test it you have to sign a real token and hit the deployed staging or production instance directly.

Use the `auth0-roster-check` script: `nx auth0-roster-check @jii/server -c staging --user-type RECIDIVIZ --email test@recidiviz.org` (pass `-h` or see the script file for the full set of options per user type — `RECIDIVIZ`/`STATE` take `--email`, `ORIJIN` takes `--user-id` and `--state-code`). Swap `-c staging` for `-c production` to hit production instead.

This script needs the real Auth0-paired private key (`AUTH0_PRIVATE_KEY`) to sign a valid token, supplied via the target-specific SOPS files `env.auth0-roster-check.staging.enc.yaml`/`env.auth0-roster-check.production.enc.yaml` (`sops edit <file>` to add or view it). These same files are also where we keep a local copy of the secret that needs to be configured in the Auth0 Action itself (as `GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY`) — if that secret is ever rotated in the Auth0 dashboard, update it here too to maintain a record of it (you cannot view secret values in Auth0) and so that this script keeps working.

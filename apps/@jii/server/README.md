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

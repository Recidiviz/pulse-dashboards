# jii-functions

This is the backend for the `jii` web application. It consists of several Firebase Functions that are responsible for sensitive auth operations.

## Simulating Edovo logins locally

The only live Edovo environment we have access to is prod. However, this project contains a local simulator that lets us test the Edovo auth flow locally.

If you aren't already, you'll need to be running the standard JII dev environment (`nx dev jii`).

As seen in `project.json` there are two additional Nx targets to run:

1. `jwks-sim` starts a local server that simulates the Edovo endpoint we hit to retrive the public key for verifying their signed tokens. Setting `DEV_ONLY_SIMULATED_JWKS_URI` in `.env.develoment` tells your locally emulated Firebase Function to hit that server instead of the real one.
1. `edovo-test-token` generates a URL containing a token with the payload contents you specify (pass `-h` or see the script file for details). This token will be encrypted with our key and signed with the keypair used in the simulator.

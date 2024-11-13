# Staff Shared / Server Package

This library actually contains two separate but related packages that need to be collocated for legacy reasons.

1. Staff Shared - this is the public library interface exported by `src/index.ts`; it contains all of the code that needs to be shared between the frontend at `apps/staff` and the legacy staff Node server (discussed below). It mainly consists of the shared filtering and optimization logic found in `src/shared-filters`.
1. Staff Server (`src/server`) - the legacy Node server. Really this is an app in itself, but because it has not yet been fully integrated with the Nx toolchain it is housed here so it can reference shared code from the same `src` directory without relying on any Nx tooling. It mainly serves the older flat-file-based endpoints for our earlier dashboards; newer backend functionality can be found in other `/apps` projects in this repo or in Python.

## Shared Filters

Shared filtering functionality for filtering the optimized data formats on the [staff frontend](/apps/staff) and the legacy staff backend

Here's a short description for the some of the main exports:

| Function name                        | Description                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| convertFromStringToUnflattenedMatrix | Converts the given optimized array as a singular string into an unflattened 2D matrix.                                    |
| filterOptimizedDataFormat            | Takes an unflattened 2D matrix, file metadata and a filter function and returns an array of filtered data point objects.  |
| validateMetadata                     | Validates that the metadata is in the correct format and is not missing any expected values.                              |
| unflattenValues                      | Unflattens an array or string by partitioning it into several sub-arrays of length equal to the provided totalDataPoints. |

### Environment

There is a dependency between the `getFilterKeys` function and the environment of the package that is using the staff-shared-server. `getFilterKeys` selects the format of the filter keys (camelcase vs snake-case) by detecting whether or not it is running in a browser environment (based on the existence of `window`).

## Staff Server

### Getting set up

1. Follow any steps laid out in [the main README for this repo](../../README.md#getting-set-up).

1. [Install Redis Version 7](https://redis.io/download#installation) (matches Memorystore for Redis version):

   Via Homebrew:
   `brew install redis@7.2`

   Using wget:

   ```sh
   :> wget https://download.redis.io/releases/redis-7.0.15.tar.gz
   :> tar xzf redis-7.0.15.tar.gz
   :> cd redis-7.0.15
   :> make

   <!-- Run redis with: -->
   :> src/redis-server

   <!-- Interact with Redis -->
   :> src/redis-cli
   ```

   [Instructions for installing Redis 5.0.14 on Windows](https://github.com/tporadowski/redis#redis-5014-for-windows)

#### Environment variables

Environment variables, auth configs, and service accounts are stored in Google Secrets Manager and loaded into the environment prior to launching or deploying the app.

To update a secret:

1. Go to the [recidiviz-dashboard-staging GSM](https://console.cloud.google.com/security/secret-manager?project=recidiviz-dashboard-staging)
1. Find the secret where the env/var or config that needs to be updated is stored. All of the secrets that contain environment variables or environment config start with `env_`
1. Copy the existing value (to be edited or added to when creating the new version). Since there are usually multiple env vars that live in a single secret, this step is necessary before moving on to the next step.
1. Create a new version of the secret with an updated value

For anyone trying to set this up independently, construct environment variables by hand based on the explanations below.

Expected frontend environment variables include:

- `VITE_API_URL` - the base URL of the backend API server.
- `VITE_AUTH_ENV` - a string indicating the "auth environment" used to point to the correct Auth0 tenant. Either "development" or "production". Must match the backend `AUTH_ENV` variable.
- `VITE_FEEDBACK_URL` - the URL of the Recidiviz Dashboard Feedback form.
- `VITE_IS_OFFLINE (OPTIONAL)` - whether or not to run the frontend in offline mode, which will run the app without requiring authentication. This should only be set when running locally and should be provided through the command line, along with the backend sibling below. To run the app in offline mode, run `yarn offline`
- `VITE_INTERCOM_APP_ID` - the APP_ID for Intercom, the customer engagement and support tool. Should be included in local, development, and production environments. The local and development environments point at the 'Recidiviz - [TEST]' Intercom workspace, and production environment points at the live 'Recidiviz' Intercom workspace.
- `VITE_SENTRY_ENV` - The environment for reporting Sentry errors
- `VITE_SENTRY_DSN` - The public DSN URL to use for sending Sentry errors, can be found on the Sentry project page.
- `VITE_DEPLOY_ENV` - The current deploy environment: `production`, `staging`, or `dev`
- `VITE_NEW_BACKEND_API_URL` - URL of the new Pathways backend
- `VITE_CRYPTO_PASSPHRASE` - Used to encrypt/decrypt salted hash ids
- `VITE_FIREBASE_BACKEND_PROJECT` - Name of the GCP project where Firebase is hosted
- `VITE_FIREBASE_API_KEY` - API Key to access Firebase
- `VITE_SENTENCING_API_BASE` - base URL of the sentencing backend API server
- `VITE_PROTOTYPES_API_URL` - base URL of the prototypes backend API server

Expected backend environment variables include:

- `AUTH_ENV` - a string indicating the "auth environment" used to point to the correct Auth0 tenant. Either "development" or "production". Must match the frontend `VITE_AUTH_ENV` variable.
- `GOOGLE_APPLICATION_CREDENTIALS` - a relative path pointing to the JSON file containing the credentials of the service account used to communicate with Google Cloud Storage, for metric retrieval.
- `METRIC_BUCKET` - the name of the Google Cloud Storage bucket where the metrics reside.
- `IS_OFFLINE` (OPTIONAL) - whether or not to run the backend in offline mode, which will retrieve static fixture data from the `server/core/demo_data` directory instead of pulling data from dynamic, live sources. This should only be set when running locally and should be provided through the command line, along with the frontend sibling above. To run the app in offline mode, use the following command: `yarn offline`
- `RECIDIVIZ_DATA_API_URL` - App Engine backend, used for impersonating a user.
- `SENTRY_ENV` - Name of environment in Sentry ("staging" or "production")
- `SENTRY_DSN` - Key to interact with Sentry
- `METADATA_NAMESPACE` - String used to access the user app metadata from the token
- `FIREBASE_PROJECT` - Name of the TCP project where Firebase is hosted
- `FIREBASE_CREDENTIAL` - Service account used to authenticate/authorize access to Firebase

The build process, as described below, ensures that the proper values are compiled and included in the static bundle at build time, for the right environment.

### Authentication

The backend API server and most frontend views in the app are authenticated via [Auth0](https://auth0.com/). If you are setting this app up completely fresh, you will need to create your own Auth0 account.

This setup assumes you have two separate Auth0 tenants, one for staging/demo/development and one for production. The configuration for each of those environments can be found in `src/shared-configs/authConfigs.js`. Which config is loaded and used relies on the `AUTH_ENV` environment variable on the backend and the `VITE_AUTH_ENV` environment variable on the frontend. It is important that the same config be loaded on the backend and frontend servers in a given tier so that API authentication will work.

### Running the application locally

A script is available for starting the development server, but most of the time you will want to run the frontend and backend together using `nx dev staff`.

The Node/Express backend is served out of port `3001`. A Redis server will be started on port `6380` (this is one higher than the default, and was chosen to make it possible to run Pathways and Case Triage at the same time).

You can run the backend development server on its own using `nx dev staff-shared-server`.

### Running the server in Offline mode

When running locally, you can run the app in offline mode to point the app to static data contained in `src/server/core/demo_data`. This is useful for debugging issues that materialize under specific data circumstances, for development when you don't have Internet access, and other use cases.

You can launch in offline mode locally via `nx offline staff`, which will run both the frontend and backend. Use `nx offline staff-shared-server` to start the backend only.

If you are running in offline mode, you may need to run through the following steps first:

1. Make sure your local repository has all the latest changes from the main branch. Run the following git commands from the `pulse-dashboards/` directory:

   ```
   :> git checkout main
   :> git pull origin main
   ```

1. Make sure your `redis-server` is not still running from a previous session. To avoid this situation, always shutdown the demo server by using `CTRL + c`. If you need to shutdown the redis-server from an earlier run, you can use the command:

   ```
   :> redis-cli -p 6380 shutdown
   ```

1. Make sure you can run the Firebase emulator; this requires Firebase Tools as described above as well as a recent version of Java.

To download data/fixture files to be used offline, run the `download_fixture_with_metadata.sh` script. The only argument to the script is the path to the file in GCS. You must have credentials to access GCS, and `gsutil` installed.

The script may be used to download both ".json" and ".txt" files. If downloading a ".txt" file, it can take some time to download and process the metadata json, so please be patient.

You may also need to install `jq`, a bash command line json processor. It can be installed using homebrew, `brew install jq`.

Example usage:
`libs/staff-shared-server/src/server/core/demo_data/download_fixture_with_metadata.sh gs://some-data-bucket/US_ID/vitals_summaries.txt`

### Running the server in Offline mode with the Python backend

The staff app's Python backend can be run in offline mode, using some configuration and fixture data that is shared with this server's offline mode. It does not run by default in the staff app's offline mode. If you do need to run it, most of the time you will want to start the frontend and backends all together; refer to the documentation in `/apps/staff` for instructions. To run the Python backend on its own, run `nx python-backend-offline staff-shared-server`.

Because the source code for this backend is not part of this repository, it requires some additional setup steps before running:

- If you do not already have Docker installed, install it from <https://www.docker.com/products/docker-desktop>
- If you use a Mac, you may need to turn off AirPlay Receiver in System Preferences in order to make port 5000 available.
- Configure docker authentication by running `gcloud auth configure-docker us-docker.pkg.dev`

The `pull-python-backend` target will pull the Docker image from the registry, which you need to do before you can start the server. You should also do this periodically to incorporate new changes.

The `python-backend-offline` target runs the necessary containers for the new backend and its databases. Once the server starts up, it will import fixture data from `src/server/core/demo_data` into a PostgreSQL database that the backend reads from. If fixture data changes during development, the server will restart and re-import the data. Because of the way Flask works, this import happens twice during startup, but only once if fixture files change while it's running.

The `python-backend-shutdown` target will tear down the Docker Compose environment created when the backend is started.

To generate new fixture data, while the backend is running run `./libs/staff-shared-server/tools/generate_pathways_fixtures.sh`.

To load fixture data from a GCS bucket, run `gsutil -m cp "gs://$BUCKET_NAME/US_OZ/*.csv" ./libs/staff-shared-server/src/server/core/demo_data/`.

### Deploys

TL;DR: run `nx deploy` and follow the instructions. See the Deploys section in `/apps/staff` for a more detailed discussion.

### Redis

We use [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis/redis-overview) as an external cache for the backend API. When developing locally, the `redis-server` will be started with the `nx dev staff-shared-server` or `nx offline staff-shared-server` scripts.

Here are a few helpful commands for inspecting the local redis cache:

```bash
# Follow along with commands sent to the redis-server
:> redis-cli -p 6380 MONITOR

# Clear your local redis cache
:> redis-cli -p 6380 FLUSHALL

:> redis-cli -p 6380
# List all the available keys in the cache
[localhost:6380]> KEYS *

# Get the value of the key
[localhost:6380]> GET key_name
```

Here's how you can access the staging and production instances on gcloud:

```
// Log into the VM
:> gcloud compute ssh --zone "us-central1-a" "pulse-dashboard-vm-1" --tunnel-through-iap --project "recidiviz-dashboard-production"

// Connect to redis instance - variables are found on the instance page
:> redis-cli -h <host> -p <port> -a <password>
```

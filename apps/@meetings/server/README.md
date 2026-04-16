# Meeting Assistant Server

This is the server component of the Meeting Assistant project. It is a [Fastify](https://fastify.dev/) server that provides an API for the Meeting Assistant client to interact with.

Some technical details:

- The API is defined using [trpc](https://trpc.io/), a type-safe RPC library for TypeScript
- The server uses [Prisma](https://www.prisma.io/) to interact with the database.

## Development

If you haven't already, follow the setup instructions in the root README to install dependencies.

1. Make sure you have your Docker daemon running.
2. To point to your own GCS bucket for local development:

   1. Create a GCS bucket in the recidiviz-dashboard-staging project with the pattern `recidiviz-dashboard-staging-[your-name]-meetings-test-bucket`
   2. Set the CORS policy on the bucket by running `gcloud storage buckets update gs://[your-bucket-name] --cors-file=apps/@meetings/server/gcs-cors.json`
   3. create an `.env.dev` file in this directory with the following contents:

   ```
   AUDIO_RECORDINGS_BUCKET_NAME=your-bucket-name
   ```

   Replace `your-bucket-name` with the name of your GCS bucket.

3. Get the service account key JSON file for the `recidiviz-dashboard-staging` GCP project from your team lead and put it in this directory. Name the file `recidiviz-dashboard-staging-22598baea1a7.json`.
4. [Only if this is the first time you're setting up the project/you want to re-seed the database] Run `nx prisma-seed @meetings/prisma` to seed the database with initial data (Docker starts automatically as a dependency).
5. Start the server with `nx dev @meetings/server`.

### Local Mode (No GCS)

When running locally via `nx dev @meetings/server`, local mode is enabled automatically. This means:

- Audio recordings are stored locally on your file system instead of GCS
- The signed URL endpoint returns a local HTTP endpoint (`/upload-audio/:meetingId/:filename`)
- Stitching and transcription read from local files
- Files are automatically cleaned up after transcription completes
- No GCS bucket or service account credentials needed

The `LOCAL_STORAGE_DIR` environment variable can optionally be set to control where local audio files are stored (default: `{system-temp}/meetings-local`). To disable local mode and connect to GCS instead, set `IS_LOCAL_MODE=false` in your `.env.dev` file.

### Updating the prisma schema

Instructions for updating the prisma schema are in the [prisma README](../../libs/@meetings/prisma/README.md).

### Add support for a new state

See [PR #13148](https://github.com/Recidiviz/pulse-dashboards/pull/13148) for the most up-to-date example of what's involved in adding a new state (as of April 2026). At a high level:

1. Create a state config file at `libs/@meetings/config/src/US_XX.ts` with the state's name, state code, and department keyword(s).
2. Register it in `libs/@meetings/config/src/configs.ts` (import + add to `AGENCY_CONFIGS`).
3. Add it to `AVAILABLE_STATE_CODES` in `StateContext.tsx`.
4. Add the lowercase state code to `additional_databases` in `libs/atmos/components/terraform/apps/meetings/main.tf`.
5. Update `DATABASE_STATE_CODES` in `libs/atmos/components/terraform/env-secrets/secrets/meetings.enc.yaml` for staging and production.
6. Add the state's meetings export in `recidiviz-data` — see [recidiviz-data PR #71761](https://github.com/Recidiviz/recidiviz-data/pull/71761) as an example.

### Why the Prisma schema and migration files are included in the build

The Prisma schema and corresponding migration files are included in the build for this app because the docker container is reused for database migrations (and both of those are needed to run `prisma migrate`). We could create a new container for migrations, but that seems like overkill for now. If this becomes a problem in the future, we can revisit this decision.

## Testing

### Integration tests

We have integration tests for the server + database.

In order to run these tests:

1. Make sure you have your Docker daemon running.
2. Run `nx test @meetings/server` to run the tests.

## Previews

Whenever you create a meetings-related PR, a preview frontend will be deployed to Firebase Hosting. A dedicated preview server and database are not yet created automatically for PRs.

### Debugging Preview Database issues

The preview database is only cloned from the staging database once per PR. If your PR becomes too out of sync with `main` and you rebase it, it's possible that the preview database will become too out of sync with the staging database for migrations to apply correctly. If you encounter issues with the preview database and migrations, you can delete it and re-run the preview Github Actions workflow to have a new one created and migrated. The name of the preview database will be in the logs of the preview Github Actions workflow.

## Deployment

Please only deploy the meetings server via the `nx deploy` command. This will ensure that the correct environment variables are used for the deployment.

## Reprocessing Meetings

There is an internal API endpoint to reprocess meetings. This can be used to re-run post-meeting processing steps (like audio stitching and transcription) for a specific meeting in the case that something went wrong during the initial processing or you want to re-run processing with updated logic.

The endpoint is a POST request to `/reprocess-meeting` with the following body parameters:

- `stateCode`: The state code of the meeting to reprocess (e.g. `US_CA` for California)
- `meetingId`: The ID of the meeting to reprocess
- `step` (optional): The specific post-meeting processing step to reprocess. Valid values are `stitching`, `transcription`, and `notetaking`. If not provided, the server will determine the appropriate step to reprocess based on the current status of the meeting.

You will need to pass a Google Identity Token in the `Authorization` header of the request. The token must be for a service account that has permission to access the meetings server (`meetings@recidiviz-dashboard-staging.iam.gserviceaccount.com` for the staging and demo servers, and `meetings@recidiviz-dashboard-production.iam.gserviceaccount.com` for the production server).

1. You can generate a token by following the instructions at https://docs.cloud.google.com/iam/docs/create-short-lived-credentials-direct#console_4

2. You can attach the token to your request using the `Authorization` header:

`-H "Authorization: Bearer {your_id_token}"`

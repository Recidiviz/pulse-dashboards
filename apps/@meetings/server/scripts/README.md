# Meetings Server Scripts

## Reprocess Meeting with Uploaded Audio

This script allows you to manually trigger processing for a meeting, optionally with an uploaded audio file.
It can start processing at any step: `stitching`, `transcription`, or `notetaking`. If no step is specified, it is inferred from the meeting's current processing status.

### Prerequisites

The prerequisites depend on which environment you're running against:

#### For Development (Local, `--configuration=dev`)

1. **Copy test data to local test bucket**

   Before running the script against development, ensure the audio file you want to process exists in your test bucket.

2. You can copy test data from the staging bucket using gsutil:

   ```bash
   # Copy test-data directory from staging to local test bucket
   gsutil -m cp -r gs://recidiviz-dashboard-staging-meetings-audio-data/test-data gs://recidiviz-dashboard-staging-NAME-meetings-test-bucket/test-data
   ```

#### For Staging/Production (Cloud)

1. **Authenticate with gcloud**

   ```bash
   gcloud auth login
   gcloud config set project recidiviz-dashboard-staging
   ```

### Environment Variables

**Environment variables are automatically loaded from SOPS-encrypted files** when you run the nx target. You don't need to set them manually.

#### Development Variables

- `DATABASE_URL` - PostgreSQL connection string (single database)
- `REPROCESS_ENDPOINT_URL` - Local @meetings/server endpoint

#### Staging/Production Variables

- `REPROCESS_ENDPOINT_URL` - Deployed @meetings/server endpoint

### Usage

**Always use the Nx target** to run this script:

```bash
nx reprocess-meeting @meetings/server \
  --configuration=<dev|staging|production> \
  --meeting-id=<meeting-id> \
  --state-code=<state-code> \
  [--gcs-path=<gcs-path-from-bucket-root>] \
  [--step=<step>]
```

#### Parameters

- `--configuration` - Environment to use (`dev`, `staging`, or `production`)
- `--meeting-id` - The meeting ID to reprocess
- `--state-code` - State code (e.g., `US_ID`, `US_NE`)
- `--gcs-path` - (Optional) Path to the uploaded audio file (from bucket root, e.g., `gs://bucket/path/to/file.m4a` is `path/to/file.m4a`). When provided, the server updates `finalRecordingGCSPath` before queuing the task.
- `--step` - (Optional) Processing step to execute. If omitted, inferred from the meeting's current processing status.
  - `stitching` - Stitch multiple audio chunks into one file
  - `transcription` - Transcribe the final audio file (use this when you've uploaded a final file)
  - `notetaking` - Generate meeting notes from existing transcription

---

## Running Against Development

When running against development (local database and server), the script:

- Calls the local server endpoint without authentication
- Uses test data from the local test bucket

**Prerequisites:** Make sure you've copied test data to your local bucket (see Prerequisites section above).

### Development Examples

**Start transcription with uploaded audio file:**

```bash
nx reprocess-meeting @meetings/server \
  --configuration=dev \
  --meeting-id=abc123 \
  --state-code=US_NE \
  --gcs-path="test-data/final-audio.m4a" \
  --step=transcription
```

**Re-run notetaking only:**

```bash
nx reprocess-meeting @meetings/server \
  --configuration=dev \
  --meeting-id=abc123 \
  --state-code=US_NE \
  --gcs-path="test-data/final-audio.m4a" \
  --step=notetaking
```

---

## Running Against Staging/Production

When running against staging/production (cloud database and server), the script:

- Uses your local `gcloud` credentials (`GoogleAuth`) to get an ID token for the endpoint
- Calls the server endpoint with the token
- Uses data from the staging/production bucket

**Prerequisites:** See staging/production prerequisites above (gcloud auth).

### Staging/Production Examples

**Skip stitching and start with transcription:**

```bash
nx reprocess-meeting @meetings/server \
  --configuration=staging \
  --meeting-id=abc123 \
  --state-code=US_NE \
  --gcs-path="path/to/final-audio.m4a" \
  --step=transcription
```

**Re-run stitching** (for debugging):

```bash
nx reprocess-meeting @meetings/server \
  --configuration=staging \
  --meeting-id=abc123 \
  --state-code=US_NE \
  --gcs-path="path/to/final-audio.m4a" \
  --step=stitching
```

**Re-run notetaking only:**

```bash
nx reprocess-meeting @meetings/server \
  --configuration=staging \
  --meeting-id=abc123 \
  --state-code=US_NE \
  --gcs-path="path/to/final-audio.m4a" \
  --step=notetaking
```

### What the Script Does

The script behavior depends on the configuration:

#### Development Mode

1. **Decrypts SOPS environment files** to load development configuration
2. **Calls the local reprocess-meeting endpoint** (no authentication) with the provided arguments
3. The server updates `finalRecordingGCSPath` (if `--gcs-path` is provided) and queues the task

#### Staging/Production Mode

1. **Decrypts SOPS environment files** to load staging/production configuration
2. **Uses `GoogleAuth`** with your local `gcloud` credentials to get an ID token for the endpoint
3. **Calls the reprocess-meeting endpoint** with the specified step and `gcsPath`
4. The server updates `finalRecordingGCSPath` (if `--gcs-path` is provided) and queues the task

### Expected Output

```
🎬 Meetings Audio Reprocessing Script

🔄 Triggering reprocess-meeting endpoint...
   Endpoint: https://...
   State Code: US_NE
   Meeting ID: abc123
   Step: transcription
   Running with user credentials
✅ Reprocess triggered successfully!
   Response: "Transcription task queued successfully."

🎉 All done! The transcription task has been queued.
   Monitor the meeting status in the database or logs.
```

### Troubleshooting

#### "Not authenticated with gcloud"

Run: `gcloud auth login`

#### "Failed to trigger reprocess: 401 Unauthorized"

Your `gcloud` credentials were not accepted. Make sure you're logged in:

```bash
gcloud auth login --update-adc
```

Then check server logs for more details.

### Next Steps

Follow the logs: <https://console.cloud.google.com/logs/query;duration=PT10M;query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22meetings-server%22%0A-protoPayload.@type%3D%22type.googleapis.com%2Fgoogle.cloud.audit.AuditLog%22?project=recidiviz-dashboard-staging>

---

## Meetings Oncall Dashboard

Serves a local dashboard of recent meetings for oncall debugging, with reprocessing and audio
re-upload actions.

### Prerequisites

1. **Authenticate with gcloud**

   ```bash
   gcloud auth login --update-adc
   ```

2. **Start the Cloud SQL Auth Proxy** and leave it running in another terminal.

   ```bash
   # staging:
   cloud-sql-proxy --port 5432 recidiviz-dashboard-staging:us-central1:meetings
   # or for production:
   cloud-sql-proxy --port 5432 recidiviz-dashboard-production:us-central1:meetings
   ```

   **Make sure `--configuration` matches the instance the proxy is pointed at.**

### Usage

```bash
nx meetings-oncall @meetings/server  # defaults to production
nx meetings-oncall @meetings/server --configuration=staging
```

The dashboard serves on `http://127.0.0.1:4321`

#### Parameters

Passed through `--args`, e.g. `--args="--limit=25 --user=someone@recidiviz.org"`:

- `--limit <n>` - How many meetings to show (default 10)
- `--meeting-id <id>` - Show only this meeting
- `--user <email>` - Show only meetings created by this staff email
- `--port <port>` - Port to serve on (default 4321)
- `--no-open` - Don't open a browser automatically

All three filters are also editable in the page itself, so you usually don't need the flags.

### Reprocessing actions

Each row has three step buttons (`stitching`, `transcription`, `notetaking`) and an
upload-and-reprocess control. Output from each action appears inline under the buttons.

The step buttons invoke the existing `reprocess-meeting`:

```bash
nx reprocess-meeting @meetings/server --configuration=<same> \
  --meeting-id=<id> --state-code=<state> --step=<step> [--gcs-path=<path>]
```

**Upload + reprocess** writes the chosen audio file to
`<recordingsFolderPath>/reupload-<timestamp><ext>` in the meeting's own bucket, then queues
`transcription` against that path. It writes to a new object rather than overwriting `final.*`, so
the original stitched audio stays recoverable — but note that the reprocess endpoint does update
the meeting's `finalRecordingGCSPath` to the new object.

### Diagnosing a failure

Expand a row with the `+` next to the meeting ID. The drawer holds three things:

**Links.** Sentry issue search on the `meetingId` tag, and Cloud Logging for the `meetings-server`
Cloud Run service windowed from 15 minutes before the meeting ended to two hours after.

\*\*Notetaking `errorDetails`

**The recordings folder.** Click `inspect GCS` to list every object under the meeting's
`recordingsFolderPath` with size, content type, and last-modified. Zero-byte objects and
non-audio objects are highlighted.

This is usually the fastest route to a cause, because **the chunk files survive a failure**: the
stitching failure path only clears its local temp dir, and the artifact cleanup job skips meetings
whose `endTime` is null, which is true of anything that never stitched successfully.

The findings map to the failure modes in `stitchAudio`
(`libs/@meetings/tasks/src/utils.ts`):

| Finding                                         | Failure mode                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Folder is empty                                 | `No audio files found to stitch for meeting <id>`                                                                                                                  |
| Zero-byte object                                | ffmpeg `Invalid data found when processing input`                                                                                                                  |
| Non-audio object present                        | `stitchAudio` lists the folder with no extension filter, so `label-studio-task.json`, an old `final.*`, and `reupload-*` files all get fed to ffmpeg's concat list |
| Mixed audio extensions                          | stitching runs `-c copy` using the _first_ file's format, so mismatched codecs fail                                                                                |
| No supported extension                          | `Unexpected file format`                                                                                                                                           |
| `final.*` in GCS but no `finalRecordingGCSPath` | ffprobe failed _after_ the upload                                                                                                                                  |
| **No `moov` atom**                              | the recording was interrupted before the index was written — see below                                                                                             |
| Truncated box structure                         | the upload did not finish                                                                                                                                          |
| Not readable as MP4                             | wrong container, or a corrupt write                                                                                                                                |

### Troubleshooting

#### "Missing DATABASE_URL_TEMPLATE environment variable"

The env file for this target/configuration wasn't found or didn't decrypt. Check that
`env.meetings-oncall.<env>.enc.yaml` exists and that you're authenticated for SOPS
(`gcloud auth login --update-adc`).

#### Every state is skipped with a connection error

The Cloud SQL Auth Proxy isn't running, isn't listening on port 5432, or is pointed at a different
environment than `--configuration`. See Prerequisites.

#### "Forbidden: missing or bad dashboard token"

The token is regenerated on every run, so a tab from a previous run is stale. Open the URL the
script printed.

#### `EADDRINUSE` on startup

Another dashboard is still running, or something else holds the port. Use `--args="--port=4322"`.

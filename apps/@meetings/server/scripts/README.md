# Meetings Server Scripts

## Reprocess Meeting with Uploaded Audio

This script allows you to manually trigger processing for a meeting, optionally with an uploaded audio file.
It can start processing at any step: `stitching`, `transcription`, or `notetaking`. If no step is specified, it is inferred from the meeting's current processing status.

### Prerequisites

The prerequisites depend on which environment you're running against:

#### For Development (Local)

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
  --configuration=<development|staging|production> \
  --meeting-id=<meeting-id> \
  --state-code=<state-code> \
  [--gcs-path=<gcs-path-from-bucket-root>] \
  [--step=<step>]
```

#### Parameters

- `--configuration` - Environment to use (`development`, `staging`, or `production`)
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
  --configuration=development \
  --meeting-id=abc123 \
  --state-code=US_NE \
  --gcs-path="test-data/final-audio.m4a" \
  --step=transcription
```

**Re-run notetaking only:**

```bash
nx reprocess-meeting @meetings/server \
  --configuration=development \
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

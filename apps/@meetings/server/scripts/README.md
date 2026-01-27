# Meetings Server Scripts

## Reprocess Meeting with Uploaded Audio

This script allows you to manually trigger processing for a meeting where you've uploaded the final audio file directly to GCS. 
It can start processing at any step: `stitching`, `transcription`, or `notetaking`.

### Prerequisites

The prerequisites depend on which environment you're running against:

#### For Development (Local)

1. **Copy test data to local test bucket**

   Before running the script against development, ensure the audio file you want to process exists in your test bucket. 
2. You can copy test data from the staging bucket  using gsutil:

   ```bash
   # Copy test-data directory from staging to local test bucket
   gsutil -m cp -r gs://recidiviz-dashboard-staging-meetings-audio-data/test-data gs://recidiviz-dashboard-staging-NAME-meetings-test-bucket/test-data
   ```

#### For Staging (Cloud)

1. **Install cloud-sql-proxy binary**
   Install it via Homebrew:
   ```bash
   brew install cloud-sql-proxy
   ```

   Or download the cloud-sql-proxy binary and place it in `apps/@meetings/server/scripts/`:

   ```bash
   cd apps/@meetings/server/scripts

   # macOS (ARM)
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.15.0/cloud-sql-proxy.darwin.arm64

   # macOS (Intel)
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.15.0/cloud-sql-proxy.darwin.amd64

   # Make it executable
   chmod +x cloud-sql-proxy
   ```

2. **Authenticate with gcloud**
   ```bash
   gcloud auth login
   gcloud config set project recidiviz-dashboard-staging
   ```

3. **Grant yourself Service Account Token Creator role**

   You need permission to impersonate the meetings service account:

   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
     meetings@recidiviz-dashboard-staging.iam.gserviceaccount.com \
     --member=user:YOUR_EMAIL@recidiviz.org \
     --role=roles/iam.serviceAccountTokenCreator \
     --project=recidiviz-dashboard-staging
   ```

4. **Request Cloud SQL access (if needed)**

   If you don't have Cloud SQL access, you may need to request temporary project ownership through [go/jit](https://go/jit) to connect to the database.

### Environment Variables

**Environment variables are automatically loaded from SOPS-encrypted files** when you run the nx target. You don't need to set them manually.

#### Development Variables
- `DATABASE_URL_US_XX` - PostgreSQL connection URLs (local database)
- `REPROCESS_ENDPOINT_URL` - Local @meetings/server endpoint

#### Staging Variables
- `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL` - Service account for authentication
- `CLOUD_SQL_PROXY_PORT` - Port for the SQL proxy
- `DATABASE_URL_US_XX` - PostgreSQL connection URLs
- `INSTANCE_CONNECTION_NAME` - Cloud SQL instance connection string
- `REPROCESS_ENDPOINT_URL` - Deployed @meetings/server endpoint

### Usage

**Always use the Nx target** to run this script:

```bash
nx reprocess-meeting @meetings/server \
  --configuration=<development|staging> \
  --meeting-id=<meeting-id> \
  --state-code=<state-code> \
  --gcs-path=<gcs-path-from-bucket-root> \
  --step=<step>
```

#### Parameters

- `--configuration` - Environment to use (`development` or `staging`)
- `--meeting-id` - The meeting ID to reprocess
- `--state-code` - State code (e.g., `US_ID`, `US_NE`)
- `--gcs-path` - Path to the uploaded audio file (from bucket root e.g., `gs://bucket/path/to/file.m4a` is `path/to/file.m4a`)
- `--step` - Processing step to execute (optional, defaults to `transcription`):
  - `stitching` - Stitch multiple audio chunks into one file
  - `transcription` - Transcribe the final audio file (use this when you've uploaded a final file)
  - `notetaking` - Generate meeting notes from existing transcription

---

## Running Against Development

When running against development (local database and server), the script:
- Connects directly to the local database (no cloud-sql-proxy needed)
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

## Running Against Staging

When running against staging (cloud database and server), the script:
- Connects via cloud-sql-proxy to the staging database
- Impersonates a service account for authentication
- Uses data from the staging bucket

**Prerequisites:** See staging prerequisites above (cloud-sql-proxy, gcloud auth, service account permissions).

### Staging Examples

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
2. **Connects directly to the local Prisma database**
3. **Updates the meeting record** to set `finalRecordingGCSPath` to your uploaded file
4. **Calls the local reprocess-meeting endpoint** (no authentication)
5. **Cleans up** by disconnecting from the database

#### Staging Mode
1. **Decrypts SOPS environment files** to load staging configuration
2. **Starts cloud-sql-proxy** to connect to the remote database
3. **Connects to Prisma** with the PostgreSQL adapter
4. **Updates the meeting record** to set `finalRecordingGCSPath` to your uploaded file
5. **Impersonates the service account** to get an authenticated OIDC token
6. **Calls the reprocess-meeting endpoint** with the specified step to queue the task
7. **Cleans up** by disconnecting from the database and stopping the proxy

### Expected Output

```
🎬 Meetings Audio Reprocessing Script

🚀 Starting Cloud SQL Proxy...
⏳ Waiting for Cloud SQL Proxy to be ready...
[proxy] Ready for new connections
✅ Cloud SQL Proxy is ready!
✅ Connected to database

📝 Updating meeting in database...
   Meeting ID: abc123
   GCS Path: path/to/final-audio.m4a
✅ Meeting updated successfully!

🔄 Triggering reprocess-meeting endpoint...
   State Code: US_NE
   Meeting ID: abc123
   Step: transcription
✅ Reprocess triggered successfully!
   Response: "OK"

🎉 All done! The transcription task has been queued.
   Monitor the meeting status in the database or logs.

🔌 Disconnected from database
🛑 Stopping Cloud SQL Proxy...
```

### Troubleshooting

#### "cloud-sql-proxy: command not found"

The script looks for `cloud-sql-proxy` in `apps/@meetings/server/scripts/`. Download it or install globally: `brew install cloud-sql-proxy`

#### "Not authenticated with gcloud"

Run: `gcloud auth login`

#### "Failed to get auth token for service account"

You need the Service Account Token Creator role:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  meetings@recidiviz-dashboard-staging.iam.gserviceaccount.com \
  --member=user:YOUR_EMAIL@recidiviz.org \
  --role=roles/iam.serviceAccountTokenCreator \
  --project=recidiviz-dashboard-staging
```

#### "Failed to connect to database" or "Permission denied on Cloud SQL"

You may need temporary project ownership to access Cloud SQL. Request access through **[go/jit](https://go/jit)** 

#### "Failed to trigger reprocess: 401 Unauthorized"

The service account impersonation is working, but the server rejected the token. Check:
- That you're using the correct service account email
- That the token has the proper audience claim
- Server logs for more details


### Next Steps
Follow the logs: https://console.cloud.google.com/logs/query;duration=PT10M;query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22meetings-server%22%0A-protoPayload.@type%3D%22type.googleapis.com%2Fgoogle.cloud.audit.AuditLog%22?project=recidiviz-dashboard-staging

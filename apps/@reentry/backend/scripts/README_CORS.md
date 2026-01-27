# Configuring CORS for Direct GCS Uploads

To enable direct file uploads from the frontend to Google Cloud Storage, you need to configure CORS (Cross-Origin Resource Sharing) on your GCS buckets.

## Why is this needed?

When uploading files directly from the browser to GCS using signed URLs, the browser enforces CORS policies. Without proper CORS configuration, the browser will block the upload request with a CORS error.

## Security: Environment-Specific CORS

Each bucket is configured with CORS that **only allows access from its corresponding frontend URL**:

| Bucket | Allowed Origins |
|--------|----------------|
| `recidiviz-recording-bucket-dev` | `http://localhost:3000`, `https://plan-dev.recidiviz.org` |
| `recidiviz-recording-bucket-staging` | `https://plan-staging.recidiviz.org` |
| `recidiviz-recording-bucket-demo` | `https://plan-demo.recidiviz.org` |
| `recidiviz-recording-bucket-production` | `https://plan.recidiviz.org` |
| `recidiviz-recording-bucket-pilot` | `https://plan-pilot.recidiviz.org` |
| `recidiviz-dev-bucket-1` | `http://localhost:3000`, `https://plan-dev.recidiviz.org` |

This ensures that:
- Production bucket can only be accessed from production frontend
- Staging bucket can only be accessed from staging frontend
- And so on...

## Quick Start: Apply CORS to All Buckets

### Option 1: Using Bash Script (Recommended)

Apply CORS configuration to all buckets at once:

```bash
cd backend/scripts
./apply_all_cors.sh
```

### Option 2: Using Python Script

```bash
cd backend
python scripts/apply_all_cors.py
```

### Option 3: Apply CORS to Individual Buckets

If you only want to configure a specific bucket:

```bash
# Development bucket
gsutil cors set scripts/cors-config-dev.json gs://recidiviz-recording-bucket-dev

# Staging bucket
gsutil cors set scripts/cors-config-staging.json gs://recidiviz-recording-bucket-staging

# Demo bucket
gsutil cors set scripts/cors-config-demo.json gs://recidiviz-recording-bucket-demo

# Production bucket
gsutil cors set scripts/cors-config-production.json gs://recidiviz-recording-bucket-production

# Pilot bucket
gsutil cors set scripts/cors-config-pilot.json gs://recidiviz-recording-bucket-pilot
```

## Verify CORS Configuration

Check the CORS configuration for a specific bucket:

```bash
gsutil cors get gs://BUCKET_NAME
```

## Configuration Files

Each environment has its own CORS configuration file:

- `cors-config-dev.json` - Development environment
- `cors-config-staging.json` - Staging environment
- `cors-config-demo.json` - Demo environment
- `cors-config-production.json` - Production environment
- `cors-config-pilot.json` - Pilot environment

## Troubleshooting

### Still getting CORS errors?

1. **Check the origin**: Make sure the origin in your CORS config matches exactly with the origin of your frontend (including protocol, domain, and port)

2. **Verify configuration was applied**:
   ```bash
   gsutil cors get gs://BUCKET_NAME
   ```

3. **Clear browser cache**: Sometimes browsers cache CORS preflight responses

4. **Check bucket permissions**: Ensure your service account has the necessary permissions (`storage.buckets.update` or `storage.admin`)

5. **Check environment**: Make sure you're using the correct bucket for your environment (dev frontend should use dev bucket, etc.)

### Common Issues

**Error: "No CORS configuration found"**
- The CORS configuration hasn't been applied yet. Run the apply script.

**Error: "Access to XMLHttpRequest blocked by CORS policy"**
- The origin is not in the CORS configuration for that bucket
- Verify you're using the correct bucket for your environment

**Error: "Bucket not found" or "Access denied"**
- Check that your service account has permission to update bucket CORS settings
- Verify you're authenticated with the correct GCP project

## Adding New Origins

If you need to add a new frontend origin:

1. Update the corresponding `cors-config-*.json` file
2. Reapply the CORS configuration:
   ```bash
   gsutil cors set scripts/cors-config-ENV.json gs://BUCKET_NAME
   ```

## Security Best Practices

✅ **DO:**
- Use environment-specific buckets with matching frontend URLs
- Keep `maxAgeSeconds` reasonable (3600 = 1 hour)
- Review CORS configuration regularly
- Use HTTPS for production URLs

❌ **DON'T:**
- Use wildcards (`*`) for origins in production
- Add unnecessary origins to buckets
- Share bucket access across environments
- Use HTTP for production origins

## Manual Configuration via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Storage** > **Buckets**
3. Click on your bucket name
4. Go to the **Permissions** tab
5. Scroll down to **CORS** section
6. Click **Edit CORS configuration**
7. Copy the content from the appropriate `cors-config-*.json` file
8. Click **Save**

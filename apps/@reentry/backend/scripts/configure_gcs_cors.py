"""
Script to configure CORS on GCS bucket for direct uploads from frontend.

Run this script once to configure CORS on your GCS bucket:
    python scripts/configure_gcs_cors.py
"""

import asyncio
import json
import os
import sys

import aiohttp
from gcloud.aio.auth import Token
from gcloud.aio.storage import Storage


async def configure_cors(bucket_name: str, allowed_origins: list[str]):
    """Configure CORS on a GCS bucket."""
    key_path = os.path.join(
        os.path.dirname(__file__), "../.secrets/gcp-service-account.json"
    )

    async with aiohttp.ClientSession() as session:
        if os.path.exists(key_path):
            token = Token(
                service_file=key_path,
                session=session,
                scopes=["https://www.googleapis.com/auth/devstorage.full_control"],
            )
            print(f"Using service account key: {key_path}")
        else:
            token = Token(
                session=session,
                scopes=["https://www.googleapis.com/auth/devstorage.full_control"],
            )
            print("Using default credentials")

        storage = Storage(token=token, session=session)

        # CORS configuration
        cors_config = [
            {
                "origin": allowed_origins,
                "method": ["GET", "PUT", "POST", "HEAD", "OPTIONS"],
                "responseHeader": [
                    "Content-Type",
                    "Content-Length",
                    "x-goog-resumable",
                ],
                "maxAgeSeconds": 3600,
            }
        ]

        print(f"Configuring CORS for bucket: {bucket_name}")
        print(f"Allowed origins: {allowed_origins}")
        print(f"CORS config: {json.dumps(cors_config, indent=2)}")

        # Get current bucket metadata
        try:
            await storage.get_bucket(bucket_name).get_metadata()
            print("Current bucket metadata retrieved")
        except Exception as e:
            print(f"Error getting bucket metadata: {e}")
            return False

        # Update bucket with CORS configuration
        try:
            # Use the REST API to update CORS
            access_token = await token.get()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }

            url = f"https://storage.googleapis.com/storage/v1/b/{bucket_name}"
            payload = {"cors": cors_config}

            async with session.patch(url, headers=headers, json=payload) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print("✓ CORS configuration updated successfully!")
                    print(
                        f"CORS config: {json.dumps(result.get('cors', []), indent=2)}"
                    )
                    return True
                else:
                    error_text = await resp.text()
                    print(f"✗ Failed to update CORS: {resp.status}")
                    print(f"Error: {error_text}")
                    return False

        except Exception as e:
            print(f"✗ Error configuring CORS: {e}")
            return False


async def main():
    # Get bucket name from environment or use default
    bucket_name = os.environ.get("GCS_BUCKET_NAME", "recidiviz-dev-bucket-1")

    # Get allowed origins from environment or use defaults
    # For development, you might want to include localhost
    # For production, use your actual frontend domain
    allowed_origins_str = os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,https://plan-dev.recidiviz.org,https://plan-staging.recidiviz.org,https://plan-demo.recidiviz.org,https://plan.recidiviz.org,https://plan-pilot.recidiviz.org",
    )
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

    print("=" * 60)
    print("GCS CORS Configuration Script")
    print("=" * 60)

    success = await configure_cors(bucket_name, allowed_origins)

    if success:
        print("\n✓ CORS configuration completed successfully!")
        print("\nYou can now upload files directly to GCS from your frontend.")
        sys.exit(0)
    else:
        print("\n✗ CORS configuration failed!")
        print("\nPlease check the error messages above.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

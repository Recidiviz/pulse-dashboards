"""
Script to apply CORS configuration to all GCS buckets.
Each bucket gets access only from its corresponding frontend URL.

Usage:
    python scripts/apply_all_cors.py
"""

import asyncio
import json
import sys
from pathlib import Path

import aiohttp
from gcloud.aio.auth import Token

# Bucket to config file mapping
BUCKET_CONFIGS = {
    "recidiviz-recording-bucket-dev": "cors-config-dev.json",
    "recidiviz-recording-bucket-staging": "cors-config-staging.json",
    "recidiviz-recording-bucket-demo": "cors-config-demo.json",
    "recidiviz-recording-bucket-production": "cors-config-production.json",
    "recidiviz-recording-bucket-pilot": "cors-config-pilot.json",
    "recidiviz-dev-bucket-1": "cors-config-dev.json",
}


async def apply_cors_to_bucket(
    session: aiohttp.ClientSession,
    token: Token,
    bucket_name: str,
    cors_config: list,
) -> bool:
    """Apply CORS configuration to a specific bucket."""
    try:
        # Get access token
        access_token = await token.get()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # API endpoint for updating bucket
        url = f"https://storage.googleapis.com/storage/v1/b/{bucket_name}"
        payload = {"cors": cors_config}

        async with session.patch(url, headers=headers, json=payload) as resp:
            if resp.status == 200:
                await resp.json()
                print(f"✅ Successfully applied CORS to {bucket_name}")
                print(f"   Origins: {cors_config[0]['origin']}")
                return True
            else:
                error_text = await resp.text()
                print(f"❌ Failed to apply CORS to {bucket_name}")
                print(f"   Status: {resp.status}")
                print(f"   Error: {error_text}")
                return False

    except Exception as e:
        print(f"❌ Error applying CORS to {bucket_name}: {e}")
        return False


async def main():
    script_dir = Path(__file__).parent
    key_path = script_dir.parent / ".secrets" / "gcp-service-account.json"

    print("=" * 60)
    print("Applying CORS to all GCS buckets")
    print("=" * 60)
    print()

    success_count = 0
    failed_count = 0

    async with aiohttp.ClientSession() as session:
        # Initialize token
        if key_path.exists():
            token = Token(
                service_file=str(key_path),
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

        print()

        # Apply CORS to each bucket
        for bucket_name, config_file in BUCKET_CONFIGS.items():
            config_path = script_dir / config_file

            print("-" * 60)
            print(f"Bucket: {bucket_name}")
            print(f"Config: {config_file}")
            print("-" * 60)

            # Check if config file exists
            if not config_path.exists():
                print(f"❌ ERROR: Config file not found: {config_path}")
                failed_count += 1
                print()
                continue

            # Load CORS configuration
            try:
                with open(config_path, "r") as f:
                    cors_config = json.load(f)
            except Exception as e:
                print(f"❌ ERROR: Failed to load config file: {e}")
                failed_count += 1
                print()
                continue

            # Apply CORS
            if await apply_cors_to_bucket(session, token, bucket_name, cors_config):
                success_count += 1
            else:
                failed_count += 1

            print()

    print("=" * 60)
    print("CORS Configuration Summary")
    print("=" * 60)
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {failed_count}")
    print()

    if failed_count == 0:
        print("🎉 All CORS configurations applied successfully!")
        return 0
    else:
        print("⚠️  Some CORS configurations failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

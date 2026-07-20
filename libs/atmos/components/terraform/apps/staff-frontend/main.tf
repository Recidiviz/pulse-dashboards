# Origin buckets for the staff frontend.
#
# Two buckets:
#   - frontend: everything the build produces. Private — readable only by the
#     Cloud Load Balancing service agent (Cloud CDN "private bucket access").
#   - frontend_index: index.html only. Public, because the URL map's custom
#     error response policy (the SPA deep-link fallback) is documented to
#     require a publicly readable bucket as its error_service. index.html is
#     the app's public entry document; everything sensitive stays private.

resource "google_storage_bucket" "frontend" {
  name                        = var.bucket_name
  location                    = "US"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  encryption {
    default_kms_key_name = google_kms_crypto_key.bucket.id
  }

  # Without a website config, a GET on the bucket root returns a
  # ListBucketResult XML object listing (the LB agent's objectViewer role
  # includes objects.list). main_page_suffix makes GCS serve index.html for
  # "/" and "/dir/" requests instead — honored for load balancer backend
  # bucket requests per the GCS static-website docs.
  website {
    main_page_suffix = "index.html"
  }

  # Deploys `gcloud storage cp` every file, resetting object age, so only files
  # dropped from the build reach this age. Keep the CDN TTLs in
  # load_balancer.tf below this so edge caches never outlive origin objects.
  lifecycle_rule {
    condition {
      age = var.asset_retention_days
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_kms_crypto_key_iam_member.gcs]
}

resource "google_storage_bucket" "frontend_index" {
  name                        = "${var.bucket_name}-index"
  location                    = "US"
  uniform_bucket_level_access = true
  force_destroy               = false

  encryption {
    default_kms_key_name = google_kms_crypto_key.bucket.id
  }

  # No lifecycle rule: this bucket only ever holds index.html, and a deploy
  # pause must not delete the live entry document.

  depends_on = [google_kms_crypto_key_iam_member.gcs]
}

resource "google_storage_bucket_iam_member" "index_public" {
  bucket = google_storage_bucket.frontend_index.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Private bucket access: the load balancer reads the origin bucket as the
# Cloud Load Balancing service agent — this grant is the entire mechanism
# (there is no enable flag on the backend bucket).
#
# The agent does not exist until the project's first backend bucket has been
# created, hence the depends_on; if the grant still races agent creation on a
# fresh project, re-apply once.
resource "google_storage_bucket_iam_member" "lb_agent" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:service-${data.google_project.this.number}@https-lb.iam.gserviceaccount.com"

  depends_on = [google_compute_backend_bucket.html]
}

resource "google_storage_bucket_iam_member" "deployers" {
  for_each = toset(var.deployer_members)

  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectAdmin"
  member = each.value
}

resource "google_storage_bucket_iam_member" "index_deployers" {
  for_each = toset(var.deployer_members)

  bucket = google_storage_bucket.frontend_index.name
  role   = "roles/storage.objectAdmin"
  member = each.value
}

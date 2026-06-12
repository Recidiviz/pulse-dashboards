locals {
  # Well-known Google service agents that must be able to use the CMEK keys.
  gke_service_agent     = "serviceAccount:service-${data.google_project.this.number}@container-engine-robot.iam.gserviceaccount.com"
  compute_service_agent = "serviceAccount:service-${data.google_project.this.number}@compute-system.iam.gserviceaccount.com"
}

resource "google_kms_key_ring" "typesense" {
  project  = var.project_id
  name     = "typesense-${var.region}"
  location = var.region
}

# Encrypts Kubernetes Secrets at the application layer in etcd.
resource "google_kms_crypto_key" "etcd" {
  name            = "gke-etcd"
  key_ring        = google_kms_key_ring.typesense.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = var.kms_rotation_period
}

# Encrypts the GKE node boot disks.
resource "google_kms_crypto_key" "nodes" {
  name            = "gke-nodes"
  key_ring        = google_kms_key_ring.typesense.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = var.kms_rotation_period
}

# Encrypts the Typesense data persistent disks (referenced by the StorageClass).
resource "google_kms_crypto_key" "pd" {
  name            = "typesense-pd"
  key_ring        = google_kms_key_ring.typesense.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = var.kms_rotation_period
}

resource "google_kms_crypto_key_iam_member" "etcd" {
  crypto_key_id = google_kms_crypto_key.etcd.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = local.gke_service_agent
}

resource "google_kms_crypto_key_iam_member" "nodes" {
  crypto_key_id = google_kms_crypto_key.nodes.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = local.compute_service_agent
}

resource "google_kms_crypto_key_iam_member" "pd" {
  crypto_key_id = google_kms_crypto_key.pd.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = local.compute_service_agent
}

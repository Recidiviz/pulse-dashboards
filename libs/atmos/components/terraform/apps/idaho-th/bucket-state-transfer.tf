# One-time: drop the live PDF uploads bucket from apps/idaho-th state WITHOUT destroying it.
# Ownership moves to apps/malware-scanning (see existing-bucket-import.tf).
#
# PREREQUISITE — this branch assumes malware *.tf was NEVER applied under apps/idaho-th.
# Live state must still use the pre-malware addresses:
#   google_kms_key_handle.pdf_gcs_bucket
#   module.pdf_gcs_bucket (bucket suffix idaho-th-pdf-uploads)
# If state already has pdf_clean_gcs_bucket / pdf_unscanned_gcs_bucket / malware_scanner,
# STOP — this transfer is wrong; write a different transfer for every malware address.
#
# Canonical apply order (migration path): malware-scanning FIRST, then idaho-th.
# Import does not require prior relinquish; removed runs after malware owns the bucket.
# Generic onboarding: apps/malware-scanning/RUNBOOK.md
# Idaho TH deployment: apps/idaho-th/MALWARE_SCANNING.md

removed {
  from = google_kms_key_handle.pdf_gcs_bucket

  lifecycle {
    destroy = false
  }
}

removed {
  from = module.pdf_gcs_bucket

  lifecycle {
    destroy = false
  }
}

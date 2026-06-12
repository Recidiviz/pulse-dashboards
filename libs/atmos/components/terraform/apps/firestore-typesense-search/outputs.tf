output "instance_id" {
  description = "Firebase Extensions instance ID (used to address the extension via Firebase CLI / console)."
  value       = google_firebase_extensions_instance.search.instance_id
}

output "service_account_email" {
  description = "Auto-provisioned service agent for this extension instance. Already granted accessor on the typesense API key secret by the extensions service."
  value       = google_firebase_extensions_instance.search.service_account_email
}

output "etag" {
  description = "Server-assigned etag for the extension config — useful when reasoning about drift."
  value       = google_firebase_extensions_instance.search.etag
}

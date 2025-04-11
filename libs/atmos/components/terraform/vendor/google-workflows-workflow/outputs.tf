/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

output "workflow_id" {
  value       = google_workflows_workflow.workflow.id
  description = "Workflow identifier for the resource with format projects/{{project}}/locations/{{region}}/workflows/{{name}}"
}

output "workflow_revision_id" {
  value       = google_workflows_workflow.workflow.revision_id
  description = "The revision of the workflow. A new one is generated if the service account or source contents is changed."
}

output "workflow_region" {
  value       = google_workflows_workflow.workflow.region
  description = "The region of the workflow."
}

output "scheduler_job_id" {
  description = "Google Cloud scheduler job id"
  value       = local.enable_scheduler == 1 ? google_cloud_scheduler_job.workflow[0].id : null
}

output "event_arc_id" {
  description = "Google Event Arc id"
  value       = local.enable_eventarc == 1 ? google_eventarc_trigger.workflow[0].id : null
}

/**
 * Copyright 2022 Google LLC
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

locals {
  enable_eventarc       = var.workflow_trigger.event_arc == null ? 0 : 1
  enable_scheduler      = var.workflow_trigger.cloud_scheduler == null ? 0 : 1
  service_account_email = var.service_account_email # RECIDIVIZ MODIFICATION
  cloud_scheduler_args = (
    try(var.workflow_trigger.cloud_scheduler.argument, null) == null ?
    jsonencode({}) :
    var.workflow_trigger.cloud_scheduler.argument
  )
  pubsub = try(var.workflow_trigger.event_arc.pubsub_topic_id, null) == null ? [] : [{ "pubsub_topic_id" = var.workflow_trigger.event_arc.pubsub_topic_id }]
}

resource "google_eventarc_trigger" "workflow" {
  count           = local.enable_eventarc
  project         = var.project_id
  name            = var.workflow_trigger.event_arc.name
  location        = var.region
  service_account = var.workflow_trigger.event_arc.service_account_email

  dynamic "matching_criteria" {
    for_each = var.workflow_trigger.event_arc.matching_criteria
    content {
      attribute = matching_criteria.value["attribute"]
      value     = matching_criteria.value["value"]
      operator  = matching_criteria.value["operator"]
    }
  }

  dynamic "transport" {
    for_each = local.pubsub
    content {
      dynamic "pubsub" {
        for_each = local.pubsub
        content {
          topic = pubsub.value["pubsub_topic_id"]
        }
      }
    }

  }

  destination {
    workflow = google_workflows_workflow.workflow.id
  }
}

resource "google_cloud_scheduler_job" "workflow" {
  count            = local.enable_scheduler
  project          = var.project_id
  name             = var.workflow_trigger.cloud_scheduler.name
  description      = "Cloud Scheduler for Workflow Job" # RECIDIVIZ MODIFICATION
  schedule         = var.workflow_trigger.cloud_scheduler.cron
  time_zone        = var.workflow_trigger.cloud_scheduler.time_zone
  attempt_deadline = var.workflow_trigger.cloud_scheduler.deadline
  region           = var.region

  http_target {
    http_method = "POST"
    uri         = "https://workflowexecutions.googleapis.com/v1/${google_workflows_workflow.workflow.id}/executions"
    body = base64encode(
      jsonencode({
        "argument" : local.cloud_scheduler_args,
        "callLogLevel" : "CALL_LOG_LEVEL_UNSPECIFIED"
        }
    ))

    oauth_token {
      service_account_email = var.workflow_trigger.cloud_scheduler.service_account_email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }

}

# RECIDIVIZ MODIFICATION: Deleted random_string and service_account resource

resource "google_workflows_workflow" "workflow" {
  name            = var.workflow_name
  region          = var.region
  description     = var.workflow_description
  service_account = local.service_account_email
  project         = var.project_id
  labels          = var.workflow_labels
  source_contents = var.workflow_source
  # RECIDIVIZ MODIFICATIONS
  user_env_vars           = var.env_vars
  call_log_level          = "LOG_ALL_CALLS"
  execution_history_level = "EXECUTION_HISTORY_DETAILED"
}

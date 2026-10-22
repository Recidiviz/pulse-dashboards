# Terraform Module: Vertex AI cache config

This Terraform module turns off Vertex AI's caching of Gemini prompts for a whole project. With caching on, Vertex AI
can keep a prompt in memory for up to 24 hours to answer repeated prompts faster; with it off, Vertex AI keeps no
copy of the prompt after the request.

The setting is a single value per project, so the module has one resource and no outputs. The provider cannot delete
the setting: removing the module from a stack only drops it from the Terraform state and leaves caching off.

## Requirements

- **Terraform Version**: Requires Terraform 1.11.4+
- **Google Provider**: Uses the `google` provider, version 7.6.0 or later, which added `google_vertex_ai_cache_config`

## Inputs

| Name         | Type     | Description                                    | Required | Default |
| ------------ | -------- | ---------------------------------------------- | -------- | ------- |
| `project_id` | `string` | The GCP project ID to turn off caching in      | Yes      | -       |
| `region`     | `string` | The GCP region used for the Vertex AI endpoint | Yes      | -       |

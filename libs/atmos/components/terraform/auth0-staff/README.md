# Terraform module: Auth0-Staff

This Terraform module manages our Auth0 settings and environments for the `staff` app.

## Input Variables

| Name                 | Description                                        | Type   | Default | Required |
| -------------------- | -------------------------------------------------- | ------ | ------- | -------- |
| `deploy_environment` | Environment being deployed to (staging/production) | string |         | Yes      |

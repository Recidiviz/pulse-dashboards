# Terraform Module: BigQuery Data Transfer from PostgreSQL

This Terraform module sets up and automates the transfer of data from PostgreSQL databases into Google BigQuery datasets. It supports configuring access controls, creating necessary BigQuery datasets, and data transfer configurations for scheduled imports.

## Features

- Automatically creates BigQuery datasets for specified PostgreSQL databases.
- Configures IAM permissions for GCP Service Accounts.
- Sets up network attachment for secure PostgreSQL-to-BigQuery data transfer.
- Supports seamless transfer of specific PostgreSQL tables into BigQuery with a customizable schedule.

## Requirements

- **Terraform Version**: This module requires Terraform 1.0+ (or compatible OpenTofu version).
- **Google Provider**: Implemented using the `google` provider, which must be configured for authentication to access Google Cloud resources.
- **Service Account**: A valid GCP Service Account with the necessary permissions for data transfers is required.

## Inputs

This module uses the following input variables:

| Name                    | Type          | Description                                                                          | Required |
|-------------------------|---------------|--------------------------------------------------------------------------------------|----------|
| `project_id`            | `string`      | The GCP project ID where the resources will be created.                              | Yes      |
| `location`              | `string`      | The GCP location for the BigQuery datasets and data transfers (e.g., `us-central1`). | Yes      |
| `dataset_name`          | `string`      | The prefix name for the BigQuery datasets created for the PostgreSQL database transfers. | Yes      |
| `service_account_email` | `string`    | The email of the service account that manages data transfers.                        | Yes      |
| `postgresql`            | `object`      | An object containing PostgreSQL connection details (host, port, credentials, databases). | Yes      |
| `tables`                | `list(string)`| A list of table names to be transferred from PostgreSQL into BigQuery.               | Yes      |

Refer to the `variables.tf` file for detailed type definitions and descriptions.

## Outputs

This module does not currently export any outputs. You can extend the module to output resources such as created BigQuery dataset IDs or transfer configurations if needed.

## How It Works

1. **IAM Permissions**: Configures the specified service account to act as a Token Creator for data transfers.
2. **BigQuery Dataset Creation**: Creates a BigQuery dataset for every specified PostgreSQL database.
3. **Network Attachment**: Configures secure attachment for PostgreSQL-to-BigQuery data flow.
4. **Transfer Configuration**: Sets up a `google_bigquery_data_transfer_config` resource to define data transfer schedules and asset mappings. It supports transferring specific tables from PostgreSQL to BigQuery with endpoints, authentication, and scheduling fully configured.

## Notes

- The `google_bigquery_data_transfer_config` resource uses the `postgresql` connector, which has certain requirements/limitations. Ensure the service account has the necessary permissions and database access.
- The module requires all listed `tables` to exist across the specified PostgreSQL databases; otherwise, error handling is your responsibility.
- The `connector.networkAttachment` parameter in the transfer configuration is automatically generated using `google_compute_network_attachment`.

## Limitations

- The module assumes all tables listed in the `tables` input variable are present in each PostgreSQL database.
- Network configuration assumes a "default" subnetwork in the GCP project. Adjustments may be required for custom subnetworks.

## Resources Created

This module will create the following Google Cloud resources:

1. `google_project_iam_member`: Grants IAM permissions to the service account.
2. `google_bigquery_dataset`: Creates BigQuery datasets for each PostgreSQL database.
3. `random_id`: Generates a unique attachment name for the transfer network.
4. `google_compute_network_attachment`: Sets up a network attachment for secure PostgreSQL connections.
5. `google_bigquery_data_transfer_config`: Configures the PostgreSQL-to-BigQuery data transfer settings.

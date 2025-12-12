# Terraform Module: BigQuery Data Transfer from PostgreSQL

This Terraform module sets up and automates the transfer of data from PostgreSQL databases into Google BigQuery datasets. It supports same-project and cross-project transfers, configurable scheduling, and manages access controls automatically.

## Features

- Automatically creates BigQuery datasets for specified PostgreSQL databases
- Configures IAM permissions for GCP Service Accounts
- Sets up network attachment for secure PostgreSQL-to-BigQuery data transfer
- Supports cross-project BigQuery dataset transfers
- Configurable transfer schedules with automatic time calculations
- Three-stage transfer pipeline: PostgreSQL → Regional BigQuery → US BigQuery → (Optional) Destination Project

## Requirements

- **Terraform Version**: This module requires Terraform 1.11.4+
- **Google Provider**: Implemented using the `google` provider version < 7.0.0
- **Service Account**: A valid GCP Service Account with the necessary permissions for data transfers is required
- **Cross-Project**: When using cross-project transfers, a destination service account is required

## Inputs

This module uses the following input variables:

| Name                                | Type          | Description                                                                          | Required | Default   |
|-------------------------------------|---------------|--------------------------------------------------------------------------------------|----------|-----------|
| `project_id`                        | `string`      | The GCP project ID where BigQuery datasets should be created (configured by Atmos)   | Yes      | -         |
| `location`                          | `string`      | The GCP location for the BigQuery datasets and data transfers (e.g., `us-central1`)  | Yes      | -         |
| `dataset_name`                      | `string`      | The prefix name for the BigQuery datasets created for the PostgreSQL database transfers | Yes      | -         |
| `service_account_email`             | `string`      | The email of the service account that manages data transfers in the source project    | Yes      | -         |
| `postgresql`                        | `object`      | An object containing PostgreSQL connection details (host, port, credentials, databases) | Yes      | -         |
| `tables`                            | `list(string)`| A list of table names to be transferred from PostgreSQL into BigQuery                 | Yes      | -         |
| `destination_project_id`            | `string`      | Optional destination project ID for cross-project BigQuery dataset copy               | No       | `null`    |
| `destination_service_account_email` | `string`      | Service account email for cross-project transfers (required when destination_project_id is set) | No       | `null`    |
| `transfer_start_time`               | `string`      | Start time for the initial PostgreSQL→BigQuery transfer in HH:MM format              | No       | `"09:00"` |
| `transfer_delay_minutes`            | `number`      | Minutes to wait between each subsequent transfer stage                                | No       | `30`      |

Refer to the `variables.tf` file for detailed type definitions and descriptions.

## Outputs

This module does not currently export any outputs. You can extend the module to output resources such as created BigQuery dataset IDs or transfer configurations if needed.

## How It Works

### Same-Project Transfer (Default)

When `destination_project_id` is not set, all resources are created in a single project:

1. **IAM Permissions**: Configures the specified service account to act as a Token Creator for data transfers
2. **BigQuery Dataset Creation**: Creates regional and US BigQuery datasets for every specified PostgreSQL database
3. **Network Attachment**: Configures secure attachment for PostgreSQL-to-BigQuery data flow
4. **Three-Stage Transfer**:
   - **Stage 1** (default: 9:00 AM): PostgreSQL → Regional BigQuery dataset
   - **Stage 2** (default: 9:30 AM): Regional BigQuery → US BigQuery dataset
   - All times configurable via `transfer_start_time` and `transfer_delay_minutes`

### Cross-Project Transfer

When `destination_project_id` is set, an additional transfer stage is created:

1. **Source Project** (`project_id`):
   - PostgreSQL → Regional BigQuery dataset
   - Regional BigQuery → US BigQuery dataset
   - IAM binding grants destination service account read access to US datasets

2. **Destination Project** (`destination_project_id`):
   - Creates BigQuery datasets
   - **Stage 3** (default: 10:00 AM): Source US BigQuery → Destination US BigQuery
   - Uses `destination_service_account_email` to run the transfer

**Requirements for Cross-Project**:
- Both `destination_project_id` and `destination_service_account_email` must be set
- Destination service account is automatically granted `roles/bigquery.dataEditor` on source datasets
- No VPC peering or Private Service Connect required - uses native BigQuery cross-project copy

## Example Configurations

### Same-Project Setup

```yaml
postgres-bq-data-transfer:
  vars:
    dataset_name: my_database
    tables:
      - users
      - orders
      - products
    service_account_email: "123456789-compute@developer.gserviceaccount.com"
    postgresql:
      host: 10.128.0.5
      port: 5432
      username: postgres
      password: !secret db_password
      databases:
        - production
        - staging
```

### Cross-Project Setup

```yaml
postgres-bq-data-transfer:
  vars:
    dataset_name: my_database
    destination_project_id: destination-project-id
    destination_service_account_email: "987654321-compute@developer.gserviceaccount.com"
    tables:
      - users
      - orders
      - products
    service_account_email: "123456789-compute@developer.gserviceaccount.com"
    postgresql:
      host: 10.128.0.5
      port: 5432
      username: postgres
      password: !secret db_password
      databases:
        - production
        - staging
```

### Custom Scheduling

```yaml
postgres-bq-data-transfer:
  vars:
    dataset_name: my_database
    transfer_start_time: "02:00"  # Start at 2:00 AM
    transfer_delay_minutes: 60    # 1 hour between stages
    # Stage 1: 2:00 AM, Stage 2: 3:00 AM, Stage 3: 4:00 AM
    # ... other config
```

## Resources Created

This module creates the following Google Cloud resources:

### Always Created (Source Project)

1. `google_project_iam_member.permissions`: Grants `roles/iam.serviceAccountTokenCreator` to service account
2. `google_project_iam_member.job_user`: Grants `roles/bigquery.jobUser` to service account
3. `google_bigquery_dataset.regional_transfer_dataset`: Regional BigQuery datasets (one per database)
4. `google_bigquery_dataset.transfer_dataset`: US BigQuery datasets (one per database)
5. `google_bigquery_dataset_iam_member.regional_transfer_dataset_access`: IAM for regional datasets
6. `google_bigquery_dataset_iam_member.transfer_dataset_access`: IAM for US datasets
7. `random_id.attachment`: Generates unique attachment name
8. `google_compute_network_attachment.transfer_attachment`: Network attachment for BigQuery Transfer Service
9. `google_bigquery_data_transfer_config.postgres_transfer_config`: PostgreSQL → Regional BigQuery transfer
10. `google_bigquery_data_transfer_config.transfer_config`: Regional → US BigQuery transfer

### Cross-Project Resources (when `destination_project_id` is set)

11. `google_bigquery_dataset_iam_member.source_dataset_access`: Grants destination SA read access to source datasets
12. `google_bigquery_dataset.destination_transfer_dataset`: BigQuery datasets in destination project (one per database)
13. `google_bigquery_data_transfer_config.cross_project_transfer_config`: Source → Destination BigQuery transfer

## Notes

- The `google_bigquery_data_transfer_config` resource uses the `postgresql` connector, which has certain requirements/limitations
- The module assumes all listed `tables` exist across the specified PostgreSQL databases
- Network configuration assumes a "default" subnetwork in the GCP project
- Cross-project transfers use native BigQuery cross-region copy - no PSC or VPC peering needed
- Org policy `iam.disableCrossProjectServiceAccountUsage` is respected by using separate service accounts per project

## Limitations

- The module assumes all tables listed in the `tables` input variable are present in each PostgreSQL database
- Network configuration assumes a "default" subnetwork in the GCP project
- Cross-project transfers require `destination_service_account_email` to be specified
- Schedule times use 24-hour format (HH:MM)

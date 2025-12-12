# Terraform Module: Cloud SQL Proxy in GKE (Google Kubernetes Engine)

This Terraform module sets up a Cloud SQL Proxy on a Google Kubernetes Engine (GKE) cluster. The proxy allows secure,
private connectivity between your Kubernetes-based workloads and one or more Cloud SQL databases, using internal IPs.

## Features

- **GKE Cluster**: Deploys a GKE cluster with an internal load balancer to host the Cloud SQL Proxy
- **Cloud SQL Proxy**: Configures the Cloud SQL Proxy as a Kubernetes Deployment, exposing endpoints for multiple Cloud SQL instances
- **IAM and Service Account**: Creates a service account with the necessary permissions to connect to the specified Cloud SQL instances
- **Internal Load Balancer**: Configures the proxy with an internal load balancer for secure, private connectivity
- **Dynamic Port Exposure**: Automatically maps and exposes specific ports for each Cloud SQL instance connection

## Requirements

- **Terraform Version**: Requires Terraform 1.11.4+
- **Google Provider**: Uses the `google` and `google-beta` providers (version ~> 6.0)
- **Kubernetes Provider**: Uses the `kubernetes` provider (version ~> 2.0) for managing Kubernetes resources on the GKE cluster
- **SOPS Provider**: Uses the `sops` provider (version ~> 0.5) for managing encrypted service account credentials

## Inputs

The module accepts the following inputs:

| Name                       | Type          | Description                                                                                                       | Required | Default |
|----------------------------|---------------|-------------------------------------------------------------------------------------------------------------------|----------|---------|
| `project_id`               | `string`      | The GCP project ID where the resources will be deployed                                                           | Yes      | -       |
| `region`                   | `string`      | The GCP region for the GKE cluster and Cloud SQL connections                                                      | Yes      | -       |
| `sql_instance_connections` | `map(number)` | A map of SQL instance connection names (formatted as `project:region:instance`) mapped to their respective ports | Yes      | -       |

Refer to `variables.tf` for exact type definitions and descriptions.

## Outputs

The module provides the following outputs:

| Name                 | Description                                                      |
|----------------------|------------------------------------------------------------------|
| `cluster_name`       | The name of the GKE cluster created by the module                |
| `cloud_sql_proxy_ip` | The internal IP address of the Cloud SQL Proxy LoadBalancer     |
| `ports`              | A map of the configured SQL instance connections and their ports |

These outputs can be referenced and used in your Terraform configuration or by other modules.

## How It Works

1. **Create GKE Cluster**: A GKE cluster named `cloud-sql-proxy` is created in the specified region
2. **IAM and Service Account**: A service account is created with the `roles/cloudsql.client` IAM role to authenticate with Cloud SQL
3. **Cloud SQL Proxy Deployment**: A Kubernetes Deployment is created on the GKE cluster to run the Cloud SQL Proxy container
    - The proxy is configured to connect to specified Cloud SQL instances using private IPs (`--private-ip` flag)
    - Ports for each SQL instance are dynamically exposed
    - Service account credentials are mounted via Kubernetes secrets (encrypted with SOPS)
4. **Internal Load Balancer**: A Kubernetes Service is created with an internal load balancer to facilitate secure communication with the proxy
5. **Dynamic Port Configuration**: Ports are automatically assigned and exposed based on the SQL instance connection map provided in the `sql_instance_connections` variable

## Example Configuration

```yaml
cloud-sql-proxy:
  vars:
    project_id: my-project
    region: us-central1
    sql_instance_connections:
      my-database-instance: 5432
      another-db: 3306
```

This will create:
- GKE cluster in `us-central1`
- Cloud SQL Proxy deployment connecting to both instances
- Internal load balancer exposing ports 5432 and 3306
- Output: `cloud_sql_proxy_ip` for connecting to the proxy

## Notes

- **Service Account Authentication**: The module relies on a GCP service account with the necessary `roles/cloudsql.client` IAM role. Kubernetes secrets are used to mount the credentials within the Cloud SQL Proxy container
- **Internal Load Balancer**: An internal IP is assigned to the proxy for private communication within your GCP Virtual Private Cloud (VPC)
- **Dynamic Port Mapping**: The module automatically maps and exposes unique ports for each Cloud SQL instance specified in the `sql_instance_connections` variable
- **Private IP Connectivity**: The proxy uses the `--private-ip` flag to connect to Cloud SQL instances via their private IP addresses
- **Encrypted Credentials**: Service account private keys are stored encrypted using SOPS in `./secrets/${var.project_id}.enc.yaml`

## Limitations

- **Default Network**: The module assumes the use of the "default" network and subnetwork in GCP. Modify the configuration if you use a custom network setup
- **Static Initial Node Pool**: The GKE cluster is deployed with a single node pool with `e2-medium` machine types. Adjust the node pool configuration if necessary
- **Region-Specific Resources**: All resources (GKE, Cloud SQL instances, and internal load balancer) must be within the same GCP region
- **SOPS Encryption**: Service account credentials must be encrypted with SOPS and stored in `./secrets/${var.project_id}.enc.yaml`

## Resources Created

This module creates the following resources:

### GKE Cluster
- `google_container_cluster.primary`: GKE cluster with L4 ILB subsetting enabled
- `google_container_node_pool.primary_nodes`: Node pool with private nodes (`e2-medium` machines)

### Cloud SQL Proxy
- `kubernetes_deployment.cloud_sql_proxy`: Deployment running the Cloud SQL Proxy container (version 2.15.3)
- `kubernetes_service.cloud_sql_proxy_service`: LoadBalancer service with internal IP
- `kubernetes_secret.service_account_token`: Kubernetes secret containing service account credentials

### IAM and Service Account
- `google_service_account.proxy_agent`: Service account for Cloud SQL Proxy authentication
- `google_project_iam_member.proxy_client`: IAM binding granting `roles/cloudsql.client` to the service account

### Networking
- `google_compute_address.internal_sql_proxy_ip`: Reserved internal IP address for the load balancer

### Data Sources
- `data.google_client_config.default`: Used for Kubernetes provider authentication
- `data.sops_file.agent_private_key`: Reads encrypted service account credentials

## Proxy Agent Service Account Setup

The module requires a service account private key to be encrypted with SOPS and stored at `./secrets/${var.project_id}.enc.yaml`.

### Creating and Encrypting the Service Account Key

1. **Provision the agent service account**
   ```bash
   atmos terraform plan  cloud-sql-proxy -s STACK -- -target=google_service_account.proxy_agent -out agent.planfile
   atmos terraform apply cloud-sql-proxy -s STACK -- agent.planfile
   rm components/terraform/cloud-sql-proxy/agent.planfile
   ```

1. **Create a service account key** (this is done automatically by the module, but you need the private key):
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=cloud-sql-proxy-agent@${PROJECT_ID}.iam.gserviceaccount.com
   ```

2**Create the secrets file**:
   ```bash
   PROJECT_ID="YOUR_PROJECT_ID"
   cd libs/atmos/components/terraform/cloud-sql-proxy
   mkdir -p secrets

   # Create the unencrypted YAML with the service account key
   cat > secrets/${PROJECT_ID}.yaml <<EOF
   agent_private_key: |
   $(cat key.json | sed 's/^/  /')
   EOF

   # Encrypt it with SOPS
   sops --filename-override secrets/${PROJECT_ID.enc.yaml -e secrets/${PROJECT_ID.yaml > secrets/${PROJECT_ID.enc.yaml
  
   # Remove unencrypted files
   rm secrets/${PROJECT_ID}.yaml key.json
   ```

3**Verify the encrypted file**:
   ```bash
   sops secrets/${PROJECT_ID}.enc.yaml
   ```

### Service Account Permissions

The `cloud-sql-proxy-agent` service account created by this module needs:

- **Automatically granted by module**: `roles/cloudsql.client` - to connect to Cloud SQL instances

No additional manual permissions are required for the proxy service account.

## Security Considerations

- Service account credentials are encrypted at rest using SOPS with GCP KMS
- Cloud SQL Proxy runs with `allow_privilege_escalation: false` and `run_as_non_root: true` security contexts
- All connectivity is private - no public IPs are exposed
- Only the minimum required IAM permissions (`roles/cloudsql.client`) are granted to the proxy service account
- The service account private key never appears in Terraform state in plaintext

# Terraform Module: Cloud SQL Proxy in GKE (Google Kubernetes Engine)

This Terraform module sets up a Cloud SQL Proxy on a Google Kubernetes Engine (GKE) cluster. The proxy allows secure,
private connectivity between your Kubernetes-based workloads and one or more Cloud SQL databases, using internal IPs.

## Features

- **GKE Cluster**: Deploys a GKE cluster with an internal load balancer to host the Cloud SQL Proxy.
- **Cloud SQL Proxy**: Configures the Cloud SQL Proxy as a Kubernetes Deployment, exposing endpoints for multiple Cloud
  SQL instances.
- **IAM and Service Account**: Creates a service account with the necessary permissions to connect to the specified
  Cloud SQL instances.
- **Internal Load Balancer**: Configures the proxy with an internal load balancer for secure, private connectivity.
- **Dynamic Port Exposure**: Automatically maps and exposes specific ports for each Cloud SQL instance connection.

## Requirements

- **Terraform Version**: Requires Terraform 1.0+ (or compatible OpenTofu version).
- **Google Provider**: Uses the `google` and `google-beta` providers for managing GCP resources.
- **Kubernetes Provider**: Uses the `kubernetes` provider for managing Kubernetes resources on the GKE cluster.

## Inputs

The module accepts the following inputs:

| Name                       | Type          | Description                                                                                                       | Required |
|----------------------------|---------------|-------------------------------------------------------------------------------------------------------------------|----------|
| `project_id`               | `string`      | The GCP project ID where the resources will be deployed.                                                          | Yes      |
| `region`                   | `string`      | The GCP region for the GKE cluster and Cloud SQL connections.                                                     | Yes      |
| `sql_instance_connections` | `map(number)` | A map of SQL instance connection names (formatted as `project:region:instance`) mapped to their respective ports. | Yes      |

Refer to `variables.tf` for exact type definitions and descriptions.

## Outputs

The module provides the following outputs:

| Name                 | Description                                                                  |
|----------------------|------------------------------------------------------------------------------|
| `cluster_name`       | The name of the GKE cluster created by the module.                           |
| `cloud_sql_proxy_ip` | The internal IP address of the Cloud SQL Proxy LoadBalancer.                 |
| `ports`              | A map of the configured SQL instance connections and their respective ports. |

These outputs can be referenced and used in your Terraform configuration.

## How It Works

1. **Create GKE Cluster**: A GKE cluster named `cloud-sql-proxy` is created in the specified region.
2. **IAM and Service Account**: A service account is created with the `roles/cloudsql.client` IAM role to authenticate
   with Cloud SQL.
3. **Cloud SQL Proxy Deployment**: A Kubernetes Deployment is created on the GKE cluster to run the Cloud SQL Proxy
   container.
    - The proxy is configured to connect to specified Cloud SQL instances using internal IPs.
    - Ports for each SQL instance are dynamically exposed.
4. **Internal Load Balancer**: A Kubernetes Service is created with an internal load balancer to facilitate secure
   communication with the proxy.
5. **Dynamic Port Configuration**: Ports are automatically assigned and exposed based on the SQL instance connection map
   provided in the `sql_instance_connections` variable.

## Notes

- **Service Account Authentication**: The module relies on a GCP service account with the necessary
  `roles/cloudsql.client` IAM role. Kubernetes secrets are used to mount the credentials within the Cloud SQL Proxy
  container.
- **Internal Load Balancer**: An internal IP is assigned to the proxy for private communication within your GCP Virtual
  Private Cloud (VPC).
- **Dynamic Port Mapping**: The module automatically maps and exposes unique ports for each Cloud SQL instance specified
  in the `sql_instance_connections` variable.

## Limitations

- **Default Network**: The module assumes the use of the "default" network and subnetwork in GCP. Modify the
  configuration if you use a custom network setup.
- **Static Initial Node Pool**: The GKE cluster is deployed with a single node pool with `e2-medium` machine types.
  Adjust the node pool configuration if necessary.
- **Region-Specific Resources**: All resources (GKE, Cloud SQL instances, and internal load balancer) must be within the
  same GCP region.

## Resources Created

This module creates the following resources:

- **GKE Cluster**:
    - `google_container_cluster`
    - `google_container_node_pool`
- **Cloud SQL Proxy**:
    - `kubernetes_deployment`: For the Cloud SQL Proxy container.
    - `kubernetes_service`: For the internal load balancer.
- **IAM and Service Account**:
    - `google_service_account`
    - `google_project_iam_member`
- **Networking**:
    - `google_compute_address`: Internal IP for the Cloud SQL Proxy load balancer.

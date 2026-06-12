# Namespace for the Typesense workload itself.
resource "kubernetes_namespace" "typesense" {
  count = local.workload_count
  metadata {
    name = local.typesense_namespace
  }
}

# Namespace for the operator (TyKO).
resource "kubernetes_namespace" "operator" {
  count = local.workload_count
  metadata {
    name = local.operator_namespace
  }
}

# Install the Typesense Kubernetes Operator (TyKO). The chart installs the
# TypesenseCluster CRD that typesense.tf's kubectl_manifest then creates.
resource "helm_release" "typesense_operator" {
  count            = local.workload_count
  name             = "typesense-operator"
  namespace        = kubernetes_namespace.operator[0].metadata[0].name
  repository       = "https://akyriako.github.io/typesense-operator/"
  chart            = "typesense-operator"
  version          = var.operator_chart_version
  create_namespace = false

  # The cluster + at least one node must be ready before scheduling the operator.
  depends_on = [
    google_container_node_pool.primary_nodes,
  ]
}

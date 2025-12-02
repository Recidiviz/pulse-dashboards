plugin "terraform" {
  enabled = true
  version = "0.9.0"
  source  = "github.com/terraform-linters/tflint-ruleset-terraform"
}

plugin "google" {
  enabled = true
  version = "0.37.1"
  source  = "github.com/terraform-linters/tflint-ruleset-google"

}

# Atmos handles configuring required providers, ignore this lint rule
rule "terraform_required_providers" {
  enabled = false
}

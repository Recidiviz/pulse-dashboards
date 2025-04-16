# `secrets`

This Terraform module manages direct mappings of YAML keys to Secret Manager secrets
The secrets are encrypted via `sops` (`brew install sops`).

## Modifying the environment values

**Prerequisite:** modifying encrypted secrets may require elevated
permissions. [go/join-on-call](https://go/join-on-call) for the relevant project

```bash
sops edit ./sops/recidiviz-jii-staging.enc.yaml
```

Alternatively, you can use the following plugins to edit inside your IDE:

* PyCharm: [Simple Sops Edit](https://plugins.jetbrains.com/plugin/21317-simple-sops-edit)
* VSCode: [signageos/vscode-sops](https://marketplace.visualstudio.com/items?itemName=signageos.signageos-vscode-sops)
    * **Be sure to clear any `.decrypted` files after use!**

Once modified, plan / apply the Terraform component, for example:

```bash
yarn atmos:apply secrets -s recidiviz-jii-staging--jii
```

## Input Variables

| Name                        | Description                                                                                           | Type          | Default  | Required |
|-----------------------------|-------------------------------------------------------------------------------------------------------|---------------|----------|:--------:|
| `project_id`                | Project to provision the secrets to                                                                   | `string`      |          |   yes    |
| `sops_file`                 | Path to SOPS file, relative to this component, to use for secrets                                     | `string`      |          |   yes    |
| `location`                  | Default location to store the secret                                                                  | `string`      |          |   yes    |
| `deletion_policy`           | Default deletion policy                                                                               | `string`      | `DELETE` |    no    |
| `replication_overrides`     | Map of secret names to replication overrides for the secret (can set to auto or a different location) | `map(string)` | `{}`     |    no    |
| `deletion_policy_overrides` | Map of secret names to deletion policy overrides for the secret                                       | `map(string)` | `{}`     |    no    |

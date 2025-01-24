# `env-secrets`
This Terraform module manages all `env_` secrets that we use.
The secrets are encrypted via `sops` (`brew install sops`).

## Modifying the environment values
**Prerequisite:** modifying encrypted secrets requires elevated permissions. [go/join-on-call](https://go/join-on-call) for the staging project 

```bash
sops edit ./env-secrets.env.yaml
```

Alternatively, you can use the following plugins to edit inside your IDE:
* VSCode: [signageos/vscode-sops](https://marketplace.visualstudio.com/items?itemName=signageos.signageos-vscode-sops)
* PyCharm: [Simple Sops Edit](https://plugins.jetbrains.com/plugin/21317-simple-sops-edit)

Once modified, plan / apply the Terraform component:
```bash
nx run atmos:cli terraform apply env-secrets -s recidiviz-dashboard-staging--shared-infra
```

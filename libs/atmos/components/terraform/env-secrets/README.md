# `env-secrets`
This Terraform module manages all `env_` secrets that we use.
The secrets are encrypted via `sops` (`brew install sops`).

## Modifying the environment values
**Prerequisite:** modifying encrypted secrets requires elevated permissions. [go/join-on-call](https://go/join-on-call) for the staging project 

```bash
sops edit ./env-secrets.enc.yaml
```

Alternatively, you can use the following plugins to edit inside your IDE:
* VSCode: [signageos/vscode-sops](https://marketplace.visualstudio.com/items?itemName=signageos.signageos-vscode-sops)
* PyCharm: [Simple Sops Edit](https://plugins.jetbrains.com/plugin/21317-simple-sops-edit)
      * **Be sure to clear any `.decrypted` files after use!**
Once modified, plan / apply the Terraform component:
```bash
yarn atmos:apply env-secrets -s recidiviz-dashboard-staging--shared-infra
```

# terraform-cloud-outputs-action

## Overview

A GitHub Action step that fetches outputs from a Terraform Cloud workspace.

### Inputs

- `token` (**Required**): The token of the TFC/E instance which holds the workspace that manages your tflocal instance.
- `organization` (**Required**): The TFC/E organization that manages the specified workspace.
- `workspace` (**Required**): The name of the TFC/E workspace that manages the tflocal configuration.
- `hostname` (**Optional**): The hostname of the TFC/E instance which holds the workspace that manages your tflocal instance. Defaults to `app.terraform.io`.

### Outputs

- `workspace-outputs-json`: A JSON-stringified object containing the outputs fetched from the specified Terraform Cloud workspace. Output names will match those found in your workspace. Sensitive output values will be redacted from runner logs.

**Example Output Value**

`'{"example-list":["list", "of", "strings"],"aws_access_key_id":"ABCD1234","aws_secret_access_key":"ZYXW00+ABCD1234"}'`

You will need to use `fromJSON()` to parse `workspace-outputs-json` in your workflow. [Read more about fromJSON()](https://docs.github.com/en/actions/learn-github-actions/expressions#fromjson)

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ fromJSON(steps.terraform-cloud-run.outputs.workspace-outputs).aws_access_key_id }}
  AWS_SECRET_ACCESS_KEY: ${{ fromJSON(steps.terraform-cloud-run.outputs.workspace-outputs).aws_secret_access_key }}
```

Workspace outputs that are marked as sensitive will be set as secret and redacted in the workflow.

## Examples

```yaml
name: Nightly Test
on:
  workflow_dispatch:
  schedule:
    - cron: 0 0 * * *

jobs:
  instance:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Fetch infra secrets
        id: fetch
        uses: brandonc/terraform-cloud-outputs-action@v1
        with:
          token: ${{ secrets.TFC_TOKEN }}
          organization: "example-org"
          workspace: "my-tflocal-workspace"
      - name: Tests
        run: go test ./...
        env:
          SOME_FOO: ${{ fromJSON(steps.fetch.outputs.workspace-outputs-json).foo }}
          SOME_BAR: ${{ fromJSON(steps.fetch.outputs.workspace-outputs-json).bar }}
```

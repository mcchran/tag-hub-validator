# inspect-tag-in-hub GitHub Action

## Description

The `inspect-tag-in-hub` GitHub Action is a workflow automation tool that scans a Helm repository for Docker tags and checks if they exist in a Docker Hub registry. This action can help you keep your Helm charts up to date with the latest Docker images.

## Inputs

### `hub-username` (required)

The username to use for the Docker Hub registry.

### `hub-password` (required)

The password to use for the Docker Hub registry.

### `target-path` (optional)

The path to the Helm repository to scan. By default, it is set to the root directory of the repository.

### `github-token` (required)

The token to use for authentication with GitHub. This is necessary for making comments in GitHub issues or pull requests.
The outputs of the action scan are going to be listed under an issue comment in the related PR.


## Usage

To use this action in your GitHub workflow, you can include it as a step in your workflow YAML file. Here's an example of how to use it:

```yaml
name: Check Docker Image Tags
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  inspect-tag-in-hub:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Scan Helm repo and Check Docker Tags
        uses: mcchran/inspect-tag-in-hub@master
        with:
          hub-username: ${{ secrets.DOCKER_HUB_USERNAME }}
          hub-password: ${{ secrets.DOCKER_HUB_PASSWORD }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

Make sure to set the required secrets (DOCKER_HUB_USERNAME, DOCKER_HUB_PASSWORD, and GITHUB_TOKEN) in your GitHub repository secrets for secure authentication.

## License

This GitHub Action is licensed under the [MIT License](LICENSE.txt). See the [LICENSE.txt](LICENSE.txt) file in this repository for more details.


## Author

Created by Christos Andrikos

For any questions or issues, please [open an issue](../../issues/new).
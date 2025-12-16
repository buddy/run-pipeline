# Buddy Run Pipeline GitHub Action

Trigger and run Buddy CI/CD pipelines from GitHub Actions workflows.

## Features

- Run Buddy pipelines directly from GitHub Actions
- Wait for pipeline completion with configurable timeout
- Support for all pipeline parameters (branch, tag, revision, pull request)
- Pass variables and masked variables to pipeline executions
- Configure pipeline run options (priority, region, refresh, cache)
- Schedule pipeline runs for later execution
- Select specific actions within a pipeline to run

## Usage

### Basic Usage

```yaml
name: Deploy
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Buddy
        uses: buddy/login@v1
        with:
          token: ${{ secrets.BUDDY_TOKEN }}
          region: 'US'

      - name: Run pipeline
        uses: buddy/run-pipeline@v1
        with:
          workspace: my-workspace
          project: my-project
          identifier: deploy-prod
```

### Wait for Completion

```yaml
- name: Run pipeline and wait
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: deploy-prod
    wait: 10  # Wait up to 10 minutes for completion
```

### With Git References

```yaml
- name: Run pipeline on specific branch
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: build
    branch: develop
    comment: ${{ github.sha }}

- name: Run pipeline on tag
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: release
    tag: v1.0.0

- name: Run pipeline on pull request
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: test
    pull-request: ${{ github.event.pull_request.number }}
```

### With Advanced Options

```yaml
- name: Run with advanced options
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: deploy
    priority: HIGH          # LOW, NORMAL, or HIGH
    region: EU              # EU or US
    refresh: true           # Deploy from scratch
    clear-cache: true       # Clear cache before running
```

### With Variables

```yaml
- name: Run pipeline with variables
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: deploy
    variable: |
      ENV:production
      VERSION:${{ github.ref_name }}
      BUILD_NUMBER:${{ github.run_number }}
    variable-masked: |
      API_KEY:${{ secrets.API_KEY }}
      DB_PASSWORD:${{ secrets.DB_PASSWORD }}
```

### With Schedule and Action Selection

```yaml
- name: Schedule pipeline run
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: maintenance
    schedule: 30m  # Run in 30 minutes (supports: 30s, 10m, 3h10m30s, or ISO 8601)

- name: Run specific actions only
  uses: buddy/run-pipeline@v1
  with:
    workspace: my-workspace
    project: my-project
    identifier: test-suite
    action: |
      1717106
      1717107
```

## Inputs

| Input              | Required | Description                                                                                       |
| ------------------ | -------- |---------------------------------------------------------------------------------------------------|
| `workspace`        | Yes      | Buddy workspace domain                                                                            |
| `project`          | Yes      | Buddy project name (URL handle)                                                                   |
| `identifier`       | Yes      | Pipeline identifier (human-readable ID)                                                           |
| `comment`          | No       | Run comment (e.g., commit hash, build info)                                                       |
| `wait`             | No       | Wait for run to finish (minutes). If not provided, returns execution URL immediately              |
| `branch`           | No       | Repository branch name                                                                            |
| `tag`              | No       | Repository tag name                                                                               |
| `revision`         | No       | Repository revision (commit SHA)                                                                  |
| `pull-request`     | No       | Repository pull request ID                                                                        |
| `refresh`          | No       | Deploy from scratch (`true`/`false`)                                                              |
| `clear-cache`      | No       | Clear cache before running the pipeline (`true`/`false`)                                          |
| `priority`         | No       | Run priority: `LOW`, `NORMAL`, or `HIGH` (default: `NORMAL`)                                      |
| `region`           | No       | Override default region: `EU` or `US`                                                             |
| `variable`         | No       | Variables in `key:value` format (one per line or comma-separated)                                 |
| `variable-masked`  | No       | Masked variables in `key:value` format (one per line or comma-separated)                          |
| `schedule`         | No       | Schedule execution time (e.g., `2016-11-18T12:38:16.000Z` or `30s`, `10m`, `3h10m30s`)            |
| `action`           | No       | Action ID(s) to run (one per line or comma-separated). If not provided, runs all pipeline actions |
| `api_url`          | No       | Override API URL                                                                                  |

## Outputs

| Output     | Description                          |
| ---------- | ------------------------------------ |
| `run_url`  | The URL of the pipeline execution    |

## Environment Variables

The action exports the following environment variables for use in subsequent steps:

| Variable          | Description                          |
| ----------------- | ------------------------------------ |
| `BUDDY_RUN_URL`   | The URL of the pipeline execution    |

## Prerequisites

This action requires authentication with Buddy. Use the [`buddy/login`](https://github.com/buddy/login) action before running pipelines:

```yaml
- name: Login to Buddy
  uses: buddy/login@v1
  with:
    token: ${{ secrets.BUDDY_TOKEN }}
    region: 'US'
```

The login action sets the following environment variables that are used by this action:
- `BUDDY_TOKEN` - Authentication token
- `BUDDY_API_ENDPOINT` - API endpoint URL

### BDY CLI Installation

By default, this action automatically installs the latest BDY CLI from the production channel. If you need a specific version or channel, use the `buddy/setup` action first:

```yaml
# Install specific version
- name: Setup BDY CLI
  uses: buddy/setup@v1
  with:
    version: '1.12.8'

# OR

# Install from different channel
- name: Setup BDY CLI (dev channel)
  uses: buddy/setup@v1
  with:
    env: 'dev'

# OR

# Use different installation method (download, apt, npm)
- name: Setup BDY CLI (via NPM)
  uses: buddy/setup@v1
  with:
    installation_method: 'npm'
```

See the [`buddy/setup`](https://github.com/buddy/setup) action for more options.

## License

MIT - See [LICENSE.md](LICENSE.md) for details.

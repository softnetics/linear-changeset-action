# Linear Changeset Action <!-- omit in toc -->

TODO

# Table of Contents <!-- omit in toc -->

- [Usage](#usage)

# Usage

```yaml
jobs:
  ci:
    name: TypeScript Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Create Versioning Pull Request
        id: changesets
        uses: changesets/action@v1.4.9
        with:
          createGithubReleases: true

      - name: Store data in Linear Changeset Action
        uses: softnetics/linear-changeset-action@v1.0.0
        with:
          projectId: ${{ secrets.LINEAR_PROJECT_ID }}
          # Default value
          repository: ${{ github.repository }}
          token: ${{ github.token }}
          max-attempts: 3
          lc-server-url: 'https://linear-changeset-server.vercel.app'
```

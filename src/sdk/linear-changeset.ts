import * as core from '@actions/core'
import { array, type InferOutput, object, string } from 'valibot'

const LinearChangesetSdkReleaseIssuesBody = object({
  projectId: string(),
  apps: array(
    object({
      appName: string(),
      issues: array(
        object({
          version: string(),
          issueId: string(),
          url: string()
        })
      )
    })
  )
})

export type LinearChangesetSdkReleaseIssuesBody = InferOutput<
  typeof LinearChangesetSdkReleaseIssuesBody
>

type GetProjectVersionsResponse = {
  releases: {
    appName: string
    version: string
  }[]
}

export class LinearChangesetSdk {
  constructor(private readonly url: string) {}

  async releaseIssues(
    body: LinearChangesetSdkReleaseIssuesBody
  ): Promise<void> {
    core.info(`Sending release issues to ${this.url}/api/release/issues`)
    core.info(`Body: ${JSON.stringify(body)}`)

    await fetch(`${this.url}/api/release/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  async getProjectTags(projectId: string): Promise<string[]> {
    const url = new URL(`${this.url}/api/release/versions`)

    url.searchParams.append('projectId', projectId)

    core.info(`Fetching tags from ${url.toString()}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.status === 404) {
      core.info(`No tags found`)
      return []
    }

    const json = (await response.json()) as GetProjectVersionsResponse

    json.releases.forEach(r => {
      core.info(`Found tag: ${r.appName} ${r.version}`)
    })

    return json.releases.map(r => `${r.appName}@${r.version}`)
  }
}

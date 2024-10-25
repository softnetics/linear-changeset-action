import * as core from '@actions/core'
import { array, InferOutput, object, string } from 'valibot'

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

  async getTags(): Promise<string[]> {
    core.info(`Fetching tags from ${this.url}/api/release/tags`)

    const response = await fetch(`${this.url}/api/release/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const json = (await response.json()) as { tags: string[] }

    json.tags.forEach(tag => {
      core.info(`Found tag: ${tag}`)
    })

    return json.tags
  }
}

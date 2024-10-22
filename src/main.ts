import * as core from '@actions/core'
import PromisePool from '@supercharge/promise-pool'
import { Octokit } from 'octokit'
import { array, InferOutput, object, parse, string } from 'valibot'

const ReleaseTags = array(string())

const ReleaseIssuesBody = object({
  projectId: string(),
  apps: array(
    object({
      appName: string(),
      issues: array(
        object({
          version: string(),
          issueId: string(),
          rawText: string()
        })
      )
    })
  )
})
type ReleaseIssuesBody = InferOutput<typeof ReleaseIssuesBody>

function parseReleaseTags(string: string) {
  try {
    return parse(ReleaseTags, JSON.parse(string))
  } catch (error) {
    core.setFailed(`Failed to parse releases-tags`)
    throw error
  }
}

type ParsedIssue = {
  workspace: string
  issue: string
  title: string
  url: string
}

export function parseIssueFromReleaseBody(
  body: string | null | undefined
): ParsedIssue[] {
  if (!body) return []
  const IssueUrlPattern =
    /\(https:\/\/linear.app\/(?<workspace>\w+)\/issue\/(?<issue>.*)\/(?<title>.*)\)/g
  const matchedIssueUrls = body.match(IssueUrlPattern)
  if (!matchedIssueUrls) return []
  return matchedIssueUrls.map(url => {
    const IssueUrlPattern =
      /\(https:\/\/linear.app\/(?<workspace>\w+)\/issue\/(?<issue>.*)\/(?<title>.*)\)/g
    return {
      ...IssueUrlPattern.exec(url)?.groups,
      url
    }
  }) as any
}

export async function releaseMode(): Promise<void> {
  const releasesTags = core.getInput('release-tags', { trimWhitespace: true })
  core.debug(`Release tags: ${releasesTags}`)
  const parsedReleaseTags = parseReleaseTags(releasesTags)

  core.debug(`Parsed release tags: ${parsedReleaseTags}`)

  if (!parsedReleaseTags.length) {
    core.info('No releases to fetch')
    return
  }

  const octokit = new Octokit({ auth: core.getInput('token') })
  const { results, errors } = await PromisePool.withConcurrency(2)
    .for(parsedReleaseTags)
    .process(async tag => {
      const release = octokit.rest.repos.getReleaseByTag({
        owner: core.getInput('owner'),
        repo: core.getInput('repo').split('/')[1],
        tag
      })
      core.debug(`Fetched release: ${tag}`)
      return release
    })

  core.info(`Fetched releases: ${results.length}, errors: ${errors.length}`)

  if (errors.length) {
    core.setFailed(`Failed to fetch releases: ${errors.length}`)
    for (const error of errors) {
      core.error(error)
    }
    return
  }

  const releaseIssues: ReleaseIssuesBody['apps'] = []

  for (const {
    data: { body, tag_name }
  } of results) {
    if (!body) continue
    // TODO: Add support for poly repos
    const version = tag_name.split('@').at(-1)!
    const appName = tag_name.split('@').slice(0, -1).join('@')
    const issues = new Set<string>()
    const issuesMap = new Map<string, ParsedIssue>()
    const app: ReleaseIssuesBody['apps'][0] = {
      appName,
      issues: []
    }
    for (const issue of parseIssueFromReleaseBody(body)) {
      issues.add(issue.issue)
      issuesMap.set(issue.issue, issue)
    }
    app.issues = Array.from(issues).map(issueId => {
      const { url } = issuesMap.get(issueId)!
      return {
        issueId,
        version,
        rawText: url
      }
    })
    releaseIssues.push(app)
  }

  const releaseWebhookUrl = core.getInput('release-webhook-url')

  core.debug(`Sending webhook to: ${releaseWebhookUrl}`)
  const result = await fetch(releaseWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      projectId: core.getInput('project-id'),
      apps: releaseIssues
    })
  })

  if (result.status !== 200) {
    core.setFailed(`Failed to send webhook: ${result.statusText}`)
    return
  }

  core.info('Webhook sent successfully')
}

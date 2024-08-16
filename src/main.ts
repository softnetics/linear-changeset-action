import * as core from '@actions/core'
import PromisePool from '@supercharge/promise-pool'
import { Octokit } from 'octokit'
import { array, parse, string } from 'valibot'

const ReleaseTagsSchema = array(string())

function parseReleaseTags(string: string) {
  try {
    return parse(ReleaseTagsSchema, JSON.parse(string))
  } catch (error) {
    core.setFailed(`Failed to parse releases-tags`)
    throw error
  }
}

type ParsedIssue = {
  workspace: string
  issue: string
  title: string
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
    return IssueUrlPattern.exec(url)?.groups
  }) as any
}

export async function releaseMode(): Promise<void> {
  const releasesTags = core.getInput('releases-tags', { trimWhitespace: true })
  const parsedReleaseTags = parseReleaseTags(releasesTags)

  core.debug(`Parsed release tags: ${parsedReleaseTags}`)

  const octokit = new Octokit({ auth: core.getInput('token') })
  const { results, errors } = await PromisePool.withConcurrency(2)
    .for(parsedReleaseTags)
    .process(async tag => {
      const release = octokit.rest.repos.getReleaseByTag({
        owner: core.getInput('owner'),
        repo: core.getInput('repo'),
        tag
      })
      core.debug(`Fetched release: ${tag}`)
      return release
    })

  core.info(`Fetched releases: ${results.length}, errors: ${errors.length}`)

  if (errors.length) {
    core.setFailed(`Failed to fetch releases: ${errors.length}`)
    return
  }

  const issues = new Set<string>()
  for (const {
    data: { body }
  } of results) {
    if (!body) continue
    for (const issue of parseIssueFromReleaseBody(body)) {
      issues.add(issue.issue)
    }
  }

  const releaseWebhookUrl = core.getInput('release-webhook-url')

  core.debug(`Sending webhook to: ${releaseWebhookUrl}`)
  const result = await fetch(releaseWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        version: core.getInput('version'),
        environment: core.getInput('environment'),
        projectName: core.getInput('project-name'),
        issues: Array.from(issues).map(issueId => ({ issueId }))
      }
    })
  })

  if (result.status !== 200) {
    core.setFailed(`Failed to send webhook: ${result.statusText}`)
    return
  }

  core.info('Webhook sent successfully')
}

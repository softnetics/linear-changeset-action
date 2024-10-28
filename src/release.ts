import { Octokit } from 'octokit'
import * as core from '@actions/core'
import {
  LinearChangesetSdk,
  LinearChangesetSdkReleaseIssuesBody
} from './sdk/linear-changeset'
import PromisePool from '@supercharge/promise-pool'
import { parseRelease } from './release-parser'
import * as R from 'remeda'

interface ReleaseTrackerConfig {
  token: string
  projectId: string
  repository: string
  serverUrl: string
}

export class ReleaseTracker {
  private readonly lcSdk: LinearChangesetSdk
  private readonly octokit: Octokit

  constructor(private readonly config: ReleaseTrackerConfig) {
    this.lcSdk = new LinearChangesetSdk(config.serverUrl)
    this.octokit = new Octokit({ auth: config.token })
  }

  async fetchAllTags(): Promise<string[]> {
    const owner = this.config.repository.split('/')[0]
    const repoName = this.config.repository.split('/').slice(1).join('/')

    const response = await this.octokit.rest.git.listMatchingRefs({
      owner: owner,
      repo: repoName,
      ref: 'tags'
    })

    const tags = (response.data as { ref: string }[]).map(tag =>
      tag.ref.replace('refs/tags/', '')
    )

    return tags
  }

  async fetchReleases(tags: string[]) {
    const owner = this.config.repository.split('/')[0]
    const repoName = this.config.repository.split('/').slice(1).join('/')

    const { results, errors } = await PromisePool.withConcurrency(2)
      .for(tags)
      .process(async tag => {
        core.debug(`Fetched release: ${tag}`)

        const release = await this.octokit.rest.repos.getReleaseByTag({
          owner: owner,
          repo: repoName,
          tag: tag
        })

        let appName = ''
        let version = ''

        // Monorepo
        if (tag.includes('@')) {
          appName = tag.split('@').slice(0, -1).join('@')
          version = tag.split('@').at(-1)!
        }
        // Polyrepo
        else {
          appName = 'main' // TODO: Get package name from package.json
          version = tag
        }

        return {
          version: version,
          appName: appName,
          rawIssues: release.data.body ?? '',
          issueId: release.data.id
        }
      })

    if (errors.length) {
      core.setFailed(`Failed to fetch releases: ${errors.length}`)
      for (const error of errors) {
        core.error(error)
      }
      throw new Error('Failed to fetch releases')
    }

    const mappedResults = results.map(result => {
      const issues = parseRelease(result.rawIssues)

      return {
        ...result,
        issues: issues.map(issue => ({
          ...issue,
          version: result.version,
          issueId: issue.issue
        }))
      } satisfies LinearChangesetSdkReleaseIssuesBody['apps'][0]
    })

    return mappedResults
  }

  async process() {
    const [stampedTags, githubTags] = await Promise.all([
      this.lcSdk.getProjectTags(this.config.projectId),
      this.fetchAllTags()
    ])

    const filterredTags = R.difference(stampedTags, githubTags)

    if (filterredTags.length <= 0) {
      core.info('No tags to stamp to Linear')
      return
    }

    const releases = await this.fetchReleases(filterredTags)

    await this.lcSdk.releaseIssues({
      projectId: this.config.projectId,
      apps: releases
    })
  }
}

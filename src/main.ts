import * as core from '@actions/core'
import { ReleaseTracker } from './release'

export async function run() {
  try {
    const inputs = {
      // Required inputs
      projectId: core.getInput('project-id', { required: true }),
      repository: core.getInput('repository') ?? process.env.GITHUB_REPOSITORY,

      // Optional
      token: core.getInput('token') ?? process.env.GITHUB_TOKEN,
      maxAttempts: core.getInput('max-attempts') ?? '3',
      linearChangesetServer:
        core.getInput('lc-server-url') ??
        'https://linear-changeset-server.vercel.app'
    }

    const releaseTracker = new ReleaseTracker({
      projectId: inputs.projectId,
      repository: inputs.repository,
      token: inputs.token,
      serverUrl: inputs.linearChangesetServer
    })

    for (let attempt = 0; attempt < parseInt(inputs.maxAttempts); attempt++) {
      try {
        core.info(`Processing release... (Attempt ${attempt + 1})`)
        await releaseTracker.process()
      } catch (error: any) {
        core.error(error)
      }
    }
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message)
  }
}

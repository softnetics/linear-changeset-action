/**
 * The entrypoint for the action.
 */
import { releaseMode } from './main'
import * as core from '@actions/core'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
async function run() {
  const mode = core.getInput('mode')
  const maxAttempts = parseInt(core.getInput('max-attempts'))
  let attempt = maxAttempts
  while (attempt--) {
    if (attempt < maxAttempts - 1) {
      core.info(`Retrying in 5 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    try {
      switch (mode) {
        case 'release':
          releaseMode()
          break
        default:
          core.setFailed(`Unknown mode: ${mode}`)
          return
      }
    } catch (error: any) {
      core.error(error)
    }
  }
}

run()

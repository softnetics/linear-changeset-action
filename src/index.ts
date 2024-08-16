/**
 * The entrypoint for the action.
 */
import { releaseMode } from './main'
import * as core from '@actions/core'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
const mode = core.getInput('mode')
switch (mode) {
  case 'release':
    releaseMode()
    break
  default:
    core.setFailed(`Unknown mode: ${mode}`)
    break
}

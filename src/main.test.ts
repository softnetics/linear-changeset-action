import { it, expect } from 'vitest'
import { parseIssueFromReleaseBody } from './main'

it('Should Parse Issue From ReleaseBody', async () => {
  const a = `[[AQU-16] - Test 20](https://linear.app/snts/issue/AQU-16/test-20)
 [[AQU-15] - Test 12](https://linear.app/snts/issue/AQU-15/test-12)
 [[AQU-14] - Peam issue](https://linear.app/snts/issue/AQU-14/peam-issue)`
  console.log(parseIssueFromReleaseBody(a))
})

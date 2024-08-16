import { it, expect, expectTypeOf } from 'vitest'
import { parseIssueFromReleaseBody } from './main'

it('Should Parse Issue From ReleaseBody', async () => {
  const a = `[[AQU-16] - Test 20](https://linear.app/snts/issue/AQU-16/test-20)
 [[AQU-15] - Test 12](https://linear.app/snts/issue/AQU-15/test-12)
 [[AQU-14] - Peam issue](https://linear.app/snts/issue/AQU-14/peam-issue)`
  // console.log(parseIssueFromReleaseBody(a))
  expect(parseIssueFromReleaseBody(a)).toEqual([
    {
      workspace: 'snts',
      issue: 'AQU-16',
      title: 'test-20'
    },
    {
      workspace: 'snts',
      issue: 'AQU-15',
      title: 'test-12'
    },
    {
      workspace: 'snts',
      issue: 'AQU-14',
      title: 'peam-issue'
    }
  ])
})

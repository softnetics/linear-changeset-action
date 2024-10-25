import { it, expect } from 'vitest'
import { parseRelease } from './release-parser'

it('Should Parse Issue From ReleaseBody', async () => {
  const a = `
  Another line
  [[AQUA-16] - Test 20](https://linear.app/snts/issue/AQUA-16/test-20)
  [[AQUA-15] - Test 12](https://linear.app/snts/issue/AQUA-15/test-12)
  [[AQUA-14] - Peam issue](https://linear.app/snts/issue/AQUA-14/peam-issue)
  https://linear.app/snts/issue/AQUA-17/peam-issue-2
  Another line
  `

  expect(parseRelease(a)).toEqual([
    {
      workspace: 'snts',
      issue: 'AQUA-16',
      title: 'test-20',
      url: 'https://linear.app/snts/issue/AQUA-16/test-20'
    },
    {
      workspace: 'snts',
      issue: 'AQUA-15',
      title: 'test-12',
      url: 'https://linear.app/snts/issue/AQUA-15/test-12'
    },
    {
      workspace: 'snts',
      issue: 'AQUA-14',
      title: 'peam-issue',
      url: 'https://linear.app/snts/issue/AQUA-14/peam-issue'
    }
  ])
})

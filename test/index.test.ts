import { describe, expect, it } from 'vitest'
import { fetchSkinJson } from '../src/fetch'

describe.skip('test', () => {
  it('should work', async () => {
    expect(await fetchSkinJson('yanusi_6')).toMatchSnapshot()
  })
})

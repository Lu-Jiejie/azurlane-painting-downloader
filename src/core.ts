import { compose } from './compose'
import { fetchAllShipList, fetchAllSkinList, fetchSkinJson } from './fetch'
import { findKeyByValue } from './utils'

export default async function download(shipName: string, skinName: string): Promise<void> {
  const allShipList = await fetchAllShipList()
  const allSkinList = await fetchAllSkinList()

  const shipId = findKeyByValue(allShipList, 'name', shipName)
  if (!shipId) {
    throw new Error('Ship not found')
  }

  const skinId = findKeyByValue(allSkinList[shipId], 'name', skinName)
  if (!skinId) {
    throw new Error('Skin not found')
  }

  const skinJson = await fetchSkinJson(skinId)
  await compose(skinJson, skinId, shipName, skinName)
}

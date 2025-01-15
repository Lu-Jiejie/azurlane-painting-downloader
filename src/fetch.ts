import { Buffer } from 'node:buffer'
// from https://github.com/Pelom777/AzurLaneTools, thanks for the data
import ky from 'ky'

// const AZURLANE_API_URL = 'https://gcore.jsdelivr.net/gh/Pelom777/AzurLaneTools/public/'
const AZURLANE_API_URL = 'https://cdn.al.pelom.cn'

export async function fetchAllShipList() {
  const response = await ky.get(`${AZURLANE_API_URL}/data/ship.json`)
  const data = await response.json() as Record<string, any>
  return data
}

export async function fetchAllSkinList() {
  const response = await ky.get(`${AZURLANE_API_URL}/data/skin.json`)
  const data = await response.json() as Record<string, any>
  return data
}

export async function fetchSkinJson(skinId: string) {
  const response = await ky.get(`${AZURLANE_API_URL}/painting/${skinId}/${skinId}.json`)
  const data = await response.json() as Record<string, any>
  return data
}

type SkinFileResponse<T extends string> = T extends `${string}.obj` ? string : Buffer

export async function fetchSkinFile<T extends string>(skinId: string, fileName: T): Promise<SkinFileResponse<T>> {
  const response = await ky.get(`${AZURLANE_API_URL}/painting/${skinId}/${fileName}`)
  // if obj file, return text
  if (fileName.endsWith('.obj')) {
    const data = await response.text()
    return data as SkinFileResponse<T>
  }
  // else return buffer
  const data = Buffer.from(await response.arrayBuffer())
  return data as SkinFileResponse<T>
}

export async function fetchSkinFace(skinId: string, faceId: string) {
  const response = await ky.get(`${AZURLANE_API_URL}/paintingface/${skinId}/${faceId}.png`)
  const data = Buffer.from(await response.arrayBuffer())
  return data
}

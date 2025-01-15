import type { Buffer } from 'node:buffer'
import path from 'node:path'
import sharp from 'sharp'
import { fetchSkinFile } from './fetch'
import { ensureDir, getRootDir } from './utils'

async function initDir() {
  const rootDir = getRootDir()
  const outputDir = path.join(rootDir, 'output')
  await ensureDir(outputDir)
  const tempDir = path.join(outputDir, '_temp')
  await ensureDir(tempDir)

  return {
    rootDir,
    outputDir,
    tempDir,
  }
}

async function composeSprite(
  textureBuffer: Buffer,
  mesh: string[],
  rawSize: [number, number],
  size: [number, number],
  tempDir: string,
  tempFileName: string,
) {
  const composites: sharp.OverlayOptions[] = []
  const count = mesh.reduce((t, c) => t + (c[1] === 't' ? 1 : 0), 0)

  for (let i = 1; i <= count; i += 4) {
    const texture = sharp(textureBuffer)
    const metadata = await texture.metadata()

    const v0: number[] = mesh[i].split(' ').slice(1).map(e => Number(e))
    // const v1: number[] = mesh[i + 2].split(' ').slice(1).map(e => Number(e))
    let vt0: number[] = mesh[i + count].split(' ').slice(1).map(e => Number(e))
    let vt1: number[] = mesh[i + count + 2].split(' ').slice(1).map(e => Number(e))

    vt0 = [Math.round(vt0[0] * metadata.width!), Math.round(vt0[1] * metadata.height!)]
    vt1 = [Math.round(vt1[0] * metadata.width!), Math.round(vt1[1] * metadata.height!)]

    const rectangle = {
      left: vt0[0],
      top: metadata.height! - vt1[1],
      width: vt1[0] - vt0[0],
      height: vt1[1] - vt0[1],
    }
    const sprite = await texture.extract(rectangle).flip().toBuffer()

    composites.push({
      input: sprite,
      left: -v0[0],
      top: +v0[1],
    })
  }

  const compositeImage = sharp({
    create: {
      width: rawSize[0],
      height: rawSize[1],
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(composites)

  await compositeImage.toFormat('png').toFile(path.join(tempDir, tempFileName))
  return await sharp(path.join(tempDir, tempFileName)).resize(size[0], size[1]).toBuffer()
}

export async function compose(skinJson: Record<string, any>, skinId: string, shipName: string, skinName: string) {
  const { outputDir, tempDir } = await initDir()

  const baseSize = skinJson[skinId].size as [number, number]
  const composities: sharp.OverlayOptions[] = []

  for (const part of Object.keys(skinJson)) {
    const size = skinJson[part].size as [number, number]
    const rawSize = skinJson[part].rawSize as [number, number]
    const pivot = skinJson[part].pivot as [number, number]
    const position = skinJson[part].position as [number, number]
    let layerBuffer: Buffer

    if (part === 'face') {
      // TODO: handle face
      continue
    }

    const textureBuffer = await fetchSkinFile(skinId, `${part}.png`)

    if (skinJson[part].raw === true) {
      layerBuffer = await sharp(textureBuffer).flip().resize(size[0], size[1]).toBuffer()
    }
    else {
      const obj = await fetchSkinFile(skinId, `${part}-mesh.obj`)
      layerBuffer = await composeSprite(textureBuffer, obj.split('\r\n'), rawSize, size, tempDir, `${part}.png`)
    }

    composities.push(
      part === skinId
        ? {
            input: layerBuffer,
            left: 0,
            top: 0,
          }
        : {
            input: layerBuffer,
            left: Math.round(baseSize[0] / 2 - size[0] * pivot[0] + position[0]),
            top: Math.round(baseSize[1] / 2 - size[1] * pivot[1] + position[1]),
          },
    )
  }

  // compose image and save to temp dir
  await sharp({
    create: {
      width: baseSize[0],
      height: baseSize[1],
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composities)
    .toFormat('png')
    .toFile(path.join(tempDir, `temp-${shipName}-${skinName}.png`))

  // flip image and save to output dir
  await sharp(path.join(tempDir, `temp-${shipName}-${skinName}.png`))
    .flip()
    .toFile(path.join(outputDir, `${shipName}-${skinName}.png`))
}

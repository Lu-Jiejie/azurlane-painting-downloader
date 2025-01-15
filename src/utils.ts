import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}

export function findKeyByValue(obj: Record<string, any>, searchKey: string, searchValue: any) {
  for (const [key, value] of Object.entries(obj)) {
    if (value[searchKey] === searchValue) {
      return key
    }
  }
  return undefined
}

export function getRootDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
}

export async function removeDir(dirPath: string) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  }
  catch (error) {
    console.error(`删除文件夹 ${dirPath} 失败:`, error)
  }
}

// @ts-nocheck
import fs from 'fs'

export const checkpointData = (item) => ({
  path: item.getSavePath(),
  urlChain: item.getURLChain(),
  offset: item.getReceivedBytes(),
  length: item.getTotalBytes(),
  eTag: item.getETag(),
  lastModified: item.getLastModifiedTime(),
  mimeType: item.getMimeType(),
  startTime: item.getStartTime()
})

export const saveCheckpoint = async (database, downloadId, filename, item, backup = false) => {
  const data = checkpointData(item)
  if (backup && data.offset > 0 && fs.existsSync(data.path)) {
    const backupPath = `${data.path}.edd-part`
    fs.copyFileSync(data.path, backupPath)
    data.backupPath = backupPath
  }

  await database.updateFilesWhere({
    downloadId,
    filename
  }, {
    resumeData: JSON.stringify(data),
    receivedBytes: data.offset,
    totalBytes: data.length
  })
}

export const restoreCheckpoint = (file) => {
  try {
    const data = JSON.parse(file.resumeData)
    if (!data || data.offset <= 0 || data.offset >= data.length) return null
    if (data.backupPath && fs.existsSync(data.backupPath)) {
      fs.copyFileSync(data.backupPath, data.path)
    }

    if (!fs.existsSync(data.path) || fs.statSync(data.path).size < data.offset) return null
    // Drop bytes written after the most recent committed checkpoint.
    fs.truncateSync(data.path, data.offset)
    const { backupPath, ...options } = data

    return options
  } catch {
    return null
  }
}

// @ts-nocheck
// Modified 2026-10-14 for the unofficial Earthdata Download Modified; see MODIFICATIONS.md.

import downloadStates from '../../../app/constants/downloadStates'
import metricsEvent from '../../../app/constants/metricsEvent'
import metricsLogger from '../../utils/metricsLogger'
import { saveCheckpoint } from '../../utils/downloadCheckpoint'
import retryDownload from '../../utils/retryDownload'

/**
 * Handles the DownloadItem 'updated' event
 * @param {Object} params
 * @param {Object} params.database `EddDatabase` instance
 * @param {String} params.downloadId downloadId of the DownloadItem being downloaded
 * @param {Object} params.item Electron DownloadItem class instance
 * @param {String} params.state Updated state of the DownloadItem
 */
const onUpdated = async ({
  database,
  downloadId,
  item,
  state
}) => {
  if (item.eddQuitting) return
  const filename = item.getFilename()

  // Get the download item from the database
  const file = await database.getFileWhere({
    filename,
    downloadId
  })
  if (item.eddQuitting) return

  // If the file is not found in the database, cancel the download
  if (!file) {
    item.cancel()

    return
  }

  const {
    id: fileId
  } = file

  // Calculate the percent done of the download
  const receivedBytes = item.getReceivedBytes()
  const totalBytes = item.getTotalBytes()

  let percentDone = 0

  // Avoid NaN by only calculating percentDone if totalBytes is known
  if (totalBytes > 0) {
    percentDone = Math.floor((receivedBytes / totalBytes) * 100)
  }

  if (state === 'interrupted') {
    await saveCheckpoint(database, downloadId, filename, item, true)
    const canResume = item.canResume()
    if (await retryDownload({ database, fileId, item: canResume ? item : undefined })) {
      if (!canResume) item.cancel()
      return
    }
    const parent = await database.getDownloadById(downloadId)
    if (parent.state === downloadStates.paused || parent.state === downloadStates.appQuitting
      || file.state === downloadStates.paused) return
    metricsLogger(database, {
      eventType: metricsEvent.downloadInterrupted,
      data: {
        downloadId,
        filename
      }
    })

    await database.createPauseByDownloadIdAndFilename(downloadId, filename)

    // Update the database if the state has updated to interrupted
    await database.updateFileById(fileId, {
      state: downloadStates.interruptedCanResume,
      percent: percentDone
    })

    // Create a pause for the download
    await database.createPauseByDownloadId(downloadId, false)

    // Set the download to interrupted
    await database.updateDownloadById(downloadId, {
      state: downloadStates.interruptedCanResume
    })
  } else if (state === 'progressing') {
    await saveCheckpoint(database, downloadId, filename, item, item.isPaused())
    // Update the database with the percent and state
    await database.updateFileById(fileId, {
      state: item.isPaused() ? downloadStates.paused : downloadStates.active,
      percent: percentDone,
      receivedBytes,
      totalBytes
    })
  }
}

export default onUpdated

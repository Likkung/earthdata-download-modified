// @ts-nocheck
// Modified 2026-10-14 for the unofficial Earthdata Download Modified; see MODIFICATIONS.md.

import downloadStates from '../../app/constants/downloadStates'
import metricsLogger from '../utils/metricsLogger'

import metricsEvent from '../../app/constants/metricsEvent'
import { saveCheckpoint } from '../utils/downloadCheckpoint'

/**
 * Pauses a download and updates the database
 * @param {Object} params
 * @param {Object} params.currentDownloadItems CurrentDownloadItems class instance that holds all of the active DownloadItems instances
 * @param {Object} params.database `EddDatabase` instance
 * @param {Object} params.info `info` parameter from ipc message
 */
const pauseDownloadItem = async ({
  currentDownloadItems,
  database,
  info
}) => {
  const { downloadId, filename } = info

  currentDownloadItems.pauseItem(downloadId, filename)
  const groups = currentDownloadItems.downloadItems
  await Promise.all(Object.entries(groups).flatMap(([id, items]) => Object.entries(items)
    .filter(([name]) => (!downloadId || id === String(downloadId)) && (!filename || name === filename))
    .map(([name, item]) => saveCheckpoint(database, id, name, item, true))))

  if (downloadId && filename) {
    await database.createPauseByDownloadIdAndFilename(downloadId, filename)

    await database.updateFilesWhere({
      downloadId,
      filename
    }, {
      state: downloadStates.paused
    })
  }

  if (downloadId && !filename) {
    await database.createPauseByDownloadId(downloadId, true)

    await database.updateDownloadById(downloadId, {
      state: downloadStates.paused
    })

    metricsLogger(database, {
      eventType: metricsEvent.downloadPause,
      data: {
        downloadIds: [downloadId],
        downloadCount: 1
      }
    })
  }

  if (!downloadId) {
    const pauseResponse = await database.createPauseForAllActiveDownloads()

    await database.updateDownloadsWhereIn([
      'state',
      [downloadStates.active, downloadStates.pending]
    ], {
      state: downloadStates.paused
    })

    metricsLogger(database, {
      eventType: metricsEvent.downloadPause,
      data: {
        downloadIds: pauseResponse.pausedIds
      }
    })
  }
}

export default pauseDownloadItem

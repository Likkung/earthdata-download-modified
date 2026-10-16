// @ts-nocheck
// Modified 2026-10-14 for the unofficial Earthdata Download Modified; see MODIFICATIONS.md.

import { app } from 'electron'

import startPendingDownloads from '../utils/startPendingDownloads'

import downloadStates from '../../app/constants/downloadStates'

/**
 * Opens the app window. Resets any active downloads/files so they can be resumed.
 * @param {Object} params
 * @param {Object} params.appWindow Electron window instance
 * @param {Object} params.autoUpdater `electron-updater` instance
 * @param {Object} params.database `EddDatabase` instance
 * @param {Function} params.setUpdateAvailable A function to set if an auto update download is available
 */
const didFinishLoad = async ({
  appWindow,
  autoUpdater,
  database,
  setUpdateAvailable
}) => {
  // Show the electron appWindow
  appWindow.show()

  // Preserve offsets and validators; recover files left by a crashed process too.
  const updatedFiles = await database.db('files').returning(['downloadId', 'filename'])
    .whereIn('state', [downloadStates.active, downloadStates.starting,
      downloadStates.interruptedCanResume])
    .update({ state: downloadStates.pending })

  // Delete any pauses associated with update files (files in pending state)
  await Promise.all(updatedFiles.map(async (updatedFile) => {
    const { downloadId, filename } = updatedFile
    await database.deletePausesByDownloadIdAndFilename(downloadId, filename)
  }))

  // Update any `appQuitting` downloads to be `paused`, so the user can resume them
  await database.updateDownloadsWhereIn([
    'state',
    [downloadStates.appQuitting, downloadStates.active, downloadStates.interruptedCanResume]
  ], {
    state: downloadStates.paused
  })

  // Open the DevTools if running in development.
  if (!app.isPackaged) appWindow.webContents.openDevTools({ mode: 'detach' })

  // Upstream updates would replace this modified build. Update this fork manually.
  setUpdateAvailable(false)
  await startPendingDownloads({ appWindow, database })

  // Locally, start pending downloads unless `forceDevUpdateConfig` is enabled
  if (!app.isPackaged && !autoUpdater.forceDevUpdateConfig) {
    setUpdateAvailable(false)

    // Start any pending downloads
    // Pending downloads were already initialized above.
  }
}

export default didFinishLoad

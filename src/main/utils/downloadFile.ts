// @ts-nocheck
// Modified 2026-10-14 for the unofficial Earthdata Download Modified; see MODIFICATIONS.md.

import { session } from 'electron'

import downloadStates from '../../app/constants/downloadStates'
import checkTokenExpired from './checkTokenExpired'
import { restoreCheckpoint } from './downloadCheckpoint'
import retryDownload from './retryDownload'
import { authorizeResume } from './resumeAuthorization'

/**
 * Starts a download of the given file
 * @param {Object} params
 * @param {Object} params.database `EddDatabase` instance
 * @param {Object} params.downloadIdContext Object where we can associate a newly created download to a downloadId
 * @param {Object} params.file File to start downloading
 * @param {Object} params.webContents Electron BrowserWindow instance's webContents
 */
const downloadFile = async ({
  database,
  downloadIdContext,
  file,
  webContents
}) => {
  const token = await checkTokenExpired({ database })

  const {
    downloadId,
    id: fileId,
    url
  } = file

  const { downloadLocation } = await database.getDownloadById(downloadId)

  // The file might not actually start download before the next time through this loop
  // Setting the file to `starting` ensures we start a new file if we need to
  await database.updateFileById(fileId, {
    state: downloadStates.starting
  })

  // eslint-disable-next-line no-param-reassign
  downloadIdContext[url] = {
    downloadId,
    downloadLocation,
    fileId
  }

  // Thin Egress App sets a cookie, but we want to ensure a token is validated for each request, so clear cookies
  // before downloading
  await session.defaultSession.clearStorageData()

  let headers = {}
  if (token) {
    headers = {
      Authorization: `Bearer ${token}`
    }
  }

  console.log(`Starting a download for ${url}, with a token: ${token ? 'Yes' : 'No'}`)

  try {
    // Native interrupted downloads retain validators and byte ranges across sessions.
    const checkpoint = restoreCheckpoint(file)
    if (checkpoint) {
      authorizeResume(checkpoint.urlChain, token)
      downloadIdContext[url].restoring = true
      session.defaultSession.createInterruptedDownload(checkpoint)
    } else {
      webContents.downloadURL(url, { headers })
    }
  } catch (error) {
    delete downloadIdContext[url]
    await database.updateFileById(fileId, { state: downloadStates.error, errors: error.message })
    await retryDownload({ database, fileId })
  }
}

export default downloadFile

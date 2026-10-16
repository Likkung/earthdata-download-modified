// @ts-nocheck
// Modified 2026-10-14 for the unofficial Earthdata Download Modified; see MODIFICATIONS.md.
import downloadStates from '../../app/constants/downloadStates'
import { saveCheckpoint } from '../utils/downloadCheckpoint'

const beforeQuit = async ({ currentDownloadItems, database }) => {
  Object.values(currentDownloadItems.downloadItems).forEach((items) => {
    Object.values(items).forEach((item) => { Object.assign(item, { eddQuitting: true }) })
  })

  currentDownloadItems.pauseItem()
  await database.updateDownloadsWhereIn(['state', [downloadStates.active]], {
    state: downloadStates.appQuitting
  })

  await Promise.all(Object.entries(currentDownloadItems.downloadItems)
    .flatMap(([id, items]) => Object.entries(items)
      .map(([filename, item]) => saveCheckpoint(database, id, filename, item, true))))
}

export default beforeQuit

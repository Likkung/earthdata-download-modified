// @ts-nocheck
import downloadStates from '../../app/constants/downloadStates'

export const retryDelay = (attempt) => Math.min(60000, 5000 * (2 ** Math.min(6, attempt - 1)))
const timers = new WeakMap()

// Authentication and EULA errors are handled by their existing UI, never retried here.
const retryDownload = async ({ database, fileId, item }) => {
  if (item && timers.has(item)) return true
  const file = await database.getFileWhere({ id: fileId })
  const download = await database.getDownloadById(file.downloadId)
  const { autoRetry = 1 } = await database.getPreferences()
  const attempt = (file.retryCount || 0) + 1
  if (!autoRetry || download.state !== downloadStates.active
    || file.cancelId || file.deleteId || file.state === downloadStates.paused) return false

  const delay = retryDelay(attempt)
  await database.updateFileById(fileId, {
    state: item ? downloadStates.interruptedCanResume : downloadStates.pending,
    retryCount: attempt,
    nextRetryAt: Date.now() + delay,
    errors: `Automatic retry ${attempt} in ${delay / 1000} seconds`
  })

  if (item) {
    const timer = setTimeout(async () => {
      timers.delete(item)
      if (item.eddQuitting) return
      try {
        const latest = await database.getFileWhere({ id: fileId })
        const parent = await database.getDownloadById(file.downloadId)
        if (parent.state === downloadStates.active
          && latest.state === downloadStates.interruptedCanResume) {
          if (!item.canResume()) {
            await retryDownload({
              database,
              fileId
            })

            item.cancel()

            return
          }

          await database.updateFileById(fileId, {
            state: downloadStates.active,
            errors: null
          })

          item.resume()
        }
      } catch (error) {
        console.error('Could not automatically resume download', error)
      }
    }, delay)
    timers.set(item, timer)
    timer.unref?.()
  }

  return true
}

export default retryDownload

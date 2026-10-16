// @ts-nocheck
// Run through scripts/recovery-integration.cjs against a local HTTP range server.
import { app, BrowserWindow, session } from 'electron'
import fs from 'fs'
import path from 'path'
import EddDatabase from '../src/main/utils/database/EddDatabase'
import CurrentDownloadItems from '../src/main/utils/currentDownloadItems'
import willDownload from '../src/main/eventHandlers/willDownload'
import startNextDownload from '../src/main/utils/startNextDownload'
import pauseDownloadItem from '../src/main/eventHandlers/pauseDownloadItem'
import resumeDownloadItem from '../src/main/eventHandlers/resumeDownloadItem'
import beforeQuit from '../src/main/eventHandlers/beforeQuit'
import didFinishLoad from '../src/main/eventHandlers/didFinishLoad'
import { installResumeAuthorization } from '../src/main/utils/resumeAuthorization'

const root = process.env.EDD_TEST_ROOT
const phase = process.env.EDD_TEST_PHASE
const url = process.env.EDD_TEST_URL
fs.mkdirSync(root, { recursive: true })
app.setPath('userData', path.join(root, 'user'))
fs.mkdirSync(app.getPath('userData'), { recursive: true })

app.whenReady().then(async () => {
  const database = new EddDatabase(root)
  await database.migrateDatabase()
  await database.setPreferences({ concurrentDownloads: 1, allowMetrics: 0 })
  const items = new CurrentDownloadItems()
  const context = {}
  const win = new BrowserWindow({ show: false })
  installResumeAuthorization(session.defaultSession)
  const params = { currentDownloadItems: items, database, downloadIdContext: context,
    webContents: win.webContents }
  session.defaultSession.on('will-download', (event, item) => {
    willDownload({ ...params, item, downloadsWaitingForAuth: {}, downloadsWaitingForEula: {} })
      .catch((error) => { console.error(error); app.exit(1) })
  })

  if (phase === 'pause') {
    await database.createDownload('test-job', { state: 'ACTIVE',
      downloadLocation: root, loadingMoreFiles: false, createdAt: Date.now() })
    await database.addLinksByDownloadId('test-job', [url])
    await startNextDownload(params)
  } else {
    await didFinishLoad({ database, appWindow: { show() {}, webContents: { openDevTools() {} } },
      autoUpdater: {}, setUpdateAvailable() {} })
    const paused = await database.getDownloadById('test-job')
    if (paused.state !== 'PAUSED') throw new Error(`Recovery did not pause job: ${paused.state}`)
    await resumeDownloadItem({ ...params, info: { downloadId: 'test-job' } })
  }

  let checkpointing = false
  const timer = setInterval(async () => {
    try {
      const file = await database.getFileWhere({ downloadId: 'test-job' })
      if (phase === 'pause' && file.receivedBytes > 0 && !checkpointing) {
        checkpointing = true
        clearInterval(timer)
        await pauseDownloadItem({ ...params, info: { downloadId: 'test-job' } })
        await beforeQuit(params)
        const saved = await database.getFileWhere({ downloadId: 'test-job' })
        fs.writeFileSync(path.join(root, 'checkpoint.json'), JSON.stringify(saved))
        app.exit(0)
        return
      }
      if (phase !== 'pause' && file.state === 'COMPLETED') {
        clearInterval(timer)
        app.exit(0)
        return
      }
      await startNextDownload(params)
    } catch (error) { console.error(error); app.exit(1) }
  }, 100)
  setTimeout(() => { console.error('Recovery integration timeout'); app.exit(1) }, 45000)
}).catch((error) => { console.error(error); app.exit(1) })

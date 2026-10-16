// @ts-nocheck
import fs from 'fs'
import os from 'os'
import path from 'path'
import EddDatabase from '../database/EddDatabase'
import didFinishLoad from '../../eventHandlers/didFinishLoad'
import resumeDownloadItem from '../../eventHandlers/resumeDownloadItem'
import CurrentDownloadItems from '../currentDownloadItems'

jest.mock('electron', () => ({ app: { isPackaged: false } }))
jest.mock('../metricsLogger', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../startNextDownload', () => ({ __esModule: true, default: jest.fn() }))

test('database migrations, extension filtering and paused files survive reopening', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'edd-db-'))
  let database
  try {
    database = new EddDatabase(root)
    await database.migrateDatabase()
    await database.createDownload('test', { state: 'ACTIVE', fileExtensions: '.nc', loadingMoreFiles: false })
    await database.addLinksByDownloadId('test', [
      'https://example.test/data.NC?signature=123', 'https://example.test/data.xml'
    ])
    let files = await database.getFilesWhere({ downloadId: 'test' })
    expect(files).toHaveLength(1)
    expect(files[0].filename).toBe('data.NC')
    await database.updateFileById(files[0].id, { state: 'PAUSED', receivedBytes: 123,
      totalBytes: 1000, percent: 12, resumeData: '{"offset":123}', retryCount: 20 })
    await database.destroy()
    database = new EddDatabase(root)
    await database.migrateDatabase()
    await didFinishLoad({ database,
      appWindow: { show() {}, webContents: { openDevTools() {} } },
      autoUpdater: {}, setUpdateAvailable() {} })
    expect((await database.getDownloadById('test')).state).toBe('PAUSED')
    await resumeDownloadItem({ database, currentDownloadItems: new CurrentDownloadItems(),
      downloadIdContext: {}, info: { downloadId: 'test' }, webContents: {} })
    files = await database.getFilesWhere({ downloadId: 'test' })
    expect(files[0]).toMatchObject({ state: 'PENDING', receivedBytes: 123,
      percent: 12, resumeData: '{"offset":123}', retryCount: 20 })
    expect(await database.getFilesToStart(1)).toHaveLength(1)
    await database.updateFileById(files[0].id, { nextRetryAt: Date.now() + 60000 })
    expect(await database.getFilesToStart(1)).toHaveLength(0)
  } finally {
    if (database) await database.destroy()
    fs.rmSync(root, { recursive: true, force: true })
  }
})


// @ts-nocheck
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseExtensions, matchesExtension } from '../fileExtensions'
import retryDownload, { retryDelay } from '../retryDownload'
import { saveCheckpoint, restoreCheckpoint } from '../downloadCheckpoint'
import onUpdated from '../../eventHandlers/willDownloadEvents/onUpdated'

jest.mock('../metricsLogger', () => ({ __esModule: true, default: jest.fn() }))

const setup = () => {
  const file = { id: 1, downloadId: 'job', filename: 'data.nc', state: 'ACTIVE', retryCount: 0 }
  const download = { state: 'ACTIVE' }
  const database = {
    getFileWhere: jest.fn(async () => file),
    getDownloadById: jest.fn(async () => download),
    getPreferences: jest.fn(async () => ({ autoRetry: 1 })),
    updateFileById: jest.fn(async (id, values) => Object.assign(file, values)),
    updateFilesWhere: jest.fn(async (where, values) => Object.assign(file, values))
  }
  const item = {
    getFilename: () => 'data.nc', getSavePath: () => '/nonexistent/data.nc',
    getReceivedBytes: () => 12, getTotalBytes: () => 100,
    getURLChain: () => ['https://example.test/data.nc'],
    getETag: () => 'version1', getLastModifiedTime: () => '',
    getMimeType: () => 'application/octet-stream', getStartTime: () => 123,
    canResume: () => true, resume: jest.fn(), cancel: jest.fn()
  }
  return { file, download, database, item }
}

afterEach(() => jest.useRealTimers())

test('accepts case, dots, globs, whitespace and compound extensions', () => {
  expect(parseExtensions('.H5, *.nc; tar.gz h5')).toEqual(['h5', 'nc', 'tar.gz'])
  expect(matchesExtension('https://a.test/data.H5?token=secret', '.h5')).toBe(true)
  expect(matchesExtension('https://a.test/file%20name.tar.gz#x', 'tar.gz')).toBe(true)
  expect(matchesExtension('https://a.test/file.nc.xml', 'nc')).toBe(false)
  expect(matchesExtension('https://a.test/data', '')).toBe(true)
})

test('backoff never exceeds one minute, even after thousands of interruptions', () => {
  expect([1, 2, 3, 4, 5, 10000].map(retryDelay)).toEqual([5000, 10000, 20000, 40000, 60000, 60000])
})

test('terminal interruption requeues automatically, with no attempt limit', async () => {
  const { file, database } = setup()
  file.retryCount = 100
  expect(await retryDownload({ database, fileId: 1 })).toBe(true)
  expect(file.state).toBe('PENDING')
  expect(file.retryCount).toBe(101)
  expect(file.nextRetryAt).toBeGreaterThan(Date.now())
})

test.each(['PAUSED', 'CANCELLED', 'WAITING_FOR_AUTH', 'WAITING_FOR_EULA'])('does not retry a %s job', async (state) => {
  const { database, download } = setup()
  download.state = state
  expect(await retryDownload({ database, fileId: 1 })).toBe(false)
  expect(database.updateFileById).not.toHaveBeenCalled()
})

test('automatically resumes an interrupted native download and deduplicates events', async () => {
  jest.useFakeTimers()
  const { database, file, item } = setup()
  await onUpdated({ database, downloadId: 'job', item, state: 'interrupted' })
  await onUpdated({ database, downloadId: 'job', item, state: 'interrupted' })
  expect(file.retryCount).toBe(1)
  await jest.advanceTimersByTimeAsync(5000)
  expect(item.resume).toHaveBeenCalledTimes(1)
  expect(file.state).toBe('ACTIVE')
})

test('non-resumable interruption schedules a new download instead of hanging', async () => {
  const { database, file, item } = setup()
  item.canResume = () => false
  await onUpdated({ database, downloadId: 'job', item, state: 'interrupted' })
  expect(file.state).toBe('PENDING')
  expect(item.cancel).toHaveBeenCalledTimes(1)
})

test('Pause suppresses an already scheduled automatic resume', async () => {
  jest.useFakeTimers()
  const { database, download, item } = setup()
  await retryDownload({ database, fileId: 1, item })
  download.state = 'PAUSED'
  await jest.advanceTimersByTimeAsync(5000)
  expect(item.resume).not.toHaveBeenCalled()
})

test('checkpoint backup survives deletion of the original partial file', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edd-checkpoint-'))
  try {
    const target = path.join(dir, 'data.nc')
    fs.writeFileSync(target, Buffer.from('partial-data'))
    const { database, file, item } = setup()
    item.getSavePath = () => target
    await saveCheckpoint(database, 'job', 'data.nc', item, true)
    fs.unlinkSync(target)
    const restored = restoreCheckpoint(file)
    expect(restored.offset).toBe(12)
    expect(restored.eTag).toBe('version1')
    expect(fs.readFileSync(target).toString()).toBe('partial-data')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('missing or short partial files fall back to a fresh download', () => {
  expect(restoreCheckpoint({ resumeData: '{invalid' })).toBeNull()
  expect(restoreCheckpoint({ resumeData: JSON.stringify({ path: '/missing', offset: 10, length: 100 }) })).toBeNull()
})


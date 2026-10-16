const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const esbuild = require('esbuild')

async function main() {
  const root = fs.mkdtempSync(path.resolve('.tools/recovery-'))
  const entry = path.join(root, 'runner.cjs')
  await esbuild.build({ entryPoints: ['scripts/recovery-integration.ts'], outfile: entry,
    bundle: true, platform: 'node', external: ['electron', 'better-sqlite3', 'knex'] })
  const payload = Buffer.alloc(1024 * 1024)
  for (let i = 0; i < payload.length; i += 1) payload[i] = i % 251
  const requests = []
  const server = http.createServer((req, res) => {
    const range = req.headers.range
    requests.push(range || 'full')
    const offset = range ? Number(/bytes=(\d+)-/.exec(range)?.[1] || 0) : 0
    res.writeHead(range ? 206 : 200, { 'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="data.nc"', 'Accept-Ranges': 'bytes',
      'Content-Length': payload.length - offset, ETag: '"integration-v1"',
      ...(range ? { 'Content-Range': `bytes ${offset}-${payload.length - 1}/${payload.length}` } : {}) })
    let cursor = offset
    const timer = setInterval(() => {
      const end = Math.min(cursor + 16384, payload.length)
      res.write(payload.subarray(cursor, end))
      cursor = end
      if (cursor === payload.length) { clearInterval(timer); res.end() }
    }, 40)
    res.on('close', () => clearInterval(timer))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const run = (phase) => new Promise((resolve, reject) => {
    const child = spawn(require('electron'), [entry], { windowsHide: true,
      env: { ...process.env, EDD_TEST_ROOT: root, EDD_TEST_PHASE: phase,
        EDD_TEST_URL: `http://127.0.0.1:${server.address().port}/data.nc` }, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Electron ${phase} exited ${code}`)))
  })
  try {
    await run('pause')
    const saved = JSON.parse(fs.readFileSync(path.join(root, 'checkpoint.json')))
    const checkpoint = JSON.parse(saved.resumeData)
    assert(checkpoint.offset > 0 && checkpoint.offset < payload.length)
    assert(fs.existsSync(checkpoint.backupPath), 'Pause must preserve a partial-file backup')
    console.log('Checkpoint bytes:', checkpoint.offset, 'backup size:', fs.statSync(checkpoint.backupPath).size)
    assert(fs.statSync(checkpoint.backupPath).size >= checkpoint.offset, 'Checkpoint bytes must be present on disk')
    // Simulate Chromium removing its partial file when the first process exits.
    if (fs.existsSync(checkpoint.path)) fs.unlinkSync(checkpoint.path)
    await run('resume')
    assert.deepEqual(fs.readFileSync(path.join(root, 'data.nc')), payload)
    console.log('Range requests:', requests, 'checkpoint offset:', checkpoint.offset)
    assert(requests.some(r => r === `bytes=${checkpoint.offset}-`), 'Restart must request the saved byte range')
    console.log(`PASS: two-process Pause/quit/reopen/Resume, byte-for-byte match, offset ${checkpoint.offset}`)
  } finally { server.closeAllConnections(); server.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })

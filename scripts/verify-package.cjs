// Verify the packaged payload and its SQLite binary using Electron's Node runtime.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')

const nativeMode = process.argv[2] === '--native'
const packageDir = path.resolve(process.argv[nativeMode ? 3 : 2])
if (nativeMode) {
  assert(process.versions.electron, 'Native smoke check must run inside Electron')
  const binding = path.join(packageDir, 'resources', 'app.asar.unpacked', 'node_modules',
    'better-sqlite3', 'prebuilds', `${process.platform}-${process.arch}.node`)
  assert(fs.existsSync(binding), 'Packaged SQLite binary is missing')
  const Database = require('better-sqlite3')
  const database = new Database(':memory:', { nativeBinding: binding })
  database.exec('CREATE TABLE checkpoint (offset INTEGER); INSERT INTO checkpoint VALUES (123)')
  assert.equal(database.prepare('SELECT offset FROM checkpoint').get().offset, 123)
  database.close()
  console.log(`PASS: packaged SQLite loads in Electron ${process.versions.electron} on ${process.platform}/${process.arch}`)
} else {
  const asar = require('@electron/asar')
  const archive = path.join(packageDir, 'resources', 'app.asar')
  const packaged = asar.extractFile(archive, 'dist-electron/main.js')
  assert(packaged.equals(fs.readFileSync('dist-electron/main.js')), 'Packaged code differs from this build')
  assert(fs.existsSync(path.join(packageDir, 'resources', 'migrations',
    '20261014000000_download_recovery.js')), 'Recovery migration is missing')
  assert(fs.readFileSync(path.join(packageDir, 'resources', 'LICENSE'))
    .equals(fs.readFileSync('LICENSE')), 'Original license must be included unchanged')
  const result = spawnSync(require('electron'), [__filename, '--native', packageDir], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, windowsHide: true,
    encoding: 'utf8', timeout: 30000
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  assert.equal(result.status, 0, 'Electron native smoke check failed')
  console.log('PASS: packaged source and recovery migration match this build')
}

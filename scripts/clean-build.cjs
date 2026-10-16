const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
for (const name of ['dist', 'dist-electron']) {
  const target = path.resolve(root, name)
  if (path.dirname(target) !== root) throw new Error('Invalid build directory')
  fs.rmSync(target, { recursive: true, force: true })
}

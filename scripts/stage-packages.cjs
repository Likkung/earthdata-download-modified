const fs = require('node:fs')
const path = require('node:path')
const version = require('../package.json').version
const source = path.join('release', version)
const pattern = process.platform === 'win32' ? /\.(exe|zip)$/ : /\.(AppImage|deb|tar\.gz)$/
const names = fs.readdirSync(source).filter(name => pattern.test(name) && fs.statSync(path.join(source, name)).isFile())
const expected = process.platform === 'win32' ? 2 : 3
if (names.length !== expected) throw new Error(`Expected ${expected} packages, found ${names.length}`)
fs.mkdirSync('artifacts', { recursive: true })
for (const name of names) fs.copyFileSync(path.join(source, name), path.join('artifacts', name))
console.log(`Staged ${names.length} ${process.platform} packages`)

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const directory = process.argv[2] || 'artifacts'
const names = fs.readdirSync(directory).filter(name => /\.(exe|zip|AppImage|deb|tar\.gz)$/.test(name)).sort()
if (names.length !== 5) throw new Error(`Expected five Windows/Linux packages, found ${names.length}`)
const checksums = names.map(name => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, name))).digest('hex')
  return `${digest}  ${name}`
})
fs.writeFileSync(path.join(directory, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`)
console.log(`Wrote SHA256SUMS.txt for ${names.length} packages`)

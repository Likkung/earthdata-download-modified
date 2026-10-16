const { spawnSync } = require('node:child_process')
const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, TZ: 'America/New_York' }
})
process.exit(result.status ?? 1)

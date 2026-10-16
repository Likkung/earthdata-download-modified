// @ts-nocheck

export const parseExtensions = (value = '') => [...new Set(String(value)
  .toLowerCase().split(/[\s,;]+/).filter(Boolean)
  .map((extension) => extension.replace(/^\*?\.?/, ''))
  .filter(Boolean))]

export const matchesExtension = (url, value) => {
  const extensions = parseExtensions(value)
  if (!extensions.length) return true
  try {
    const filename = decodeURIComponent(new URL(url).pathname.split('/').pop()).toLowerCase()

    return extensions.some((extension) => filename.endsWith(`.${extension}`))
  } catch {
    return false
  }
}

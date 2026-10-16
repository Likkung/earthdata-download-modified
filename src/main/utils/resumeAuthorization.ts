// @ts-nocheck
const tokens = new Map()
export const authorizeResume = (urlChain, token) => {
  urlChain.forEach((url) => tokens.set(url, token))
}

export const clearResumeAuthorization = (urlChain) => {
  urlChain.forEach((url) => tokens.delete(url))
}

export const installResumeAuthorization = (session) => {
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    const token = tokens.get(details.url)
    const headers = { ...details.requestHeaders }
    if (token) headers.Authorization = `Bearer ${token}`
    callback({ requestHeaders: headers })
  })
}

export function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || null
}

export function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || null
}

export function getGoogleRefreshToken() {
  return process.env.GOOGLE_REFRESH_TOKEN?.trim() || null
}

export function getGoogleCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || "primary"
}

export function isGoogleCalendarConfigured() {
  return Boolean(
    getGoogleClientId() &&
      getGoogleClientSecret() &&
      getGoogleRefreshToken()
  )
}

/** Janela em que o indicador de sync fica verde no header. */
export const SYNC_FRESHNESS_HOURS = 48

export function getZeppAppToken() {
  return getZeppBearerToken()
}

export function getZeppBearerToken() {
  return (
    process.env.ZEPP_BEARER_TOKEN?.trim() ||
    process.env.ZEPP_APP_TOKEN?.trim() ||
    null
  )
}

export function getZeppUserId() {
  return process.env.ZEPP_USER_ID?.trim() || null
}

export function getHevyApiKey() {
  return process.env.HEVY_API_KEY?.trim() || null
}

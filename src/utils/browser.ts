/**
 * Thin cross-browser shim.
 *
 * Firefox exposes the promise-based `browser.*` namespace, Chromium exposes
 * `chrome.*`. The handful of APIs santi.tab touches (permissions, runtime)
 * behave identically on both once you pick the right global, so this module
 * resolves it once instead of sprinkling `typeof browser` checks everywhere.
 *
 * Everything here degrades to a no-op in a plain web page (`npm run dev`) and
 * under jsdom, so the UI never has to guard against a missing extension API.
 */

type PermissionDescriptor = { origins?: string[]; permissions?: string[] }

type ExtensionApi = {
  permissions?: {
    contains: (
      descriptor: PermissionDescriptor,
      callback?: (granted: boolean) => void
    ) => Promise<boolean> | void
    request: (
      descriptor: PermissionDescriptor,
      callback?: (granted: boolean) => void
    ) => Promise<boolean> | void
  }
  runtime?: { id?: string; getManifest?: () => { version?: string } }
}

declare global {
  var browser: ExtensionApi | undefined
  var chrome: ExtensionApi | undefined
}

export const getExtensionApi = (): ExtensionApi | null => {
  if (typeof globalThis.browser?.runtime?.id === "string")
    return globalThis.browser as ExtensionApi
  if (typeof globalThis.chrome?.runtime?.id === "string")
    return globalThis.chrome as ExtensionApi
  return null
}

/** True when running as an installed extension rather than a dev web page. */
export const isExtension = () => getExtensionApi() !== null

/**
 * Chromium resolves permission calls with a promise; MV2-era Chromium and some
 * polyfills only take a callback. Support both without leaking the difference.
 */
function callPermission(
  method: "contains" | "request",
  descriptor: PermissionDescriptor
): Promise<boolean> {
  const api = getExtensionApi()
  const permissions = api?.permissions

  if (!permissions) return Promise.resolve(true)

  return new Promise<boolean>((resolve) => {
    try {
      const result = permissions[method](descriptor, (granted) =>
        resolve(!!granted)
      )

      if (result && typeof (result as Promise<boolean>).then === "function") {
        ;(result as Promise<boolean>).then(
          (granted) => resolve(!!granted),
          () => resolve(false)
        )
      }
    } catch {
      resolve(false)
    }
  })
}

export const REDDIT_ORIGINS = [
  "https://www.reddit.com/*",
  "https://oauth.reddit.com/*",
]

export const hasOrigins = (origins: string[]) =>
  callPermission("contains", { origins })

/**
 * Must be called from a user gesture (a click) -- Firefox rejects
 * `permissions.request` otherwise.
 */
export const requestOrigins = (origins: string[]) =>
  callPermission("request", { origins })

/**
 * Turns a URL into the wildcard match pattern its host needs, e.g.
 * `https://cdn.example.com/a/b.png` -> `https://cdn.example.com/*`.
 * Returns null for anything that isn't a fetchable http(s) URL.
 */
export const originPatternFor = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
    return `${parsed.protocol}//${parsed.host}/*`
  } catch {
    return null
  }
}

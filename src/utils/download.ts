/** Turns a wallpaper title into something safe to write to disk. */
export const filenameFor = (title: string, url: string) => {
  const extension = url.split("?")[0].split(".").pop()
  const safeExtension = /^[a-z0-9]{2,4}$/i.test(extension ?? "")
    ? `.${extension}`
    : ".jpg"

  const base =
    title
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "wallpaper"

  return `${base}${safeExtension}`
}

/**
 * Saves the current wallpaper. Downloading cross-origin images needs the image
 * host in `host_permissions`; where that isn't granted (Firefox MV3 until the
 * user opts in) we fall back to opening the image so it can be saved manually.
 */
export async function downloadImage(url: string, title: string) {
  const anchor = document.createElement("a")

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const objectUrl = URL.createObjectURL(await res.blob())

    anchor.href = objectUrl
    anchor.download = filenameFor(title, url)
    anchor.click()

    URL.revokeObjectURL(objectUrl)
    return true
  } catch {
    window.open(url, "_blank", "noopener,noreferrer")
    return false
  }
}

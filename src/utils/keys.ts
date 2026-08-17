/** "KeyR" -> "R", "ArrowLeft" -> "Arrow Left", "" -> "unset". */
export const formatKeyCode = (code: string) => {
  if (!code) return "unset"
  if (code.startsWith("Key")) return code.slice(3)
  if (code.startsWith("Digit")) return code.slice(5)
  return code.replace(/([a-z])([A-Z])/g, "$1 $2")
}

/**
 * Keyboard shortcuts must never fire while the user is typing a subreddit
 * name, a custom CSS rule, or a search query.
 */
export const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false

  return (
    element.isContentEditable === true ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName ?? "")
  )
}

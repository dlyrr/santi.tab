import type { ConfigState } from "../stores/ConfigStore"
import type { RedditPost } from "../stores/HistoryStore"

type RedditSearchResponse = {
  data: {
    after: string | null
    children: Array<{ data: RedditPost & { thumbnail?: string } }>
  }
}

type Post = RedditPost & { thumbnail?: string }

/** Thrown when a source can't be read, so the UI can offer a useful fix. */
export class SourceError extends Error {
  reason: "network" | "permission" | "blocked" | "empty"

  constructor(reason: SourceError["reason"], message: string) {
    super(message)
    this.name = "SourceError"
    this.reason = reason
  }
}

const DEFAULT_SUBREDDITS = ["Animewallpaper"]
const DEFAULT_LIMIT = 200

/** Normalises a user-entered subreddit ("/r/Foo", "r/Foo", "Foo") to "Foo". */
export const normalizeSubreddit = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\/(www\.)?reddit\.com/i, "")
    .replace(/^\/?r\//i, "")
    .replace(/\/.*$/, "")
    .trim()

const dimensionsOf = (post: Post) => {
  const source = post.preview?.images?.[0]?.source
  if (!source?.width || !source?.height) return null
  return { width: source.width, height: source.height }
}

/**
 * Applies the user's size / orientation filters. Posts that don't expose
 * preview metadata are always kept -- dropping them would silently throw away
 * most of a listing just because reddit omitted the preview block.
 */
export const matchesFilters = (post: Post, source: ConfigState["source"]) => {
  const dims = dimensionsOf(post)
  if (!dims) return true

  if (source.minWidth && dims.width < source.minWidth) return false
  if (source.minHeight && dims.height < source.minHeight) return false

  if (source.orientation === "landscape" && dims.width < dims.height)
    return false
  if (source.orientation === "portrait" && dims.height < dims.width)
    return false

  return true
}

/** Turns a plain list of image URLs into the post shape the app renders. */
export const urlsToPosts = (urls: string[]): Post[] =>
  urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      id: `custom-${index}`,
      title: decodeURIComponent(url.split("/").pop() || `Image ${index + 1}`),
      url,
    }))

/**
 * Reddit's search endpoint needs an actual query -- `search.json?q=` comes
 * back empty, which is what "flair: any" used to produce. With no query we
 * read the plain subreddit listing instead, which is the endpoint that means
 * "everything in here".
 */
export function buildListingUrl(
  subreddit: string,
  config: ConfigState,
  nsfw: boolean,
  after: string | null
) {
  const search = config.q.trim()

  if (search) {
    const query = new URLSearchParams({
      q: search,
      sort: config.sort.toString(),
      t: config.t.toString(),
      show: "all",
      restrict_sr: "1",
      include_over_18: nsfw ? "on" : "off",
    })
    if (after) query.set("after", after)

    return `https://www.reddit.com/r/${subreddit}/search.json?${query}`
  }

  // "relevance" is only meaningful against a query; hot is the listing analogue.
  const listing = config.sort === "relevance" ? "hot" : config.sort
  const query = new URLSearchParams({
    limit: "100",
    show: "all",
    include_over_18: nsfw ? "on" : "off",
  })
  // Only the top listing is time-scoped.
  if (listing === "top") query.set("t", config.t.toString())
  if (after) query.set("after", after)

  return `https://www.reddit.com/r/${subreddit}/${listing}.json?${query}`
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * One listing request, with the failure modes reddit actually produces mapped
 * to messages a person can act on.
 *
 * Reddit answers rate limits and blocks with an HTML page, not JSON. Parsing
 * that blindly used to surface "JSON.parse: unexpected character at line 1
 * column 1", which tells the user nothing about what went wrong.
 */
async function fetchListing(
  url: string,
  subreddit: string,
  attempt = 0
): Promise<RedditSearchResponse> {
  let res: Response

  try {
    res = await fetch(url)
  } catch {
    throw new SourceError(
      "network",
      `Couldn't reach r/${subreddit} — check your connection`
    )
  }

  if (!res.ok) {
    // Rate limits and hiccups are usually over in a moment; everything else
    // won't improve by asking again.
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      await delay(600 * (attempt + 1))
      return fetchListing(url, subreddit, attempt + 1)
    }

    if (res.status === 429) {
      throw new SourceError(
        "blocked",
        `Reddit is rate-limiting requests (429) — try again in a minute`
      )
    }

    if (res.status === 403 || res.status === 404) {
      throw new SourceError(
        "blocked",
        `r/${subreddit} returned ${res.status} — it may be private, banned, misspelled, or blocking this request`
      )
    }

    throw new SourceError(
      "network",
      `r/${subreddit} returned HTTP ${res.status}`
    )
  }

  const body = await res.text()

  try {
    return JSON.parse(body) as RedditSearchResponse
  } catch {
    throw new SourceError(
      "blocked",
      `Reddit sent a page instead of data for r/${subreddit} — it's likely rate-limiting you. Try again shortly.`
    )
  }
}

async function fetchSubreddit(
  subreddit: string,
  config: ConfigState,
  limit: number,
  nsfw: boolean
): Promise<Post[]> {
  let posts: Post[] = []
  let after: string | null = null

  while (posts.length < limit) {
    const json = await fetchListing(
      buildListingUrl(subreddit, config, nsfw, after),
      subreddit
    )

    if (!json?.data?.children) {
      throw new SourceError("network", `r/${subreddit} returned no listing`)
    }

    posts = posts.concat(json.data.children.map((child) => child.data))
    after = json.data.after
    if (!after) break
  }

  return posts
}

/**
 * @param onWarning called when some (but not all) sources failed, so the UI
 *   can say so without treating a partial result as a hard failure.
 */
export async function fetchPosts(
  config: ConfigState,
  onWarning?: (message: string) => void
) {
  const source = config.source
  const kind = source?.kind ?? "reddit"

  if (kind === "color") return []
  if (kind === "urls") return urlsToPosts(source?.urls ?? [])

  const subreddits = (source?.subreddits?.length
    ? source.subreddits
    : DEFAULT_SUBREDDITS
  )
    .map(normalizeSubreddit)
    .filter(Boolean)

  const limit = config.settings?.fetchLimit || DEFAULT_LIMIT

  // `nsfw` stays the legacy master switch; `nsfwMode` refines what to do with
  // it. An old config with only `nsfw` keeps behaving exactly as it used to.
  const nsfwMode = config.nsfw ? (source?.nsfwMode ?? "only") : "off"

  const targets = subreddits.length ? subreddits : DEFAULT_SUBREDDITS

  // Fetched in parallel, and a failure is isolated to its own subreddit: one
  // banned, private, or misspelled entry must not take down the whole list.
  const results = await Promise.all(
    targets.map(async (subreddit) => {
      try {
        return {
          subreddit,
          posts: await fetchSubreddit(subreddit, config, limit, nsfwMode !== "off"),
          error: null as Error | null,
        }
      } catch (error) {
        return { subreddit, posts: [] as Post[], error: error as Error }
      }
    })
  )

  const failed = results.filter((result) => result.error)

  // Only give up when there is nothing left to show.
  if (failed.length === results.length && failed[0]) {
    throw failed[0].error
  }

  if (failed.length) {
    const names = failed.map((result) => `r/${result.subreddit}`).join(", ")
    console.warn(`[!] Skipped unreachable subreddits: ${names}`)
    onWarning?.(`Couldn't reach ${names}`)
  }

  let posts: Post[] = results.flatMap((result) => result.posts)

  if (nsfwMode === "only") posts = posts.filter((e) => e.thumbnail === "nsfw")

  posts = posts.filter((e) => e.url.includes("i.redd.it"))

  if (source) posts = posts.filter((post) => matchesFilters(post, source))

  // Multiple subreddits can surface the same crosspost twice.
  const seen = new Set<string>()
  return posts.filter((post) => {
    if (seen.has(post.url)) return false
    seen.add(post.url)
    return true
  })
}

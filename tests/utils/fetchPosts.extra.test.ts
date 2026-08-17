import { describe, expect, it, vi } from "vitest"
import {
  buildListingUrl,
  fetchPosts,
  matchesFilters,
  normalizeSubreddit,
  SourceError,
  urlsToPosts,
} from "../../src/utils/fetchPosts"
import type { ConfigState } from "../../src/stores/ConfigStore"
import { DEFAULT_CONFIG } from "../../src/stores/ConfigStore"
import { makeListing } from "../helpers"

const config = (overrides: Partial<ConfigState> = {}) =>
  ({
    ...structuredClone(DEFAULT_CONFIG),
    ...overrides,
  }) as ConfigState

const withSource = (source: Partial<ConfigState["source"]>) =>
  config({ source: { ...structuredClone(DEFAULT_CONFIG.source), ...source } })

describe("normalizeSubreddit", () => {
  it("accepts every shape a user might paste", () => {
    expect(normalizeSubreddit("Animewallpaper")).toBe("Animewallpaper")
    expect(normalizeSubreddit("r/wallpapers")).toBe("wallpapers")
    expect(normalizeSubreddit("/r/wallpapers")).toBe("wallpapers")
    expect(normalizeSubreddit("  /r/EarthPorn/  ")).toBe("EarthPorn")
    expect(normalizeSubreddit("https://www.reddit.com/r/pics/")).toBe("pics")
    expect(normalizeSubreddit("   ")).toBe("")
  })
})

describe("matchesFilters", () => {
  const post = (width: number, height: number) => ({
    id: "x",
    title: "x",
    url: "https://i.redd.it/x.jpg",
    preview: { images: [{ source: { url: "u", width, height } }] },
  })

  it("keeps posts with no preview metadata", () => {
    const bare = { id: "x", title: "x", url: "https://i.redd.it/x.jpg" }
    expect(
      matchesFilters(bare, { ...DEFAULT_CONFIG.source, minWidth: 5000 })
    ).toBe(true)
  })

  it("applies minimum size", () => {
    const source = { ...DEFAULT_CONFIG.source, minWidth: 1920, minHeight: 1080 }

    expect(matchesFilters(post(1920, 1080), source)).toBe(true)
    expect(matchesFilters(post(1280, 1080), source)).toBe(false)
    expect(matchesFilters(post(1920, 720), source)).toBe(false)
  })

  it("applies orientation", () => {
    const landscape = {
      ...DEFAULT_CONFIG.source,
      orientation: "landscape" as const,
    }
    const portrait = {
      ...DEFAULT_CONFIG.source,
      orientation: "portrait" as const,
    }

    expect(matchesFilters(post(1920, 1080), landscape)).toBe(true)
    expect(matchesFilters(post(1080, 1920), landscape)).toBe(false)
    expect(matchesFilters(post(1080, 1920), portrait)).toBe(true)
    expect(matchesFilters(post(1920, 1080), portrait)).toBe(false)
  })
})

describe("urlsToPosts", () => {
  it("turns plain URLs into renderable posts and skips blanks", () => {
    const posts = urlsToPosts([
      "https://example.com/a%20b.jpg",
      "   ",
      "https://example.com/c.png",
    ])

    expect(posts).toHaveLength(2)
    expect(posts[0]).toMatchObject({
      id: "custom-0",
      title: "a b.jpg",
      url: "https://example.com/a%20b.jpg",
    })
  })
})

describe("buildListingUrl", () => {
  it("uses the search endpoint when there is a query", () => {
    const url = buildListingUrl("Animewallpaper", config(), false, null)

    expect(url).toContain("/r/Animewallpaper/search.json?")
    expect(url).toContain("restrict_sr=1")
    expect(url).toContain("include_over_18=off")
  })

  // Regression: "flair: any" clears the query, and search.json?q= returns an
  // empty listing, which looked exactly like a frozen reroll.
  it("falls back to the subreddit listing when the query is empty", () => {
    const url = buildListingUrl("Animewallpaper", config({ q: "" }), false, null)

    expect(url).toContain("/r/Animewallpaper/top.json?")
    expect(url).not.toContain("search.json")
    expect(url).toContain("t=year")
    expect(url).toContain("limit=100")
  })

  it("treats a whitespace-only query as empty", () => {
    expect(buildListingUrl("x", config({ q: "   " }), false, null)).toContain(
      "/top.json?"
    )
  })

  it("maps relevance onto hot, which has no time scope", () => {
    const url = new URL(
      buildListingUrl("x", config({ q: "", sort: "relevance" }), false, null)
    )

    expect(url.pathname).toBe("/r/x/hot.json")
    expect(url.searchParams.get("t")).toBeNull()
  })

  it("passes pagination and nsfw through on the listing endpoint", () => {
    const url = buildListingUrl("x", config({ q: "", sort: "new" }), true, "t3_a")

    expect(url).toContain("/r/x/new.json?")
    expect(url).toContain("after=t3_a")
    expect(url).toContain("include_over_18=on")
  })
})

describe("fetchPosts sources", () => {
  it("returns nothing for a colour background without hitting the network", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    expect(await fetchPosts(withSource({ kind: "color" }))).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("uses the user's own URLs without hitting the network", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const posts = await fetchPosts(
      withSource({ kind: "urls", urls: ["https://example.com/a.jpg"] })
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(posts).toHaveLength(1)
  })

  it("queries every configured subreddit and de-duplicates crossposts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () =>
          makeListing([{ url: "https://i.redd.it/shared.jpg" }], null),
      })
      .mockResolvedValueOnce({
        json: async () =>
          makeListing(
            [
              { url: "https://i.redd.it/shared.jpg" },
              { url: "https://i.redd.it/unique.jpg" },
            ],
            null
          ),
      })

    vi.stubGlobal("fetch", fetchMock)

    const posts = await fetchPosts(
      withSource({ subreddits: ["wallpapers", "EarthPorn"] })
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toContain("/r/wallpapers/search.json")
    expect(fetchMock.mock.calls[1][0]).toContain("/r/EarthPorn/search.json")
    expect(posts.map((post) => post.url)).toEqual([
      "https://i.redd.it/shared.jpg",
      "https://i.redd.it/unique.jpg",
    ])
  })

  it("stops paginating once the configured fetch limit is reached", async () => {
    const page = makeListing(
      Array.from({ length: 30 }, (_, index) => ({
        url: `https://i.redd.it/${index}.jpg`,
      })),
      "next"
    )

    const fetchMock = vi.fn().mockResolvedValue({ json: async () => page })
    vi.stubGlobal("fetch", fetchMock)

    await fetchPosts(
      config({
        settings: { ...DEFAULT_CONFIG.settings, fetchLimit: 25 },
      })
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("includes but does not require NSFW posts in 'include' mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () =>
          makeListing(
            [
              { url: "https://i.redd.it/nsfw.jpg", thumbnail: "nsfw" },
              { url: "https://i.redd.it/sfw.jpg", thumbnail: "default" },
            ],
            null
          ),
      })
    )

    const posts = await fetchPosts(
      config({ nsfw: true, source: { ...DEFAULT_CONFIG.source, nsfwMode: "include" } })
    )

    expect(posts).toHaveLength(2)
  })

  it("keeps working when one subreddit of several fails", async () => {
    const fetchMock = vi
      .fn()
      // r/good succeeds...
      .mockResolvedValueOnce({
        json: async () => makeListing([{ url: "https://i.redd.it/ok.jpg" }], null),
      })
      // ...r/banned is unreachable.
      .mockRejectedValueOnce(new Error("NetworkError"))

    vi.stubGlobal("fetch", fetchMock)

    const warn = vi.fn()
    const posts = await fetchPosts(
      withSource({ subreddits: ["good", "banned"] }),
      warn
    )

    expect(posts.map((p) => p.url)).toEqual(["https://i.redd.it/ok.jpg"])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("r/banned"))
  })

  it("still throws when every subreddit fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("NetworkError")))

    const warn = vi.fn()
    await expect(
      fetchPosts(withSource({ subreddits: ["a", "b"] }), warn)
    ).rejects.toBeInstanceOf(SourceError)
    expect(warn).not.toHaveBeenCalled()
  })

  it("raises a SourceError when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("NetworkError"))
    )

    await expect(fetchPosts(config())).rejects.toBeInstanceOf(SourceError)
  })

  it("raises a SourceError when reddit returns something unexpected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ error: 403 }) })
    )

    await expect(fetchPosts(config())).rejects.toThrow(/no listing/)
  })
})

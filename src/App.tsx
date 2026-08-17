import { useEffect, useRef } from "react"
import { FaHeart, FaReddit, FaSadTear, FaSync } from "react-icons/fa"
import { PuffLoader } from "react-spinners"

import Config from "./components/Config"
import Menu from "./components/Menu"
import Image from "./components/Image"
import MenuButton from "./components/MenuButton"
import QuickLinks from "./components/QuickLinks"
import QuoteWidget from "./components/Quote"
import SearchBar from "./components/SearchBar"
import TodoList from "./components/TodoList"
import { TimeDate } from "./components/TimeDate"

import pkg from "../package.json"

import { useSnapshot } from "valtio"
import "./App.scss"
import {
  AppStore,
  LoadState,
  setError,
  setLoaded,
  setWarning,
} from "./stores/AppStore"
import { CacheStore } from "./stores/CacheStore"
import { ConfigStore, type ConfigState } from "./stores/ConfigStore"
import {
  HistoryStore,
  pushPostToHistory,
  type RedditPost,
} from "./stores/HistoryStore"
import { fetchPosts } from "./utils/fetchPosts"
import { rollIntervalMs, themeVariables } from "./utils/theme"

function App() {
  const { loaded, showRollOverlay, error, warning } = useSnapshot(AppStore)
  const config = useSnapshot(ConfigStore)
  const cache = useSnapshot(CacheStore)
  const { history, i } = useSnapshot(HistoryStore)

  // Only the very first render honours the hourly/daily/manual hold. Anything
  // that flips the app back to FETCH_NEW afterwards is a deliberate user
  // action (reroll, filter change) and always rolls.
  const isFirstRun = useRef(true)

  useEffect(() => {
    const variables = themeVariables(config as ConfigState)

    for (const [name, value] of Object.entries(variables)) {
      document.documentElement.style.setProperty(name, value)
    }
  }, [config])

  useEffect(() => {
    if (config.pinned && loaded === LoadState.FETCH_NEW) {
      setLoaded(LoadState.LOADING)
    }
  }, [config.pinned, loaded])

  useEffect(() => {
    // No-op if incognito or pinned
    if (config.incognito || config.pinned || loaded !== LoadState.FETCH_NEW)
      return

    const firstRun = isFirstRun.current
    isFirstRun.current = false

    // Hold the current wallpaper if the refresh schedule says it's not due.
    if (firstRun && history.length) {
      const interval = rollIntervalMs(config.settings.refresh)
      const elapsed = Date.now() - (cache.lastRolled ?? -1)

      if (cache.lastRolled > 0 && elapsed < interval) {
        setLoaded(LoadState.LOADING)
        return
      }
    }

    let ignore = false

    async function run() {
      let posts: RedditPost[] = []
      const cacheMs = (ConfigStore.settings.cacheHours || 24) * 60 * 60 * 1000

      if (cache.lastUpdated === -1 || Date.now() - cache.lastUpdated >= cacheMs) {
        console.log("[i] Fetching w/ config:", config)

        try {
          let warning: string | null = null

          posts = await fetchPosts(config as ConfigState, (message) => {
            warning = message
          })

          if (!ignore) {
            setError(null)
            setWarning(warning)
          }
        } catch (fetchError) {
          if (ignore) return

          console.error("[!] Could not load wallpapers:", fetchError)
          setError((fetchError as Error).message)
          setLoaded(LoadState.LOADED)
          return
        }

        if (!ignore) {
          CacheStore.lastUpdated = Date.now()
          CacheStore.data = posts
        }
      } else {
        console.log("[i] Using cached posts")
        posts = cache.data as RedditPost[]
      }

      if (!posts.length || ignore) {
        if (!ignore) {
          // With history behind us the old wallpaper stays on screen, which
          // is indistinguishable from a broken reroll unless we say why.
          if (HistoryStore.history.length) {
            setWarning("Nothing matched your filters — showing the last one")
          }
          setLoaded(LoadState.LOADED)
        }
        return
      }

      // Reroll should visibly do something. When the filters leave more than
      // one candidate, never hand back the one already on screen.
      const currentUrl = HistoryStore.history[HistoryStore.i]?.url
      const pool =
        posts.length > 1 ? posts.filter((p) => p.url !== currentUrl) : posts
      const candidates = pool.length ? pool : posts

      const post = candidates[Math.floor(Math.random() * candidates.length)]

      console.log("[i] Loading post:", post)

      // Number the post against the full listing, not the filtered pool, so
      // the "#N of M" line still means what it says.
      pushPostToHistory(post, posts.indexOf(post), posts.length)
      CacheStore.lastRolled = Date.now()
      setLoaded(LoadState.LOADING)
    }

    run()

    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.data, cache.lastUpdated, config, loaded])

  const data =
    loaded !== LoadState.FETCH_NEW
      ? history.length
        ? history[i] || history[history.length - 1]
        : null
      : undefined

  const { layout, theme, source } = config
  const isColorOnly = source.kind === "color"
  const attributionSub = data?.subreddit || source.subreddits[0] || "wallpapers"

  return (
    <div className={showRollOverlay ? "roll-flashing" : ""}>
      {theme.customCss && <style>{theme.customCss}</style>}

      {showRollOverlay && (
        <div className="roll-overlay" aria-label="Rolling wallpaper">
          <FaSync size={48} />
        </div>
      )}

      <div
        className={
          "app-frame " +
          (!config.incognito && loaded === LoadState.LOADED ? "load" : "") +
          " " +
          (config.hideGui ? "hidden" : "") +
          (theme.kenBurns ? " ken-burns" : "") +
          (theme.vignette ? " vignetted" : "")
        }
      >
        <div
          className="content"
          data-align={layout.align}
          data-vertical={layout.vertical}
        >
          <div className="stage">
            <header>
              <div className="header-left">
                <TimeDate />

                {layout.showDetails && (
                  <div className="details hideable">
                    <p className="to-load to-delay-1">{data?.title}</p>
                    <p className="to-load to-delay-2">{data?.res}</p>
                  </div>
                )}

                <SearchBar />
                <QuickLinks />
                <QuoteWidget />
                <TodoList />
              </div>
            </header>
          </div>

          <div className="header-right">
            <Config />
          </div>

          <footer className="to-bottom hideable">
            <div className="attr">
              {layout.showAttribution && (
                <>
                  <p className="attr-from to-load to-delay-3">
                    {error ? (
                      <strong>
                        Couldn&apos;t load wallpapers <FaSadTear size={20} />
                      </strong>
                    ) : isColorOnly ? (
                      <strong>Solid background</strong>
                    ) : data === null ? (
                      <strong>
                        No images found <FaSadTear size={20} />
                      </strong>
                    ) : source.kind === "urls" ? (
                      <strong>Your images</strong>
                    ) : (
                      <>
                        Image from{" "}
                        <a href={`https://reddit.com/r/${attributionSub}`}>
                          <FaReddit size={20} /> r/{attributionSub}
                        </a>
                      </>
                    )}
                  </p>

                  <p className="attr-bottom to-load to-delay-4">
                    {error ? (
                      <>{error} • Check the Data tab in the menu</>
                    ) : isColorOnly ? (
                      <>Pick colours under Wallpaper in the menu</>
                    ) : data === null ? (
                      <>Try different filters! • Reddit down perhaps?</>
                    ) : warning ? (
                      <>
                        {warning} • Post{" "}
                        <strong>#{(data?.nums[0] || 0) + 1}</strong> of{" "}
                        <strong>{data?.nums[1]}</strong>
                      </>
                    ) : (
                      <>
                        Post <strong>#{(data?.nums[0] || 0) + 1}</strong> of{" "}
                        <strong>{data?.nums[1]}</strong> •{" "}
                        <a href={data?.link}>{data?.link}</a>
                      </>
                    )}
                  </p>
                </>
              )}

              {loaded !== LoadState.LOADED && !config.incognito && (
                <span className="attr-loader">
                  <PuffLoader color="white" size={18} />
                </span>
              )}
            </div>

            {layout.showCredits && (
              <div className="credits">
                <p>
                  Created with <FaHeart /> •{" "}
                  <a href="https://github.com/dlyrr/santi.tab">
                    santi.tab v{pkg.version}
                  </a>
                </p>
              </div>
            )}

            <MenuButton />
            <Menu />
          </footer>
        </div>

        {data === null || isColorOnly ? null : (
          <Image
            className="bg to-load-bg"
            src={data?.backgroundUrl || data?.url}
            alt=""
            onLoad={() => {
              setLoaded(LoadState.LOADED)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App

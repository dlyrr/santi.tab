import { chromium } from "playwright"

const urls = {
  "search, empty q":
    "https://www.reddit.com/r/Animewallpaper/search.json?q=&sort=top&t=year&show=all&restrict_sr=1&include_over_18=off",
  "search, flair q":
    'https://www.reddit.com/r/Animewallpaper/search.json?q=flair%3A"Desktop"&sort=top&t=year&show=all&restrict_sr=1&include_over_18=off',
  "listing top.json":
    "https://www.reddit.com/r/Animewallpaper/top.json?t=year&limit=100",
}

const browser = await chromium.launch()
const page = await browser.newPage()

for (const [label, url] of Object.entries(urls)) {
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded" })
    const body = await page.evaluate(() => document.body.innerText.slice(0, 300))
    let n = "n/a", after = "n/a"
    try { const j = JSON.parse(body.length < 300 ? body : await page.evaluate(()=>document.body.innerText)); n = j?.data?.children?.length; after = j?.data?.after } catch {}
    console.log(`${label}: HTTP ${res.status()} | children=${n} | after=${after}`)
    if (n === undefined || n === "n/a") console.log("   body:", body.slice(0,160).replace(/\s+/g,' '))
  } catch (e) {
    console.log(`${label}: ERROR ${e.message.split("\n")[0]}`)
  }
}
await browser.close()

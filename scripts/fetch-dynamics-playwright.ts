import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const MID = "545530293";
const DATA_DIR = path.join(process.cwd(), "public", "data");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function fetchDynamicsViaBrowser() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: UA,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  let best: any = null;

  page.on("response", async (resp) => {
    const url = resp.url();
    if (!url.includes("/x/polymer/web-dynamic/v1/feed/space")) return;
    try {
      const json = await resp.json();
      if (json?.code === 0 && json?.data?.items?.length > (best?.data?.items?.length ?? -1)) {
        best = json;
      }
    } catch {
      // ignore non-json
    }
  });

  await page.goto(`https://space.bilibili.com/${MID}/dynamic`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(5000);

  await browser.close();
  return best;
}

async function main() {
  console.log("Fetching dynamics via browser...");
  const data = await fetchDynamicsViaBrowser();
  const code = data?.code ?? -1;
  const items = data?.data?.items ?? [];
  console.log("Browser dynamics result:", code, "items:", items.length);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "dynamics.json"), JSON.stringify({ code, items }));
}

main().catch((e) => {
  console.error("Playwright fetch failed:", e.message);
  process.exit(1);
});

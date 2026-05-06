// E2E test for 2-phase crawl flow.
// Login → run discover → wait → screenshot inbox → bulk fetch → wait → screenshot fetched/review/skipped.
import puppeteer from "puppeteer";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@tramtuyen.local";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme123";
const OUT = path.resolve(process.cwd(), "docs/assets");

async function shot(page, name) {
  await fs.mkdir(OUT, { recursive: true });
  const file = path.join(OUT, `two-phase-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`📸 ${file}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForText(page, text, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const found = await page.evaluate(
      (t) => document.body.innerText.includes(t),
      text,
    );
    if (found) return true;
    await sleep(500);
  }
  return false;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1400, height: 900 },
  });
  const page = await browser.newPage();

  // (1) Login
  console.log("→ login");
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle2" });
  await page.type("input[name=email], input[type=email]", EMAIL);
  await page.type("input[name=password], input[type=password]", PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("button[type=submit]"),
  ]);
  console.log("  url after login:", page.url());

  // (2) Sources page screenshot (before discover)
  console.log("→ /admin/sources (before)");
  await page.goto(`${BASE}/admin/sources`, { waitUntil: "networkidle2" });
  await shot(page, "01-sources-before");

  // (3) Click Refresh on Mock Fixture row.
  console.log("→ click Refresh on Mock Fixture");
  // Find row containing "Mock Fixture", click its Refresh button.
  const clicked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr"));
    const row = rows.find((r) => r.textContent?.includes("Mock Fixture"));
    if (!row) return false;
    const btn = Array.from(row.querySelectorAll("button")).find(
      (b) => b.textContent?.trim().toLowerCase() === "refresh",
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (!clicked) throw new Error("Refresh button not found on Mock Fixture row");
  await sleep(8000); // wait for discover-job to finish

  // (4) Inbox: DISCOVERED tab
  console.log("→ /admin/discovered?status=DISCOVERED");
  await page.goto(`${BASE}/admin/discovered?status=DISCOVERED`, {
    waitUntil: "networkidle2",
  });
  await shot(page, "02-inbox-discovered");

  // (5) Bulk select first 3 + click Fetch nội dung
  console.log("→ bulk-fetch 3 items");
  await page.evaluate(() => {
    const cbs = Array.from(
      document.querySelectorAll('input[type=checkbox]'),
    ).filter((c) => c.parentElement?.tagName === "TD");
    for (let i = 0; i < Math.min(3, cbs.length); i++) {
      cbs[i].click();
    }
  });
  await sleep(300);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Fetch nội dung"),
    );
    btn?.click();
  });
  await sleep(8000); // wait for fetch-job

  // (6) FETCHED tab
  console.log("→ /admin/discovered?status=FETCHED");
  await page.goto(`${BASE}/admin/discovered?status=FETCHED`, {
    waitUntil: "networkidle2",
  });
  await shot(page, "03-inbox-fetched");

  // (7) Review queue
  console.log("→ /admin/review");
  await page.goto(`${BASE}/admin/review`, { waitUntil: "networkidle2" });
  await shot(page, "04-review-pending");

  // (8) Bulk-skip 2 from DISCOVERED tab
  console.log("→ bulk-skip 2 items");
  await page.goto(`${BASE}/admin/discovered?status=DISCOVERED`, {
    waitUntil: "networkidle2",
  });
  await page.evaluate(() => {
    const cbs = Array.from(
      document.querySelectorAll('input[type=checkbox]'),
    ).filter((c) => c.parentElement?.tagName === "TD");
    for (let i = 0; i < Math.min(2, cbs.length); i++) {
      cbs[i].click();
    }
  });
  await sleep(300);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Bỏ qua"),
    );
    btn?.click();
  });
  await sleep(2000);
  await page.goto(`${BASE}/admin/discovered?status=SKIPPED`, {
    waitUntil: "networkidle2",
  });
  await shot(page, "05-inbox-skipped");

  // (9) Sources page after run (counts column populated)
  console.log("→ /admin/sources (after, counts column)");
  await page.goto(`${BASE}/admin/sources`, { waitUntil: "networkidle2" });
  await shot(page, "06-sources-after");

  await browser.close();
  console.log("✓ done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Phase B: test gutenberg-vi (FULL license) — DB empty for this source so /admin/review will show new chapters.
import puppeteer from "puppeteer";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const EMAIL = "admin@tramtuyen.local";
const PASSWORD = "changeme123";
const OUT = path.resolve(process.cwd(), "docs/assets");

async function shot(page, name) {
  await fs.mkdir(OUT, { recursive: true });
  const file = path.join(OUT, `two-phase-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`📸 ${file}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox"],
  defaultViewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle2" });
await page.type("input[type=email]", EMAIL);
await page.type("input[type=password]", PASSWORD);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click("button[type=submit]"),
]);

await page.goto(`${BASE}/admin/sources`, { waitUntil: "networkidle2" });
console.log("→ click Refresh on Wikisource VI");
await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll("tr"));
  const row = rows.find((r) => r.textContent?.includes("Wikisource VI"));
  const btn = Array.from(row?.querySelectorAll("button") ?? []).find(
    (b) => b.textContent?.trim().toLowerCase() === "refresh",
  );
  btn?.click();
});
await sleep(15000);

await page.goto(`${BASE}/admin/discovered?status=DISCOVERED`, {
  waitUntil: "networkidle2",
});
await shot(page, "07-gutenberg-discovered");

console.log("→ select all + bulk fetch");
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.trim().includes("Chọn tất cả"),
  );
  btn?.click();
});
await sleep(300);
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("Fetch nội dung"),
  );
  btn?.click();
});
await sleep(15000);

await page.goto(`${BASE}/admin/review`, { waitUntil: "networkidle2" });
await shot(page, "08-gutenberg-review");

await page.goto(`${BASE}/admin/sources`, { waitUntil: "networkidle2" });
await shot(page, "09-sources-final");

await browser.close();
console.log("done");

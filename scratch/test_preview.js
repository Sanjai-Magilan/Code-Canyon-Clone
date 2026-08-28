import { chromium } from "/home/magilan/Games/Code-Canyon-Clone/node_modules/playwright/index.mjs";
import { spawn } from "child_process";

async function runTest() {
  console.log("1. Starting Vite preview server...");
  const previewProcess = spawn("npx", ["vite", "preview", "--port", "4173", "--strictPort"], {
    cwd: "/home/magilan/Games/Code-Canyon-Clone",
    stdio: "pipe",
    env: { ...process.env, FORCE_COLOR: "0" }
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("2. Launching Playwright Chromium Headless Browser...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on("console", (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log(`[REAL BROWSER CONSOLE]: ${text}`);
  });

  page.on("pageerror", (err) => {
    console.log(`[BROWSER UNCAUGHT EXCEPTION]: ${err.stack || err.message}`);
  });

  console.log("3. Navigating to main menu...");
  await page.goto("http://localhost:4173/");
  await page.waitForTimeout(1500);

  console.log("4. Clicking to enter CharacterSelectScene...");
  await page.mouse.click(960, 540);
  await page.waitForTimeout(1500);

  console.log("5. Clicking PLAY button to enter GameScene...");
  // Play button is centered at (960, 890)
  await page.mouse.click(960, 890);
  await page.waitForTimeout(2500);

  const screenshotPath = "/home/magilan/.gemini/antigravity-cli/brain/ad8f2b14-67e3-4d1f-a6b2-e65021e02bf0/game_scene_transition_success.png";
  await page.screenshot({ path: screenshotPath });
  console.log(`6. Screenshot saved to ${screenshotPath}`);

  console.log("7. Closing browser & server...");
  await browser.close();
  previewProcess.kill("SIGTERM");
}

runTest().catch((err) => {
  console.error("TEST ERROR:", err);
  process.exit(1);
});

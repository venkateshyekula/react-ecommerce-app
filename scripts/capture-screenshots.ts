import fs from "node:fs";
import path from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer";

type ViewportPreset = {
  name: string;
  width: number;
  height: number;
  isMobile?: boolean;
};

type ScreenshotRoute = {
  name: string;
  path: string;
  requiresAuth?: boolean;
};

// Extracted type utility to completely eliminate the 'any' error from image_7cbc1e.png
type PuppeteerCookies = Awaited<ReturnType<Page["cookies"]>>;

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
const LOGIN_EMAIL = process.env.LOGIN_EMAIL ?? "test@example.com";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD ?? "password123";

const viewports: ViewportPreset[] = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024, isMobile: true },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];

const routes: ScreenshotRoute[] = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "products", path: "/products" },
  { name: "electronics-category", path: "/categories/Electronics" },
  { name: "product-details", path: "/products/prod-001" },
  { name: "profile", path: "/profile", requiresAuth: true },
  { name: "cart", path: "/cart", requiresAuth: true },
  { name: "checkout", path: "/checkout", requiresAuth: true },
  { name: "orders", path: "/orders", requiresAuth: true },
  { name: "not-found", path: "/unknown-route" }
];

const ensureScreenshotDirectory = (): void => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
};

const waitForPageReady = async (page: Page): Promise<void> => {
  try {
    await page.waitForNetworkIdle({
      idleTime: 700,
      timeout: 15000
    });
  } catch {
    console.warn("Network idle timeout reached, moving forward with asset evaluation.");
  }

  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      })
    );
  });
};

const gotoPage = async (page: Page, routePath: string): Promise<void> => {
  const url = `${APP_BASE_URL}${routePath}`;
  await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 30000
  });
  await waitForPageReady(page);
};

// FIX 1: Explicit type replacement here for image_7cbc1e.png
const performGlobalLogin = async (page: Page): Promise<PuppeteerCookies> => {
  console.log("Performing global authentication initialization step...");
  await gotoPage(page, "/login");

  const emailInput = await page.$('input[name="email"]');
  const passwordInput = await page.$('input[name="password"]');

  if (!emailInput || !passwordInput) {
    throw new Error("Global authentication initialization failed: Login fields missing.");
  }

  await page.click('input[name="email"]', { clickCount: 3 });
  await page.type('input[name="email"]', LOGIN_EMAIL, { delay: 10 });

  await page.click('input[name="password"]', { clickCount: 3 });
  await page.type('input[name="password"]', LOGIN_PASSWORD, { delay: 10 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }),
    page.click('button[type="submit"]')
  ]);

  await waitForPageReady(page);
  
  return await page.cookies();
};

const addSampleProductToCart = async (page: Page): Promise<void> => {
  await gotoPage(page, "/products/prod-001");

  const buttonHandles = await page.$$("button");
  let clicked = false;

  for (const buttonHandle of buttonHandles) {
    const buttonText = await page.evaluate(
      (button) => button.textContent?.trim() ?? "",
      buttonHandle
    );

    if (buttonText.includes("Add to Cart")) {
      await buttonHandle.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    throw new Error("Target 'Add to Cart' action button context not resolved.");
  }
};

// FIX 2: Explicit type declaration applied to argument input parameter
const captureRouteScreenshot = async (
  browser: Browser,
  route: ScreenshotRoute,
  viewport: ViewportPreset,
  authCookies: PuppeteerCookies
): Promise<void> => {
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      isMobile: viewport.isMobile ?? false
    });

    if (route.requiresAuth) {
      if (authCookies.length === 0) {
        throw new Error("Route requires authentication but no global cookies are available.");
      }
      await page.setCookie(...authCookies);

      if (route.path === "/checkout") {
        await addSampleProductToCart(page);
      }
    }

    await gotoPage(page, route.path);

    const screenshotPath = path.join(
      SCREENSHOT_DIR,
      `${route.name}-${viewport.name}.png`
    );

    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Captured: ${screenshotPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown screenshot error";
    console.error(`Failed: ${route.name}-${viewport.name}. Reason: ${message}`);
  } finally {
    await page.close();
  }
};

const captureScreenshots = async (): Promise<void> => {
  ensureScreenshotDirectory();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  // FIX 3: Explicit typing applied to local state assignment pointer
  let sharedAuthCookies: PuppeteerCookies = [];

  try {
    const authSetupPage = await browser.newPage();
    try {
      sharedAuthCookies = await performGlobalLogin(authSetupPage);
      console.log(`Successfully cached ${sharedAuthCookies.length} authentication session cookies.`);
    } catch (authError) {
      console.error("Critical Failure: Global authentication block failed. Aborting script run.");
      throw authError;
    } finally {
      await authSetupPage.close();
    }

    for (const viewport of viewports) {
      for (const route of routes) {
        await captureRouteScreenshot(browser, route, viewport, sharedAuthCookies);
      }
    }
  } catch (globalError) {
    console.error("Batch processing execution broke early:", globalError);
  } finally {
    await browser.close();
  }
};

void captureScreenshots();
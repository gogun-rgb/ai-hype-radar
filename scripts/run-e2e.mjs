import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const localUrl = "http://localhost:3000";
const readinessUrl = "http://[::1]:3000/api/analyses";
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const playwrightBin = path.join(process.cwd(), "node_modules", "playwright", "cli.js");

const server = spawn(process.execPath, [nextBin, "dev", "--hostname", "localhost"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    DEMO_MODE: "true",
    E2E_DEMO: "true",
    NEXT_PUBLIC_APP_URL: localUrl,
    NO_PROXY: "localhost,127.0.0.1,::1",
    no_proxy: "localhost,127.0.0.1,::1"
  }
});

let exitCode = 0;

try {
  await waitForServer(readinessUrl, 45_000);

  const result = spawnSync(process.execPath, [playwrightBin, "test", "--config", "playwright.config.ts", "--reporter", "list"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_SKIP_WEBSERVER: "true",
      PLAYWRIGHT_BASE_URL: localUrl,
      NO_PROXY: "localhost,127.0.0.1,::1",
      no_proxy: "localhost,127.0.0.1,::1"
    }
  });

  exitCode = result.status ?? 1;
  if (result.error) {
    console.error(result.error);
    exitCode = 1;
  }
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  stopProcessTree(server.pid);
}

process.exit(exitCode);

async function waitForServer(url, timeoutMs) {
  const started = Date.now();
  let lastError;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await httpGet(url);
      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
        return;
      }
      lastError = new Error(`HTTP ${response.statusCode}${response.body ? `: ${response.body.slice(0, 500)}` : ""}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Next dev server did not become ready: ${lastError instanceof Error ? lastError.message : "unknown error"}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({ statusCode: response.statusCode, body });
      });
    });
    request.on("error", reject);
    request.setTimeout(3000, () => {
      request.destroy(new Error("request timeout"));
    });
  });
}

function stopProcessTree(pid) {
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process may already be gone.
    }
  }
}

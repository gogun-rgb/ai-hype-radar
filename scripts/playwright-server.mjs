import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
let shuttingDown = false;

const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "localhost"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    DEMO_MODE: process.env.DEMO_MODE ?? "true",
    E2E_DEMO: process.env.E2E_DEMO ?? "true",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NO_PROXY: "localhost,127.0.0.1,::1",
    no_proxy: "localhost,127.0.0.1,::1"
  }
});

function shutdown() {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (process.platform === "win32" && child.pid) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }

  setTimeout(() => process.exit(0), 500).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

child.on("exit", (code) => {
  if (shuttingDown) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});

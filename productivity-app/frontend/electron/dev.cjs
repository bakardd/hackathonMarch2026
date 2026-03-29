const { spawn } = require("child_process");
const path = require("path");

const rendererUrl = "http://localhost:5173";
const rootDir = path.resolve(__dirname, "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const electronBinary = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "electron.cmd" : "electron");

let viteProcess;
let electronProcess;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill("SIGTERM");
  }

  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill("SIGTERM");
  }

  setTimeout(() => process.exit(code), 100);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRenderer(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}

    await wait(300);
  }

  throw new Error(`Timed out waiting for Vite at ${url}`);
}

async function main() {
  viteProcess = spawn(npmCmd, ["run", "dev", "--", "--host", "127.0.0.1"], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  viteProcess.on("exit", (code) => {
    if (!shuttingDown) {
      shutdown(code ?? 1);
    }
  });

  await waitForRenderer(rendererUrl);

  electronProcess = spawn(electronBinary, ["."], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: rendererUrl,
    },
  });

  electronProcess.on("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(error.message);
  shutdown(1);
});

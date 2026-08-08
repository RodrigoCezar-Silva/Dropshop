#!/usr/bin/env node
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const targetUrl = process.argv[2] || "http://127.0.0.1:5501/html/index.html";
const timeoutMs = Number(process.env.BROWSER_OPEN_TIMEOUT_MS || 20000);

function request(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });

    req.on("error", reject);
    req.setTimeout(1500, () => req.destroy(new Error("timeout")));
  });
}

async function waitForServer(url, timeout) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    try {
      const status = await request(url);
      if (status >= 200 && status < 500) {
        return;
      }
    } catch {
      // Continue waiting until the app responds.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

function findChromeExecutable() {
  if (process.platform !== "win32") {
    return null;
  }

  const candidates = [];
  const programFiles = process.env.ProgramFiles;
  const programFilesX86 = process.env["ProgramFiles(x86)"];
  const localAppData = process.env.LOCALAPPDATA;

  if (programFiles) {
    candidates.push(path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"));
  }

  if (programFilesX86) {
    candidates.push(path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"));
  }

  if (localAppData) {
    candidates.push(path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"));
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function openBrowser(url) {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      const chromePath = findChromeExecutable();
      if (chromePath) {
        execFile(chromePath, [url], { windowsHide: false }, () => resolve());
        return;
      }

      execFile("cmd", ["/c", "start", "", url], { windowsHide: false }, () => resolve());
      return;
    }

    if (process.platform === "darwin") {
      execFile("open", ["-a", "Google Chrome", url], { windowsHide: false }, () => resolve());
      return;
    }

    execFile("xdg-open", [url], { windowsHide: false }, () => resolve());
  });
}

(async () => {
  try {
    await waitForServer(targetUrl, timeoutMs);
    await openBrowser(targetUrl);
    console.log(`Browser opened: ${targetUrl}`);
  } catch (error) {
    console.warn(`Could not open browser automatically: ${error.message}`);
  }
})();

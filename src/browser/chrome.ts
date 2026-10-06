import { chromium, type Browser } from "playwright";
import { spawn } from "node:child_process";

const CHROME_PATH =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const DEBUG_PORT = 9222;
const PROFILE_DIR = "C:\\chrome-debug";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function isChromeRunning(): Promise<boolean> {
    try {
        const response = await fetch(
            `http://127.0.0.1:${DEBUG_PORT}/json/version`
        );

        return response.ok;
    } catch {
        return false;
    }
}

async function waitForChrome(): Promise<void> {
    for (let i = 0; i < 50; i++) {
        try {
            const response = await fetch(
                `http://127.0.0.1:${DEBUG_PORT}/json/version`
            );

            if (response.ok) {
                return;
            }
        } catch {
            // Chrome is still starting.
        }

        await sleep(100);
    }

    throw new Error(
        `Chrome did not start with CDP on port ${DEBUG_PORT}`
    );
}

export async function startChrome(): Promise<void> {
    if (await isChromeRunning()) {
        console.log("Chrome already running");
        return;
    }

    console.log("Starting Chrome...");

    spawn(
        CHROME_PATH,
        [
            `--remote-debugging-port=${DEBUG_PORT}`,
            `--user-data-dir=${PROFILE_DIR}`,
        ],
        {
            detached: true,
            stdio: "ignore",
        }
    ).unref();

    await waitForChrome();

    console.log("Chrome ready");
}

export async function connectToChrome(): Promise<Browser> {
    await startChrome();

    const browser = await chromium.connectOverCDP(
        `http://127.0.0.1:${DEBUG_PORT}`
    );

    return browser;
}
import {
    chromium,
    type Browser,
    type BrowserContext,
} from "playwright";

import {
    execFile,
    spawn,
    type ChildProcess,
} from "node:child_process";

import { promisify } from "node:util";

const CHROME_PATH =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const DEBUG_PORT = 9222;

const WINDOWS_PROFILE_DIR =
    "C:\\chrome-debug";

const DOCKER_PROFILE_DIR =
    "/home/pwuser/.cache/leetcode-profile";

const execFileAsync = promisify(execFile);

let chromeProcess: ChildProcess | null = null;
let chromeStartedByAutomation = false;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function isDocker(): boolean {
    return process.env.DOCKER === "true";
}

async function isChromeRunning(): Promise<boolean> {
    try {
        const response = await fetch(
            `http://127.0.0.1:${DEBUG_PORT}/json/version`,
        );

        return response.ok;
    } catch {
        return false;
    }
}

async function waitForChrome(): Promise<void> {
    for (let i = 0; i < 50; i++) {
        if (await isChromeRunning()) {
            return;
        }

        await sleep(100);
    }

    throw new Error(
        `Chrome did not start with CDP on port ${DEBUG_PORT}`,
    );
}

async function startWindowsChrome(): Promise<void> {
    const alreadyRunning = await isChromeRunning();

    if (alreadyRunning) {
        console.log("Chrome already running.");
        chromeStartedByAutomation = false;
        return;
    }

    console.log("Starting Windows Chrome...");

    chromeProcess = spawn(
        CHROME_PATH,
        [
            `--remote-debugging-port=${DEBUG_PORT}`,
            `--user-data-dir=${WINDOWS_PROFILE_DIR}`,
        ],
        {
            detached: false,
            stdio: "ignore",
        },
    );

    chromeStartedByAutomation = true;

    await waitForChrome();

    console.log("Chrome started by automation.");
}

/**
 * Docker:
 * Launch Chromium with a persistent user profile.
 *
 * The profile survives container restarts because the
 * Docker Compose volume will mount this directory.
 */
async function startDockerBrowser(): Promise<BrowserContext> {
    console.log("Starting persistent Playwright Chromium...");

    const context = await chromium.launchPersistentContext(
        DOCKER_PROFILE_DIR,
        {
            headless: true,

            args: [
                "--disable-dev-shm-usage",
            ],
        },
    );

    console.log(
        "Persistent Chromium started.",
    );

    return context;
}

/**
 * Windows:
 * Return a Browser.
 *
 * Docker:
 * Return a persistent BrowserContext.
 */
export async function connectToChrome(): Promise<
    Browser | BrowserContext
> {
    if (isDocker()) {
        return await startDockerBrowser();
    }

    await startWindowsChrome();

    return await chromium.connectOverCDP(
        `http://127.0.0.1:${DEBUG_PORT}`,
    );
}

export async function closeChromeIfStarted(): Promise<void> {
    if (isDocker()) {
        return;
    }

    if (
        !chromeStartedByAutomation ||
        !chromeProcess
    ) {
        console.log(
            "Chrome was not started by automation. Leaving it open.",
        );

        return;
    }

    console.log(
        "Closing Chrome started by automation...",
    );

    try {
        if (process.platform === "win32") {
            chromeProcess.kill();
        } else {
            chromeProcess.kill("SIGTERM");
        }

        console.log("Chrome closed.");
    } catch (error) {
        console.error(
            "Failed to close Chrome:",
            error,
        );
    }

    chromeProcess = null;
    chromeStartedByAutomation = false;
}
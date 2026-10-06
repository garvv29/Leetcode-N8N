import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runGit(args: string[]): Promise<string> {
    const { stdout, stderr } = await execFileAsync("git", args, {
        cwd: process.cwd(),
        windowsHide: true,
    });

    if (stderr.trim()) {
        console.log(stderr.trim());
    }

    return stdout.trim();
}

export async function gitAddAndCommit(
    files: string[],
    message: string,
): Promise<void> {
    console.log("\nPreparing Git commit...");

    await runGit(["add", ...files]);

    const status = await runGit(["status", "--short"]);

    if (!status) {
        console.log("No Git changes to commit.");
        return;
    }

    console.log("Changes:");
    console.log(status);

    await runGit(["commit", "-m", message]);

    console.log(`Git commit created: ${message}`);
}

export async function gitPush(): Promise<void> {
    console.log("\nPushing to GitHub...");

    await runGit(["push"]);

    console.log("GitHub push completed.");
}
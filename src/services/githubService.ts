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

export async function commitArchive(
    archivePath: string,
    date: string,
    title: string,
): Promise<void> {
    console.log("\nCommitting archive to Git...");

    await runGit(["add", archivePath]);

    const status = await runGit(["status", "--short"]);

    if (!status) {
        console.log("No archive changes to commit.");
        return;
    }

    console.log(status);

    const message = `chore: add LeetCode solution for ${date} - ${title}`;

    await runGit(["commit", "-m", message]);

    console.log(`Git commit created: ${message}`);
}

export async function pushToGitHub(): Promise<void> {
    console.log("\nPushing archive to GitHub...");

    await runGit(["push"]);

    console.log("GitHub push completed.");
}
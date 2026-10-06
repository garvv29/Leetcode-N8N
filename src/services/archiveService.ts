import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface ArchiveData {
    date: string;
    title: string;
    difficulty: string;
    url: string;
    language: string;
    model: string;
    code: string;
    status: string;
    attempts: number;
}

export async function archiveSolution(
    data: ArchiveData
): Promise<string> {
    const archiveDirectory =
        path.resolve("archive");

    await mkdir(
        archiveDirectory,
        {
            recursive: true,
        }
    );

    const safeTitle =
        data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

    const filename =
        `${data.date}-${safeTitle}.md`;

    const filepath =
        path.join(
            archiveDirectory,
            filename
        );

    const markdown = `# ${data.title}

**Date:** ${data.date}

**Difficulty:** ${data.difficulty}

**LeetCode:** ${data.url}

**Status:** ${data.status}

**Attempts:** ${data.attempts}

**Language:** ${data.language}


---

## Solution

\`\`\`cpp
${data.code}
\`\`\`
`;

    await writeFile(
        filepath,
        markdown,
        "utf8"
    );

    console.log(
        `Markdown archive created: ${filepath}`
    );

    return filepath;
}
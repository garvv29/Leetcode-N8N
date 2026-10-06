import express from "express";
import { runAutomation } from "./automation.js";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.post("/run", async (_req, res) => {
    console.log("n8n requested automation");

    try {
        const result = await runAutomation();

        res.json(result);
    } catch (error) {
        console.error("\nAutomation request failed:");
        console.error(error);

        res.status(500).json({
            status: "FAILED",
            error: error instanceof Error
                ? error.message
                : String(error),
        });
    }
});

app.listen(3000, "0.0.0.0", () => {
    console.log(
        "Automation API running on http://localhost:3000",
    );
});
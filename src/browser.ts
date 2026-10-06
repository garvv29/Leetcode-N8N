import { runAutomation } from "./automation.js";

runAutomation().catch((error) => {
    console.error("\nAutomation failed:");
    console.error(error);

    process.exit(1);
});
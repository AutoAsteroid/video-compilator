import { intro, text, outro, isCancel } from "@clack/prompts";
import pc from "picocolors";
import VideoPipeline from "./pipeline.js";
import ProgressBar from "./progress.js";

/**
 * Helper function called to safely stop the command line interface and video pipeline
 */
function cancel(message) {
    outro(pc.red(message));
    process.exit();
}

/**
 * ffmpeg CLI wrapper to join video and image files into a single video compilation.
 * Supports smart export defaults, join ordering, progress bars, and normalization.
 */

async function main() {
    intro(pc.bold(pc.cyan("Welcome to Video-Compilator! @ github.com/AutoAsteroid")));

    const folder = await text({
        message: "Where are your image and video files located?",
        placeholder: "Relative or absolute path to folder..."
    });
    if (isCancel(folder)) return cancel("Operation cancelled. Exiting.");

    const pipeline = new VideoPipeline(folder);
    const scanProgress = new ProgressBar("Scanning");

    scanProgress.start();
    await pipeline.scanFiles(scanProgress);
    scanProgress.stop(`Successfully loaded ${pipeline.assets.length} media asset(s).`);

    if (pipeline.assets.length === 0)
        return cancel("Could not find any media files at the provided path.");
}

// Execute the main command line interface video pipeline with global error catching
main().catch(({ message }) => cancel(message));

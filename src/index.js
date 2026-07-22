import { intro, text, outro, isCancel } from "@clack/prompts";
import pc from "picocolors";
import VideoPipeline from "./pipeline.js";
import ProgressBar from "./progress.js";

// Helper function called to safely stop the command line interface and video pipeline
function cancel(message) {
    outro(pc.red(message));
    process.exit();
}

// Helper function wrapping a @clack/prompts promise to handle cancellation globally
async function ask(prompt) {
    const result = await prompt;
    if (isCancel(result))
        cancel("Operation cancelled. Exiting.");
    else return result;
}

/**
 * ffmpeg CLI wrapper to join video and image files into a single video compilation.
 * Supports smart export defaults, join ordering, progress bars, and normalization.
 */

async function main() {
    intro(pc.bold(pc.cyan("Welcome to Video-Compilator! @ github.com/AutoAsteroid")));

    // Recursively scan the input folder path into pipeline.assets Asset class instances
    const folder = await ask(text({
        message: "Where are your image and video files located?",
        placeholder: "Relative or absolute path to folder..."
    }));

    const pipeline = new VideoPipeline(folder);
    const scanProgress = new ProgressBar("Scanning");

    scanProgress.start();
    await pipeline.scanFiles(scanProgress);
    scanProgress.stop(`Successfully loaded ${pipeline.assets.length} media asset(s).`);

    if (pipeline.assets.length === 0)
        return cancel("Could not find any media files at the provided path.");

    // Set the length each output image should be at if we detected any image assets
    if (pipeline.assets.some(asset => asset.isImage)) {
        const durationInput = await ask(text({
            message: "How many seconds should each image be displayed?",
            validate: (value) => {
                const input = parseFloat(value);
                if (isNaN(input) || input <= 0)
                    return "Enter a valid duration in seconds (e.g., 3 or 2.5).";
            }
        }));
        pipeline.setImageLength(parseFloat(durationInput));
    }

    const outputName = await ask(text({ 
        message: "What should the merged video compilation be named?", 
        initialValue: new Date().toLocaleString() + ".mp4"
    }));
}

// Execute the main command line interface video pipeline with global error catching
main().catch(({ message }) => cancel(message));

import { intro, text, select, outro, isCancel } from "@clack/prompts";
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

    // Output video will be encoded in the "../output" folder of this directory
    const outputName = await ask(text({ 
        message: "What should the merged video compilation be named?", 
        initialValue: new Date().toLocaleString() + ".mp4"
    }));

    // The default resolution is the most common resolution from input asset files
    const smartResolution = pipeline.getSmartResolution();
    const targetResolution = await ask(select({
        message: "Select an output video resolution:",
        options: [
            { value: smartResolution, label: `Default (${smartResolution})` },
            { value: "1920x1080", label: "1080p Full HD (1920x1080)" },
            { value: "3840x2160", label: "4K Ultra HD (3840x2160)" },
            { value: "1080x1920", label: "Vertical HD (1080x1920)" },
            { value: "1280x720", label: "720p HD (1280x720)" },
            { value: "1080x1080", label: "Square (1080x1080)" },
        ],
        initialValue: smartResolution,
    }));

    // The default frame rate is the most common frame rate from input asset files
    const smartFrameRate = pipeline.getSmartFrameRate();
    const targetFps = await ask(select({
        message: "Select an output video frame rate:",
        options: [
            { value: smartFrameRate, label: `${smartFrameRate} FPS (Default)` },
            { value: "60000/1001", label: "59.94 FPS (NTSC High)" },
            { value: "30000/1001", label: "29.97 FPS (NTSC Standard)" },
            { value: "24000/1001", label: "23.976 FPS (Cinematic)" },
            { value: "60/1", label: "60 FPS" },
            { value: "30/1", label: "30 FPS" },
            { value: "24/1", label: "24 FPS" },
        ],
        initialValue: smartFrameRate,
    }));

    pipeline.setResolution(targetResolution);
    pipeline.setFrameRate(targetFps)
}

// Execute the main command line interface video pipeline with global error catching
main().catch(({ message }) => cancel(message));

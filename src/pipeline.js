import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pc from "picocolors";
import Asset from "./asset.js";
import { fisherYatesShuffle } from "./utils.js";

export default class VideoPipeline {
    /**
     * Class representation pipeline used to orchestrate the full fmmpeg video compilation process.
     * @param {string} inputDirectory The input folder that has the video and/or image files to join.
     */
    constructor(inputDirectory) {
        // Remove any trailing whitespace and single/double quotes
        this.inputDirectory = inputDirectory.trim().replace(/^['"]|['"]$/g, "");
        this.assets = [];
        this.normalizedPaths = [];
    }

    /**
     * Sets the output target resolution that files will all have to be normalized to match
     * @param {string} resolution Resolution formatted as #x#, e.g. "1920x1080", "3840x2160"
     */
    setResolution(resolution) {
        const [ w, h ] = resolution.split("x");
        this.targetWidth = parseInt(w, 10);
        this.targetHeight = parseInt(h, 10);
        this.resolution = resolution;
    }

    /**
     * Sets the output target frame rate that files will all have to be normalized to match
     * @returns {string} Raw fraction frame rate string representation for FFmpeg (e.g. "30000/1001")
     */
    setFrameRate(frameRate) {
        this.targetFPS = frameRate;
    }

    /**
     * Sets the length in seconds that image inputs will be looped to match in the output file
     * @param {number} seconds Seconds each image file will take in the final output video file
     */
    setImageLength(seconds) {
        this.imageLength = seconds;
    }

    /**
     * Returns a dynamic resolution of the most common input resolution to limit normalization needed
     * @returns {string} Resolution string formatted as #x#, e.g. "1920x1080", "3840x2160"
     */
    getSmartResolution() {
        if (!this.assets || this.assets.length === 0) return "1920x1080";

        const weights = {}; // { "1920x1080": duration }
        for (const { duration, resolution, isImage } of this.assets) {
            // Looping images are weighted at only 15% the computational effort to encode
            const weight = isImage ? this.imageLength * 0.15 : duration;
            weights[resolution] ??= 0;
            weights[resolution] += weight;
        }

        // Smart resolution is the most common. We want to skip normalizing these
        let topResolution = "1920x1080";
        let maxWeight = -1;

        for (const [ resolution, totalWeight ] of Object.entries(weights)) {
            if (totalWeight > maxWeight) {
                maxWeight = totalWeight;
                topResolution = resolution;
            }
        }
        return topResolution;
    }

    /**
     * Returns a dynamic frame rate of the most common input frame rate to limit normalization needed
     * @returns {string} Raw fraction frame rate string representation for FFmpeg (e.g. "30000/1001")
     */
    getSmartFrameRate() {
        if (!this.assets || this.assets.length === 0) return "30/1";

        const weights = {};
        for (const { duration, rawFPS, isImage } of this.assets) {
            // Skip images entirely as they adopt whatever FPS the output video uses
            if (isImage || !rawFPS || rawFPS === "0/0") continue;

            weights[rawFPS] ??= 0;
            weights[rawFPS] += duration;
        }

        // Smart frame rate is the most common. We want to skip normalizing these
        let topFrameRate = "30/1";
        let maxWeight = -1;

        for (const [ rawFPS, totalWeight ] of Object.entries(weights)) {
            if (totalWeight > maxWeight) {
                maxWeight = totalWeight;
                topFrameRate = rawFPS;
            }
        }
        return topFrameRate;
    }

    /**
     * Recursively appends file paths to this.assets array in the initialized input directory
     * @param {import("./progress").default} progress Progress bar clack spinner wrapper class instance
     * @param {string} [directory=this.inputDirectory] Current directory path being scanned
     * @returns {Promise<void>} Appends objects representing input file meta data into this.assets
     */
    async scanFiles(progress, directory = this.inputDirectory) {
        if (!fs.existsSync(directory)) return;

        // Expand total task count dynamically as new file entries are found
        const entries = fs.readdirSync(directory);
        progress.addTotalTasks(entries.length);

        for (const entry of entries) {
            const fullPath = path.join(directory, entry);
            const fileStat = fs.statSync(fullPath);

            // Handle any sub folders recursively depth first
            if (fileStat.isDirectory()) {
                await this.scanFiles(progress, fullPath);
                continue;
            }

            // Process the current file entry asset metadata
            progress.setMessage(fullPath, false);
            const asset = new Asset(fullPath);
            await asset.analyze();

            if (asset.isValidMedia)
                this.assets.push(asset);

            progress.completeTask(entry);
        }
    }

    /**
     * Sorts the assets array given the provided preset string, changing the order files are stitched
     * @param {string} method Preset sort method described by the hard coded function methods below
     * @returns {Array<Object>} Returns the sorted this.assets array of objects
     */
    sortFiles(method) {
        // Randomly shuffle this.assets in place and return this.assets
        if (method === "RANDOM") return fisherYatesShuffle(this.assets);

        // Hard coded sort methods to join the output video compilation by
        const sortMethods = {
            ALPHABETICAL_ASC: (a, b) => a.name.localeCompare(b.name),
            ALPHABETICAL_DESC: (a, b) => b.name.localeCompare(a.name),
            DATE_ASC: (a, b) => a.birthTime - b.birthTime,
            DATE_DESC: (a, b) => b.birthTime - a.birthTime,
            DURATION_ASC: (a, b) => a.duration - b.duration,
            DURATION_DESC: (a, b) => b.duration - a.duration,
            SIZE_ASC: (a, b) => a.size - b.size,
            SIZE_DESC: (a, b) => b.size - a.size,
            TYPE_ASC: (a, b) => a.extension.localeCompare(b.extension),
            TYPE_DESC: (a, b) => b.extension.localeCompare(a.extension),
        };
        return this.assets.sort(sortMethods[method]);
    }

    /**
     * Normalize all assets with the given output parameters so the final stitching can use -c copy
     * @param {import("./progress").default} progress Progress bar clack spinner wrapper class instance
     */
    async normalizeFiles(progress) {
        // Assure that the directory for normalization is empty so there are no ffmpeg conflicts
        fs.rmSync("normalized", { recursive: true, force: true }); 
        fs.mkdirSync("normalized");
 
        const { targetWidth, targetHeight, targetFPS, imageLength } = this;

        // Video frame normalization to match the target resolution and FPS with black box padding
        const vf = [
            `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
            `pad=${targetWidth}:${targetHeight}:(${targetWidth}-iw)/2:(${targetHeight}-ih)/2:black`,
            `fps=${targetFPS}`
        ].join(",");

        for (let i = 0; i < this.assets.length; i++) {
            const asset = this.assets[i];
            const outputPath = path.join("normalized", i + ".mp4");
            const duration = asset.isImage ? imageLength : asset.duration;

            // Initialize base ffmpeg normalization promise before adding our parametered outputs
            const ffmpegCMD = ffmpeg(asset.path);
            const normalize = new Promise((resolve, reject) => ffmpegCMD
                .outputOptions([ "-xerror" ])
                .on("start", () => progress.updateTask(0, asset.path))
                .on("end", resolve)
                .on("error", reject)
                .on("progress", ({ percent }) => progress.updateTask(percent, asset.path))
                .save(outputPath)
            );

            // Loop image frames into a video for the provided image duration given by the user
            if (asset.isImage) ffmpegCMD.inputOptions(["-loop 1", `-t ${duration}`]);

            // Both images and silent videos need the same visual filter and silent audio source
            if (!asset.hasAudio)
                ffmpegCMD.complexFilter(`[0:v]${vf}[v]; anullsrc=r=44100:cl=stereo:d=${duration}[a]`);
            else ffmpegCMD.complexFilter(`[0:v]${vf}[v]`);

            // Strict output options to guarantee the same stream specifications for final stitching
            ffmpegCMD.outputOptions(["-map [v]", `-t ${duration}`]);
            ffmpegCMD.outputOptions(!asset.hasAudio ? "-map [a]" : "-map 0:a:0");
            ffmpegCMD.outputOptions([ 
                "-c:v libx264", "-pix_fmt yuv420p", "-profile:v main", "-level:v 3.1",
                "-c:a aac", "-b:a 128k", "-ar 44100", "-ac 2", "-sn", "-nostdin" 
            ]);

            await normalize;
            this.normalizedPaths.push(path.resolve(outputPath));
            progress.completeTask(asset.path);
        }
        
        return this.normalizedPaths;
    }

    /**
     * Stitches the normalized video files together into a final output video using -c copy flag
     * ffmpeg -c copy copies the bits directly and does not need to re-encode the video if used
     * @param {string} outputName The output video file name to place in the output folder
     * @param {import("./progress").default} progress Progress bar clack spinner wrapper class instance
     * @returns {Promise<string|Error>} Output path the video is located at once over 
     */
    async stitchFiles(outputName, progress) {
        if (!fs.existsSync("output")) fs.mkdirSync("output");

        const safeOutputName = outputName.replace(/[/\\?%*:|"<>]/g, "-");
        const outputPath = path.resolve("output", safeOutputName);
        const listFilePath = path.resolve("normalized", "concat.txt");

        // Normalized paths are absolute paths, format them for FFmpeg's demuxer format
        const manifestContent = this.normalizedPaths
            .map((file) => `file '${file.replace(/\\/g, "/")}'`)
            .join("\n");

        fs.writeFileSync(listFilePath, manifestContent, "utf8");

        // Combine the normalized videos using -c copy to copy video bits directly  
        return new Promise((resolve, reject) => ffmpeg(listFilePath)
            .inputOptions([ "-f concat", "-safe 0" ])
            .outputOptions([ "-c copy", "-movflags +faststart" ])
            .on("progress", ({ percent }) => progress.updateTask(percent))
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .save(outputPath)
        );
    }
}
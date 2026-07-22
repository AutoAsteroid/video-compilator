import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pc from "picocolors";
import { fileTypeFromFile } from "file-type";
import { fisherYatesShuffle, probeFile } from "./utils.js";

export default class VideoPipeline {
    /**
     * Class representation pipeline used to orchestrate the full fmmpeg video compilation process.
     * @param {string} inputDirectory The input folder that has the video and/or image files to join.
     */
    constructor(inputDirectory) {
        // Remove any trailing whitespace and single/double quotes
        this.inputDirectory = inputDirectory.trim().replace(/^['"]|['"]$/g, "");
		this.assets = [];
		this.tempDirectory = "./normalized";
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
     * @param {number} frameRate Positive integer representing frames per second
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

    }

    /**
     * Returns a dynamic frame rate of the most common input frame rate to limit normalization needed
     * @returns {number} Positive integer representing most frequent frames per second of video
     */
    getSmartFrameRate() {

    }

    /**
     * Recursively appends file paths to this.assets array in the initialized input directory
     * @param {import("./progress").default} progress Progress bar clack spinner class instance
     * @param {string} [directory=this.inputDirectory] Current directory path being scanned
     * @returns {Promise<void>} Appends objects representing input file meta data into this.assets
     */
    async scanFiles(progress, directory = this.inputDirectory) {
        if (!fs.existsSync(directory)) return; 

        const entries = fs.readdirSync(directory);

        // Expand total task count dynamically as entries are found
        progress.addTotalTasks(entries.length);

        for (const entry of entries) {
            const fullPath = path.join(directory, entry);
            const fileStat = fs.statSync(fullPath);

            // Handle Subdirectories recursively
            if (fileStat.isDirectory()) {
                await this.scanFiles(progress, fullPath);
                // Mark the directory entry itself as complete so totalTask math stays balanced
                progress.completeTask(entry);
                continue;
            }

            // Show current file being probed without incrementing completion count yet
            progress.setMessage(entry, false);

            // Probe file metadata with FFmpeg
            const meta = await probeFile(fullPath);
            
            // Skip non-media or unreadable files
            if (!meta || !meta.streams || meta.streams.length === 0) {
                progress.completeTask(entry);
                continue;
            }

            // Ensure file contains a visual video/image stream
            const videoStream = meta.streams.find((s) => s.codec_type === "video");
            if (!videoStream) {
                progress.completeTask(entry);
                continue;
            }

            const isImage = ["mjpeg", "png", "bmp", "webp"].includes(videoStream.codec_name);
            const duration = meta.format?.duration ? parseFloat(meta.format.duration) : 0;

            this.assets.push({
                path: fullPath,
                name: entry,
                size: fileStat.size,
                birthTime: fileStat.birthtimeMs,
                image: isImage,
                duration: duration,
                width: videoStream.width || 0,
                height: videoStream.height || 0,
            });

            // Mark file scan as complete (locks in green segment)
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
            TYPE_ASC: (a, b) => a.extension - b.extension,
            TYPE_DESC: (a, b) => b.extension - a.extension,
        };
        return this.assets.sort(sortMethods[method]);
    }
    
    /**
     * Normalize all assets with the given output parameters so the final stitching can use -c copy
     * @param {import("./progress").default} progress Progress bar clack spinner class instance
     */
    async normalizeFiles(spinner) {

    }

    /**
     * Stitches the normalized video files together into a final output video using -c copy flag
     * ffmpeg -c copy copies the bits directly and does not need to re-encode the video if used
     * @param {string} outputName The output video file name to place in the output folder
     * @param {import("./progress").default} progress Progress bar clack spinner class instance
     */
    async stitchFiles(outputName, spinner) {

    }
}
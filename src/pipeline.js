import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pc from "picocolors";

export default class VideoPipeline {
    /**
     * Class representation pipeline used to orchestrate the full fmmpeg video compilation process.
     * @param {string} inputDirectory The input folder including the video and/or image files to join.
     * @param {string} outputName The output video file name to place in the output folder
     */
    constructor(inputDirectory, outputName) {
        this.inputDir = inputDir;
		this.outputName = outputName;
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
     * @param {import("@clack/prompts").spinner} spinner Clack spinner to show progress over time
     * @returns {void} Appends objects representing input file meta data into this.assets
     */
    async scanFiles(spinner) {

    }

    /**
     * Sorts the assets array given the provided preset string, changing the order files are stitched
     * @param {string} method Preset sort method described by the hard coded function methods below
     * @returns {Array<Object>} Returns the sorted this.assets array of objects
     */
    sortFiles(method) {

    }
    
    /**
     * Normalize all assets with the given output parameters so the final stitching can use -c copy
     * @param {import("@clack/prompts").spinner} spinner Clack spinner to show progress over time
     */
    async normalizeFiles(spinner) {

    }

    /**
     * Stitches the normalized video files together into a final output video using -c copy flag
     * ffmpeg -c copy copies the bits directly and does not need to re-encode the video if used
     * @param {import("@clack/prompts").spinner} spinner Clack spinner to show progress over time
     */
    async stitchFiles(spinner) {

    }
}
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pc from "picocolors";
import { fileTypeFromFile } from "file-type";

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

    setResolution(resolution) {
        const [ w, h ] = resolution.split("x");
		this.targetWidth = parseInt(w, 10);
		this.targetHeight = parseInt(h, 10);
        this.resolution = resolution;
    }

    setFrameRate(frameRate) {
        this.targetFPS = frameRate;
    }

    scanFiles() {

    }

    getSmartResolution() {

    }

    getSmartFrameRate() {

    }
}
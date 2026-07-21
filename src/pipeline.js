import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import pc from "picocolors";

const VIDEO_TYPES = new Set([ ".mp4", ".mov", ".avi", ".mkv", ".webm" ]);
const IMAGE_TYPES = new Set([ ".jpg", ".jpeg", ".png", ".webp" ]);

export default class VideoPipeline {

    constructor(inputDirectory, outputName) {

    }

    setResolution() {

    }
}
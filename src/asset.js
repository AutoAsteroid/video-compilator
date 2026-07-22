import fs from "fs";
import path from "path";
import { imageSize } from "image-size";
import { fileTypeFromFile } from "file-type";
import { videoInfo } from "./utils.js";

export default class Asset {
    /**
     * File media asset class representation with metadata for the main video pipeline
     * @param {string} filePath The file path to the asset file assuming it exists
     */
    constructor(filePath) {
        this.path = filePath;
        this.name = path.basename(filePath);

        // Default file metadata that will be filled in Asset.analyze()
        this.size = 0;
        this.birthTime = 0;
        this.isImage = false;
        this.duration = 0;
        this.extension = "";
        this.width = 0;
        this.height = 0;
        this.isValidMedia = false;
    }

    /**
     * Reads file stats, checks header bytes, and extracts media information metadata
     * @returns {Promise<this>} Returns this asset instance with the populated metadata
     */
    async analyze() {
        if (!fs.existsSync(this.path)) return this;

        // Populate the file size and creation date from fs.statSync
        const stat = fs.statSync(this.path);
        this.size = stat.size;
        this.birthTime = stat.birthtimeMs;

        const fileType = await fileTypeFromFile(this.path);
        if (fileType === undefined) return this;

        // Process the file directly without spawning ffprobe if it is an image 
        if (fileType.mime.startsWith("image/")) {
            try {
                const dimensions = imageSize(this.path);
                this.width = dimensions.width || 0;
                this.height = dimensions.height || 0;
                this.isImage = true;
                this.isValidMedia = true;
            } catch {}
        }
        // Spawn a ffprobe child process to check for the video metadata and info
        else if (fileType.mime.startsWith("video/")) {
            try {
                const metadata = await videoInfo(this.path);
                if (metadata) {
                    Object.assign(this, metadata);
                    this.isValidMedia = true;
                }
            } catch {}
        }
        // This same instance but now with populated metadata
        return this;
    }

    /**
     * Returns the resolution of this asset. "0x0" if the asset is invalid media
     * @returns {string} Returns a string formatted resolution, e.g.: "1920x1080"
     */
    get resolution() {
        return this.width + "x" + this.height;
    }

    /**
     * This asset is considered to be a video if it is valid and not an image
     * @returns {Boolean} Returns whether or not this asset is a video
     */
    get isVideo() {
        return this.isValidMedia && !this.isImage;
    }

    /**
     * This asset is considered portrait if its height is larger than its width
     * @returns {Boolean} Returns whether or not this asset is in portrait
     */
    get isPortrait() {
        return this.height > this.width;
    }

    /**
     * Returns a formatted duration of the asset if its a video, "0:00" if its an image
     * @returns {string} String duration of the asset in formatted in minutes:seconds
     */
    get formattedDuration() {
        if (this.isImage) return "0:00";

        const mins = Math.floor(this.duration / 60);
        const secs = Math.floor(this.duration % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    /**
     * Returns a formatted size of the asset in megabytes. this.size is in bytes
     * @returns {string} The formatted asset size in MB format, e.g.: "5.32 MB"
     */
    get formattedSize() {
        return `${(this.size / 1024 / 1024).toFixed(2)} MB`;
    }
}

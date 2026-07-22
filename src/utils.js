import ffmpeg from "fluent-ffmpeg";

/**
 * Shuffles an array in-place using the Fisher-Yates shuffle algorithm
 * @param {Array<any>} array The input array to be shuffled
 * @returns {Array<any>} Same input array but uniformly shuffled
 */
export function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Helper function that spawns an ffmpeg child process to probe a files meta information
 * @param {string} filePath The full file path to the file to probe
 * @returns {Promise<null|ffmpeg.FfprobeData>} Probed file data from ffmpeg.ffprobe 
 */
export function probeFile(filePath) {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (error, meta) => resolve(error ? null : meta));
    });
}

/**
 * Parses a fractional FPS from ffprobe into a rounded decimal e.g.: parseFPS("30000/1001") 
 * @param {string} rawFPS The raw frame rate string from ffprobe which if formatted "num/den"
 * @returns {number} The calculated frame rate rounded to 2 decimal places, or 0 if invalid
 */
export function parseFPS(rawFPS) {
    if (!rawFPS || rawFPS === "0/0") return 0;

    const [ num, den ] = rawFPS.split("/").map(Number);
    if (!den || isNaN(num) || isNaN(den)) return 0;

    return Number((num / den).toFixed(2));
}

/**
 * Extracts comprehensive video stream and format information and metadata using ffprobe
 * @param {string} filePath Absolute file path to the video file to probe
 * @returns {Promise<Object|null>} Object containing video metadata or null if invalid
 */
export async function videoInfo(filePath) {
    const meta = await probeFile(filePath);
    if (!meta || !meta.streams || meta.streams.length === 0) return null;

    // Check for the existence of audio and video streams from the ffprobe
    const videoStream = meta.streams.find((stream) => stream.codec_type === "video");
    const audioStream = meta.streams.find((stream) => stream.codec_type === "audio");
    if (!videoStream) return null;

    return {
        // Video resolution metadata
        width: videoStream.width || 0,
        height: videoStream.height || 0,

        // Video performance and playback properties
        fps: parseFPS(videoStream.r_frame_rate || videoStream.avg_frame_rate),
        duration: parseFloat(meta.format?.duration || videoStream.duration) || 0,
        bitrate: parseInt(meta.format?.bit_rate || videoStream.bit_rate || 0, 10),
        frameCount: parseInt(videoStream.nb_frames || 0, 10),

        // Codec and video format details
        codec: videoStream.codec_name || "",
        pixFmt: videoStream.pix_fmt || "",
        container: meta.format?.format_name || "",

        // Audio stream presence metadata
        hasAudio: Boolean(audioStream),
        audioCodec: audioStream?.codec_name || null,
    };
}

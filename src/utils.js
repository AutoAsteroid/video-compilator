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
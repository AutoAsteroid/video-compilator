import { spinner } from "@clack/prompts";
import pc from "picocolors";

export default class ProgressBar {
    /**
     * Wrapper around clack's native spinner method to implement a similar cli-progress bar
     * Supports multi tasks to replicate a similar look to how ComfyUI does their bars
     * @param {string} title Main label shown directly after the spinner, e.g.: ◐ ${title}:
     * @param {number} [barLength=20] The number of bars in the progress bar in the spinner
     */
    constructor(title, barLength = 20) {
        this.title = title;
        this.clackSpinner = spinner();
        this.totalTasks = 0;
        this.completedTasks = 0;
        this.currentTaskProgress = 0; // 0 to 100 for current active task
        this.startTime = null;
        this.eta = "--:--";
        this.active = false;
        this.timer = null;
        this.detail = "";
        this.barLength = barLength;
    }

    /**
     * Start tracking the progress bar. 0 total tasks will mean the progress bar doesn't show
     * @param {number} [totalTasks=0] Total number of tasks known if it is known in advance
     */
    start(totalTasks = 0) {
        this.totalTasks = totalTasks;
        this.startTime = Date.now();
        this.active = true;
        this.clackSpinner.start(this.buildMessage());

        // Continuous ticker every 200 milliseconds to update the progress bar
        this.timer = setInterval(() => {
            if (!this.active || this.totalTasks === 0) return;
            this.eta = this.getETA();
            this.clackSpinner.message(this.buildMessage());
        }, 200);
    }

    /**
     * Seamlessly add more tasks if the number of total tasks becomes known later
     * @param {number} tasks If totalTasks !== 0, then the progress bar will render
     */
    addTotalTasks(tasks) {
        this.totalTasks += tasks;
        this.clackSpinner.message(this.buildMessage());
    }

    /**
     * Simple message progress mode used if there is no progress bar or total tasks = 0
     * @param {string} detail Message detail to place at the end of the progress bar
     * @param {boolean} [increment=true] Increment the counter at the end of the spinner
     */
    setMessage(detail, increment = true) {
        if (increment) this.completedTasks++;
        this.detail = detail;
        this.clackSpinner.message(this.buildMessage());
    }

    /**
     * Update the progress percentage of the CURRENT active task (0 to 100)
     * @param {number} percent Percentage complete for current task progress bar
     * @param {string} [detail=""] Message detail to place at the end of the progress bar
     */
    updateTask(percent = 0, detail = "") {
        if (detail) this.detail = detail;

        this.currentTaskProgress = Math.min(100, Math.max(0, percent));
        this.eta = this.getETA();
        this.clackSpinner.message(this.buildMessage());
    }

    /**
     * Complete the current task and count it as a completed task out of the total
     * @param {string} [detail=""] Message detail to place at the end of the progress bar
     */
    completeTask(detail = "") {
        if (this.completedTasks < this.totalTasks) this.completedTasks++;
        if (detail) this.detail = detail;

        this.currentTaskProgress = 0;
        this.eta = this.getETA();
        this.clackSpinner.message(this.buildMessage());
    }

    /**
     * Calculates the overall progress ratio (0.0 to 1.0) of this task to all tasks
     * @returns {number} The ratio representing current progress over total tasks
     */
    getOverallRatio() {
        if (this.totalTasks === 0) return 0;

        const taskWeight = 1 / this.totalTasks;
        const activeFraction = (this.currentTaskProgress / 100) * taskWeight;
        const completedFraction = this.completedTasks * taskWeight;
        return Math.min(1, completedFraction + activeFraction);
    }

    /**
     * Updates the progress ETA based on the elapsed time and current progress
     * @returns {string} The new ETA string formatted by minutes:seconds
     */
    getETA() {
        if (this.totalTasks === 0) return "--:--";

        const elapsed = (Date.now() - this.startTime) / 1000;
        const progressRatio = this.getOverallRatio();

        if (progressRatio === 0) return "--:--";

        const estimatedTotalTime = elapsed / progressRatio;
        const remainingSeconds = Math.max(0, estimatedTotalTime - elapsed);
        const mins = Math.floor(remainingSeconds / 60);
        const secs = Math.floor(remainingSeconds % 60);

        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    /**
     * Builds the message representing the current progress from current progress status
     * @returns {string} Progress bar message to be passed into the clack spinner message
     */
    buildMessage() {
        // Multi progress bar when we have total tasks to be able to represent progress
        const overallRatio = this.getOverallRatio();
        const totalFilled = Math.round(overallRatio * this.barLength);
        const completed = Math.floor((this.completedTasks / this.totalTasks) * this.barLength);
        const active = Math.max(0, totalFilled - completed);
        const empty = Math.max(0, this.barLength - totalFilled);

        // Continuous color bar: green = complete, cyan = active, grey = incomplete
        const greenBlock = pc.green("█".repeat(completed));
        const cyanBlock = pc.cyan("█".repeat(active));
        const grayBlock = pc.gray("░".repeat(empty));

        // If totalTasks = 0, the output bar will just be a non progressing bar
        const progressBar = `[${greenBlock}${cyanBlock}${grayBlock}]`;
        const percent = pc.green(Math.round(overallRatio * 100) + "%");
        const counter = pc.green(`(${this.completedTasks}/${this.totalTasks})`);
        const eta = pc.yellow(`ETA: ${this.eta}`);
        const detail = this.detail ? `\n   ${pc.dim(this.detail)}`: "";

        return `${this.title} ${progressBar} ${percent} ${counter} ${eta}${detail}`;
    }

    /**
     * Stops the ProgressBar spinner with a green message assuming it was successful.
     * @param {string} message The final message for this porgress bar spinner.
     */
    stop(message = this.title + " completed.") {
        clearInterval(this.timer);
        this.active = false;
        this.clackSpinner.stop(pc.green(message));
    }

    /**
     * Stops the ProgressBar spinner with a red message assuming there was an error.
     * @param {string} message The final message for this porgress bar spinner.
     */
    error(message = this.title + " failed.") {
        clearInterval(this.timer);
        this.active = false;
        this.clackSpinner.error(pc.red(message));
    }
}

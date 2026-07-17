import { intro, select, text, spinner, outro } from "@clack/prompts";
import pc from "picocolors";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

function makeProgressBar(percent, length = 20) {
  const filledLength = Math.round((length * percent) / 100);
  const emptyLength = length - filledLength;
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  return `[${pc.cyan(filled)}${pc.gray(empty)}] ${percent}%`;
}

async function run() {
	intro(pc.cyan("Welcome to video-compilator!"));

	const folder = await text({
		message: "Where are your video files located?",
		placeholder: "./videos",
		initialValue: "./videos"
	});

	const files = fs.readdirSync(folder).filter(f => f.endsWith(".mp4"));

	if (files.length === 0) {
		outro(pc.red("No matching video files found!"));
		return;
	}

	const outputName = await text({
		message: "What should the merged file be named?",
		initialValue: "compilation.mp4"
	});

	const s = spinner();
	s.start("Stitching your videos together...");

	const merger = ffmpeg();

	files.forEach(file => {
		merger.input(`${folder}/${file}`);
	});

	merger
		.on("progress", progress => {
            const percentage = Math.min(100, Math.max(0, Math.round(progress.percent || 0)));
            s.message(`Compiling: ${makeProgressBar(percentage)}`);
		})
		.on("end", () => {
            s.stop('Video compilation complete!');
			console.log(pc.green("\nVideo compilation completed successfully!"));
		})
		.on("error", err => {
            s.stop('Failed');
			console.error(pc.red(`\nError processing video: ${err.message}`));
		})
		.mergeToFile(outputName, "./temp_dir");
}

run();

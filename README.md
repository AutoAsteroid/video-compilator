# Video Compilator

An interactive CLI wrapper to recursively scan, normalize, and stitch video and image files into a single, cohesive compilation.

---

## 🎬 Key Features

| Requirement | Version |
|-------------| -------- |
| **Smart Asset Scanning** | Recursively loads videos and images from any provided target directory. |
| **Smart Resolution & FPS Detection** | Automatically detects the most common resolution and frame rate among your media assets to suggest optimal defaults. |
| **Export Ordering** | Compilate by creation date, file size, duration, name, type, or randomization. | 
| **Hardware Acceleration Support** | Hardware-accelerated encoding via NVIDIA NVENC, Apple VideoToolbox, Intel QuickSync, or AMD AMF (with CPU `libx264`/`libx265` defaults). |
| **Two-Stage FFmpeg Pipeline** | First normalizes mixed aspect ratios/codecs, then uses rapid loss-free `-c copy` stitching for the final merge. |

---

## 📋 Prerequisites

- **Node.js** v18.0.0 or newer
- **FFmpeg** Installed and available in your system `PATH`

* **Windows:** `winget install Gyan.FFmpeg`
* **macOS:** `brew install ffmpeg`
* **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install ffmpeg`

---

## 🚀 Getting Started

### 1. Installation

Clone the repository into your current directory with terminal:

```bash
git clone https://github.com/AutoAsteroid/video-compilator.git
```

Go to the directory and install the depencies:

```bash
cd video-compilator
npm install
```

### 2. Usage

Run the main CLI pipeline:

```bash
npm start
```

---

## 📂 Interactive Workflow

When you run `npm start`, Video Compilator guides you through the process step-by-step:

| Step | Prompt | Description |
| --- | --- | --- |
| **1. Target Path** | *Where are your image and video files located?* | Absolute or relative path that has your images and video files. |
| **2. Image Duration** | *How many seconds should each image be displayed?* | Prompted if static image files (`.png`, `.jpg`, etc.) are found. |
| **3. Output Name** | *What should the merged video compilation be named?* | Output saved in `./output/`. Defaults to the current system date. |
| **4. Resolution** | *Select an output video resolution:* | Pick from Default, 1080p, 4K, 720p, Vertical, or Square. |
| **5. Frame Rate** | *Select an output video frame rate:* | Pick from Default, 60 FPS, 30 FPS, 24 FPS, or NTSC standards. |
| **6. Sort Order** | *Select an output compilation order:* | Choose how clip sequences are ordered. |
| **7. Encoder** | *Select a video encoder to normalize with:* | Select CPU or GPU-accelerated encoding. |

Your images and videos will then be normalized into `./normalized/` with the parameters you chose and saved into `./output/`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

# File Analysis Tool

## Overview

The File Analysis Tool is a web-based educational app for computer science students to explore file structures and cryptography. Built with HTML, JavaScript, and CSS, it visualizes file bytes, highlights sensitive data, extracts metadata, and supports encryption/decryption. It includes a table of selectable rectangles to highlight key file sections (e.g., file name, extension) in the hex viewer. Ideal for learning file formats, binary/hex representation, and data security.

## Features

- **Scrollable Graphical View**:
  - Shows all file bytes as 10x10px rectangles in a 16-column SVG grid, scrollable for large files.
  - Colors: yellow (metadata, potentially sensitive), blue (file headers), green (content), gray (unknown/other).
  - Click a rectangle to show a tooltip with the byte’s position, hex, and binary values (hides after 2 seconds), update the scrubber, and highlight the corresponding byte in the hex viewer.
- **Hex Viewer**:
  - Displays file bytes in hexadecimal, with sensitive data in yellow.
  - Editable; click "Save Hex Changes" to apply modifications (invalid hex shows an error).
  - Clicking an SVG rectangle highlights only the corresponding hex byte; clicking a table rectangle highlights a range.
- **Metadata Display**:
  - Extracts metadata (e.g., EXIF for images, ID3 for MP3s, docProps for DOCX).
  - Explicitly shows file name and extension, with notes on their storage (file system or binary).
  - Sensitive fields (e.g., file name, GPS data) marked with ⚠️.
- **Section Table**:
  - A table summarizing key file sections (File Name, Extension, Headers, Content).
  - Each section has a clickable 16x16px rectangle (yellow for metadata, blue for headers, green for content) that highlights the corresponding hex bytes.
  - File name/extension may be external (file system) or internal (e.g., MP3 ID3 tags, DOCX metadata).
- **Binary Sample**:
  - Shows the first 256 bytes in binary format.
- **Scrubber**:
  - Slider to navigate bytes, highlighting the selected byte in the SVG (red outline) and hex viewer.
- **Encryption Analysis**:
  - Supports Caesar Cipher, AES-256, and XOR Cipher for encrypting/decrypting file content.
  - Outputs results as hex in a textarea.
- **Supported File Types**:
  - Text (.txt), JPEG (.jpg, .jpeg), PNG (.png), DOCX (.docx), MP3 (.mp3), PDF (.pdf), MP4 (.mp4).
  - 1MB file size limit for performance.

## Setup

### Prerequisites
- Modern browser (Chrome, Firefox, Edge).
- Files: `index.html`, `script.js`, `styles.css`.
- Optional for production: Node.js and npm for Tailwind CSS.

### Local Setup
1. Place `index.html`, `script.js`, and `styles.css` in one directory.
2. Open `index.html` in a browser (uses Tailwind CDN for prototyping).
3. For production (to avoid CDN warning):
   - Install Node.js and npm.
   - Run `npm init -y`.
   - Install Tailwind: `npm install -D tailwindcss`.
   - Create `tailwind.config.js`:
     ```javascript
     /** @type {import('tailwindcss').Config} */
     module.exports = {
       content: ['./*.html'],
       theme: { extend: {} },
       plugins: [],
     }
     ```
   - Create `input.css`:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   - Build `styles.css`: `npx tailwindcss -i ./input.css -o ./styles.css --minify`.
   - Remove `<script src="https://cdn.tailwindcss.com">` from `index.html`.

### Deployment on GitHub Pages
1. Create a repository (e.g., `kappter/file-analysis-tool`).
2. Commit `index.html`, `script.js`, `styles.css`, and `README.md` to the root.
3. Enable GitHub Pages in settings (`main` branch, `/ (root)` folder).
4. Access at `https://kappter.github.io/file-analysis-tool`.
5. Ensure paths in `index.html`: `<script src="/file-analysis-tool/script.js">` and `<link href="/file-analysis-tool/styles.css">`.
6. **Favicon**: Inline SVG favicon prevents 404 errors. For a physical favicon:
   - Add `favicon.ico` to the root.
   - Update `index.html`: `<link rel="icon" href="/file-analysis-tool/favicon.ico" type="image/x-icon">`.

## Usage

1. **Upload a File**:
   - Select a file (.txt, .jpg, .jpeg, .png, .docx, .mp3, .pdf, .mp4, up to 1MB).
   - Errors show for unsupported formats or oversized files.

2. **Explore the Graphical View**:
   - See bytes as a scrollable SVG grid (16 columns, 10x10px rectangles).
   - Colors: yellow (metadata), blue (headers), green (content), gray (other).
   - Click a rectangle to:
     - View a tooltip (position, hex, binary).
     - Set the scrubber to the byte’s position.
     - Highlight only that byte’s hex value in the hex viewer.

3. **Use the Section Table**:
   - View a table of key sections (File Name, Extension, Headers, Content).
   - Click a rectangle to highlight the corresponding byte range in the hex viewer (e.g., bytes 3-32 for MP3 title).
   - Note: File name/extension are often managed by the file system, except in MP3 (ID3 tags) or DOCX (ZIP metadata).

4. **Use the Hex Viewer**:
   - View/edit hex data (sensitive sections in yellow).
   - Click "Save Hex Changes" to update the file (invalid input shows an error).

5. **Check Metadata**:
   - View metadata, including file name and extension; sensitive fields marked with ⚠️.

6. **View Binary Sample**:
   - See the first 256 bytes in binary.

7. **Navigate with the Scrubber**:
   - Drag to select a byte, updating the SVG (red outline) and hex viewer.

8. **Perform Encryption**:
   - Choose a cipher (Caesar, AES-256, XOR).
   - Enter a key (e.g., "3" for Caesar, password for AES, number for XOR).
   - Click "Encrypt" or "Decrypt" to see hex output.

## Troubleshooting

- **Tailwind CDN Warning**: Appears with CDN; use production setup to generate `styles.css`.
- **Favicon 404**: Inline SVG favicon fixes this. For GitHub Pages, verify paths or add `favicon.ico`.
- **Syntax Error (`script.js`)**: Fixed `Unexpected end of input` by ensuring proper code structure.
- **Hex Viewer Selection**: Fixed to highlight only the clicked byte for SVG clicks; table clicks highlight ranges.
- **Section Table**: If rectangles show “N/A,” the section (e.g., file name) may not be stored in the binary.
- **File Size Errors**: Keep files under 1MB.
- **Browser Issues**: Use Chrome, Firefox, or Edge; older browsers may not support SVG/JavaScript.

## Notes for Students

- **Learning Objectives**:
  - Explore file structures (headers, metadata, content) via the SVG grid and section table.
  - Understand binary/hex with clickable rectangles and hex editing.
  - Learn where file names/extensions are stored (file system or binary).
  - Study cryptography through encryption/decryption.
- **Limitations**:
  - 1MB file size limit.
  - SVG grid may be tall for large files; scroll to navigate.
  - Tooltip hides after 2 seconds.
- **Customization**:
  - Adjust SVG grid in `script.js` (`bytesPerRow`, `rectSize`).
  - Change tooltip duration in `showByteTooltip` (`setTimeout`).
  - Modify table rectangle size in `styles.css` (`.section-rect`).

## License

For educational use only. Modify and share in academic settings.
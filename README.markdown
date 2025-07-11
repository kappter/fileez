# File Analysis Tool

## Overview

The File Analysis Tool is a web-based educational app for computer science students to explore file structures and cryptography. Built with HTML, JavaScript, and CSS, it visualizes file bytes, highlights sensitive data, extracts metadata, and supports encryption/decryption. The UI features a modular grid layout with a fixed footer, a dark/light mode toggle (applied to the entire page), and a sticky hex viewer for easy access without scrolling. A section table highlights key file sections (e.g., file name, extension, encoding, created date/time) in the hex viewer, ideal for learning file formats, binary/hex representation, and data security.

## Features

- **Modular Layout**:
  - Two-column grid (responsive, stacks on mobile): left (file input, graphical view, metadata, section table), right (hex viewer, scrubber, encryption, binary sample).
  - Each section is a styled card with rounded corners and shadows for clarity.
- **Scrollable Graphical View**:
  - Displays file bytes as 10x10px rectangles in a 16-column SVG grid, scrollable for large files.
  - Colors: yellow (metadata, sensitive), blue (headers), green (content), gray (unknown/other).
  - Click a rectangle to:
    - View a tooltip (position, hex, binary, hides after 2 seconds).
    - Set the scrubber to the byte’s position.
    - Highlight only that byte’s hex value in the hex viewer.
- **Sticky Hex Viewer**:
  - Displays file bytes in hexadecimal, with sensitive data in yellow.
  - Editable; click "Save Hex Changes" to apply modifications (invalid hex shows an error).
  - Always visible (sticky positioning), eliminating scrolling to access the edit area.
  - SVG clicks highlight single hex bytes; table clicks highlight ranges.
- **Metadata Display**:
  - Extracts metadata (e.g., EXIF for images, ID3 for MP3s, docProps for DOCX).
  - Shows file name, extension, encoding (e.g., UTF-8, MPEG-1 Layer III), created/last modified date/time, hidden, locked, deleted status.
  - Sensitive fields (e.g., file name, GPS data) marked with ⚠️.
  - Notes storage (file system or binary, e.g., MP3 ID3 tags, DOCX `core.xml`).
- **Section Table**:
  - Summarizes sections: File Name, Extension, Encoding, Created Date/Time, Last Modified Date/Time, Hidden, Locked, Deleted, Headers, Content.
  - Clickable 16x16px rectangles (yellow for metadata, blue for headers, green for content) highlight hex ranges (e.g., MP3 title bytes 3-32, encoding bytes 128-131).
  - File system metadata (e.g., encoding for text, hidden) shows “N/A” for binary ranges.
- **Binary Sample**:
  - Shows first 256 bytes in binary format.
- **Scrubber**:
  - Slider navigates bytes, highlighting the selected byte in SVG (red outline) and hex viewer.
- **Encryption Analysis**:
  - Supports Caesar Cipher, AES-256, XOR Cipher for encrypting/decrypting file content.
  - Outputs hex in a textarea.
- **Dark/Light Mode Toggle**:
  - Toggle button (sun/moon icons) in header switches themes for the entire page (header, main, footer, cards, SVG, tables, inputs), stored in `localStorage`.
  - Light mode: gray background, white cards; dark mode: dark gray background, darker cards.
- **Fixed Footer**:
  - Displays copyright info (“© 2025 File Analysis Tool. For educational use only.”) at the bottom of the viewport.
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

     :root {
       --bg-primary: #f3f4f6;
       --bg-card: #ffffff;
       --text-primary: #1f2937;
       --border-primary: #d1d5db;
       --hex-bg: #f3f4f6;
       --yellow-sensitive: #fefcbf;
       --blue-header: #bfdbfe;
       --green-content: #bbf7d0;
       --svg-rect-gray: #c8c8c8;
       --tooltip-bg: #1f2937;
       --tooltip-text: #ffffff;
       --input-bg: #ffffff;
       --button-bg-blue: #3b82f6;
       --button-bg-green: #22c55e;
       --button-bg-red: #ef4444;
       --button-text: #ffffff;
     }

     .dark {
       --bg-primary: #111827;
       --bg-card: #1f2937;
       --text-primary: #f3f4f6;
       --border-primary: #4b5563;
       --hex-bg: #374151;
       --yellow-sensitive: #facc15;
       --blue-header: #2563eb;
       --green-content: #22c55e;
       --svg-rect-gray: #6b7280;
       --tooltip-bg: #374151;
       --tooltip-text: #f3f4f6;
       --input-bg: #374151;
       --button-bg-blue: #60a5fa;
       --button-bg-green: #4ade80;
       --button-bg-red: #f87171;
       --button-text: #f3f4f6;
     }

     body {
       background-color: var(--bg-primary);
       color: var(--text-primary);
     }

     .card {
       background-color: var(--bg-card);
       border-color: var(--border-primary);
     }

     #hexViewer {
       background-color: var(--hex-bg);
       color: var(--text-primary);
     }

     .section-rect {
       width: 16px;
       height: 16px;
       display: inline-block;
     }

     .bg-yellow-200 {
       background-color: var(--yellow-sensitive);
     }

     .bg-blue-200 {
       background-color: var(--blue-header);
     }

     .bg-green-200 {
       background-color: var(--green-content);
     }

     footer {
       background-color: var(--bg-card);
       color: var(--text-primary);
     }

     #byteTooltip {
       background-color: var(--tooltip-bg);
       color: var(--tooltip-text);
     }

     input[type="file"],
     input[type="range"],
     select,
     textarea {
       background-color: var(--input-bg);
       color: var(--text-primary);
       border-color: var(--border-primary);
     }

     #saveHex {
       background-color: var(--button-bg-blue);
       color: var(--button-text);
     }

     #encryptBtn {
       background-color: var(--button-bg-green);
       color: var(--button-text);
     }

     #decryptBtn {
       background-color: var(--button-bg-red);
       color: var(--button-text);
     }

     #fileSvg rect[fill="rgb(200, 200, 200)"] {
       fill: var(--svg-rect-gray);
     }

     #sectionTable {
       border-color: var(--border-primary);
     }

     #sectionTable td {
       border-color: var(--border-primary);
     }
     ```
   - Build `styles.css`: `npx tailwindcss -i ./input.css -o ./styles.css --minify`.
   - Remove `<script src="https://cdn.tailwindcss.com">` from `index.html`.

### Deployment on GitHub Pages
1. Create a repository (e.g., `kappter/file-analysis-tool`).
2. Commit `index.html`, `script.js`, `styles.css`, and `README.md` to the root or a subdirectory (e.g., `docs/`).
3. Enable GitHub Pages in settings (`main` branch, `/ (root)` or `/docs` folder).
4. Update `index.html` paths based on your repository structure:
   - For root: `<link href="/file-analysis-tool/styles.css">`, `<script src="/file-analysis-tool/script.js">`.
   - For subdirectory (e.g., `docs/`): `<link href="/file-analysis-tool/docs/styles.css">`, `<script src="/file-analysis-tool/docs/script.js">`.
5. Access at `https://kappter.github.io/file-analysis-tool` (or `/docs` if using a subdirectory).
6. **Favicon**: Inline SVG favicon prevents 404 errors. For a physical favicon:
   - Add `favicon.ico` to the root or subdirectory.
   - Update `index.html`: `<link rel="icon" href="/file-analysis-tool/favicon.ico" type="image/x-icon">` (or `/file-analysis-tool/docs/favicon.ico`).
7. **Checklist for File Uploads**:
   - Go to your repository on GitHub (e.g., `kappter/file-analysis-tool`).
   - Click “Add file” > “Upload files”.
   - Upload `index.html`, `script.js`, `styles.css`, and `README.md` to the root or `docs/`.
   - Commit changes with a message (e.g., “Initial file upload”).
   - Verify files appear in the repository’s file list.
   - Check GitHub Pages settings to ensure the correct branch (`main`) and folder (`/ (root)` or `/docs`).

## Usage

1. **Toggle Theme**:
   - Click the sun/moon icon in the header to switch between light and dark modes (applies to entire page, persists across sessions).
2. **Upload a File**:
   - Select a file (.txt, .jpg, .jpeg, .png, .docx, .mp3, .pdf, .mp4, up to 1MB).
   - Errors show for unsupported formats or oversized files.
3. **Explore the Graphical View**:
   - See bytes as a scrollable SVG grid (16 columns, 10x10px rectangles).
   - Colors: yellow (metadata), blue (headers), green (content), gray (other).
   - Click a rectangle to:
     - View a tooltip (position, hex, binary).
     - Set the scrubber to the byte’s position.
     - Highlight only that byte’s hex value in the hex viewer.
4. **Use the Hex Viewer**:
   - Always visible (sticky) in the right column.
   - View/edit hex data (sensitive sections in yellow).
   - Click "Save Hex Changes" to update the file (invalid input shows an error).
5. **Use the Section Table**:
   - View sections (File Name, Extension, Encoding, Created Date/Time, Last Modified Date/Time, Hidden, Locked, Deleted, Headers, Content).
   - Click a rectangle to highlight hex ranges (e.g., MP3 title bytes 3-32, encoding bytes 128-131).
   - File system metadata (e.g., encoding for text, hidden) shows “N/A” if not stored in the binary.
6. **Check Metadata**:
   - View file name, extension, encoding (e.g., UTF-8, MPEG-1 Layer III), and system fields.
7. **View Binary Sample**:
   - See first 256 bytes in binary.
8. **Navigate with the Scrubber**:
   - Drag to select a byte, updating SVG (red outline) and hex viewer.
9. **Perform Encryption**:
   - Choose a cipher (Caesar, AES-256, XOR).
   - Enter a key (e.g., "3" for Caesar, password for AES, number for XOR).
   - Click "Encrypt" or "Decrypt" to see hex output.

## Troubleshooting

- **Dark/Light Mode Not Applying to All Elements**:
  - Ensure `localStorage` is enabled in your browser.
  - Verify `<html class="light" id="html-root">` in `index.html` and toggle button functionality.
  - Check `styles.css` for correct `dark:` classes and CSS variables.
- **404 Errors for `styles.css` or `script.js`**:
  - **Local Testing**: Ensure `styles.css` and `script.js` are in the same directory as `index.html`. Use relative paths (`./styles.css`, `./script.js`) in `index.html`.
  - **GitHub Pages**: Verify files are committed to the repository root or subdirectory (e.g., `docs/`). Update `index.html` paths to match (e.g., `/file-analysis-tool/styles.css` or `/file-analysis-tool/docs/styles.css`). Check GitHub Pages settings (`main` branch, correct folder).
  - **Fix**: Use GitHub’s web interface to upload files:
    1. Go to your repository (e.g., `kappter/file-analysis-tool`).
    2. Click “Add file” > “Upload files”.
    3. Upload `styles.css` and `script.js` to the root or `docs/`.
    4. Commit changes.
    5. Verify files in the repository’s file list.
    6. Check the deployed URL (e.g., `https://kappter.github.io/file-analysis-tool`) and console for errors.
- **Tailwind CDN Warning**: Appears with CDN; use production setup to generate `styles.css`.
- **Favicon 404**: Inline SVG favicon fixes this. For GitHub Pages, verify paths or add `favicon.ico`.
- **Syntax Error (`script.js`)**: Fixed `Unexpected end of input` by ensuring proper code structure.
- **Hex Viewer Selection**: Fixed to highlight single bytes for SVG clicks; table clicks highlight ranges.
- **Section Table**: “N/A” indicates metadata (e.g., encoding for text, hidden, locked) stored in the file system, not the binary.
- **File Size Errors**: Keep files under 1MB.
- **Browser Issues**: Use Chrome, Firefox, or Edge; older browsers may not support SVG/JavaScript.

## Notes for Students

- **Learning Objectives**:
  - Explore file structures (headers, metadata, content) via the SVG grid and section table.
  - Understand binary/hex with clickable rectangles and hex editing.
  - Learn where file name, extension, encoding, and system metadata (created date/time, hidden, locked, deleted) are stored.
  - Study cryptography through encryption/decryption.
- **Limitations**:
  - 1MB file size limit.
  - SVG grid may be tall for large files; scroll to navigate.
  - Tooltip hides after 2 seconds.
  - System metadata (hidden, locked, deleted) and some encodings are not accessible via the File API.
- **Customization**:
  - Adjust SVG grid in `script.js` (`bytesPerRow`, `rectSize`).
  - Change tooltip duration in `showByteTooltip` (`setTimeout`).
  - Modify table rectangle size in `styles.css` (`.section-rect`).
  - Customize theme colors in `styles.css` (CSS custom properties).

## License

© 2025 File Analysis Tool. For educational use only. Modify and share in academic settings.
# File Analysis Tool

## Overview

The File Analysis Tool is a web-based educational application designed for computer science students to explore file structures and basic cryptography. Built with HTML, JavaScript, and CSS, it visualizes file bytes, highlights sensitive data, extracts metadata, and supports encryption/decryption. This tool is perfect for learning about file formats, binary/hex representation, and data security in a classroom setting.

## Features

- **Scrollable Graphical View**:
  - Displays all file bytes as 10x10px rectangles in a 16-column SVG grid, scrollable for large files.
  - Color-coded: yellow (metadata, potentially sensitive), blue (file system/headers), green (content), gray (unknown/other).
  - Click a rectangle to show a tooltip with the byte’s position, hex, and binary values (auto-hides after 2 seconds), updating the scrubber and hex viewer.
- **Hex Viewer**:
  - Shows file bytes in hexadecimal, with sensitive data highlighted in yellow.
  - Editable; click "Save Hex Changes" to apply modifications (invalid hex triggers an error).
- **Metadata Display**:
  - Extracts metadata for supported files (e.g., EXIF for images, ID3 for MP3s, docProps for DOCX).
  - Sensitive fields (e.g., file name, GPS data, artist) are marked with ⚠️.
- **Binary Sample**:
  - Displays the first 256 bytes in binary format for educational purposes.
- **Scrubber**:
  - A slider to navigate file bytes, highlighting the selected byte in the SVG view (red outline) and hex viewer.
- **Encryption Analysis**:
  - Supports Caesar Cipher, AES-256, and XOR Cipher for encrypting/decrypting file content.
  - Outputs results as hex in a textarea.
- **Supported File Types**:
  - Text (.txt), JPEG (.jpg, .jpeg), PNG (.png), DOCX (.docx), MP3 (.mp3), PDF (.pdf), MP4 (.mp4).
  - Maximum file size: 1MB for browser performance.

## Setup

### Prerequisites
- Modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge recommended).
- Files: `index.html`, `script.js`, `styles.css` (provided in the repository).
- For production (optional): Node.js and npm to generate `styles.css` with Tailwind CSS.

### Local Setup
1. Place `index.html`, `script.js`, and `styles.css` in the same directory.
2. Open `index.html` in a browser to use the tool with the Tailwind CDN (included for prototyping).
3. For production (to avoid the Tailwind CDN warning):
   - Install Node.js and npm.
   - Initialize a project: `npm init -y`.
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
   - Remove `<script src="https://cdn.tailwindcss.com"></script>` from `index.html` if using the generated `styles.css`.

### Deployment on GitHub Pages
1. Create a GitHub repository (e.g., `kappter/file-analysis-tool`).
2. Commit `index.html`, `script.js`, `styles.css`, and `README.md` to the repository root.
3. Enable GitHub Pages in repository settings:
   - Select the `main` branch and `/ (root)` folder.
   - Access the tool at `https://kappter.github.io/file-analysis-tool`.
4. **File Paths**: Ensure `<script src="/file-analysis-tool/script.js">` and `<link href="/file-analysis-tool/styles.css" rel="stylesheet">` match your repository path.
5. **Favicon**: The inline SVG favicon in `index.html` prevents 404 errors. For a physical favicon:
   - Add `favicon.ico` to the repository root.
   - Update `index.html`: `<link rel="icon" href="/file-analysis-tool/favicon.ico" type="image/x-icon">`.

## Usage

1. **Upload a File**:
   - Click the file input to select a file (.txt, .jpg, .jpeg, .png, .docx, .mp3, .pdf, .mp4, up to 1MB).
   - Errors display for unsupported formats or files exceeding 1MB.

2. **Explore the Graphical View**:
   - View all bytes as a scrollable SVG grid (16 columns, 10x10px rectangles).
   - Colors indicate:
     - **Yellow**: Metadata (e.g., EXIF, ID3).
     - **Blue**: Headers (e.g., magic numbers).
     - **Green**: Content (e.g., text, image data).
     - **Gray**: Unknown/other.
   - Click a rectangle to:
     - Show a tooltip with position, hex, and binary values.
     - Sync the scrubber and highlight the byte in the hex viewer.

3. **Use the Hex Viewer**:
   - View/edit hex data (sensitive sections in yellow).
   - Click "Save Hex Changes" to update the file buffer (invalid input shows an error).

4. **Check Metadata**:
   - View metadata with sensitive fields marked (⚠️).

5. **View Binary Sample**:
   - See the first 256 bytes in binary.

6. **Navigate with the Scrubber**:
   - Drag the slider to select a byte, updating the SVG view (red outline) and hex viewer.

7. **Perform Encryption**:
   - Choose a cipher (Caesar, AES-256, XOR).
   - Enter a key (e.g., "3" for Caesar, a password for AES, a number for XOR).
   - Click "Encrypt" or "Decrypt" to view the hex output.

## Troubleshooting

- **Tailwind CDN Warning**: Appears when using the CDN (`<script src="https://cdn.tailwindcss.com">`). Follow the production setup to generate `styles.css`.
- **Favicon 404 Error**: The inline SVG favicon prevents this. For GitHub Pages, ensure the favicon path is correct or add `favicon.ico`.
- **Syntax Errors**: The `m3Sensitive` typo in `script.js` is fixed (`parseMp3Sensitive`).
- **File Size Errors**: Ensure files are under 1MB.
- **Browser Issues**: Use Chrome, Firefox, or Edge. Older browsers may not support SVG or modern JavaScript.

## Notes for Students

- **Learning Objectives**:
  - Understand file structures (headers, metadata, content) via the SVG view.
  - Explore binary/hex data through interactive clicking and editing.
  - Learn basic cryptography with encryption/decryption features.
- **Limitations**:
  - 1MB file size limit for performance.
  - SVG grid may be tall for large files; scroll to navigate.
  - Tooltip hides after 2 seconds to avoid clutter.
- **Customization**:
  - Adjust the SVG grid in `script.js` (`bytesPerRow`, `rectSize`).
  - Modify tooltip duration in `showByteTooltip` (`setTimeout`).
- **Browser Compatibility**: Tested on Chrome, Firefox, Edge. May not work on older browsers (e.g., IE).

## License

For educational use only. Modify and share freely in academic settings.
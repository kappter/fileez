# File Analysis Tool

A web-based tool for analyzing file structures, designed for educational purposes. Upload files to visualize their binary content, metadata, and sections, with features to explore file name and extension storage, hex data, and encryption.

## Features
- **File Input**: Upload files (txt, jpg, jpeg, png, docx, mp3, pdf, mp4) up to 1MB.
- **Graphical View**: Displays file bytes as a 16-column SVG grid (10x10px rectangles) with color coding:
  - Orange: File name (e.g., MP3 ID3 title, DOCX core.xml).
  - Blue: Headers.
  - Yellow: Metadata/sensitive data.
  - Green: Content.
  - Gray: Unknown/other.
- **Hex Viewer**: Fixed at the top, shows hex and ASCII data (16 bytes per row) with orange highlights for file name ranges and yellow for sensitive data.
- **Metadata**: Displays file details (name, extension, encoding, etc.) with notes on file name/extension storage (file system vs. binary).
- **File Sections**: Table listing sections (File Name, Extension, etc.) with clickable rectangles to highlight ranges in the hex viewer. "Learn More" buttons for File Name and Extension explain storage.
- **Scrubber**: Navigate through file bytes, updating the hex viewer and SVG.
- **Encryption Analysis**: Apply Caesar, AES-256, or XOR ciphers to file data.
- **Binary Sample**: Shows the first 256 bytes in binary.
- **Dark/Light Mode**: Toggle between themes with a navbar button.
- **File Name/Extension Education**: Modal explains where file name and extension are stored (file system or binary, e.g., MP3 bytes 3-32, DOCX bytes 0-500), triggered by "Learn More" buttons in the section table.

## Setup
1. Clone the repository or download files.
2. Host on a local server (e.g., `python -m http.server`) or deploy to GitHub Pages.
3. Ensure files are in the correct structure:
   - `index.html`
   - `script.js`
   - `styles.css`
4. Open `index.html` in a browser (Chrome recommended).

## Usage
1. Upload a file via the File Input card.
2. View the Graphical View (SVG grid) to see byte structure.
3. Check the Hex Viewer (fixed at top) for hex and ASCII data.
4. Explore the Metadata card for file details, including file name/extension storage notes.
5. Use the File Sections table to highlight ranges (click rectangles) or learn about file name/extension storage (click "Learn More").
6. Navigate bytes with the Scrubber or click SVG rectangles.
7. Test encryption/decryption in the Encryption Analysis card.
8. Toggle dark/light mode via the navbar button.

## Testing
- **Test Files**: Use MP3 (e.g., `song.mp3` with ID3 tags), DOCX (e.g., `document.docx` with core.xml), and TXT (e.g., `note.txt`) files under 1MB.
- **Verify**:
  - File Name/Extension in Metadata card includes storage notes (e.g., “stored in file system” or “MP3 ID3 title, bytes 3-32”).
  - Section Table shows “Learn More” buttons for File Name and Extension, opening a modal with details.
  - Hex Viewer and SVG grid highlight file name ranges in orange (e.g., MP3 bytes 3-32, DOCX bytes 0-500).
  - Modal explains file system vs. binary storage for the file type.
  - Dark/light mode applies to modal and highlights.
- **Deployment**: Test on GitHub Pages to ensure no 404 errors (use relative paths `./styles.css`, `./script.js`).
- **Browser**: Test in Chrome for best compatibility.

## Troubleshooting
- **404 Errors**: Ensure `styles.css` and `script.js` are in the same directory as `index.html`. Check GitHub Pages settings.
- **File Size**: Files over 1MB will show an error in the File Input card.
- **Unsupported Formats**: Only txt, jpg, jpeg, png, docx, mp3, pdf, mp4 are supported.
- **Modal Issues**: Ensure JavaScript console shows no errors for modal events; verify `infoModal` CSS.
- **Highlighting**: Orange highlights appear only for MP3 (bytes 3-32) or DOCX (bytes 0-500); other files show “N/A” for File Name in the section table.

## License
For educational use only. © 2025 File Analysis Tool.
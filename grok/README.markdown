# File Analysis Tool

A web-based tool for analyzing and editing file structures, designed for educational purposes. Upload files to visualize and modify their binary content, explore metadata, sections, and data type breakdowns, and learn about file name/extension storage.

## Features
- **File Input**: Upload files (txt, jpg, jpeg, png, docx, mp3, pdf, mp4) up to 1MB.
- **Graphical View**: Displays file bytes as a 16-column SVG grid (10x10px rectangles) with color coding:
  - Orange: File Name (e.g., MP3 ID3 title, DOCX core.xml).
  - Blue: Headers.
  - Yellow: Metadata/sensitive data.
  - Green: Content.
  - Gray: Unknown/other.
- **Hex Viewer**: In the right column, editable textarea for hex data (16 bytes per row, space-separated) with synchronized scrolling to the ASCII viewer. Orange highlights for file name ranges (e.g., MP3 bytes 3-32, DOCX bytes 0-500), yellow for sensitive data.
- **ASCII Viewer**: Synchronized with hex viewer, updates dynamically as hex is edited.
- **Save Hex Changes**: Button saves edited hex to the file buffer, updating SVG and metadata, with a success message.
- **Download Modified File**: Button downloads the modified file buffer as `modified_<filename>`.
- **Metadata**: Displays file details (name, extension, encoding, etc.) with notes on file name/extension storage (file system vs. binary).
- **File Sections**: Table listing sections (File Name, Extension, etc.) with clickable rectangles to highlight ranges in the hex viewer. "Learn More" buttons for File Name and Extension explain storage.
- **Data Type Breakdown**: Pie chart showing byte counts for File Name, Headers, Metadata, Content, and Unknown.
- **Scrubber**: Navigate through file bytes, updating the hex viewer and SVG.
- **Encryption Analysis**: Apply Caesar, AES-256, or XOR ciphers to file data.
- **Binary Sample**: Shows the first 256 bytes in binary.
- **Dark/Light Mode**: Toggle via a button at the top of the main content area.
- **File Name/Extension Education**: Modal explains where file name and extension are stored (file system or binary, e.g., MP3 bytes 3-32, DOCX bytes 0-500), triggered by "Learn More" buttons.
- **Layout**: Two-column grid (left: File Input, Graphical View, Metadata, Section Table, Pie Chart; right: Hex Viewer, Scrubber, Encryption, Binary Sample). No fixed header; fixed footer with copyright.

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
3. Edit hex data in the Hex Viewer (right column); ASCII viewer updates synchronously.
4. Click "Save Hex Changes" to update the file buffer (shows success message).
5. Click "Download Modified File" to save the edited file.
6. Explore the Metadata card for file details, including file name/extension storage notes.
7. Use the File Sections table to highlight ranges (click rectangles) or learn about file name/extension storage (click "Learn More").
8. View the Data Type Breakdown pie chart for byte distribution.
9. Navigate bytes with the Scrubber or click SVG rectangles.
10. Test encryption/decryption in the Encryption Analysis card.
11. Toggle dark/light mode via the top button.

## Testing
- **Test Files**: Use MP3 (e.g., `song.mp3` with ID3 tags), DOCX (e.g., `document.docx` with core.xml), and TXT (e.g., `note.txt`) files under 1MB.
- **Verify**:
  - Edit hex data in the textarea; confirm ASCII viewer updates synchronously.
  - Click "Save Hex Changes"; verify SVG, metadata, and pie chart update, with a success message.
  - Click "Download Modified File"; check the downloaded file reflects changes.
  - Confirm two-column grid layout (left: File Input, Graphical View, Metadata, Section Table, Pie Chart; right: Hex Viewer, Scrubber, Encryption, Binary Sample).
  - Pie chart shows correct byte counts for File Name, Headers, Metadata, Content, Unknown.
  - Hex Viewer and ASCII Viewer scroll synchronously (vertical scrolling aligns rows).
  - No fixed header; title and theme toggle at the top of main content; fixed footer visible.
  - File Name/Extension in Metadata card includes storage notes.
  - Section Table has “Learn More” buttons opening a modal.
  - Hex Viewer/SVG grid shows orange highlights for MP3 (bytes 3-32) or DOCX (bytes 0-500).
  - Modal explains file system vs. binary storage.
  - Dark/light mode applies to all elements, including pie chart.
- **Deployment**: Test on GitHub Pages to ensure no 404 errors (use relative paths `./styles.css`, `./script.js`).
- **Browser**: Test in Chrome for best compatibility.

## Troubleshooting
- **404 Errors**: Ensure `styles.css` and `script.js` are in the same directory as `index.html`. Check GitHub Pages settings.
- **File Size**: Files over 1MB will show an error in the File Input card.
- **Unsupported Formats**: Only txt, jpg, jpeg, png, docx, mp3, pdf, mp4 are supported.
- **Modal Issues**: Ensure JavaScript console shows no errors for modal events; verify `infoModal` CSS.
- **Highlighting**: Orange highlights appear only for MP3 (bytes 3-32) or DOCX (bytes 0-500); other files show “N/A” for File Name in the section table.
- **Synchronized Scrolling**: Check that hex and ASCII viewers align on the same row when scrolling vertically; horizontal scrolling is independent.
- **Pie Chart**: Verify byte counts match section ranges; ensure colors align with SVG grid (orange, blue, yellow, green, gray).
- **Editing Issues**: Ensure hex input is valid (hex digits, space-separated); invalid input shows an error on save.

## License
For educational use only. © 2025 File Analysis Tool.
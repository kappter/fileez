const fileInput = document.getElementById('fileInput');
const fileError = document.getElementById('fileError');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const fileLastModified = document.getElementById('fileLastModified');
const metadataSection = document.getElementById('metadataSection');
const fileMetadata = document.getElementById('fileMetadata');
const headerAnalysis = document.getElementById('headerAnalysis');
const headerDetails = document.getElementById('headerDetails');
const scrubToolSection = document.getElementById('scrubToolSection');
const offsetInput = document.getElementById('offsetInput');
const lengthInput = document.getElementById('lengthInput');
const applyScrub = document.getElementById('applyScrub');
const currentViewRange = document.getElementById('currentViewRange');
const dataDisplaySection = document.getElementById('dataDisplaySection');
const hexDataDisplay = document.getElementById('hexData');
const binaryDataDisplay = document.getElementById('binaryData');

const editModal = document.getElementById('editModal');
const modalOffset = document.getElementById('modalOffset');
const modalCurrentValue = document.getElementById('modalCurrentValue');
const newHexValueInput = document.getElementById('newHexValue');
const modalError = document.getElementById('modalError');
const saveEditButton = document.getElementById('saveEdit');
const cancelEditButton = document.getElementById('cancelEdit');

// Encryption/Decryption elements
const encryptionSection = document.getElementById('encryptionSection');
const cipherSelect = document.getElementById('cipherSelect');
const shiftKeyInput = document.getElementById('shiftKeyInput');
const encryptButton = document.getElementById('encryptButton');
const decryptButton = document.getElementById('decryptButton');
const cipherOutput = document.getElementById('cipherOutput');
const cipherError = document.getElementById('cipherError');

// Graphical View elements
const graphicalViewSection = document.getElementById('graphicalViewSection');
const graphicalViewCanvas = document.getElementById('graphicalViewCanvas');
const ctx = graphicalViewCanvas.getContext('2d');

const MAX_FILE_SIZE = 100 * 1024; // 100 KB in bytes
let currentFileBuffer = null; // Stores the ArrayBuffer of the current file
let currentViewOffset = 0;
let currentViewLength = 256; // Default view length

// Define colors for graphical view
const COLOR_HEADER_METADATA = '#3B82F6'; // Tailwind blue-500
const COLOR_PAYLOAD_DATA = '#10B981';    // Tailwind emerald-500
const HEADER_METADATA_BYTES = 64; // First 64 bytes for header/metadata

// --- Utility Functions ---

/**
 * Converts an ArrayBuffer to a hexadecimal string representation.
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @param {number} [offset=0] The starting offset in the buffer.
 * @param {number} [length=buffer.byteLength] The number of bytes to convert.
 * @returns {string} The hexadecimal string.
 */
function arrayBufferToHex(buffer, offset = 0, length = buffer.byteLength) {
    const byteArray = new Uint8Array(buffer, offset, length);
    return Array.from(byteArray).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

/**
 * Converts an ArrayBuffer to a binary string representation.
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @param {number} [offset=0] The starting offset in the buffer.
 * @param {number} [length=buffer.byteLength] The number of bytes to convert.
 * @returns {string} The binary string.
 */
function arrayBufferToBinary(buffer, offset = 0, length = buffer.byteLength) {
    const byteArray = new Uint8Array(buffer, offset, length);
    return Array.from(byteArray).map(byte => byte.toString(2).padStart(8, '0')).join(' ');
}

/**
 * Extracts and formats hex data with offsets and character representation.
 * This function is now responsible for generating the HTML for the hex display,
 * including the editable spans.
 * @param {ArrayBuffer} buffer The ArrayBuffer to format.
 * @param {number} offset The starting offset for the view.
 * @param {number} length The number of bytes to view.
 * @returns {string} Formatted hex string with offsets and ASCII.
 */
function formatHexWithAscii(buffer, offset, length) {
    const bytes = new Uint8Array(buffer, offset, length);
    let formattedOutput = '';
    const bytesPerLine = 16;

    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const currentLineBytes = bytes.slice(i, i + bytesPerLine);
        const currentLineOffset = offset + i;

        // Offset
        formattedOutput += `<span class="text-gray-500">${currentLineOffset.toString(16).padStart(8, '0').toUpperCase()}: </span>`;

        // Hex values
        for (let j = 0; j < bytesPerLine; j++) {
            if (j < currentLineBytes.length) {
                const byteValue = currentLineBytes[j];
                const hex = byteValue.toString(16).padStart(2, '0').toUpperCase();
                // Add data-offset and data-value for editing
                formattedOutput += `<span class="hex-byte-editable" data-offset="${currentLineOffset + j}" data-value="${hex}">${hex}</span> `;
            } else {
                formattedOutput += '   '; // Placeholder for shorter last line
            }
        }

        formattedOutput += '  '; // Separator

        // ASCII representation
        for (let j = 0; j < currentLineBytes.length; j++) {
            const byteValue = currentLineBytes[j];
            // Replace non-printable ASCII characters with a dot
            formattedOutput += (byteValue >= 32 && byteValue <= 126) ? String.fromCharCode(byteValue) : '.';
        }
        formattedOutput += '\n';
    }
    return formattedOutput;
}

/**
 * Extracts and formats binary data with offsets.
 * @param {ArrayBuffer} buffer The ArrayBuffer to format.
 * @param {number} offset The starting offset for the view.
 * @param {number} length The number of bytes to view.
 * @returns {string} Formatted binary string with offsets.
 */
function formatBinary(buffer, offset, length) {
    const bytes = new Uint8Array(buffer, offset, length);
    let formattedOutput = '';
    const bytesPerLine = 8; // Display 8 bytes per line for binary

    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const currentLineBytes = bytes.slice(i, i + bytesPerLine);
        const currentLineOffset = offset + i;

        // Offset
        formattedOutput += `<span class="text-gray-500">${currentLineOffset.toString(16).padStart(8, '0').toUpperCase()}: </span>`;

        // Binary values
        for (let j = 0; j < bytesPerLine; j++) {
            if (j < currentLineBytes.length) {
                const byteValue = currentLineBytes[j];
                formattedOutput += byteValue.toString(2).padStart(8, '0') + ' ';
            } else {
                formattedOutput += '         '; // Placeholder for shorter last line
            }
        }
        formattedOutput += '\n';
    }
    return formattedOutput;
}

/**
 * Analyzes the file buffer for common header information (magic numbers).
 * @param {ArrayBuffer} buffer The file buffer.
 * @returns {string} A string describing identified headers.
 */
function analyzeHeaders(buffer) {
    if (buffer.byteLength === 0) {
        return "File is empty, no headers to analyze.";
    }

    const bytes = new Uint8Array(buffer);
    let headerInfo = '';

    // Helper to get bytes safely
    const getBytes = (start, count) => {
        if (bytes.length < start + count) return null;
        return Array.from(bytes.slice(start, start + count)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    };

    // Common File Signatures (Magic Numbers)
    // JPEG/JPG: FF D8 FF E0/E1/E2/E3/E8 (SOI marker + APP0/APP1/APP2/APP3/APP8 marker)
    const jpegSignature1 = getBytes(0, 4); // FF D8 FF E0
    const jpegSignature2 = getBytes(0, 4); // FF D8 FF E1 (EXIF)
    const jpegSignature3 = getBytes(0, 4); // FF D8 FF E2 (Canon EOS)
    const jpegSignature4 = getBytes(0, 4); // FF D8 FF E3 (Samsung D800)
    const jpegSignature5 = getBytes(0, 4); // FF D8 FF E8 (SPIFF)

    if (jpegSignature1 && jpegSignature1.startsWith('FFD8FF') && ['E0', 'E1', 'E2', 'E3', 'E8'].includes(jpegSignature1.substring(6, 8))) {
        headerInfo += `- Identified as JPEG/JPG image (Magic Number: ${jpegSignature1}).\n`;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = getBytes(0, 8);
    if (pngSignature === '89504E470D0A1A0A') {
        headerInfo += `- Identified as PNG image (Magic Number: ${pngSignature}).\n`;
    }

    // GIF: 47 49 46 38 37 61 or 47 49 46 38 39 61
    const gifSignature = getBytes(0, 6);
    if (gifSignature === '474946383761' || gifSignature === '474946383961') {
        headerInfo += `- Identified as GIF image (Magic Number: ${gifSignature}).\n`;
    }

    // PDF: %PDF-
    const pdfSignature = new TextDecoder().decode(bytes.slice(0, 5));
    if (pdfSignature === '%PDF-') {
        headerInfo += `- Identified as PDF document (Signature: ${pdfSignature}).\n`;
    }

    // DOCX/XLSX/PPTX (ZIP files): PK 03 04
    const zipSignature = getBytes(0, 4);
    if (zipSignature === '504B0304') {
        headerInfo += `- Identified as a ZIP archive (e.g., DOCX, XLSX, PPTX) (Magic Number: ${zipSignature}).\n`;
    }

    // MP3 (ID3v2 tag): 49 44 33 (ID3)
    const mp3ID3Signature = getBytes(0, 3);
    if (mp3ID3Signature === '494433') {
        headerInfo += `- Identified as MP3 audio (ID3v2 tag: ${mp3ID3Signature}).\n`;
    } else {
        // MP3 (MPEG frame header - common, but less definitive than ID3)
        // Check for FF FB (MPEG-1 Layer III) or FF F3 (MPEG-2 Layer III)
        const mp3FrameSignature1 = getBytes(0, 2);
        if (mp3FrameSignature1 === 'FFFB' || mp3FrameSignature1 === 'FFF3') {
            headerInfo += `- Identified as MP3 audio (MPEG frame header: ${mp3FrameSignature1}). Note: This is a frame header, not a definitive file signature like ID3.\n`;
        }
    }

    // TXT: No specific magic number, but can check for common text encodings or just assume
    if (headerInfo === '' && buffer.byteLength > 0) {
        // Heuristic: Check if the first few bytes are printable ASCII
        const first100Bytes = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(100, bytes.length)));
        const isMostlyPrintable = [...first100Bytes].every(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126 || char === '\n' || char === '\r' || char === '\t');
        if (isMostlyPrintable) {
            headerInfo += `- Appears to be a plain text file (TXT). No specific magic number.\n`;
        }
    }

    if (headerInfo === '') {
        headerInfo = "No common file headers identified based on magic numbers.";
    }

    return headerInfo;
}


/**
 * Renders the file data (hex and binary) based on current view settings.
 */
function renderFileData() {
    if (!currentFileBuffer) return;

    const totalBytes = currentFileBuffer.byteLength;
    const startByte = Math.max(0, Math.min(currentViewOffset, totalBytes - 1));
    const endByte = Math.min(startByte + currentViewLength, totalBytes);
    const actualLength = endByte - startByte;

    // Update scrub tool inputs and range display
    offsetInput.value = startByte;
    lengthInput.value = actualLength;
    currentViewRange.textContent = `${startByte} - ${endByte - 1}`;

    // Display Hex Data
    hexDataDisplay.innerHTML = formatHexWithAscii(currentFileBuffer, startByte, actualLength);
    // Display Binary Data
    binaryDataDisplay.textContent = formatBinary(currentFileBuffer, startByte, actualLength);

    // Add click listeners to hex bytes for editing
    document.querySelectorAll('.hex-byte-editable').forEach(span => {
        span.onclick = (event) => openEditModal(event.target);
    });
}

/**
 * Applies Caesar cipher encryption or decryption to a given text.
 * @param {string} text The input text.
 * @param {number} shift The shift key.
 * @param {boolean} encrypt True for encryption, false for decryption.
 * @returns {string} The processed text.
 */
function caesarCipher(text, shift, encrypt) {
    let result = '';
    shift = shift % 26; // Ensure shift is within 0-25
    if (!encrypt) {
        shift = (26 - shift) % 26; // For decryption, shift in reverse
    }

    for (let i = 0; i < text.length; i++) {
        let char = text.charCodeAt(i);

        // Uppercase letters (A-Z)
        if (char >= 65 && char <= 90) {
            result += String.fromCharCode(((char - 65 + shift) % 26) + 65);
        }
        // Lowercase letters (a-z)
        else if (char >= 97 && char >= 97 && char <= 122) {
            result += String.fromCharCode(((char - 97 + shift) % 26) + 97);
        }
        // Other characters (numbers, symbols, spaces) remain unchanged
        else {
            result += text.charAt(i);
        }
    }
    return result;
}

/**
 * Renders the graphical view of the file bytes on the canvas.
 * @param {ArrayBuffer} buffer The file buffer to visualize.
 */
function renderGraphicalView(buffer) {
    if (!buffer || buffer.byteLength === 0) {
        ctx.clearRect(0, 0, graphicalViewCanvas.width, graphicalViewCanvas.height);
        return;
    }

    const bytes = new Uint8Array(buffer);
    const totalBytes = bytes.byteLength;

    // Clear the canvas
    ctx.clearRect(0, 0, graphicalViewCanvas.width, graphicalViewCanvas.height);

    // Calculate dimensions for each "byte block"
    // We want to fill the canvas, so calculate pixel dimensions per byte
    // For small files, each byte might be represented by multiple pixels.
    // For large files, multiple bytes might be represented by one pixel.

    const canvasWidth = graphicalViewCanvas.width;
    const canvasHeight = graphicalViewCanvas.height;

    // Determine the number of "cells" in the grid
    const cellSize = 2; // Each cell is 2x2 pixels for better visibility
    const cellsX = Math.floor(canvasWidth / cellSize);
    const cellsY = Math.floor(canvasHeight / cellSize);
    const totalCells = cellsX * cellsY;

    // How many bytes does each cell represent?
    const bytesPerCell = Math.ceil(totalBytes / totalCells);

    let currentByteIndex = 0;

    for (let y = 0; y < cellsY; y++) {
        for (let x = 0; x < cellsX; x++) {
            if (currentByteIndex >= totalBytes) {
                break; // All bytes rendered
            }

            // Determine the color based on byte category
            let fillColor;
            if (currentByteIndex < HEADER_METADATA_BYTES) {
                fillColor = COLOR_HEADER_METADATA; // Header/Metadata
            } else {
                fillColor = COLOR_PAYLOAD_DATA; // Payload Data
            }

            ctx.fillStyle = fillColor;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

            currentByteIndex += bytesPerCell;
        }
        if (currentByteIndex >= totalBytes) {
            break;
        }
    }
}


// --- Event Handlers ---

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        fileError.textContent = '';
        fileInfo.classList.add('hidden');
        metadataSection.classList.add('hidden');
        graphicalViewSection.classList.add('hidden'); // Hide graphical view
        scrubToolSection.classList.add('hidden');
        dataDisplaySection.classList.add('hidden');
        encryptionSection.classList.add('hidden'); // Hide encryption section
        currentFileBuffer = null;
        renderGraphicalView(null); // Clear canvas
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        fileError.textContent = `File size exceeds the 100KB limit. Please select a smaller file. (Current: ${Math.round(file.size / 1024)} KB)`;
        fileInfo.classList.add('hidden');
        metadataSection.classList.add('hidden');
        graphicalViewSection.classList.add('hidden'); // Hide graphical view
        scrubToolSection.classList.add('hidden');
        dataDisplaySection.classList.add('hidden');
        encryptionSection.classList.add('hidden'); // Hide encryption section
        currentFileBuffer = null;
        renderGraphicalView(null); // Clear canvas
        return;
    }

    fileError.textContent = ''; // Clear previous errors

    // Display basic file info
    fileName.textContent = file.name;
    fileSize.textContent = file.size;
    fileType.textContent = file.type || 'Unknown';
    fileLastModified.textContent = new Date(file.lastModified).toLocaleString();
    fileInfo.classList.remove('hidden');

    // Read file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = (e) => {
        currentFileBuffer = e.target.result;
        currentViewOffset = 0; // Reset view offset
        currentViewLength = Math.min(256, currentFileBuffer.byteLength); // Default to 256 bytes or less if file is smaller

        // Display metadata (basic file properties)
        fileMetadata.textContent = `File Name: ${file.name}\nFile Type: ${file.type || 'Unknown'}\nFile Size: ${file.size} bytes\nLast Modified: ${new Date(file.lastModified).toLocaleString()}`;
        metadataSection.classList.remove('hidden');

        // Analyze and display header info
        headerDetails.textContent = analyzeHeaders(currentFileBuffer);
        headerAnalysis.classList.remove('hidden'); // Ensure headerAnalysis is visible

        // Show graphical view
        graphicalViewSection.classList.remove('hidden');
        renderGraphicalView(currentFileBuffer); // Render graphical view

        // Show scrub tool, data display, and encryption sections
        scrubToolSection.classList.remove('hidden');
        dataDisplaySection.classList.remove('hidden');
        encryptionSection.classList.remove('hidden'); // Show encryption section

        renderFileData(); // Initial render
        cipherOutput.value = ''; // Clear cipher output on new file load
        cipherError.textContent = '';
    };
    reader.onerror = () => {
        fileError.textContent = 'Failed to read file.';
        currentFileBuffer = null;
        renderGraphicalView(null); // Clear canvas
    };
    reader.readAsArrayBuffer(file);
});

applyScrub.addEventListener('click', () => {
    if (!currentFileBuffer) return;

    const newOffset = parseInt(offsetInput.value, 10);
    const newLength = parseInt(lengthInput.value, 10);

    if (isNaN(newOffset) || newOffset < 0 || newOffset >= currentFileBuffer.byteLength) {
        // In a real app, you might show a specific error message for invalid offset
        offsetInput.value = currentViewOffset; // Revert to current valid offset
        return;
    }
    if (isNaN(newLength) || newLength <= 0) {
         // In a real app, you might show a specific error message for invalid length
        lengthInput.value = currentViewLength; // Revert to current valid length
        return;
    }

    currentViewOffset = newOffset;
    currentViewLength = newLength;
    renderFileData();
});

// --- Modal Logic for Hex Editing ---
let selectedHexByteSpan = null; // Reference to the span being edited
let originalByteValue = null; // Store original value for comparison

function openEditModal(spanElement) {
    selectedHexByteSpan = spanElement;
    const offset = parseInt(spanElement.dataset.offset, 10);
    const currentValue = spanElement.dataset.value; // Hex string, e.g., "A5"

    modalOffset.textContent = offset;
    modalCurrentValue.textContent = currentValue;
    newHexValueInput.value = currentValue;
    modalError.textContent = ''; // Clear previous modal errors
    editModal.classList.remove('hidden');
    newHexValueInput.focus();
    newHexValueInput.select(); // Select the text for easy overwrite
}

function closeEditModal() {
    editModal.classList.add('hidden');
    selectedHexByteSpan = null;
    originalByteValue = null;
}

saveEditButton.addEventListener('click', () => {
    const newHex = newHexValueInput.value.trim().toUpperCase();
    if (!/^[0-9A-F]{2}$/.test(newHex)) {
        modalError.textContent = 'Please enter a valid 2-digit hex value (00-FF).';
        return;
    }

    if (selectedHexByteSpan && currentFileBuffer) {
        const offset = parseInt(selectedHexByteSpan.dataset.offset, 10);
        const byteValue = parseInt(newHex, 16); // Convert hex string to integer

        // Create a new ArrayBuffer with the modified byte
        // It's important to create a new buffer because ArrayBuffer is immutable
        const newBuffer = currentFileBuffer.slice(0); // Create a copy
        const newByteArray = new Uint8Array(newBuffer);
        newByteArray[offset] = byteValue; // Modify the byte in the new array

        currentFileBuffer = newBuffer; // Update the main buffer reference

        renderFileData(); // Re-render with the updated buffer
        renderGraphicalView(currentFileBuffer); // Re-render graphical view after edit
    }
    closeEditModal();
});

cancelEditButton.addEventListener('click', closeEditModal);

// Allow closing modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !editModal.classList.contains('hidden')) {
        closeEditModal();
    }
});

// Prevent modal from closing when clicking inside the content
document.querySelector('.modal-content').addEventListener('click', (event) => {
    event.stopPropagation();
});

// Close modal when clicking outside the content
editModal.addEventListener('click', closeEditModal);


// --- Encryption/Decryption Event Listeners ---
encryptButton.addEventListener('click', () => {
    if (!currentFileBuffer) {
        cipherError.textContent = 'Please upload a file first.';
        return;
    }
    const shift = parseInt(shiftKeyInput.value, 10);
    if (isNaN(shift) || shift < 0 || shift > 25) {
        cipherError.textContent = 'Shift key must be between 0 and 25.';
        return;
    }
    cipherError.textContent = ''; // Clear previous errors

    // Get the ASCII representation of the *entire* file for encryption
    // Note: This will only work meaningfully for text-based files.
    // For binary files, the output will likely be gibberish but demonstrates the character shift.
    const fileText = new TextDecoder('utf-8', { fatal: false }).decode(currentFileBuffer);
    const encryptedText = caesarCipher(fileText, shift, true);
    cipherOutput.value = encryptedText;
});

decryptButton.addEventListener('click', () => {
    if (!currentFileBuffer) {
        cipherError.textContent = 'Please upload a file first.';
        return;
    }
    const shift = parseInt(shiftKeyInput.value, 10);
    if (isNaN(shift) || shift < 0 || shift > 25) {
        cipherError.textContent = 'Shift key must be between 0 and 25.';
        return;
    }
    cipherError.textContent = ''; // Clear previous errors

    // Decrypt the content currently in the cipherOutput textarea
    // This allows decrypting previously encrypted text or any text pasted into the box
    const textToDecrypt = cipherOutput.value;
    const decryptedText = caesarCipher(textToDecrypt, shift, false);
    cipherOutput.value = decryptedText;
});


// Initial state: hide sections until a file is loaded
fileInfo.classList.add('hidden');
metadataSection.classList.add('hidden');
graphicalViewSection.classList.add('hidden'); // Ensure graphical view section is hidden initially
scrubToolSection.classList.add('hidden');
dataDisplaySection.classList.add('hidden');
encryptionSection.classList.add('hidden'); // Ensure encryption section is hidden initially

// Handle canvas resizing (optional, but good for responsiveness)
window.addEventListener('resize', () => {
    if (currentFileBuffer) {
        // Adjust canvas display size
        const containerWidth = graphicalViewCanvas.parentElement.clientWidth;
        graphicalViewCanvas.style.width = containerWidth + 'px';
        // Re-render to adapt to new dimensions if necessary (though fixed internal resolution is used)
        renderGraphicalView(currentFileBuffer);
    }
});

// Set initial canvas display width to match its parent container
window.onload = () => {
    const containerWidth = graphicalViewCanvas.parentElement.clientWidth;
    graphicalViewCanvas.style.width = containerWidth + 'px';
};

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
const scrubSlider = document.getElementById('scrubSlider');
const currentOffsetDisplay = document.getElementById('currentOffsetDisplay');
const lengthInput = document.getElementById('lengthInput');
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
const editSuccessMessage = document.getElementById('editSuccessMessage'); // NEW: Success message element

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
const byteInfoDisplay = document.getElementById('byteInfoDisplay');

// Encoding selection element
const encodingSelect = document.getElementById('encodingSelect');

// Theme toggle button
const themeToggle = document.getElementById('themeToggle');

// Loading indicator element
const loadingIndicator = document.getElementById('loadingIndicator');

// Filename Explanation Section
const filenameExplanationSection = document.getElementById('filenameExplanationSection');
const currentFileNameInExplanation = document.getElementById('currentFileNameInExplanation');

// Data Type Breakdown Section (NEW)
const dataTypeBreakdownSection = document.getElementById('dataTypeBreakdownSection');
const byteTypePieChart = document.getElementById('byteTypePieChart');
const pieChartLegend = document.getElementById('pieChartLegend');

// About This Tool Section (NEW)
const aboutToolSection = document.getElementById('aboutToolSection');


const MAX_FILE_SIZE = 100 * 1024; // 100 KB in bytes
let currentFileBuffer = null; // Stores the ArrayBuffer of the current file
let currentViewOffset = 0;
let currentViewLength = 256; // Default view length
let currentEncoding = 'utf-8'; // Default encoding

// Define colors for graphical view (these are hardcoded for canvas, as canvas doesn't directly use CSS vars)
const COLOR_HEADER_METADATA = '#3B82F6'; // Tailwind blue-500
const COLOR_PAYLOAD_DATA = '#10B981';    // Tailwind emerald-500
const COLOR_HIGHLIGHT = '#F59E0B';       // Tailwind amber-500 for clicked byte
const HEADER_METADATA_BYTES = 64; // First 64 bytes for header/metadata

const BYTES_PER_ROW_GRAPHICAL = 64; // Fixed number of bytes to display per row in graphical view

// Pie chart colors (mapped to CSS variables for theme compatibility)
const PIE_CHART_COLORS = {
    'Control Characters (0x00-0x1F, 0x7F)': 'var(--chart-color-control)',
    'Printable ASCII (0x20-0x7E)': 'var(--chart-color-printable)',
    'Extended ASCII / Latin-1 (0x80-0xFF)': 'var(--chart-color-extended)',
    'Other/Invalid': 'var(--chart-color-other)'
};


// --- Theme Toggle Logic ---
/**
 * Applies the stored theme preference or defaults to light mode.
 */
function applyThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Toggles the dark/light theme and saves the preference.
 */
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    // Re-render pie chart on theme change to update colors
    if (currentFileBuffer) {
        renderPieChart(analyzeByteTypes(currentFileBuffer));
    }
}

// Apply theme on initial load
applyThemePreference();
themeToggle.addEventListener('click', toggleTheme);


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
 * @param {number} [highlightOffset = -1] Optional absolute offset of a byte to highlight.
 * @returns {string} Formatted hex string with offsets and ASCII.
 */
function formatHexWithAscii(buffer, offset, length, highlightOffset = -1) {
    const bytes = new Uint8Array(buffer, offset, length);
    let formattedOutput = '';
    const bytesPerLine = 16;
    const textDecoder = new TextDecoder(currentEncoding, { fatal: false }); // Use currentEncoding

    for (let i = 0; i < bytes.length; i += bytesPerLine) {
        const currentLineBytes = bytes.slice(i, i + bytesPerLine);
        const currentLineOffset = offset + i;

        // Offset
        formattedOutput += `<span class="text-secondary-text">${currentLineOffset.toString(16).padStart(8, '0').toUpperCase()}: </span>`;

        // Hex values
        for (let j = 0; j < bytesPerLine; j++) {
            const absoluteByteOffset = currentLineOffset + j;
            if (j < currentLineBytes.length) {
                const byteValue = currentLineBytes[j];
                const hex = byteValue.toString(16).padStart(2, '0').toUpperCase();
                let classes = "hex-byte-editable";
                if (absoluteByteOffset === highlightOffset) {
                    classes += " highlighted-hex-byte"; // Apply new highlight class
                }
                // Add data-offset and data-value for editing
                formattedOutput += `<span class="${classes}" data-offset="${absoluteByteOffset}" data-value="${hex}">${hex}</span> `;
            } else {
                formattedOutput += '   '; // Placeholder for shorter last line
            }
        }

        formattedOutput += '  '; // Separator

        // ASCII representation using the selected encoding
        const asciiChunk = textDecoder.decode(currentLineBytes);
        formattedOutput += [...asciiChunk].map(char => {
            const charCode = char.charCodeAt(0);
            return (charCode >= 32 && charCode <= 126) ? char : '.'; // Replace non-printable with dot
        }).join('');
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
 * @param {number} [highlightOffset = -1] Optional absolute offset of a byte to highlight in the hex view.
 */
function renderFileData(highlightOffset = -1) {
    if (!currentFileBuffer) return;

    const totalBytes = currentFileBuffer.byteLength;
    const startByte = Math.max(0, Math.min(currentViewOffset, totalBytes - 1));
    const endByte = Math.min(startByte + currentViewLength, totalBytes);
    const actualLength = endByte - startByte;

    // Update scrub tool inputs and range display
    // Ensure scrubSlider value is in sync with currentViewOffset
    scrubSlider.value = currentViewOffset;
    currentOffsetDisplay.textContent = currentViewOffset;
    currentViewRange.textContent = `${startByte} - ${endByte - 1}`;

    // Display Hex Data, passing the highlightOffset
    hexDataDisplay.innerHTML = formatHexWithAscii(currentFileBuffer, startByte, actualLength, highlightOffset);
    // Display Binary Data
    binaryDataDisplay.textContent = formatBinary(currentFileBuffer, startByte, actualLength);

    // Add click listeners to hex bytes for editing
    document.querySelectorAll('.hex-byte-editable').forEach(span => {
        span.onclick = (event) => openEditModal(event.target);
    });

    // If a highlight is requested and it's within the current view, scroll to it
    if (highlightOffset !== -1 && highlightOffset >= startByte && highlightOffset < endByte) {
        const hexByteElement = hexDataDisplay.querySelector(`[data-offset="${highlightOffset}"]`);
        if (hexByteElement) {
            // Calculate the scroll position to bring the element into view
            const containerScrollTop = hexDataDisplay.scrollTop;
            const elementOffsetTop = hexByteElement.offsetTop;
            const elementHeight = hexByteElement.offsetHeight;
            const containerHeight = hexDataDisplay.clientHeight;

            // Scroll only if the element is not fully visible
            if (elementOffsetTop < containerScrollTop || elementOffsetTop + elementHeight > containerScrollTop + containerHeight) {
                hexDataDisplay.scrollTop = elementOffsetTop - (containerHeight / 2) + (elementHeight / 2);
            }
        }
    }
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
        else if (char >= 97 && char <= 122) {
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
 * @param {number} [highlightByteIndex = -1] Optional index of a byte to highlight.
 */
function renderGraphicalView(buffer, highlightByteIndex = -1) {
    if (!buffer || buffer.byteLength === 0) {
        ctx.clearRect(0, 0, graphicalViewCanvas.width, graphicalViewCanvas.height);
        byteInfoDisplay.textContent = 'Click a byte in the graphical view to see its details.';
        return;
    }

    const bytes = new Uint8Array(buffer);
    const totalBytes = bytes.byteLength;

    const canvasWidth = graphicalViewCanvas.width; // Fixed width from HTML
    const pixelWidthPerByte = canvasWidth / BYTES_PER_ROW_GRAPHICAL;
    const pixelHeightPerByte = pixelWidthPerByte; // Make them square

    const numRows = Math.ceil(totalBytes / BYTES_PER_ROW_GRAPHICAL);
    const requiredCanvasHeight = numRows * pixelHeightPerByte;

    // Set canvas height dynamically to enable scrolling in its container
    graphicalViewCanvas.height = requiredCanvasHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, requiredCanvasHeight);

    const borderSize = 0.5; // Small border for visual separation

    for (let i = 0; i < totalBytes; i++) {
        const row = Math.floor(i / BYTES_PER_ROW_GRAPHICAL);
        const col = i % BYTES_PER_ROW_GRAPHICAL;

        const x = col * pixelWidthPerByte;
        const y = row * pixelHeightPerByte;

        let fillColor;
        if (i < HEADER_METADATA_BYTES) {
            fillColor = COLOR_HEADER_METADATA; // Header/Metadata
        } else {
            fillColor = COLOR_PAYLOAD_DATA; // Payload Data
        }

        if (i === highlightByteIndex) {
            fillColor = COLOR_HIGHLIGHT; // Highlight clicked byte
        }

        ctx.fillStyle = fillColor;
        // Draw slightly smaller rectangle to create a border effect
        ctx.fillRect(x + borderSize, y + borderSize, pixelWidthPerByte - 2 * borderSize, pixelHeightPerByte - 2 * borderSize);

        // No need for separate strokeRect if using fillRect with borderSize
    }
}

/**
 * Analyzes byte types in the buffer and returns counts.
 * @param {ArrayBuffer} buffer
 * @returns {Array<Object>} Data for the pie chart.
 */
function analyzeByteTypes(buffer) {
    const bytes = new Uint8Array(buffer);
    let counts = {
        'Control Characters (0x00-0x1F, 0x7F)': 0,
        'Printable ASCII (0x20-0x7E)': 0,
        'Extended ASCII / Latin-1 (0x80-0xFF)': 0,
        'Other/Invalid': 0 // Fallback for any unexpected
    };

    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte >= 0x00 && byte <= 0x1F || byte === 0x7F) {
            counts['Control Characters (0x00-0x1F, 0x7F)']++;
        } else if (byte >= 0x20 && byte <= 0x7E) {
            counts['Printable ASCII (0x20-0x7E)']++;
        } else if (byte >= 0x80 && byte <= 0xFF) {
            counts['Extended ASCII / Latin-1 (0x80-0xFF)']++;
        } else {
            counts['Other/Invalid']++;
        }
    }

    // Convert counts to an array of objects suitable for D3 pie chart
    return Object.keys(counts).map(key => ({
        label: key,
        value: counts[key],
        color: PIE_CHART_COLORS[key] || 'gray' // Fallback color
    })).filter(d => d.value > 0); // Only include categories with data
}

/**
 * Renders the pie chart using D3.js.
 * @param {Array<Object>} data Data for the pie chart.
 */
function renderPieChart(data) {
    // Clear previous chart
    d3.select(byteTypePieChart).selectAll("*").remove();
    pieChartLegend.innerHTML = ''; // Clear previous legend

    if (data.length === 0) {
        pieChartLegend.textContent = "No data to display for byte type breakdown.";
        return;
    }

    const width = byteTypePieChart.clientWidth;
    const height = byteTypePieChart.clientHeight;
    const radius = Math.min(width, height) / 2 - 10; // Subtract some padding

    const svg = d3.select(byteTypePieChart)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    const arcs = svg.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "var(--color-primary-bg)") // Border between slices
        .style("stroke-width", "1px")
        .transition() // Add transition for smooth drawing
        .duration(750)
        .attrTween("d", function(d) {
            const i = d3.interpolate(d.startAngle, d.endAngle);
            return function(t) {
                d.endAngle = i(t);
                return arc(d);
            };
        });

    // Add text labels
    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("fill", "white") // Text color for labels on slices
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text(d => d.data.value > 0 ? `${((d.data.value / d3.sum(data, v => v.value)) * 100).toFixed(1)}%` : "")
        .style("opacity", 0) // Start hidden
        .transition() // Fade in
        .duration(1000)
        .style("opacity", 1);


    // Create legend
    data.forEach(d => {
        const legendItem = document.createElement('div');
        legendItem.className = 'flex items-center gap-2';
        legendItem.innerHTML = `
            <span class="inline-block w-4 h-4 rounded-sm" style="background-color: ${d.color};"></span>
            <span>${d.label} (${d.value} bytes)</span>
        `;
        pieChartLegend.appendChild(legendItem);
    });
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
        loadingIndicator.classList.add('hidden'); // Hide loading indicator if no file selected
        filenameExplanationSection.classList.add('hidden'); // Hide explanation
        dataTypeBreakdownSection.classList.add('hidden'); // Hide pie chart section
        aboutToolSection.classList.add('hidden'); // Hide about tool section
        currentFileBuffer = null;
        renderGraphicalView(null); // Clear canvas
        return;
    }

    // Show loading indicator immediately
    loadingIndicator.classList.remove('hidden');

    if (file.size > MAX_FILE_SIZE) {
        fileError.textContent = `File size exceeds the 100KB limit. Please select a smaller file. (Current: ${Math.round(file.size / 1024)} KB)`;
        fileInfo.classList.add('hidden');
        metadataSection.classList.add('hidden');
        graphicalViewSection.classList.add('hidden'); // Hide graphical view
        scrubToolSection.classList.add('hidden');
        dataDisplaySection.classList.add('hidden');
        encryptionSection.classList.add('hidden'); // Hide encryption section
        loadingIndicator.classList.add('hidden'); // Hide loading indicator on error
        filenameExplanationSection.classList.add('hidden'); // Hide explanation
        dataTypeBreakdownSection.classList.add('hidden'); // Hide pie chart section
        aboutToolSection.classList.add('hidden'); // Hide about tool section
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

        // Update scrub slider max value
        scrubSlider.max = Math.max(0, currentFileBuffer.byteLength - currentViewLength);
        scrubSlider.value = 0; // Reset slider to start
        currentOffsetDisplay.textContent = 0; // Reset display

        // Display metadata (basic file properties)
        fileMetadata.textContent = `File Name: ${file.name}\nFile Type: ${file.type || 'Unknown'}\nFile Size: ${file.size} bytes\nLast Modified: ${new Date(file.lastModified).toLocaleString()}`;
        metadataSection.classList.remove('hidden');

        // Analyze and display header info
        headerDetails.textContent = analyzeHeaders(currentFileBuffer);
        headerAnalysis.classList.remove('hidden'); // Ensure headerAnalysis is visible

        // Show graphical view
        graphicalViewSection.classList.remove('hidden');
        renderGraphicalView(currentFileBuffer); // Render graphical view
        byteInfoDisplay.textContent = 'Click a byte in the graphical view to see its details.'; // Reset info text


        // Show scrub tool, data display, and encryption sections
        scrubToolSection.classList.remove('hidden');
        dataDisplaySection.classList.remove('hidden'); // Show hex/binary display
        encryptionSection.classList.remove('hidden'); // Show encryption section

        // Show and update filename explanation section
        currentFileNameInExplanation.textContent = file.name;
        filenameExplanationSection.classList.remove('hidden');

        // Show and render data type breakdown pie chart
        dataTypeBreakdownSection.classList.remove('hidden');
        renderPieChart(analyzeByteTypes(currentFileBuffer));

        // Show About This Tool section
        aboutToolSection.classList.remove('hidden');

        renderFileData(); // Initial render
        cipherOutput.value = ''; // Clear cipher output on new file load
        cipherError.textContent = '';

        loadingIndicator.classList.add('hidden'); // Hide loading indicator after successful load
    };
    reader.onerror = () => {
        fileError.textContent = 'Failed to read file.';
        currentFileBuffer = null;
        renderGraphicalView(null); // Clear canvas
        loadingIndicator.classList.add('hidden'); // Hide loading indicator on error
        filenameExplanationSection.classList.add('hidden'); // Hide explanation on error
        dataTypeBreakdownSection.classList.add('hidden'); // Hide pie chart section on error
        aboutToolSection.classList.add('hidden'); // Hide about tool section on error
    };
    reader.readAsArrayBuffer(file);
});

// Event listener for scrub slider
scrubSlider.addEventListener('input', () => {
    currentViewOffset = parseInt(scrubSlider.value, 10);
    renderFileData(); // Re-render hex data based on new offset
    // No need to re-render graphical view unless there's a highlight to clear/add
    // renderGraphicalView(currentFileBuffer); // Could clear highlight here if desired
});

// Event listener for length input
lengthInput.addEventListener('change', () => { // Using 'change' for number input is often better for performance
    let newLength = parseInt(lengthInput.value, 10);
    if (isNaN(newLength) || newLength < 1) {
        newLength = 256; // Default to 256 if invalid
        lengthInput.value = newLength;
    }
    currentViewLength = newLength;
    // Adjust slider max if length changes
    scrubSlider.max = Math.max(0, currentFileBuffer.byteLength - currentViewLength);
    // Ensure current offset doesn't exceed new max
    if (currentViewOffset > scrubSlider.max) {
        currentViewOffset = scrubSlider.max;
        scrubSlider.value = currentViewOffset;
    }
    renderFileData();
});

// Event listener for encoding selection
encodingSelect.addEventListener('change', (event) => {
    currentEncoding = event.target.value;
    if (currentFileBuffer) {
        renderFileData(); // Re-render hex data with new encoding
        // Re-render byte info display if a byte is currently selected
        const currentHighlightedByte = graphicalViewCanvas.dataset.highlightedByte;
        if (currentHighlightedByte) {
            const byteIndex = parseInt(currentHighlightedByte, 10);
            const byteValue = new Uint8Array(currentFileBuffer)[byteIndex];
            const hex = byteValue.toString(16).padStart(2, '0');
            const binary = byteValue.toString(2).padStart(8, '0');
            const textDecoder = new TextDecoder(currentEncoding, { fatal: false }); // Use currentEncoding
            const ascii = textDecoder.decode(new Uint8Array([byteValue]));

            byteInfoDisplay.innerHTML = `
                <span class="font-semibold">Offset:</span> 0x${byteIndex.toString(16).toUpperCase()} (${byteIndex}) &nbsp;
                <span class="font-semibold">Hex:</span> 0x${hex.toUpperCase()} &nbsp;
                <span class="font-semibold">Binary:</span> ${binary} &nbsp;
                <span class="font-semibold">ASCII:</span> '${(ascii.charCodeAt(0) >= 32 && ascii.charCodeAt(0) <= 126) ? ascii : '.'}'
            `;
        }
    }
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
    editSuccessMessage.classList.add('hidden'); // Hide previous success message
    editModal.classList.remove('hidden');
    newHexValueInput.focus();
    newHexValueInput.select(); // Select the text for easy overwrite
}

function closeEditModal() {
    editModal.classList.add('hidden');
    selectedHexByteSpan = null;
    originalByteValue = null;
    editSuccessMessage.classList.add('hidden'); // Ensure hidden on close
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
        renderPieChart(analyzeByteTypes(currentFileBuffer)); // Re-render pie chart after edit

        // Show success message
        editSuccessMessage.classList.remove('hidden');
        setTimeout(() => {
            editSuccessMessage.classList.add('hidden');
            closeEditModal(); // Close modal after showing message briefly
        }, 1000); // Show for 1 second
    } else {
        closeEditModal(); // Close if something went wrong
    }
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
    const fileText = new TextDecoder(currentEncoding, { fatal: false }).decode(currentFileBuffer); // Use current encoding
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

// New event listener for graphical view clicks
graphicalViewCanvas.addEventListener('click', (event) => {
    if (!currentFileBuffer) return;

    const rect = graphicalViewCanvas.getBoundingClientRect();
    // Adjust for scroll position of the parent container
    const scrollY = graphicalViewCanvas.parentElement.scrollTop;
    const x = event.clientX - rect.left;
    const y = (event.clientY - rect.top) + scrollY; // Add scrollY to get true Y relative to canvas top

    const canvasWidth = graphicalViewCanvas.width;
    const pixelWidthPerByte = canvasWidth / BYTES_PER_ROW_GRAPHICAL;
    const pixelHeightPerByte = pixelWidthPerByte;

    const col = Math.floor(x / pixelWidthPerByte);
    const row = Math.floor(y / pixelHeightPerByte);

    const clickedByteIndex = row * BYTES_PER_ROW_GRAPHICAL + col;

    if (clickedByteIndex >= 0 && clickedByteIndex < currentFileBuffer.byteLength) {
        const byteValue = new Uint8Array(currentFileBuffer)[clickedByteIndex];
        const hex = byteValue.toString(16).padStart(2, '0');
        const binary = byteValue.toString(2).padStart(8, '0');
        const textDecoder = new TextDecoder(currentEncoding, { fatal: false }); // Use currentEncoding
        const ascii = textDecoder.decode(new Uint8Array([byteValue]));

        byteInfoDisplay.innerHTML = `
            <span class="font-semibold">Offset:</span> 0x${clickedByteIndex.toString(16).toUpperCase()} (${clickedByteIndex}) &nbsp;
            <span class="font-semibold">Hex:</span> 0x${hex.toUpperCase()} &nbsp;
            <span class="font-semibold">Binary:</span> ${binary} &nbsp;
            <span class="font-semibold">ASCII:</span> '${(ascii.charCodeAt(0) >= 32 && ascii.charCodeAt(0) <= 126) ? ascii : '.'}'
        `;
        renderGraphicalView(currentFileBuffer, clickedByteIndex); // Re-render graphical view to highlight
        graphicalViewCanvas.dataset.highlightedByte = clickedByteIndex; // Store highlighted byte

        // Scroll hex data display to the clicked byte and highlight it there
        currentViewOffset = Math.max(0, clickedByteIndex - Math.floor(currentViewLength / 2)); // Center the clicked byte
        renderFileData(clickedByteIndex); // Re-render hex data with highlight
    } else {
        byteInfoDisplay.textContent = 'Click a byte in the graphical view to see its details.';
        renderGraphicalView(currentFileBuffer); // Clear graphical highlight
        renderFileData(); // Clear hex highlight
        delete graphicalViewCanvas.dataset.highlightedByte; // Clear stored highlighted byte
    }
});


// Initial state: hide sections until a file is loaded
fileInfo.classList.add('hidden');
metadataSection.classList.add('hidden');
graphicalViewSection.classList.add('hidden'); // Ensure graphical view section is hidden initially
scrubToolSection.classList.add('hidden');
dataDisplaySection.classList.add('hidden');
encryptionSection.classList.add('hidden'); // Ensure encryption section is hidden initially
loadingIndicator.classList.add('hidden'); // Ensure loading indicator is hidden initially
filenameExplanationSection.classList.add('hidden'); // Ensure new section is hidden initially
dataTypeBreakdownSection.classList.add('hidden'); // Ensure new section is hidden initially
aboutToolSection.classList.add('hidden'); // Ensure new section is hidden initially


// Handle canvas resizing (optional, but good for responsiveness)
window.addEventListener('resize', () => {
    if (currentFileBuffer) {
        // Adjust canvas display size
        const containerWidth = graphicalViewCanvas.parentElement.clientWidth;
        graphicalViewCanvas.style.width = containerWidth + 'px';
        // Re-render to adapt to new dimensions if necessary (though fixed internal resolution is used)
        renderGraphicalView(currentFileBuffer);
        // Re-render pie chart on resize to adapt to new container width/height
        renderPieChart(analyzeByteTypes(currentFileBuffer));
    }
});

// Set initial canvas display width to match its parent container
window.onload = () => {
    const containerWidth = graphicalViewCanvas.parentElement.clientWidth;
    graphicalViewCanvas.style.width = containerWidth + 'px';
};

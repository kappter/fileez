const fileInput = document.getElementById('fileInput');
const fileSvg = document.getElementById('fileSvg');
const hexViewer = document.getElementById('hexViewer');
const saveHex = document.getElementById('saveHex');
const metadata = document.getElementById('metadata');
const binaryOutput = document.getElementById('binaryOutput');
const error = document.getElementById('error');
const scrubber = document.getElementById('scrubber');
const scrubberPos = document.getElementById('scrubberPos');
const cipherSelect = document.getElementById('cipherSelect');
const cipherKey = document.getElementById('cipherKey');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const encryptedOutput = document.getElementById('encryptedOutput');
const byteTooltip = document.getElementById('byteTooltip');
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const rectSize = 10;
let fileBuffer = null;
let sensitiveRanges = [];
let headerRanges = [];

// Supported file types and their magic numbers
const fileSignatures = {
  'txt': { signature: null, metadata: parseTextMetadata, sensitive: parseTextSensitive, headers: parseTextHeaders },
  'jpg': { signature: [0xFF, 0xD8], metadata: parseImageMetadata, sensitive: parseImageSensitive, headers: parseImageHeaders },
  'jpeg': { signature: [0xFF, 0xD8], metadata: parseImageMetadata, sensitive: parseImageSensitive, headers: parseImageHeaders },
  'png': { signature: [0x89, 0x50, 0x4E, 0x47], metadata: parseImageMetadata, sensitive: parseImageSensitive, headers: parseImageHeaders },
  'docx': { signature: [0x50, 0x4B, 0x03, 0x04], metadata: parseDocxMetadata, sensitive: parseDocxSensitive, headers: parseDocxHeaders },
  'mp3': { signature: [0x49, 0x44, 0x33], metadata: parseMp3Metadata, sensitive: parseMp3Sensitive, headers: parseMp3Headers },
  'pdf': { signature: [0x25, 0x50, 0x44, 0x46], metadata: parseGenericMetadata, sensitive: parseGenericSensitive, headers: parsePdfHeaders },
  'mp4': { signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], metadata: parseGenericMetadata, sensitive: parseGenericSensitive, headers: parseMp4Headers }
};

// File input handler
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    showError(`File size exceeds ${MAX_FILE_SIZE / 1024}KB limit.`);
    return;
  }

  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();
  fileBuffer = new Uint8Array(arrayBuffer);

  // Detect file type
  const ext = file.name.split('.').pop().toLowerCase();
  const fileType = fileSignatures[ext] ? ext : 'unknown';
  if (fileType === 'unknown' || !checkFileSignature(fileBuffer, fileSignatures[ext]?.signature)) {
    showError('Unsupported or invalid file format.');
    return;
  }

  // Get sensitive and header ranges
  sensitiveRanges = await fileSignatures[ext].sensitive(file, fileBuffer);
  headerRanges = await fileSignatures[ext].headers(file, fileBuffer);
  // Display graphical view
  drawFileSvg(fileBuffer, sensitiveRanges, headerRanges);
  // Display hex data with sensitive highlights
  displayHex(fileBuffer, sensitiveRanges);
  // Display metadata
  const metadataText = await fileSignatures[ext].metadata(file, fileBuffer);
  metadata.innerHTML = metadataText;
  // Display binary sample
  displayBinarySample(fileBuffer);
  // Initialize scrubber
  initScrubber(fileBuffer);
  // Clear encryption output
  encryptedOutput.value = '';
  clearError();
});

// SVG click handler
fileSvg.addEventListener('click', (e) => {
  if (e.target.tagName === 'rect') {
    const byteIndex = parseInt(e.target.getAttribute('data-index'));
    scrubber.value = byteIndex;
    scrubberPos.textContent = `Position: ${byteIndex}`;
    highlightHexPosition(byteIndex);
    showByteTooltip(e, byteIndex);
    drawFileSvg(fileBuffer, sensitiveRanges, headerRanges, byteIndex);
  }
});

// Save hex changes
saveHex.addEventListener('click', () => {
  const hex = hexViewer.textContent.replace(/\s/g, '');
  if (!/^[0-9A-Fa-f]*$/.test(hex) || hex.length % 2 !== 0) {
    showError('Invalid hex data.');
    return;
  }
  fileBuffer = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  drawFileSvg(fileBuffer, sensitiveRanges, headerRanges);
  displayHex(fileBuffer, sensitiveRanges);
  clearError();
});

// Scrubber handler
scrubber.addEventListener('input', () => {
  const pos = parseInt(scrubber.value);
  scrubberPos.textContent = `Position: ${pos}`;
  highlightHexPosition(pos);
  drawFileSvg(fileBuffer, sensitiveRanges, headerRanges, pos);
});

// Encryption handler
encryptBtn.addEventListener('click', () => {
  if (!fileBuffer) {
    showError('No file loaded.');
    return;
  }
  const cipher = cipherSelect.value;
  const key = cipherKey.value;
  if (!key) {
    showError('Encryption key is required.');
    return;
  }
  const encrypted = encryptData(fileBuffer, cipher, key);
  displayEncryptedHex(encrypted);
  clearError();
});

// Decryption handler
decryptBtn.addEventListener('click', () => {
  if (!fileBuffer) {
    showError('No file loaded.');
    return;
  }
  const cipher = cipherSelect.value;
  const key = cipherKey.value;
  if (!key) {
    showError('Decryption key is required.');
    return;
  }
  const decrypted = decryptData(fileBuffer, cipher, key);
  displayEncryptedHex(decrypted);
  clearError();
});

// Draw file on SVG
function drawFileSvg(buffer, sensitiveRanges, headerRanges, highlightPos = -1) {
  const bytesPerRow = 16;
  const width = bytesPerRow * rectSize;
  const height = Math.ceil(buffer.length / bytesPerRow) * rectSize;
  fileSvg.setAttribute('width', width);
  fileSvg.setAttribute('height', height);
  fileSvg.innerHTML = '';

  for (let i = 0; i < buffer.length; i++) {
    let color = 'rgb(200, 200, 200)'; // Unknown/Other (Gray)
    if (headerRanges.some(([start, end]) => i >= start && i <= end)) {
      color = 'rgb(173, 216, 230)'; // File System/Headers (Blue)
    } else if (sensitiveRanges.some(([start, end]) => i >= start && i <= end)) {
      color = 'rgb(255, 255, 224)'; // Metadata (Yellow)
    } else {
      color = 'rgb(144, 238, 144)'; // Content (Green)
    }
    const x = (i % bytesPerRow) * rectSize;
    const y = Math.floor(i / bytesPerRow) * rectSize;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', rectSize);
    rect.setAttribute('height', rectSize);
    rect.setAttribute('fill', color);
    rect.setAttribute('data-index', i);
    if (i === highlightPos) {
      rect.setAttribute('stroke', 'red');
      rect.setAttribute('stroke-width', '2');
    }
    fileSvg.appendChild(rect);
  }
}

// Show byte tooltip
function showByteTooltip(event, index) {
  const hex = fileBuffer[index].toString(16).padStart(2, '0').toUpperCase();
  const binary = fileBuffer[index].toString(2).padStart(8, '0');
  byteTooltip.innerHTML = `Position: ${index}<br>Hex: ${hex}<br>Binary: ${binary}`;
  byteTooltip.style.display = 'block';
  const rect = event.target.getBoundingClientRect();
  byteTooltip.style.left = `${rect.left + window.scrollX + rectSize}px`;
  byteTooltip.style.top = `${rect.top + window.scrollY + rectSize}px`;
  setTimeout(() => {
    byteTooltip.style.display = 'none';
  }, 2000); // Hide after 2 seconds
}

// Display hex data with highlights
function displayHex(buffer, ranges) {
  const hex = Array.from(buffer)
    .map((b, i) => {
      const hexByte = b.toString(16).padStart(2, '0').toUpperCase();
      const isSensitive = ranges.some(([start, end]) => i >= start && i <= end);
      return isSensitive
        ? `<span class="bg-yellow-200" title="Potentially Sensitive Data">${hexByte}</span>`
        : `<span>${hexByte}</span>`;
    })
    .join(' ');
  hexViewer.innerHTML = hex;
}

// Highlight hex position
function highlightHexPosition(pos) {
  const spans = hexViewer.querySelectorAll('span');
  if (pos < spans.length) {
    const span = spans[pos];
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Initialize scrubber
function initScrubber(buffer) {
  scrubber.max = buffer.length - 1;
  scrubber.value = 0;
  scrubberPos.textContent = `Position: 0`;
}

// Display binary sample
function displayBinarySample(buffer) {
  const sample = Array.from(buffer.slice(0, 256))
    .map(b => b.toString(2).padStart(8, '0'))
    .join(' ');
  binaryOutput.textContent = sample || 'No binary data available.';
}

// Check file signature
function checkFileSignature(buffer, signature) {
  if (!signature) return true;
  return signature.every((byte, i) => buffer[i] === byte);
}

// Parse text metadata
function parseTextMetadata(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(`File Name: ⚠️ ${file.name}<br>Size: ${file.size} bytes<br>Type: text/plain<br>Sample Content: ${reader.result.slice(0, 100)}...`);
    };
    reader.readAsText(file);
  });
}

// Parse text sensitive ranges
function parseTextSensitive(file) {
  return Promise.resolve([]); // No specific sensitive ranges
}

// Parse text headers
function parseTextHeaders(file) {
  return Promise.resolve([]); // No headers for text
}

// Parse image metadata
function parseImageMetadata(file) {
  return new Promise((resolve) => {
    window.EXIF.getData(file, function() {
      const exifData = window.EXIF.getAllTags(this);
      const metadata = [`File Name: ⚠️ ${file.name}`, `Size: ${file.size} bytes`, `Type: ${file.type}`];
      for (let tag in exifData) {
        const isSensitive = ['GPSLatitude', 'GPSLongitude', 'DateTime', 'Model'].includes(tag);
        metadata.push(`${isSensitive ? '⚠️ ' : ''}${tag}: ${exifData[tag]}`);
      }
      resolve(metadata.join('<br>') || 'No EXIF data available.');
    });
  });
}

// Parse image sensitive ranges
function parseImageSensitive(file, buffer) {
  return new Promise((resolve) => {
    window.EXIF.getData(file, function() {
      const ranges = [];
      for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i] === 0xFF && buffer[i + 1] === 0xE1) {
          ranges.push([i, i + 100]); // Approximate EXIF range
          break;
        }
      }
      resolve(ranges);
    });
  });
}

// Parse image headers
function parseImageHeaders(file, buffer) {
  return Promise.resolve([[0, 8]]); // First 8 bytes for magic numbers
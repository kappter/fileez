const fileInput = document.getElementById('fileInput');
const fileSvg = document.getElementById('fileSvg');
const hexViewer = document.getElementById('hexViewer');
const saveHex = document.getElementById('saveHex');
const metadata = document.getElementById('metadata');
const sectionTable = document.getElementById('sectionTable');
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
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const rectSize = 10;
let fileBuffer = null;
let sensitiveRanges = [];
let headerRanges = [];
let sectionRanges = [];

// Theme toggle
const applyTheme = (theme) => {
  document.getElementById('html-root').classList.toggle('dark', theme === 'dark');
  sunIcon.classList.toggle('hidden', theme === 'dark');
  moonIcon.classList.toggle('hidden', theme !== 'dark');
  localStorage.setItem('theme', theme);
};

// Initialize theme
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

// Theme toggle event
themeToggle.addEventListener('click', () => {
  const currentTheme = document.getElementById('html-root').classList.contains('dark') ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

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

  // Get sensitive, header, and section ranges
  sensitiveRanges = await fileSignatures[ext].sensitive(file, fileBuffer);
  headerRanges = await fileSignatures[ext].headers(file, fileBuffer);
  sectionRanges = await generateSectionRanges(file, fileBuffer, ext);
  // Display graphical view
  drawFileSvg(fileBuffer, sensitiveRanges, headerRanges);
  // Display hex data with sensitive highlights
  displayHex(fileBuffer, sensitiveRanges);
  // Display metadata
  const metadataText = await fileSignatures[ext].metadata(file, fileBuffer);
  metadata.innerHTML = metadataText;
  // Generate section table
  generateSectionTable(sectionRanges, ext);
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

// Section table click handler
sectionTable.addEventListener('click', (e) => {
  if (e.target.classList.contains('section-rect')) {
    const start = parseInt(e.target.getAttribute('data-start'));
    const end = parseInt(e.target.getAttribute('data-end'));
    highlightHexRange(start, end);
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
        ? `<span class="bg-yellow-200 dark:bg-yellow-600" title="Potentially Sensitive Data">${hexByte}</span>`
        : `<span>${hexByte}</span>`;
    })
    .join(' ');
  hexViewer.innerHTML = hex;
}

// Highlight single hex position
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

// Highlight hex range
function highlightHexRange(start, end) {
  const spans = hexViewer.querySelectorAll('span');
  if (start < spans.length && end < spans.length && start <= end) {
    const range = document.createRange();
    range.setStartBefore(spans[start]);
    range.setEndAfter(spans[end]);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    spans[start].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Generate section table
function generateSectionTable(ranges, ext) {
  sectionTable.innerHTML = '';
  const sections = [
    { name: 'File Name', range: ranges.find(r => r.name === 'File Name')?.range || null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Extension', range: ranges.find(r => r.name === 'Extension')?.range || null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Encoding', range: ranges.find(r => r.name === 'Encoding')?.range || null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Created Date/Time', range: null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Last Modified Date/Time', range: null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Hidden', range: null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Locked', range: null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Deleted', range: null, color: 'bg-yellow-200 dark:bg-yellow-600' },
    { name: 'Headers', range: ranges.find(r => r.name === 'Headers')?.range || null, color: 'bg-blue-200 dark:bg-blue-600' },
    { name: 'Content', range: ranges.find(r => r.name === 'Content')?.range || null, color: 'bg-green-200 dark:bg-green-600' }
  ];

  const table = document.createElement('table');
  table.className = 'border-collapse border w-full border-gray-300 dark:border-gray-600';
  const tbody = document.createElement('tbody');
  sections.forEach(section => {
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.className = 'border p-2 border-gray-300 dark:border-gray-600';
    tdLabel.textContent = section.name;
    const tdRect = document.createElement('td');
    tdRect.className = 'border p-2 border-gray-300 dark:border-gray-600';
    if (section.range) {
      const rect = document.createElement('div');
      rect.className = `section-rect ${section.color} w-4 h-4 cursor-pointer`;
      rect.setAttribute('data-start', section.range[0]);
      rect.setAttribute('data-end', section.range[1]);
      tdRect.appendChild(rect);
    } else {
      tdRect.textContent = 'N/A';
    }
    tr.appendChild(tdLabel);
    tr.appendChild(tdRect);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  sectionTable.appendChild(table);
}

// Generate section ranges
async function generateSectionRanges(file, buffer, ext) {
  const ranges = [];
  const name = file.name.split('.').slice(0, -1).join('.');
  const extension = file.name.split('.').pop().toLowerCase();
  
  // File Name and Extension (from File API, not binary for most formats)
  ranges.push({ name: 'File Name', range: null });
  ranges.push({ name: 'Extension', range: null });
  
  // Encoding range (set for specific formats below)
  ranges.push({ name: 'Encoding', range: null });
  
  // Headers (from existing headerRanges)
  if (headerRanges.length > 0) {
    ranges.push({ name: 'Headers', range: headerRanges[0] });
  }
  
  // Content (approximate as non-header, non-metadata)
  const contentStart = headerRanges.length > 0 ? headerRanges[0][1] + 1 : 0;
  ranges.push({ name: 'Content', range: [contentStart, buffer.length - 1] });
  
  // MP3: File name in ID3 tags, encoding in frame headers
  if (ext === 'mp3' && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    ranges.find(r => r.name === 'File Name').range = [3, 32]; // Title field in ID3v1
    ranges.find(r => r.name === 'Encoding').range = [128, 131]; // First frame header
  }
  
  // DOCX: File name and encoding in docProps/core.xml
  if (ext === 'docx') {
    try {
      const zip = await JSZip.loadAsync(buffer);
      if (zip.file('docProps/core.xml')) {
        ranges.find(r => r.name === 'File Name').range = [0, 500]; // Approximate ZIP metadata
        ranges.find(r => r.name === 'Encoding').range = [0, 500]; // XML encoding
      }
    } catch (e) {}
  }
  
  return ranges.filter(r => r.range || ['File Name', 'Extension', 'Encoding', 'Created Date/Time', 'Last Modified Date/Time', 'Hidden', 'Locked', 'Deleted'].includes(r.name));
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

// Format date for metadata
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Detect text encoding
function detectTextEncoding(buffer) {
  const bom = buffer.slice(0, 3);
  if (bom[0] === 0xEF && bom[1] === 0xBB && bom[2] === 0xBF) return 'UTF-8';
  if (bom[0] === 0xFF && bom[1] === 0xFE) return 'UTF-16 LE';
  if (bom[0] === 0xFE && bom[1] === 0xFF) return 'UTF-16 BE';
  const sample = String.fromCharCode(...buffer.slice(0, 1000));
  const result = jschardet.detect(sample);
  return result.confidence > 0.5 ? result.encoding : 'ASCII';
}

// Parse text metadata
function parseTextMetadata(file, buffer) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const name = file.name.split('.').slice(0, -1).join('.');
      const ext = file.name.split('.').pop().toLowerCase();
      const encoding = detectTextEncoding(buffer);
      resolve(`File Name: ⚠️ ${name}<br>Extension: ${ext}<br>Encoding: ${encoding}<br>Created Date/Time: ${formatDate(file.lastModified)}<br>Last Modified Date/Time: ${formatDate(file.lastModified)}<br>Hidden: N/A (file system metadata, not accessible via File API)<br>Locked: N/A (file system metadata, not accessible via File API)<br>Deleted: N/A (not applicable for uploaded files)<br>Size: ${file.size} bytes<br>Type: text/plain<br>Sample Content: ${reader.result.slice(0, 100)}...<br>Note: File name and extension are managed by the file system, not stored in the binary.`);
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
function parseImageMetadata(file, buffer) {
  return new Promise((resolve) => {
    window.EXIF.getData(file, function() {
      const exifData = window.EXIF.getAllTags(this);
      const name = file.name.split('.').slice(0, -1).join('.');
      const ext = file.name.split('.').pop().toLowerCase();
      const encoding = ext === 'jpg' || ext === 'jpeg' ? 'JPEG DCT' : 'PNG DEFLATE';
      const metadata = [
        `File Name: ⚠️ ${name}`,
        `Extension: ${ext}`,
        `Encoding: ${encoding}`,
        `Created Date/Time: ${formatDate(file.lastModified)}`,
        `Last Modified Date/Time: ${formatDate(file.lastModified)}`,
        `Hidden: N/A (file system metadata, not accessible via File API)`,
        `Locked: N/A (file system metadata, not accessible via File API)`,
        `Deleted: N/A (not applicable for uploaded files)`,
        `Size: ${file.size} bytes`,
        `Type: ${file.type}`,
        `Note: File name and extension are managed by the file system, not stored in the binary.`
      ];
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
}

// Parse docx metadata
async function parseDocxMetadata(file, buffer) {
  try {
    const name = file.name.split('.').slice(0, -1).join('.');
    const ext = file.name.split('.').pop().toLowerCase();
    const zip = await JSZip.loadAsync(buffer);
    const docProps = await zip.file('docProps/core.xml')?.async('string');
    if (docProps) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(docProps, 'application/xml');
      const props = {
        creator: xml.querySelector('creator')?.textContent,
        lastModifiedBy: xml.querySelector('lastModifiedBy')?.textContent,
        created: xml.querySelector('created')?.textContent,
        modified: xml.querySelector('modified')?.textContent
      };
      return `File Name: ⚠️ ${name}<br>Extension: ${ext}<br>Encoding: UTF-8 (XML)<br>Created Date/Time: ${formatDate(file.lastModified)}<br>Last Modified Date/Time: ${formatDate(file.lastModified)}<br>Hidden: N/A (file system metadata, not accessible via File API)<br>Locked: N/A (file system metadata, not accessible via File API)<br>Deleted: N/A (not applicable for uploaded files)<br>Size: ${file.size} bytes<br>Type: ${file.type}<br>Creator: ⚠️ ${props.creator || 'N/A'}<br>Last Modified By: ⚠️ ${props.lastModifiedBy || 'N/A'}<br>Created: ${props.created || 'N/A'}<br>Modified: ${props.modified || 'N/A'}<br>Note: File name and encoding may be stored in docProps/core.xml (bytes 0-500).`;
    }
    return `File Name: ⚠️ ${name}<br>Extension: ${ext}<br>Encoding: N/A<br>Created Date/Time: ${formatDate(file.lastModified)}<br>Last Modified Date/Time: ${formatDate(file.lastModified)}<br>Hidden: N/A (file system metadata, not accessible via File API)<br>Locked: N/A (file system metadata, not accessible via File API)<br>Deleted: N/A (not applicable for uploaded files)<br>Size: ${file.size} bytes<br>Type: ${file.type}<br>No detailed metadata available.<br>Note: File name and extension are managed by the file system.`;
  } catch (e) {
    return `Error parsing docx metadata: ${e.message}`;
  }
}

// Parse docx sensitive ranges
async function parseDocxSensitive(file, buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docProps = await zip.file('docProps/core.xml')?.async('string');
    if (docProps) {
      return [[0, 500]]; // First 500 bytes for ZIP headers and metadata
    }
    return [];
  } catch (e) {
    return [];
  }
}

// Parse docx headers
async function parseDocxHeaders(file, buffer) {
  return [[0, 30]]; // ZIP file header
}

// Parse mp3 metadata
function parseMp3Metadata(file, buffer) {
  const name = file.name.split('.').slice(0, -1).join('.');
  const ext = file.name.split('.').pop().toLowerCase();
  const id3 = buffer.slice(0, 128);
  let encoding = 'N/A';
  if (buffer.length > 131 && buffer[128] === 0xFF && (buffer[129] & 0xE0) === 0xE0) {
    encoding = 'MPEG-1 Layer III';
  }
  if (id3[0] === 0x54 && id3[1] === 0x41 && id3[2] === 0x47) {
    const title = String.fromCharCode(...id3.slice(3, 33)).trim();
    const artist = String.fromCharCode(...id3.slice(33, 63)).trim();
    const album = String.fromCharCode(...id3.slice(63, 93)).trim();
    return `File Name: ⚠️ ${name}<br>Extension: ${ext}<br>Encoding: ${encoding}<br>Created Date/Time: ${formatDate(file.lastModified)}<br>Last Modified Date/Time: ${formatDate(file.lastModified)}<br>Hidden: N/A (file system metadata, not accessible via File API)<br>Locked: N/A (file system metadata, not accessible via File API)<br>Deleted: N/A (not applicable for uploaded files)<br>Size: ${file.size} bytes<br>Type: ${file.type}<br>Title: ⚠️ ${title || 'N/A'} (bytes 3-32)<br>Artist: ⚠️ ${artist || 'N/A'}<br>Album: ${album || 'N/A'}<br>Note: File name may be stored in ID3v1 title (bytes 3-32); encoding in frame headers (bytes 128-131).`;
  }
  return `File Name: ⚠️ ${name}<br>Extension: ${ext}<br>Encoding: ${encoding}<br>Created Date/Time: ${formatDate(file.lastModified)}<br>Last Modified Date/Time: ${formatDate(file.lastModified)}<br>Hidden: N/A (file system metadata, not accessible via File API)<br>Locked: N/A (file system metadata, not accessible via File API)<br>Deleted: N/A (not applicable for uploaded files)<br>Size: ${file.size} bytes<br>Type: ${file.type}<br>No ID3v1 metadata found.<br>Note: File name and extension are managed by the file system.`;
}

// Parse mp3 sensitive ranges
function parseMp3Sensitive(file, buffer) {
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return [[0, 128], [128, 131]]; // ID3v1 tag and first frame header
  }
  return [];
}

// Parse mp3 headers
function parseMp3Headers(file, buffer) {
  return [[0, 10]]; // ID3 header
}

// Parse generic metadata
function parseGenericMetadata(file) {
  const name = file.name.split('.').slice(0, -1).join('.');
  const ext = file.name.split('.').pop().toLowerCase();
  const encoding = ext === 'pdf' ? 'ASCII/UTF-8' : ext === 'mp4' ? 'H.264/AAC' : 'N/A';
  return `File Name: ⚠️ ${name}<br>Extension: ${ext}<br>Encoding: ${encoding}<br>Created Date/Time: ${formatDate(file.lastModified)}<br>Last Modified Date/Time: ${formatDate(file.lastModified)}<br>Hidden: N/A (file system metadata, not accessible via File API)<br>Locked: N/A (file system metadata, not accessible via File API)<br>Deleted: N/A (not applicable for uploaded files)<br>Size: ${file.size} bytes<br>Type: ${file.type}<br>No specific metadata parser available.<br>Note: File name and extension are managed by the file system.`;
}

// Parse generic sensitive ranges
function parseGenericSensitive(file) {
  return Promise.resolve([]);
}

// Parse PDF headers
function parsePdfHeaders(file, buffer) {
  return [[0, 8]]; // PDF magic number
}

// Parse MP4 headers
function parseMp4Headers(file, buffer) {
  return [[0, 8]]; // MP4 ftyp box
}

// Encrypt data
function encryptData(buffer, cipher, key) {
  if (cipher === 'caesar') {
    const shift = parseInt(key) || 3;
    return Array.from(buffer).map(b => (b + shift) % 256);
  } else if (cipher === 'aes') {
    const text = String.fromCharCode(...buffer);
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    return new TextEncoder().encode(encrypted);
  } else if (cipher === 'xor') {
    const keyByte = parseInt(key) || 0xFF;
    return Array.from(buffer).map(b => b ^ keyByte);
  }
  return buffer;
}

// Decrypt data
function decryptData(buffer, cipher, key) {
  if (cipher === 'caesar') {
    const shift = parseInt(key) || 3;
    return Array.from(buffer).map(b => (b - shift + 256) % 256);
  } else if (cipher === 'aes') {
    try {
      const text = String.fromCharCode(...buffer);
      const decrypted = CryptoJS.AES.decrypt(text, key).toString(CryptoJS.enc.Utf8);
      return new TextEncoder().encode(decrypted);
    } catch (e) {
      showError('Decryption failed. Invalid key or data.');
      return buffer;
    }
  } else if (cipher === 'xor') {
    const keyByte = parseInt(key) || 0xFF;
    return Array.from(buffer).map(b => b ^ keyByte);
  }
  return buffer;
}

// Display encrypted hex
function displayEncryptedHex(buffer) {
  const hex = Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  encryptedOutput.value = hex;
}

// Show error
function showError(msg) {
  error.textContent = msg;
  error.classList.remove('hidden');
}

// Clear error
function clearError() {
  error.textContent = '';
  error.classList.add('hidden');
}
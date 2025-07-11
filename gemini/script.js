// ... (existing script.js content and variables)

    const encryptionSection = document.getElementById('encryption-section');
    const encryptionAlgorithmSelect = document.getElementById('encryptionAlgorithm');
    const caesarKeyInputDiv = document.getElementById('caesarKeyInput');
    const caesarShiftInput = document.getElementById('caesarShift');
    const xorKeyInputDiv = document.getElementById('xorKeyInput');
    const xorKeyInput = document.getElementById('xorKey');
    const applyEncryptionBtn = document.getElementById('applyEncryption');
    const originalContentPreview = document.getElementById('originalContentPreview');
    const encryptedContentPreview = document.getElementById('encryptedContentPreview');
    const decryptedContentPreview = document.getElementById('decryptedContentPreview');

    // ... (existing event listeners)

    encryptionAlgorithmSelect.addEventListener('change', () => {
        caesarKeyInputDiv.style.display = 'none';
        xorKeyInputDiv.style.display = 'none';
        if (encryptionAlgorithmSelect.value === 'caesar') {
            caesarKeyInputDiv.style.display = 'block';
        } else if (encryptionAlgorithmSelect.value === 'xor') {
            xorKeyInputDiv.style.display = 'block';
        }
        // Clear previous results when algorithm changes
        originalContentPreview.textContent = '';
        encryptedContentPreview.textContent = '';
        decryptedContentPreview.textContent = '';
    });

    applyEncryptionBtn.addEventListener('click', applySelectedEncryption);

    function handleFileSelect(event) {
        // ... (existing file handling logic)

        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            currentFileBytes = new Uint8Array(arrayBuffer);

            displayFileInfo(file);
            detectFileTypeAndHeaders(currentFileBytes);
            extractMetadata(currentFileBytes, file.type);
            setupOffsetRange();
            updateFileContentView();

            fileInfoSection.style.display = 'block';
            fileContentSection.style.display = 'block';
            encryptionSection.style.display = 'block'; // Show encryption section
            fileStatus.textContent = `File "${file.name}" loaded successfully.`;

            // Reset encryption preview on new file load
            originalContentPreview.textContent = '';
            encryptedContentPreview.textContent = '';
            decryptedContentPreview.textContent = '';
            encryptionAlgorithmSelect.value = 'none'; // Reset dropdown
            caesarKeyInputDiv.style.display = 'none';
            xorKeyInputDiv.style.display = 'none';
        };

        // ... (rest of handleFileSelect)
    }

    // --- Encryption/Decryption Functions ---
    // For simplicity, we'll convert the byte array to a string, process, and convert back.
    // This will work best for text-based files. Binary files might yield unreadable output.
    function bytesToString(bytes) {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    }

    function stringToBytes(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    function applySelectedEncryption() {
        if (!currentFileBytes) {
            alert('Please upload a file first!');
            return;
        }

        const originalText = bytesToString(currentFileBytes);
        originalContentPreview.textContent = originalText.substring(0, 500) + (originalText.length > 500 ? '...' : ''); // Show first 500 chars

        const algorithm = encryptionAlgorithmSelect.value;
        let encryptedText = '';
        let decryptedText = '';

        try {
            switch (algorithm) {
                case 'caesar':
                    const shift = parseInt(caesarShiftInput.value, 10);
                    if (isNaN(shift) || shift < 0 || shift > 25) {
                        alert('Caesar shift must be between 0 and 25.');
                        return;
                    }
                    encryptedText = caesarCipher(originalText, shift);
                    decryptedText = caesarCipher(encryptedText, -shift); // Decrypt by shifting back
                    break;
                case 'xor':
                    const xorKeyChar = xorKeyInput.value;
                    if (xorKeyChar.length !== 1) {
                        alert('XOR key must be a single character.');
                        return;
                    }
                    const xorKeyValue = xorKeyChar.charCodeAt(0);
                    encryptedText = xorCipher(originalText, xorKeyValue);
                    decryptedText = xorCipher(encryptedText, xorKeyValue); // XORing twice with same key decrypts
                    break;
                case 'none':
                    encryptedText = 'No encryption applied.';
                    decryptedText = 'No encryption applied.';
                    break;
                default:
                    encryptedText = 'Algorithm not implemented.';
                    decryptedText = 'Algorithm not implemented.';
            }
        } catch (error) {
            alert(`Error during encryption/decryption: ${error.message}`);
            console.error(error);
            encryptedText = 'Error during encryption.';
            decryptedText = 'Error during decryption.';
        }

        encryptedContentPreview.textContent = encryptedText.substring(0, 500) + (encryptedText.length > 500 ? '...' : '');
        decryptedContentPreview.textContent = decryptedText.substring(0, 500) + (decryptedText.length > 500 ? '...' : '');
    }

    // Caesar Cipher Implementation (only affects A-Z, a-z)
    function caesarCipher(text, shift) {
        let result = '';
        shift = shift % 26; // Ensure shift is within 0-25 range

        for (let i = 0; i < text.length; i++) {
            let char = text.charCodeAt(i);

            if (char >= 65 && char <= 90) { // Uppercase A-Z
                result += String.fromCharCode(((char - 65 + shift + 26) % 26) + 65);
            } else if (char >= 97 && char <= 122) { // Lowercase a-z
                result += String.fromCharCode(((char - 97 + shift + 26) % 26) + 97);
            } else {
                result += text.charAt(i); // Keep non-alphabetic characters as is
            }
        }
        return result;
    }

    // Simple XOR Cipher Implementation
    function xorCipher(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key);
        }
        return result;
    }

    // ... (rest of the script.js content)
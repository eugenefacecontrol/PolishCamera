import {
  filterPredictionsByScore,
  formatPredictionScore,
  getLocalizedText,
  getTopPredictions,
  translateClass
} from "./src/app-logic.js";

const elements = {
  languageSelect: document.getElementById("languageSelect"),
  cameraSelect: document.getElementById("cameraSelect"),
  startButton: document.getElementById("startButton"),
  stopButton: document.getElementById("stopButton"),
  status: document.getElementById("status"),
  video: document.getElementById("video"),
  overlay: document.getElementById("overlay"),
  liveCaptions: document.getElementById("liveCaptions"),
  emptyState: document.getElementById("emptyState"),
  resultsList: document.getElementById("resultsList"),
  resultCount: document.getElementById("resultCount")
};

const state = {
  language: "pl",
  facingMode: "environment",
  model: null,
  stream: null,
  isRunning: false,
  predictions: [],
  detectionTimer: null
};

const ctx = elements.overlay.getContext("2d");

function text(key) {
  return getLocalizedText(state.language, key);
}

function setStatus(messageKey) {
  elements.status.textContent = text(messageKey);
}

function setEmptyStateVisible(isVisible) {
  elements.emptyState.hidden = !isVisible;
  elements.emptyState.setAttribute("aria-hidden", String(!isVisible));
}

function updateStaticText() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text(node.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-option]").forEach((node) => {
    node.textContent = text(node.dataset.i18nOption);
  });

  if (!state.isRunning) {
    renderPredictions([]);
  } else {
    renderPredictions(state.predictions);
  }
}

function resizeCanvas() {
  const width = elements.video.videoWidth || elements.video.clientWidth;
  const height = elements.video.videoHeight || elements.video.clientHeight;

  if (!width || !height) {
    return;
  }

  elements.overlay.width = width;
  elements.overlay.height = height;
}

function drawRoundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPredictions(predictions) {
  resizeCanvas();
  ctx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);

  const isFrontCamera = state.facingMode === "user";
  const canvasWidth = elements.overlay.width;
  const baseFontSize = Math.max(20, Math.min(32, Math.round(canvasWidth * 0.036)));
  const labelHeight = baseFontSize + 18;

  predictions.forEach((prediction) => {
    const [x, y, width, height] = prediction.bbox;
    const drawX = isFrontCamera ? canvasWidth - x - width : x;
    const label = `${translateClass(prediction.class, state.language)} ${formatPredictionScore(prediction.score)}`;

    ctx.lineWidth = Math.max(3, Math.round(canvasWidth * 0.004));
    ctx.strokeStyle = "#ffb14d";
    ctx.fillStyle = "rgba(255, 177, 77, 0.18)";
    ctx.strokeRect(drawX, y, width, height);
    ctx.fillRect(drawX, y, width, height);

    ctx.font = `800 ${baseFontSize}px Avenir Next, Segoe UI, sans-serif`;
    const paddingX = 14;
    const textWidth = ctx.measureText(label).width;
    const labelWidth = Math.min(width, textWidth + paddingX * 2);
    const labelY = y - labelHeight - 8 >= 0 ? y - labelHeight - 8 : y + 8;
    const textY = labelY + labelHeight / 2 + baseFontSize * 0.34;

    ctx.fillStyle = "rgba(18, 34, 22, 0.92)";
    drawRoundedRect(drawX, labelY, labelWidth, labelHeight, 12);
    ctx.fill();

    ctx.fillStyle = "#fffaf1";
    ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 4;
    ctx.strokeText(label, drawX + paddingX, textY, labelWidth - paddingX * 2);
    ctx.fillText(label, drawX + paddingX, textY, labelWidth - paddingX * 2);
  });
}

function renderLiveCaptions(predictions) {
  elements.liveCaptions.innerHTML = "";

  getTopPredictions(predictions, 2).forEach((prediction) => {
    const chip = document.createElement("div");
    chip.className = "live-caption-chip";

    const translated = translateClass(prediction.class, state.language);
    const score = formatPredictionScore(prediction.score);

    chip.innerHTML = `
      <span class="live-caption-name">${translated}</span>
      <span class="live-caption-score">${text("confidence")}: ${score}</span>
    `;

    elements.liveCaptions.appendChild(chip);
  });
}

function renderPredictions(predictions) {
  state.predictions = predictions;
  elements.resultsList.innerHTML = "";
  elements.resultCount.textContent = String(predictions.length);

  if (!predictions.length) {
    renderLiveCaptions([]);
    const empty = document.createElement("li");
    empty.className = "result-item empty-results";
    empty.textContent = text("noObjects");
    elements.resultsList.appendChild(empty);
    drawPredictions([]);
    return;
  }

  getTopPredictions(predictions, predictions.length).forEach((prediction) => {
    const item = document.createElement("li");
    item.className = "result-item";

    const translated = translateClass(prediction.class, state.language);
    const score = formatPredictionScore(prediction.score);

    item.innerHTML = `
      <div class="result-main">
        <span class="result-name">${translated}</span>
        <span class="result-score">${text("confidence")}: ${score}</span>
      </div>
      <div class="result-meta">${text("originalLabel")}: ${prediction.class}</div>
    `;

    elements.resultsList.appendChild(item);
  });

  renderLiveCaptions(predictions);
  drawPredictions(predictions);
}

async function waitForLibraries() {
  if (window.tf && window.cocoSsd) {
    return;
  }

  setStatus("loadingLibraries");

  await new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function check() {
      if (window.tf && window.cocoSsd) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > 15000) {
        reject(new Error("AI libraries failed to load"));
        return;
      }

      window.requestAnimationFrame(check);
    }

    check();
  });
}

async function loadModel() {
  if (state.model) {
    return state.model;
  }

  await waitForLibraries();
  setStatus("loadingModel");

  await tf.ready();
  state.model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
  return state.model;
}

function stopStream() {
  if (state.detectionTimer) {
    clearTimeout(state.detectionTimer);
    state.detectionTimer = null;
  }

  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }

  state.isRunning = false;
  elements.video.srcObject = null;
  setEmptyStateVisible(true);
  renderPredictions([]);
  setStatus("stopped");
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("unsupported");
    return;
  }

  elements.startButton.disabled = true;

  try {
    setStatus("startingCamera");
    await loadModel();

    if (state.stream) {
      stopStream();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: state.facingMode },
        width: { ideal: 1280 },
        height: { ideal: 960 }
      }
    });

    state.stream = stream;
    state.isRunning = true;
    elements.video.dataset.facingMode = state.facingMode;
    elements.video.srcObject = stream;
    setEmptyStateVisible(false);

    await elements.video.play();
    await new Promise((resolve) => {
      if (elements.video.readyState >= 2) {
        resolve();
        return;
      }

      elements.video.onloadedmetadata = () => resolve();
    });

    resizeCanvas();
    setStatus("ready");
    runDetectionLoop();
  } catch (error) {
    console.error(error);
    stopStream();
    setStatus("cameraError");
  } finally {
    elements.startButton.disabled = false;
  }
}

async function runDetectionLoop() {
  if (!state.isRunning || !state.model) {
    return;
  }

  try {
    const predictions = await state.model.detect(elements.video, 10);
    const filtered = filterPredictionsByScore(predictions, 0.5);
    renderPredictions(filtered);
  } catch (error) {
    console.error(error);
  }

  state.detectionTimer = window.setTimeout(runDetectionLoop, 250);
}

elements.languageSelect.addEventListener("change", (event) => {
  state.language = event.target.value;
  updateStaticText();
});

elements.cameraSelect.addEventListener("change", (event) => {
  state.facingMode = event.target.value;
  if (state.isRunning) {
    startCamera();
  }
});

elements.startButton.addEventListener("click", startCamera);
elements.stopButton.addEventListener("click", stopStream);

updateStaticText();
renderPredictions([]);
setEmptyStateVisible(true);
setStatus("stopped");

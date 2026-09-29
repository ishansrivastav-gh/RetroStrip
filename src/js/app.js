import { sounds } from './audio.js';
import { CameraEngine } from './camera.js';
import { CanvasEngine } from './canvas.js';
import { exportPrintReadyPDF } from './pdf.js';

/**
 * Main Central Application State & Controller
 */
const state = {
  mode: 'polaroid',
  stripCount: '3',
  frameStyle: 'classic',
  filter: 'none',
  grain: 15,
  lightLeak: 'none',
  caption: 'VINTAGESNAP 2026',
  captionFont: 'Permanent Marker',
  images: [],
  stickers: []
};

// DOM References
const studioCanvas = document.getElementById('studioCanvas');
const webcam = document.getElementById('webcam');
const cameraOverlay = document.getElementById('cameraOverlay');
const countdownDisplay = document.getElementById('countdownDisplay');
const flashLayer = document.getElementById('flashLayer');

// Engines
const canvasEngine = new CanvasEngine(studioCanvas);
const cameraEngine = new CameraEngine(webcam, cameraOverlay, countdownDisplay, flashLayer);

function init() {
  bindEventListeners();
  render();
}

function render() {
  canvasEngine.render(state);
  updateBadges();
}

function updateBadges() {
  document.getElementById('badgeMode').textContent = `MODE: ${state.mode.toUpperCase()}`;
  document.getElementById('badgeCanvas').textContent = `CANVAS: ${studioCanvas.width}x${studioCanvas.height}@300DPI`;
}

function bindEventListeners() {
  // Mode Switcher
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sounds.playClick();
      document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.mode = e.target.dataset.mode;

      document.getElementById('groupStripCount').style.display = 
        state.mode === 'strip' ? 'flex' : 'none';
      
      render();
    });
  });

  // Strip Frame Count
  document.querySelectorAll('[data-stripcount]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sounds.playClick();
      document.querySelectorAll('[data-stripcount]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.stripCount = e.target.dataset.stripcount;
      render();
    });
  });

  // Camera Controls
  document.getElementById('btnStartCam').addEventListener('click', () => {
    sounds.playClick();
    cameraEngine.toggleCamera();
  });

  document.getElementById('btnCaptureBurst').addEventListener('click', () => {
    sounds.playClick();
    const count = state.mode === 'polaroid' ? 1 : parseInt(state.stripCount, 10);
    cameraEngine.captureBurst(count, (capturedPhotos) => {
      state.images = capturedPhotos;
      render();
    });
  });

  // File Upload
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.images.push(img);
          render();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  });

  // Frame, Filter & Input Selects
  document.getElementById('selectFrame').addEventListener('change', (e) => {
    state.frameStyle = e.target.value;
    render();
  });

  document.getElementById('selectFilter').addEventListener('change', (e) => {
    state.filter = e.target.value;
    render();
  });

  document.getElementById('inputGrain').addEventListener('input', (e) => {
    state.grain = parseInt(e.target.value, 10);
    document.getElementById('grainVal').textContent = state.grain;
    render();
  });

  document.querySelectorAll('[data-leak]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sounds.playClick();
      document.querySelectorAll('[data-leak]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.lightLeak = e.target.dataset.leak;
      render();
    });
  });

  document.getElementById('inputCaption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    render();
  });

  document.getElementById('selectFont').addEventListener('change', (e) => {
    state.captionFont = e.target.value;
    render();
  });

  // Stickers
  document.querySelectorAll('[data-sticker]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sounds.playClick();
      state.stickers.push({
        char: e.target.dataset.sticker,
        x: Math.random() * (studioCanvas.width - 60) + 30,
        y: Math.random() * (studioCanvas.height - 100) + 50,
        size: 36
      });
      render();
    });
  });

  // Downloads
  document.getElementById('btnDownloadPNG').addEventListener('click', () => {
    sounds.playClick();
    const link = document.createElement('a');
    link.download = `VintageSnap_${Date.now()}.png`;
    link.href = studioCanvas.toDataURL('image/png');
    link.click();
  });

  document.getElementById('btnDownloadPDF').addEventListener('click', () => {
    sounds.playClick();
    exportPrintReadyPDF(studioCanvas);
  });
}

// Start App
window.addEventListener('DOMContentLoaded', init);
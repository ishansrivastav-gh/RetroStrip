import { sounds } from './audio.js';

/**
 * Handles WebRTC Webcam stream access and timed burst sequence logic.
 */
export class CameraEngine {
  constructor(videoElement, overlayElement, countdownElement, flashElement) {
    this.video = videoElement;
    this.overlay = overlayElement;
    this.countdown = countdownElement;
    this.flash = flashElement;
    this.stream = null;
  }

  async toggleCamera() {
    if (this.stream) {
      this.stopCamera();
      return false;
    } else {
      return await this.startCamera();
    }
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: false
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch (err) {
      console.error("Camera permissions denied or unavailable:", err);
      alert("Unable to access camera. Please check browser permissions.");
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
      this.stream = null;
    }
  }

  triggerFlash() {
    this.flash.classList.add('active');
    setTimeout(() => this.flash.classList.remove('active'), 100);
  }

  async captureBurst(count, onPhotoCaptured) {
    if (!this.stream) {
      const active = await this.startCamera();
      if (!active) return;
    }

    const capturedImages = [];

    for (let shot = 0; shot < count; shot++) {
      // 3-second countdown
      for (let timer = 3; timer > 0; timer--) {
        this.countdown.textContent = timer;
        sounds.playBeep(600, 0.08);
        await new Promise(r => setTimeout(r, 1000));
      }

      this.countdown.textContent = '';
      this.triggerFlash();
      sounds.playShutter();

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth || 1080;
      canvas.height = this.video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');

      // Mirror horizontally
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0);

      const img = new Image();
      img.src = canvas.toDataURL('image/png');
      await new Promise(r => img.onload = r);

      capturedImages.push(img);
      onPhotoCaptured([...capturedImages]);

      if (shot < count - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}
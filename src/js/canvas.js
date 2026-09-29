/**
 * Real-time HTML5 Canvas rendering engine for Polaroids, Photo Strips, LUT shaders, and grain.
 */
export class CanvasEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
  }

  render(state) {
    if (state.mode === 'polaroid') {
      this.renderPolaroid(state);
    } else {
      this.renderPhotoStrip(state);
    }

    this.applyGrain(state.grain);
    this.renderStickers(state.stickers);
  }

  renderPolaroid(state) {
    this.canvas.width = 600;
    this.canvas.height = 720;

    this.drawBackgroundMaterial(state.frameStyle);

    const photoX = 40, photoY = 40, photoW = 520, photoH = 520;

    if (state.images[0]) {
      this.drawFilteredImage(state.images[0], photoX, photoY, photoW, photoH, state);
    } else {
      this.drawPlaceholder(photoX, photoY, photoW, photoH, "UPLOAD OR CAPTURE PHOTO");
    }

    // Caption
    this.ctx.fillStyle = state.frameStyle === 'noir' ? '#f0f2f8' : '#111111';
    this.ctx.font = `28px "${state.captionFont}"`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(state.caption, this.canvas.width / 2, 630);
  }

  renderPhotoStrip(state) {
    const count = parseInt(state.stripCount, 10);
    const photoW = 370, photoH = 240;
    const padding = 25, topMargin = 30, gap = 20;

    this.canvas.width = 420;
    this.canvas.height = topMargin + (photoH * count) + (gap * (count - 1)) + 110;

    this.drawBackgroundMaterial(state.frameStyle);

    for (let i = 0; i < count; i++) {
      const y = topMargin + i * (photoH + gap);
      if (state.images[i]) {
        this.drawFilteredImage(state.images[i], padding, y, photoW, photoH, state);
      } else {
        this.drawPlaceholder(padding, y, photoW, photoH, `FRAME 0${i + 1}`);
      }
    }

    // Strip Footer Branding
    this.ctx.fillStyle = state.frameStyle === 'noir' ? '#f0f2f8' : '#111111';
    this.ctx.font = `18px "${state.captionFont}"`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(state.caption, this.canvas.width / 2, this.canvas.height - 40);
  }

  drawBackgroundMaterial(style) {
    const { width, height } = this.canvas;
    switch (style) {
      case 'noir':
        this.ctx.fillStyle = '#121212';
        break;
      case 'y2k':
        this.ctx.fillStyle = '#0a0a16';
        break;
      case 'kraft':
        this.ctx.fillStyle = '#c8b08b';
        break;
      case 'holo':
        const grad = this.ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#ff9a9e');
        grad.addColorStop(0.5, '#fecfef');
        grad.addColorStop(1, '#a1c4fd');
        this.ctx.fillStyle = grad;
        break;
      default: // classic
        this.ctx.fillStyle = '#fafafa';
    }
    this.ctx.fillRect(0, 0, width, height);
  }

  drawFilteredImage(img, x, y, w, h, state) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, 6);
    this.ctx.clip();

    // Apply LUT matrix filter string
    switch (state.filter) {
      case 'y2k_chrome':
        this.ctx.filter = 'contrast(130%) saturate(150%) hue-rotate(-10deg)';
        break;
      case 'vhs':
        this.ctx.filter = 'contrast(110%) saturate(80%) sepia(20%) hue-rotate(180deg)';
        break;
      case 'film_35mm':
        this.ctx.filter = 'sepia(25%) contrast(105%) saturate(115%)';
        break;
      case 'cyberpunk':
        this.ctx.filter = 'contrast(140%) hue-rotate(140deg) saturate(180%)';
        break;
      case 'mono':
        this.ctx.filter = 'grayscale(100%) contrast(140%)';
        break;
      default:
        this.ctx.filter = 'none';
    }

    this.ctx.drawImage(img, x, y, w, h);
    this.ctx.restore();

    if (state.lightLeak !== 'none') {
      this.drawLightLeak(x, y, w, h, state.lightLeak);
    }
  }

  drawLightLeak(x, y, w, h, type) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';
    let grad = this.ctx.createLinearGradient(
      type === 'left' ? x : x + w, y, 
      type === 'left' ? x + w * 0.6 : x + w * 0.4, y + h
    );
    grad.addColorStop(0, 'rgba(255, 100, 0, 0.45)');
    grad.addColorStop(0.5, 'rgba(255, 0, 128, 0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.restore();
  }

  drawPlaceholder(x, y, w, h, text) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.06)';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '12px "JetBrains Mono"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x + w / 2, y + h / 2);
  }

  applyGrain(amount) {
    if (amount <= 0) return;
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imgData.data;
    const factor = amount * 0.4;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * factor;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  renderStickers(stickers) {
    stickers.forEach(s => {
      this.ctx.font = `${s.size}px sans-serif`;
      this.ctx.fillText(s.char, s.x, s.y);
    });
  }
}
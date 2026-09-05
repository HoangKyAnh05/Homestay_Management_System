import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ffmpegPath = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const publicVideoDir = path.resolve('public/video');

if (!fs.existsSync(publicVideoDir)) {
  fs.mkdirSync(publicVideoDir, { recursive: true });
}

const bmpPath = path.join(publicVideoDir, 'greenscreen_frame.bmp');
const mp4Path = path.join(publicVideoDir, 'greenscreen_presenter.mp4');

const width = 1080;
const height = 1920;

// Header BMP 24-bit RGB
const rowSize = Math.floor((24 * width + 31) / 32) * 4;
const pixelArraySize = rowSize * height;
const fileSize = 54 + pixelArraySize;

const buffer = Buffer.alloc(fileSize);

// BMP Header
buffer.write('BM', 0);
buffer.writeUInt32LE(fileSize, 2);
buffer.writeUInt32LE(54, 10); // Offset to pixel array

// DIB Header
buffer.writeUInt32LE(40, 14); // Header size
buffer.writeInt32LE(width, 18);
buffer.writeInt32LE(height, 22);
buffer.writeUInt16LE(1, 26); // Color planes
buffer.writeUInt16LE(24, 28); // Bits per pixel
buffer.writeUInt32LE(0, 30); // Compression (none)
buffer.writeUInt32LE(pixelArraySize, 34);

// Vẽ pixel (BMP lưu từ dưới lên trên!)
// Nền xanh lá cây chuẩn Chroma Key: R=0, G=255, B=0 (Trong BMP thứ tự là B, G, R)
for (let y = 0; y < height; y++) {
  const rowOffset = 54 + y * rowSize;
  for (let x = 0; x < width; x++) {
    const pOffset = rowOffset + x * 3;

    // Tọa độ người ở giữa:
    // Đầu & vai người ở x từ 240 đến 840, y từ 200 đến 1400
    const centerX = 540;
    const dx = x - centerX;

    // Phần đầu người (Hình ellipse tâm y=1250, x=540)
    const headRadiusX = 180;
    const headRadiusY = 220;
    const headDist = (dx * dx) / (headRadiusX * headRadiusX) + ((y - 1250) * (y - 1250)) / (headRadiusY * headRadiusY);

    // Phần cổ (y từ 950 đến 1050, dx từ -70 đến 70)
    const isNeck = y >= 950 && y <= 1050 && Math.abs(dx) <= 70;

    // Phần thân và vai (y từ 0 đến 980, vai mở rộng ra hai bên)
    const shoulderWidth = 360 + (980 - y) * 0.45;
    const isBody = y < 980 && Math.abs(dx) <= shoulderWidth;

    // Phần tóc (phía trên đỉnh đầu y > 1280)
    const isHair = headDist <= 1.05 && y > 1280;

    if (isHair) {
      // Tóc đen tuyền
      buffer[pOffset] = 25;     // B
      buffer[pOffset + 1] = 20; // G
      buffer[pOffset + 2] = 20; // R
    } else if (headDist <= 1.0) {
      // Khuôn mặt (Màu da người sáng đẹp)
      buffer[pOffset] = 170;    // B
      buffer[pOffset + 1] = 195;// G
      buffer[pOffset + 2] = 245;// R
    } else if (isNeck) {
      // Cổ da người hơi tối hơn
      buffer[pOffset] = 150;    // B
      buffer[pOffset + 1] = 175;// G
      buffer[pOffset + 2] = 230;// R
    } else if (isBody) {
      // Áo vest xanh tím than điện ảnh sang trọng
      buffer[pOffset] = 90;     // B
      buffer[pOffset + 1] = 40; // G
      buffer[pOffset + 2] = 30; // R
    } else {
      // NỀN PHÔNG XANH LÁ CHUẨN CHROMA-KEY (#00FF00)
      buffer[pOffset] = 0;       // B = 0
      buffer[pOffset + 1] = 255; // G = 255
      buffer[pOffset + 2] = 0;   // R = 0
    }
  }
}

fs.writeFileSync(bmpPath, buffer);
console.log('✅ Đã tạo file BMP phông xanh nhân vật chuẩn:', bmpPath);

// Render video MP4 6 giây 30fps bằng FFmpeg
const ffmpegCmd = `"${ffmpegPath}" -y -loop 1 -i "${bmpPath}" -t 6 -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`;
execSync(ffmpegCmd, { stdio: 'inherit' });
console.log('🎉 ĐÃ TẠO THÀNH CÔNG VIDEO PHÔNG XANH MP4:', mp4Path);

// Dọn dẹp file BMP tạm
fs.unlinkSync(bmpPath);

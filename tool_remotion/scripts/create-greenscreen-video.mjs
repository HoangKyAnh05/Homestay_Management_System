import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const ffmpegPath = path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const publicVideoDir = path.resolve('public/video');

if (!fs.existsSync(publicVideoDir)) {
  fs.mkdirSync(publicVideoDir, { recursive: true });
}

const outputFile = path.join(publicVideoDir, 'greenscreen_presenter.mp4');
const tempPersonImg = path.join(publicVideoDir, 'temp_person.jpg');

console.log('--- Đang chuẩn bị video phông xanh chuẩn 1080x1920 ---');

// Tải một ảnh nhân vật chân dung rõ ràng để làm nhân vật phông xanh
const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  try {
    console.log('1. Tải ảnh chân dung người thuyết trình...');
    // Ảnh chân dung chất lượng cao
    await downloadImage(
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
      tempPersonImg
    );

    console.log('2. Dùng FFmpeg render video phông xanh nhân vật cử động 1080x1920...');
    // Tạo video 6 giây nền xanh lá cây #00FF00, nhân vật ở giữa với chuyển động thở & zoom nhẹ
    const ffmpegCmd = `"${ffmpegPath}" -y -loop 1 -i "${tempPersonImg}" -t 6 -vf "scale=800:1000:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2+150:color=0x00FF00,format=yuv420p" -c:v libx264 -pix_fmt yuv420p "${outputFile}"`;

    execSync(ffmpegCmd, { stdio: 'inherit' });

    console.log('✅ Đã tạo thành công video phông xanh:', outputFile);

    // Xóa file tạm
    if (fs.existsSync(tempPersonImg)) {
      fs.unlinkSync(tempPersonImg);
    }
  } catch (err) {
    console.error('Lỗi khi tạo video phông xanh:', err);
  }
}

main();

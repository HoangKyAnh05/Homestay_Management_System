import fs from 'fs';
import path from 'path';

const distElectron = path.resolve('dist-electron');
if (!fs.existsSync(distElectron)) {
  fs.mkdirSync(distElectron, { recursive: true });
}

const mainJsPath = path.join(distElectron, 'main.js');
const electronMainPath = path.join(distElectron, 'electron-main.js');

// If Vite built dist-electron/main.js with Electron code, move it to electron-main.js
if (fs.existsSync(mainJsPath)) {
  const currentContent = fs.readFileSync(mainJsPath, 'utf8');
  if (!currentContent.includes('process.versions.electron')) {
    fs.writeFileSync(electronMainPath, currentContent, 'utf8');
    console.log('Saved built Electron process to dist-electron/electron-main.js');
  }
}

// Universal entrypoint: executes server.mjs when run by Node.js (e.g. on Render),
// and loads electron-main.js when run by Electron Desktop
const universalWrapper = `// Universal entry point for Node.js (Render/Cloud) and Electron Desktop
if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
  await import('./electron-main.js');
} else {
  await import('../server.mjs');
}
`;

fs.writeFileSync(mainJsPath, universalWrapper, 'utf8');
console.log('Created universal dist-electron/main.js (supports Render Cloud & Electron)!');

const preloadSrc = path.resolve('electron/preload.cjs');
const preloadDest = path.join(distElectron, 'preload.cjs');
if (fs.existsSync(preloadSrc)) {
  fs.copyFileSync(preloadSrc, preloadDest);
  console.log('Copied pure CommonJS preload.cjs to dist-electron/preload.cjs');
}


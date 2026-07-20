const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
let currentProjectRoot = PROJECT_ROOT;

function createWindow() {
  const win = new BrowserWindow({
    width: 1450,
    height: 950,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    autoHideMenuBar: true,
    title: "Homestay Code Flow Explorer"
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Strip X-Frame-Options and Content-Security-Policy to allow local React app iframe loading
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    
    // Normalize headers to lowercase to ensure we delete them reliably
    Object.keys(responseHeaders).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'x-frame-options' || lowerKey === 'content-security-policy') {
        delete responseHeaders[key];
      }
    });

    callback({ cancel: false, responseHeaders });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler to open external browser
ipcMain.handle('open-external-url', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


// Secure IPC handler to read project files
ipcMain.handle('read-project-file', async (event, relPath) => {
  try {
    // Sanitize path to prevent directory traversal
    const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\))+/, '');
    const absolutePath = path.join(currentProjectRoot, safePath);

    // Verify the resolved path is inside the project root
    if (!absolutePath.startsWith(currentProjectRoot)) {
      throw new Error("Access denied: Path is outside the project root.");
    }

    if (!fs.existsSync(absolutePath)) {
      return `// File not found: ${relPath}\n// Checked path: ${absolutePath}`;
    }

    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      return `// Path is a directory: ${relPath}`;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    return content;
  } catch (error) {
    return `// Error reading file: ${error.message}`;
  }
});

// IPC handler to get current project directory
ipcMain.handle('get-project-directory', async () => {
  return currentProjectRoot;
});

// IPC handler to select a folder from OS browser dialog
ipcMain.handle('select-folder', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled) {
    return null;
  }
  currentProjectRoot = result.filePaths[0];
  return currentProjectRoot;
});

// IPC handler to set project directory manually
ipcMain.handle('set-project-directory', async (event, customPath) => {
  try {
    const resolvedPath = path.resolve(customPath);
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      currentProjectRoot = resolvedPath;
      return { success: true, path: currentProjectRoot };
    }
    return { success: false, error: 'Thư mục không tồn tại hoặc không phải thư mục.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC handler to get a recursive list of project files for sidebar explorer
ipcMain.handle('get-project-files', async () => {
  try {
    const listDir = (dirPath, relativeTo = currentProjectRoot) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        const name = entry.name;
        // Ignore noise folders
        if (['node_modules', '.git', '.idea', '.vscode', 'dist', 'build', 'target', '.gemini', 'Images', 'diagram'].includes(name)) {
          continue;
        }
        
        const fullPath = path.join(dirPath, name);
        const relPath = path.relative(relativeTo, fullPath);

        if (entry.isDirectory()) {
          try {
            const children = listDir(fullPath, relativeTo);
            if (children.length > 0) {
              files.push({
                name,
                path: relPath.replace(/\\/g, '/'),
                type: 'directory',
                children
              });
            }
          } catch (e) {
            // Ignore subfolders with reading permission issues
          }
        } else {
          // Only show readable text / code files
          const ext = path.extname(name).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx', '.java', '.py', '.css', '.html', '.json', '.xml', '.properties', '.yml', '.yaml', '.bat', '.sh', '.md', '.txt'].includes(ext)) {
            files.push({
              name,
              path: relPath.replace(/\\/g, '/'),
              type: 'file'
            });
          }
        }
      }

      // Sort: directories first, then files alphabetically
      return files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    return listDir(currentProjectRoot);
  } catch (error) {
    return { error: error.message };
  }
});

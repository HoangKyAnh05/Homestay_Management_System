// MAIN RENDERER ENTRYPOINT
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFlowList();
  initCopyCode();
  initLiveWebBrowser();
  initPanelMaximizer();
  initProjectRootSelection();
  initSidebarTabs();
  
  // App Reload button logic
  const appReloadBtn = document.getElementById('app-reload-btn');
  if (appReloadBtn) {
    appReloadBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  
  // Select first flow by default
  const firstFlowId = Object.keys(window.FLOWS_CONFIG)[0];
  if (firstFlowId) {
    selectFlow(firstFlowId);
  }
});


// TAB SYSTEM
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active to current
      tab.classList.add('active');
      const targetTabId = `tab-${tab.getAttribute('data-tab')}`;
      document.getElementById(targetTabId).classList.add('active');
      
      // Special actions on tab load
      if (tab.getAttribute('data-tab') === 'liveweb') {
        loadLiveWebIframe();
      }
      
      logToConsole(`[Giao diện] Chuyển sang Tab: ${tab.innerText.trim()}`);
    });
  });
}

// LIVE WEB TAB ACTIONS
function initLiveWebBrowser() {
  const urlInput = document.getElementById('liveweb-url');
  const reloadBtn = document.getElementById('liveweb-reload-btn');
  const openBtn = document.getElementById('liveweb-open-btn');
  const iframe = document.getElementById('liveweb-iframe');
  const errorOverlay = document.getElementById('liveweb-overlay');
  
  reloadBtn.addEventListener('click', () => {
    loadLiveWebIframe();
  });
  
  openBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    logToConsole(`[Hệ thống] Đang mở URL ngoài: ${url}...`);
    window.api.openExternalUrl(url);
  });
  
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadLiveWebIframe();
    }
  });
  
  // Detect iframe load to toggle overlay helper
  iframe.addEventListener('load', () => {
    try {
      // Check if loaded about:blank
      if (iframe.contentWindow.location.href === 'about:blank') {
        errorOverlay.style.display = 'flex';
      } else {
        errorOverlay.style.display = 'none';
      }
    } catch (e) {
      // If cross-origin error occurs, it means page successfully loaded from localhost!
      errorOverlay.style.display = 'none';
    }
  });
}

function loadLiveWebIframe() {
  const urlInput = document.getElementById('liveweb-url');
  const iframe = document.getElementById('liveweb-iframe');
  const errorOverlay = document.getElementById('liveweb-overlay');
  
  let url = urlInput.value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  urlInput.value = url;
  
  logToConsole(`[Trình duyệt] Đang kết nối tới ${url}...`);
  iframe.src = url;
  
  // Hide overlay initially and let the load listener decide
  errorOverlay.style.display = 'none';
}

// DYNAMIC SPLIT-PANE MAXIMIZER (ZOOM)
function initPanelMaximizer() {
  const splitPane = document.querySelector('.content-split-pane');
  const leftSimMaxBtn = document.getElementById('left-sim-maximize-btn');
  const leftLiveMaxBtn = document.getElementById('left-live-maximize-btn');
  const rightMaxBtn = document.getElementById('right-maximize-btn');

  function toggleLeftMaximize() {
    if (splitPane.classList.contains('left-maximized')) {
      splitPane.classList.remove('left-maximized');
      leftSimMaxBtn.innerText = '⛶ Phóng to';
      leftLiveMaxBtn.innerText = '⛶ Phóng to';
      logToConsole('[Giao diện] Khôi phục kích thước màn hình chia đôi.');
    } else {
      splitPane.classList.remove('right-maximized');
      splitPane.classList.add('left-maximized');
      leftSimMaxBtn.innerText = '❐ Thu nhỏ';
      leftLiveMaxBtn.innerText = '❐ Thu nhỏ';
      rightMaxBtn.innerText = '⛶ Phóng to';
      logToConsole('[Giao diện] Phóng to màn hình bên trái (Giả lập / Web thật).');
    }
  }

  function toggleRightMaximize() {
    if (splitPane.classList.contains('right-maximized')) {
      splitPane.classList.remove('right-maximized');
      rightMaxBtn.innerText = '⛶ Phóng to';
      logToConsole('[Giao diện] Khôi phục kích thước màn hình chia đôi.');
    } else {
      splitPane.classList.remove('left-maximized');
      splitPane.classList.add('right-maximized');
      rightMaxBtn.innerText = '❐ Thu nhỏ';
      leftSimMaxBtn.innerText = '⛶ Phóng to';
      leftLiveMaxBtn.innerText = '⛶ Phóng to';
      logToConsole('[Giao diện] Phóng to màn hình bên phải (Trình đọc code).');
    }
  }

  leftSimMaxBtn.addEventListener('click', toggleLeftMaximize);
  leftLiveMaxBtn.addEventListener('click', toggleLeftMaximize);
  rightMaxBtn.addEventListener('click', toggleRightMaximize);
}


// INITIALIZE FLOW SELECTION LIST IN SIDEBAR
function initFlowList() {
  const flowListContainer = document.getElementById('flow-list');
  flowListContainer.innerHTML = '';
  
  Object.keys(window.FLOWS_CONFIG).forEach(flowId => {
    const flow = window.FLOWS_CONFIG[flowId];
    
    const item = document.createElement('div');
    item.className = 'flow-item';
    item.id = `flow-item-${flowId}`;
    item.innerHTML = `
      <span class="flow-item-title">${flow.title}</span>
      <span class="flow-item-desc">${flow.desc}</span>
    `;
    
    item.addEventListener('click', () => {
      selectFlow(flowId);
    });
    
    flowListContainer.appendChild(item);
  });
}

// SELECT A CODE FLOW
function selectFlow(flowId) {
  // Update sidebar active state
  document.querySelectorAll('.flow-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.getElementById(`flow-item-${flowId}`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
  
  const flow = window.FLOWS_CONFIG[flowId];
  if (!flow) return;
  
  // Update nav info
  document.getElementById('active-flow-title').innerText = flow.title;
  document.getElementById('active-flow-desc').innerText = flow.desc;
  
  // Render sequence steps flowchart
  renderFlowSteps(flowId);
  
  // Load simulator page
  loadSimulator(flowId);
}

// COPY CODE FUNCTION
function initCopyCode() {
  const copyBtn = document.getElementById('copy-code-btn');
  copyBtn.addEventListener('click', () => {
    if (window.currentCode) {
      navigator.clipboard.writeText(window.currentCode).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Đã sao chép! ✓';
        copyBtn.style.backgroundColor = 'var(--success)';
        copyBtn.style.color = 'white';
        
        setTimeout(() => {
          copyBtn.innerText = originalText;
          copyBtn.style.backgroundColor = '';
          copyBtn.style.color = '';
        }, 1500);
        
        logToConsole(`[Hệ thống] Đã sao chép mã nguồn của file vào clipboard.`);
      }).catch(err => {
        logToConsole(`[Hệ thống] Không thể sao chép code: ${err.message}`, 'error');
      });
    } else {
      logToConsole(`[Hệ thống] Không có code nào để sao chép.`, 'error');
    }
  });
}

// PROJECT ROOT SELECTION & CONFIGURATION
function initProjectRootSelection() {
  const pathInput = document.getElementById('project-path-input');
  const browseBtn = document.getElementById('browse-folder-btn');
  const statusContainer = document.getElementById('project-path-status');
  const statusText = document.getElementById('project-status-text');

  function updateStatus(isSuccess, message) {
    if (isSuccess) {
      statusContainer.className = 'path-status status-success';
      statusText.innerText = message || 'Sẵn sàng';
    } else {
      statusContainer.className = 'path-status status-error';
      statusText.innerText = message || 'Lỗi kết nối';
    }
  }

  // Load initial path
  window.api.getProjectDirectory().then(currentPath => {
    if (currentPath) {
      pathInput.value = currentPath;
      updateStatus(true, 'Sẵn sàng');
      // Pre-load the file explorer tree in the background
      loadProjectFilesTree();
    }
  }).catch(err => {
    updateStatus(false, 'Lỗi lấy thư mục mặc định: ' + err.message);
  });

  // Handle Browse click
  browseBtn.addEventListener('click', async () => {
    try {
      const selectedPath = await window.api.selectFolder();
      if (selectedPath) {
        pathInput.value = selectedPath;
        updateStatus(true, 'Đã kết nối');
        logToConsole(`[Hệ thống] Đã đổi thư mục dự án sang: ${selectedPath}`);
        
        // Reload project files tree
        loadProjectFilesTree();
        // Reload current step if there's any active step
        reloadCurrentStepCode();
      }
    } catch (err) {
      updateStatus(false, 'Lỗi chọn thư mục: ' + err.message);
      logToConsole(`[Hệ thống] Lỗi chọn thư mục: ${err.message}`, 'error');
    }
  });

  // Handle manual input text changes (Enter or blur)
  let lastVal = '';
  async function handleManualPathChange() {
    const inputPath = pathInput.value.trim();
    if (inputPath === lastVal) return;
    lastVal = inputPath;
    
    if (!inputPath) {
      updateStatus(false, 'Đường dẫn không được để trống');
      return;
    }

    try {
      const result = await window.api.setProjectDirectory(inputPath);
      if (result.success) {
        pathInput.value = result.path;
        updateStatus(true, 'Đã cập nhật');
        logToConsole(`[Hệ thống] Đã cập nhật thư mục dự án thành công: ${result.path}`);
        
        // Reload project files tree
        loadProjectFilesTree();
        // Reload current step if there's any active step
        reloadCurrentStepCode();
      } else {
        updateStatus(false, result.error || 'Thư mục không tồn tại');
        logToConsole(`[Hệ thống] Thư mục không hợp lệ: ${inputPath}`, 'error');
      }
    } catch (err) {
      updateStatus(false, err.message);
      logToConsole(`[Hệ thống] Lỗi khi cấu hình thư mục: ${err.message}`, 'error');
    }
  }

  pathInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleManualPathChange();
    }
  });

  pathInput.addEventListener('blur', () => {
    handleManualPathChange();
  });

  // Handle Analyze project flows click (App thinking)
  const analyzeBtn = document.getElementById('analyze-project-btn');
  analyzeBtn.addEventListener('click', async () => {
    const inputPath = pathInput.value.trim();
    if (!inputPath) {
      updateStatus(false, 'Đường dẫn không được để trống');
      return;
    }

    try {
      analyzeBtn.disabled = true;
      const originalBtnText = analyzeBtn.innerHTML;
      analyzeBtn.innerHTML = '🤖 Đang phân tích...';
      logToConsole('[Hệ thống] Trình Antigravity AI đang quét tệp tin và thiết kế luồng chạy nghiệp vụ...');

      // Get files first
      const files = await window.api.getProjectFiles();
      if (files.error) {
        throw new Error(files.error);
      }

      // Flatten files
      const flatFiles = [];
      const flatten = (nodes) => {
        nodes.forEach(n => {
          if (n.type === 'file') {
            flatFiles.push(n);
          } else if (n.type === 'directory' && n.children) {
            flatten(n.children);
          }
        });
      };
      flatten(files);

      // Analyze and generate flows
      const newFlows = generateSmartFlows(flatFiles);
      
      // Update global window.FLOWS_CONFIG
      window.FLOWS_CONFIG = newFlows;

      // Rebrand sidebar title based on folder name
      const folderName = inputPath.replace(/\\/g, '/').split('/').pop() || 'Dự án';
      document.getElementById('sidebar-main-title').innerText = `Dự án: ${folderName}`;

      // Artificial timeout of 1.2s to feel premium
      setTimeout(() => {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = originalBtnText;

        // Initialize sidebar flow list with new flows
        initFlowList();

        // Select first flow
        const firstFlowId = Object.keys(window.FLOWS_CONFIG)[0];
        if (firstFlowId) {
          selectFlow(firstFlowId);
        }

        logToConsole(`[Hệ thống] Đã hoàn thành thiết lập luồng nghiệp vụ động cho dự án: ${folderName}!`);
        updateStatus(true, 'Hoàn tất phân tích');
      }, 1200);

    } catch (err) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '🤖 Phân tích luồng';
      updateStatus(false, 'Lỗi phân tích: ' + err.message);
      logToConsole(`[Hệ thống] Lỗi phân tích dự án: ${err.message}`, 'error');
    }
  });
}

// Helper function to reload current step code when path changes
function reloadCurrentStepCode() {
  const activeNode = document.querySelector('.step-node.active');
  if (activeNode) {
    // Re-trigger click on the active node to reload file content from new path
    const activeStepNodeName = activeNode.querySelector('.step-node-name').innerText;
    logToConsole(`[Hệ thống] Tải lại file code cho bước: ${activeStepNodeName}`);
    activeNode.click();
  }
}

// SIDEBAR TAB NAVIGATION
function initSidebarTabs() {
  const tabFlows = document.getElementById('sidebar-tab-flows');
  const tabExplorer = document.getElementById('sidebar-tab-explorer');
  const flowList = document.getElementById('flow-list');
  const fileExplorer = document.getElementById('file-explorer-tree');

  tabFlows.addEventListener('click', () => {
    tabFlows.classList.add('active');
    tabExplorer.classList.remove('active');
    flowList.style.display = 'flex';
    fileExplorer.style.display = 'none';
  });

  tabExplorer.addEventListener('click', () => {
    tabExplorer.classList.add('active');
    tabFlows.classList.remove('active');
    flowList.style.display = 'none';
    fileExplorer.style.display = 'block';
  });
}

// LOAD AND RENDER FILE EXPLORER TREE
async function loadProjectFilesTree() {
  const container = document.getElementById('file-explorer-tree');
  container.innerHTML = '<div style="color: var(--text-muted); padding: 8px;">Đang quét thư mục...</div>';

  try {
    const files = await window.api.getProjectFiles();
    if (files.error) {
      container.innerHTML = `<div style="color: var(--danger); padding: 8px;">Lỗi: ${files.error}</div>`;
      return;
    }

    if (!files || files.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); padding: 8px;">Thư mục trống hoặc không có file code phù hợp.</div>';
      return;
    }

    container.innerHTML = '';
    const buildTreeHTML = (nodes) => {
      const fragment = document.createDocumentFragment();

      nodes.forEach(node => {
        const item = document.createElement('div');
        item.className = 'tree-node';

        const header = document.createElement('div');
        header.className = 'tree-node-header';
        
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.innerText = node.type === 'directory' ? '📁' : '📄';

        const label = document.createElement('span');
        label.innerText = node.name;

        header.appendChild(icon);
        header.appendChild(label);
        item.appendChild(header);

        if (node.type === 'directory') {
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'tree-node-children';
          childrenContainer.style.display = 'none'; // Collapsed by default

          header.addEventListener('click', (e) => {
            e.stopPropagation();
            if (childrenContainer.style.display === 'none') {
              childrenContainer.style.display = 'flex';
              icon.innerText = '📂';
            } else {
              childrenContainer.style.display = 'none';
              icon.innerText = '📁';
            }
          });

          const childHTML = buildTreeHTML(node.children);
          childrenContainer.appendChild(childHTML);
          item.appendChild(childrenContainer);
        } else {
          // File click handler
          header.addEventListener('click', (e) => {
            e.stopPropagation();
            // Remove active from all nodes
            document.querySelectorAll('.tree-node-header').forEach(h => h.classList.remove('active'));
            header.classList.add('active');

            // Load file content using code_viewer custom loader
            loadCustomFileContent(node.path);
            logToConsole(`[Xem file] Mở file: ${node.name} (${node.path})`);
          });
        }

        fragment.appendChild(item);
      });

      return fragment;
    };

    const treeFragment = buildTreeHTML(files);
    container.appendChild(treeFragment);
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); padding: 8px;">Lỗi: ${err.message}</div>`;
  }
}

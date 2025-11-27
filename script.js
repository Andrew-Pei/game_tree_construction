let isDragging = false;
let draggedElement = null;
let offsetX, offsetY;
let isConnecting = false;
let startNode = null;
let connectionLine = null;
const connectionLinesMap = new Map();
window.connectionsArray = [];

// 所有棋盘的状态定义
const boardStates = {
  "A": ["X", "X", "O", "O", "", "", "", "X", "O"],
  "B": ["X", "X", "O", "O", "X", "", "", "X", "O"],
  "C": ["X", "X", "O", "O", "", "X", "", "X", "O"],
  "D": ["X", "X", "O", "O", "", "", "X", "X", "O"],
  "E": ["X", "X", "O", "O", "O", "X", "", "X", "O"],
  "F": ["X", "X", "O", "O", "", "X", "O", "X", "O"],
  "G": ["X", "X", "O", "O", "O", "", "X", "X", "O"],
  "H": ["X", "X", "O", "O", "", "O", "X", "X", "O"],
  "I": ["X", "X", "O", "O", "O", "X", "X", "X", "O"],
  "J": ["X", "X", "O", "O", "X", "X", "O", "X", "O"],
  "K": ["X", "X", "O", "O", "O", "X", "X", "X", "O"]
};

// 定义每个棋盘的父棋盘关系
const parentBoard = {
  "A": null,  // A是根节点，没有父节点
  "B": "A",
  "C": "A",
  "D": "A",
  "E": "C",
  "F": "C",
  "G": "D",
  "H": "D",
  "I": "E",
  "J": "F",
  "K": "G"
};

// 随机打乱棋盘库中的棋盘顺序
function shufflePalette() {
  const palette = document.getElementById("nodePalette");
  const items = Array.from(palette.querySelectorAll(".palette-item"));
  
  // Fisher-Yates 洗牌算法
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  
  // 重新排列DOM元素
  items.forEach((item) => {
    palette.appendChild(item);
  });
}

// 检测井字棋获胜情况，返回获胜的三个位置索引，如果没有获胜则返回null
function checkWinner(boardState) {
  // 所有可能的获胜组合：3行、3列、2条对角线
  const winLines = [
    [0, 1, 2], // 第一行
    [3, 4, 5], // 第二行
    [6, 7, 8], // 第三行
    [0, 3, 6], // 第一列
    [1, 4, 7], // 第二列
    [2, 5, 8], // 第三列
    [0, 4, 8], // 主对角线
    [2, 4, 6]  // 副对角线
  ];
  
  for (const line of winLines) {
    const [a, b, c] = line;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return line; // 返回获胜的三个位置
    }
  }
  
  return null; // 没有获胜
}

// 高亮显示获胜的三个棋子
function highlightWinningCells(board, boardState, newMovePiece = null, newMoveIndex = -1) {
  // 先清除之前的高亮
  const cells = board.querySelectorAll(".cell");
  cells.forEach(cell => {
    cell.classList.remove("winning-cell");
  });
  
  // 检测获胜情况
  const winningLine = checkWinner(boardState);
  
  if (winningLine) {
    // 如果新落子在获胜线上，将获胜线的所有三个棋子都标记为新落子的颜色
    if (newMovePiece && newMoveIndex >= 0 && winningLine.includes(newMoveIndex)) {
      winningLine.forEach(index => {
        cells[index].classList.add("winning-cell");
        // 将获胜线的所有棋子都标记为新落子的颜色
        if (newMovePiece === "O") {
          cells[index].classList.add("new-move-o");
        } else if (newMovePiece === "X") {
          cells[index].classList.add("new-move-x");
        }
      });
    } else {
      // 如果没有新落子信息或新落子不在获胜线上，只添加高亮
      winningLine.forEach(index => {
        cells[index].classList.add("winning-cell");
      });
    }
  }
}

// 标记新下的棋子
function markNewMoves() {
  const palette = document.getElementById("nodePalette");
  const boards = palette.querySelectorAll(".ttt-board");
  
  boards.forEach((board) => {
    // 获取棋盘标签
    const paletteItem = board.closest(".palette-item");
    const labelElement = paletteItem.querySelector(".node-label");
    const boardLabel = labelElement ? labelElement.textContent.trim() : null;
    
    if (!boardLabel || !boardStates[boardLabel]) return;
    
    const cells = board.querySelectorAll(".cell");
    const currentBoard = Array.from(cells).map(cell => cell.textContent.trim());
    
    // 获取父棋盘
    const parentLabel = parentBoard[boardLabel];
    if (!parentLabel || !boardStates[parentLabel]) {
      // 如果没有父棋盘（如棋盘A），不标记
      return;
    }
    
    const parentBoardState = boardStates[parentLabel];
    
    // 找出与父棋盘不同的位置（新下的棋子）
    // 找出所有不同的位置，标记索引最大的那个（最后下的棋子）
    let lastNewMoveIndex = -1;
    for (let i = 0; i < 9; i++) {
      if (parentBoardState[i] !== currentBoard[i] && currentBoard[i] !== "") {
        // 记录新棋子的位置
        lastNewMoveIndex = i;
      }
    }
    // 标记最后下的棋子（索引最大的那个），根据棋子类型使用不同颜色
    let newMovePiece = null;
    if (lastNewMoveIndex >= 0) {
      newMovePiece = currentBoard[lastNewMoveIndex];
      if (newMovePiece === "O") {
        cells[lastNewMoveIndex].classList.add("new-move-o");
      } else if (newMovePiece === "X") {
        cells[lastNewMoveIndex].classList.add("new-move-x");
      }
    }
    
    // 高亮显示获胜的三个棋子，如果新落子在获胜线上，将另外两个棋子也标记为新落子的颜色
    highlightWinningCells(board, currentBoard, newMovePiece, lastNewMoveIndex);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const palette = document.getElementById("nodePalette");
  const workspace = document.getElementById("workspace");
  const arrowSvg = document.getElementById("arrow-svg");

  // 随机打乱棋盘库中的棋盘顺序
  shufflePalette();

  // 标记棋盘库中所有新下的棋子
  markNewMoves();

  // 页面加载完成后自动添加棋盘A到构建区
  initializeWorkspaceWithBoardA();

  function initializeWorkspaceWithBoardA() {
    // 移除占位符
    const placeholder = workspace.querySelector(".workspace-placeholder");
    if (placeholder) placeholder.remove();

    // 创建棋盘A节点
    const nodeA = document.createElement("div");
    nodeA.className = "draggable-node";
    nodeA.id = "node_initial_A";
    nodeA.style.position = "absolute";
    nodeA.style.left = "50%";
    nodeA.style.top = "20px";
    nodeA.style.transform = "translateX(-50%)";

    // 添加标签
    const nodeLabel = document.createElement("div");
    nodeLabel.className = "node-label";
    nodeLabel.textContent = "A";
    nodeA.appendChild(nodeLabel);

    // 添加棋盘内容
    const board = document.createElement("div");
    board.className = "ttt-board";
    board.innerHTML = `
              <div class="cell">X</div><div class="cell">X</div><div class="cell">O</div>
              <div class="cell">O</div><div class="cell"></div><div class="cell"></div>
              <div class="cell"></div><div class="cell">X</div><div class="cell">O</div>
          `;
    nodeA.appendChild(board);

    // 添加连接点
    const connectionPoint = document.createElement("div");
    connectionPoint.className = "connection-point";
    nodeA.appendChild(connectionPoint);

    // 注意：节点A不添加删除按钮，因为它是初始节点，不可删除

    // 添加事件监听器
    connectionPoint.addEventListener(
      "mousedown",
      handleConnectionPointMouseDown
    );
    nodeA.addEventListener("mousedown", handleNodeMouseDown);

    // 将节点添加到构建区
    workspace.appendChild(nodeA);

    // 更新状态消息
    document.getElementById("statusMessage").textContent =
      "初始棋盘A已加载！请开始构建博弈树。";
  }

  function setupDraggableNodes() {
    const nodes = palette.querySelectorAll(".draggable-node");
    nodes.forEach((node) => {
      node.addEventListener("dragstart", function (e) {
        const label =
          this.closest(".palette-item").querySelector(
            ".node-label"
          ).textContent;
        e.dataTransfer.setData("text/html", e.target.outerHTML);
        e.dataTransfer.setData("text/plain", label);
        e.dataTransfer.effectAllowed = "copy";
      });
    });
  }
  setupDraggableNodes();

  workspace.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });

  workspace.addEventListener("drop", function (e) {
    e.preventDefault();
    const html = e.dataTransfer.getData("text/html");
    const label = e.dataTransfer.getData("text/plain");

    if (html) {
      const placeholder = workspace.querySelector(
        ".workspace-placeholder"
      );
      if (placeholder) placeholder.remove();

      const newNode = document.createElement("div");
      newNode.innerHTML = html;
      const nodeElement = newNode.firstChild;

      nodeElement.id =
        "node_" + Date.now() + Math.random().toString(36).substring(2, 7);

      nodeElement.style.position = "absolute";
      nodeElement.style.left =
        e.clientX - workspace.getBoundingClientRect().left - 60 + "px";
      nodeElement.style.top =
        e.clientY - workspace.getBoundingClientRect().top - 60 + "px";
      nodeElement.removeAttribute("draggable");

      // 添加标签到棋盘框内（在ttt-board之前）
      const board = nodeElement.querySelector(".ttt-board");
      const nodeLabel = document.createElement("div");
      nodeLabel.className = "node-label";
      nodeLabel.textContent = label;
      if (board) {
        nodeElement.insertBefore(nodeLabel, board);
      } else {
        nodeElement.appendChild(nodeLabel);
      }

      const connectionPoint = document.createElement("div");
      connectionPoint.className = "connection-point";
      nodeElement.appendChild(connectionPoint);

      const deleteBtn = document.createElement("div");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.onclick = function (event) {
        event.stopPropagation();
        // 检查是否是初始节点A
        if (nodeElement.id === "node_initial_A") {
          document.getElementById("statusMessage").textContent =
            "初始节点不能删除！";
          return;
        }
        
        // 计算实际节点数量（排除svg和placeholder）
        const nodes = workspace.querySelectorAll(".draggable-node");
        if (nodes.length <= 1) {
          // 如果只剩一个节点（初始节点A），清空并重新初始化
          workspace.innerHTML =
            '<div class="workspace-placeholder">将节点从左侧拖拽到这里开始构建你的博弈树...</div>';
          const newSvg = document.createElement("svg");
          newSvg.id = "arrow-svg";
          newSvg.innerHTML =
            '<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" markerUnits="strokeWidth"><polygon points="0 0, 10 3.5, 0 7" fill="#333" /></marker></defs>';
          workspace.appendChild(newSvg);
          connectionLinesMap.clear();
          window.connectionsArray = [];
          // 重新初始化初始节点A
          initializeWorkspaceWithBoardA();
        } else {
          removeNodeConnections(nodeElement);
          nodeElement.remove();
        }
        document.getElementById("statusMessage").textContent =
          "节点已删除。";
      };
      nodeElement.appendChild(deleteBtn);

      connectionPoint.addEventListener(
        "mousedown",
        handleConnectionPointMouseDown
      );
      nodeElement.addEventListener("mousedown", handleNodeMouseDown);

      workspace.appendChild(nodeElement);
      
      // 确保新添加的节点也标记了新棋子
      const newBoard = nodeElement.querySelector(".ttt-board");
      if (newBoard) {
        // 获取棋盘标签
        const boardLabel = label;
        
        if (boardLabel && boardStates[boardLabel]) {
          const cells = newBoard.querySelectorAll(".cell");
          const currentBoard = Array.from(cells).map(cell => cell.textContent.trim());
          
          // 获取父棋盘
          const parentLabel = parentBoard[boardLabel];
          if (parentLabel && boardStates[parentLabel]) {
            const parentBoardState = boardStates[parentLabel];
            
            // 找出与父棋盘不同的位置（新下的棋子）
            // 找出所有不同的位置，标记索引最大的那个（最后下的棋子）
            let lastNewMoveIndex = -1;
            for (let i = 0; i < 9; i++) {
              if (parentBoardState[i] !== currentBoard[i] && currentBoard[i] !== "") {
                // 记录新棋子的位置
                lastNewMoveIndex = i;
              }
            }
            // 标记最后下的棋子（索引最大的那个），根据棋子类型使用不同颜色
            let newMovePiece = null;
            if (lastNewMoveIndex >= 0) {
              newMovePiece = currentBoard[lastNewMoveIndex];
              if (newMovePiece === "O") {
                cells[lastNewMoveIndex].classList.add("new-move-o");
              } else if (newMovePiece === "X") {
                cells[lastNewMoveIndex].classList.add("new-move-x");
              }
            }
            
            // 高亮显示获胜的三个棋子，如果新落子在获胜线上，将另外两个棋子也标记为新落子的颜色
            highlightWinningCells(newBoard, currentBoard, newMovePiece, lastNewMoveIndex);
          } else {
            // 如果没有父棋盘，仍然检查是否有获胜情况
            highlightWinningCells(newBoard, currentBoard);
          }
        }
      }
      
      document.getElementById("statusMessage").textContent =
        "节点已添加！可拖动调整位置或点击节点下方连接点绘制箭头。";
    }
  });

  function handleNodeMouseDown(e) {
    // 如果点击的是连接点、删除按钮或标签，不触发拖拽
    if (
      e.target.classList.contains("connection-point") ||
      e.target.classList.contains("delete-btn") ||
      e.target.classList.contains("node-label")
    ) {
      return;
    }

    // 允许拖拽节点（包括点击单元格时）
    if (e.currentTarget.classList.contains("draggable-node")) {
      e.preventDefault();
      isDragging = true;
      draggedElement = e.currentTarget;
      // 清除transform属性，避免位置计算错误
      draggedElement.style.transform = "none";
      const rect = draggedElement.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.getElementById("statusMessage").textContent =
        "正在拖动节点...";
    }
  }

  document.addEventListener("mousemove", function (e) {
    if (isDragging && draggedElement) {
      e.preventDefault();
      const workspaceRect = workspace.getBoundingClientRect();
      let newLeft = e.clientX - workspaceRect.left - offsetX;
      let newTop = e.clientY - workspaceRect.top - offsetY;

      const nodeWidth = draggedElement.offsetWidth;
      const nodeHeight = draggedElement.offsetHeight;
      newLeft = Math.max(
        0,
        Math.min(newLeft, workspaceRect.width - nodeWidth)
      );
      newTop = Math.max(
        0,
        Math.min(newTop, workspaceRect.height - nodeHeight)
      );

      // 确保transform已被清除
      draggedElement.style.transform = "none";
      draggedElement.style.left = newLeft + "px";
      draggedElement.style.top = newTop + "px";
    }
  });

  document.addEventListener("mouseup", function (e) {
    if (isDragging) {
      isDragging = false;
      if (draggedElement) {
        redrawConnections();
        document.getElementById("statusMessage").textContent =
          "节点移动完成。";
      }
      draggedElement = null;
    }
    if (isConnecting) {
      finishConnection(e);
    }
  });
  
  // 处理页面失去焦点或窗口关闭时清理连接状态
  window.addEventListener("beforeunload", function() {
    if (isConnecting && connectionLine) {
      const arrowSvg = document.getElementById("arrow-svg");
      if (arrowSvg && arrowSvg.contains(connectionLine)) {
        arrowSvg.removeChild(connectionLine);
      }
      document.removeEventListener("mousemove", updateConnectionLine);
    }
  });
  
  // 处理鼠标离开窗口时取消连接
  document.addEventListener("mouseleave", function() {
    if (isConnecting && connectionLine) {
      const arrowSvg = document.getElementById("arrow-svg");
      if (arrowSvg && arrowSvg.contains(connectionLine)) {
        arrowSvg.removeChild(connectionLine);
      }
      document.removeEventListener("mousemove", updateConnectionLine);
      isConnecting = false;
      startNode = null;
      connectionLine = null;
      document.getElementById("statusMessage").textContent =
        "连接已取消。";
    }
  });

  function handleConnectionPointMouseDown(e) {
    e.stopPropagation();
    e.preventDefault();

    // 如果已经在连接中，先取消之前的连接
    if (isConnecting && connectionLine) {
      arrowSvg.removeChild(connectionLine);
      connectionLine = null;
      document.removeEventListener("mousemove", updateConnectionLine);
    }

    startNode = e.currentTarget.parentElement;
    isConnecting = true;
    document.getElementById("statusMessage").textContent =
      "点击并拖动连接点以创建箭头...";

    const rect = startNode.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();

    const startX = rect.left + rect.width / 2 - workspaceRect.left;
    const startY = rect.top + rect.height + 1 - workspaceRect.top;

    connectionLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    connectionLine.setAttribute("x1", startX);
    connectionLine.setAttribute("y1", startY);
    connectionLine.setAttribute("x2", startX);
    connectionLine.setAttribute("y2", startY);
    connectionLine.setAttribute("stroke", "#333");
    connectionLine.setAttribute("stroke-width", "2");
    connectionLine.setAttribute("marker-end", "url(#arrowhead)");
    arrowSvg.appendChild(connectionLine);

    document.addEventListener("mousemove", updateConnectionLine);
  }

  // updateConnectionLine 已移到全局作用域

  function finishConnection(e) {
    if (!isConnecting) return;

    if (connectionLine) {
      arrowSvg.removeChild(connectionLine);
      connectionLine = null;
    }

    const targetNode = document.elementFromPoint(e.clientX, e.clientY);
    const actualTargetNode = targetNode?.closest(".draggable-node");

    if (actualTargetNode && actualTargetNode !== startNode) {
      const rect = actualTargetNode.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      if (relativeY <= rect.height / 2) {
        const exists = window.connectionsArray.some(
          (conn) =>
            conn.from === startNode && conn.to === actualTargetNode
        );
        if (!exists) {
          const line = drawConnection(startNode, actualTargetNode);
          if (line) {
            const key = `${startNode.id}->${actualTargetNode.id}`;
            connectionLinesMap.set(key, line);
            window.connectionsArray.push({
              from: startNode,
              to: actualTargetNode,
            });
          }
          document.getElementById("statusMessage").textContent =
            "箭头已创建！";
        } else {
          document.getElementById("statusMessage").textContent =
            "该连接已存在。";
        }
      } else {
        document.getElementById("statusMessage").textContent =
          "请将箭头连接到目标节点的上半部分。";
      }
    } else {
      document.getElementById("statusMessage").textContent =
        "连接已取消。";
    }

    isConnecting = false;
    startNode = null;
    document.removeEventListener("mousemove", updateConnectionLine);
  }

  function drawConnection(fromNode, toNode) {
    if (!workspace.contains(fromNode) || !workspace.contains(toNode)) {
      return null;
    }
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const workspaceRect = workspace.getBoundingClientRect();

    const x1 = fromRect.left + fromRect.width / 2 - workspaceRect.left;
    const y1 = fromRect.top + fromRect.height + 2 - workspaceRect.top;

    const x2 = toRect.left + toRect.width / 2 - workspaceRect.left;
    const y2 = toRect.top - workspaceRect.top;

    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#333");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrowhead)");

    arrowSvg.appendChild(line);
    return line;
  }

  function redrawConnections() {
    // 只选择line元素，排除defs中的marker
    const lines = arrowSvg.querySelectorAll('line');
    lines.forEach((line) => {
      if (arrowSvg.contains(line)) {
        arrowSvg.removeChild(line);
      }
    });
    connectionLinesMap.clear();

    window.connectionsArray.forEach((conn) => {
      if (workspace.contains(conn.from) && workspace.contains(conn.to)) {
        const line = drawConnection(conn.from, conn.to);
        if (line) {
          const key = `${conn.from.id}->${conn.to.id}`;
          connectionLinesMap.set(key, line);
        }
      }
    });
  }

  function removeNodeConnections(nodeToRemove) {
    const keysToRemove = [];
    connectionLinesMap.forEach((line, key) => {
      const [fromId, toId] = key.split("->");
      if (fromId === nodeToRemove.id || toId === nodeToRemove.id) {
        keysToRemove.push(key);
        if (arrowSvg.contains(line)) {
          arrowSvg.removeChild(line);
        }
      }
    });
    keysToRemove.forEach((key) => connectionLinesMap.delete(key));
    window.connectionsArray = window.connectionsArray.filter(
      (conn) => conn.from !== nodeToRemove && conn.to !== nodeToRemove
    );
  }
});

// 将 updateConnectionLine 提取到全局作用域
function updateConnectionLine(e) {
  if (!isConnecting || !connectionLine) return;
  const workspace = document.getElementById("workspace");
  const workspaceRect = workspace.getBoundingClientRect();
  connectionLine.setAttribute("x2", e.clientX - workspaceRect.left);
  connectionLine.setAttribute("y2", e.clientY - workspaceRect.top);
}

// 验证博弈树
function validateGameTree() {
  const workspace = document.getElementById("workspace");
  const nodes = workspace.querySelectorAll(".draggable-node");
  
  // 收集构建区中的所有节点及其标签
  const workspaceNodes = new Map();
  nodes.forEach((node) => {
    const labelElement = node.querySelector(".node-label");
    if (labelElement) {
      const label = labelElement.textContent.trim();
      workspaceNodes.set(node.id, label);
    }
  });

  // 收集所有连接关系
  const connections = [];
  window.connectionsArray.forEach((conn) => {
    const fromLabel = workspaceNodes.get(conn.from.id);
    const toLabel = workspaceNodes.get(conn.to.id);
    if (fromLabel && toLabel) {
      connections.push({ from: fromLabel, to: toLabel });
    }
  });

  // 验证结果
  const errors = [];
  const warnings = [];

  // 获取所有应该存在的节点（parentBoard中的所有节点，包括A）
  const allRequiredNodes = new Set(["A"]);
  Object.keys(parentBoard).forEach((node) => {
    allRequiredNodes.add(node);
  });

  // 获取构建区中实际存在的节点标签
  const existingNodes = new Set(Array.from(workspaceNodes.values()));

  // 1. 检查所有必需的节点是否都存在
  allRequiredNodes.forEach((requiredNode) => {
    if (!existingNodes.has(requiredNode)) {
      errors.push(`缺少节点${requiredNode}`);
    }
  });

  // 2. 检查每个节点的父节点连接是否正确
  const nodesWithConnections = new Set(); // 记录已有连接的节点，避免重复检查
  
  workspaceNodes.forEach((label, nodeId) => {
    if (label === "A") return; // A是根节点，跳过

    const expectedParent = parentBoard[label];
    if (!expectedParent) {
      warnings.push(`节点${label}未定义父节点`);
      return;
    }

    // 检查父节点是否存在
    if (!existingNodes.has(expectedParent)) {
      errors.push(`节点${label}的父节点${expectedParent}缺失`);
      return;
    }

    // 检查是否有从父节点到当前节点的连接
    const hasCorrectConnection = connections.some(
      (conn) => conn.from === expectedParent && conn.to === label
    );

    // 检查是否有错误的连接（从其他节点连接到当前节点）
    const wrongConnections = connections.filter(
      (conn) => conn.to === label && conn.from !== expectedParent
    );

    if (wrongConnections.length > 0) {
      // 有错误的连接
      wrongConnections.forEach((conn) => {
        errors.push(`节点${label}连接错误：应为${expectedParent}→${label}`);
      });
      nodesWithConnections.add(label); // 标记为已检查
    } else if (!hasCorrectConnection) {
      // 没有正确的连接
      errors.push(`节点${label}缺少父节点连接`);
      nodesWithConnections.add(label); // 标记为已检查
    } else {
      // 连接正确
      nodesWithConnections.add(label); // 标记为已检查
    }
  });

  // 3. 检查是否有多余的连接（未定义的连接）
  connections.forEach((conn) => {
    const expectedParent = parentBoard[conn.to];
    if (expectedParent && conn.from !== expectedParent) {
      // 这个错误已经在上面检查过了，跳过
      return;
    }
    if (!expectedParent && conn.to !== "A") {
      warnings.push(`节点${conn.to}连接未定义`);
    }
  });

  // 显示验证结果
  showValidationResult(errors, warnings);
}

// 显示验证结果
function showValidationResult(errors, warnings) {
  const modal = document.getElementById("validationModal");
  const resultDiv = document.getElementById("validationResult");
  
  let html = "";

  if (errors.length === 0 && warnings.length === 0) {
    // 完全正确
    html += `<div class="validation-result validation-success">`;
    html += `<strong>✓ 验证通过！请前往UMU平台完成活动2问卷</strong><br>`;
    html += `博弈树结构完整且正确，所有节点和连接关系都符合要求。`;
    html += `</div>`;
  } else {
    // 有错误或警告，进行汇总
    if (errors.length > 0) {
      // 分类汇总错误
      const missingNodes = [];
      const missingParents = [];
      const missingConnections = [];
      const wrongConnections = [];

      errors.forEach((error) => {
        if (error.startsWith("缺少节点")) {
          missingNodes.push(error.replace("缺少节点", ""));
        } else if (error.includes("父节点") && error.includes("缺失")) {
          missingParents.push(error);
        } else if (error.includes("缺少父节点连接")) {
          missingConnections.push(error.replace("节点", "").replace("缺少父节点连接", ""));
        } else if (error.includes("连接错误")) {
          wrongConnections.push(error);
        }
      });

      html += `<div class="validation-result validation-error">`;
      html += `<strong>✗ 验证失败，发现 ${errors.length} 个错误：</strong><br><br>`;

      if (missingNodes.length > 0) {
        html += `缺少节点：${missingNodes.join("、")}<br>`;
      }
      if (missingParents.length > 0) {
        html += `父节点缺失：${missingParents.length}个<br>`;
      }
      if (missingConnections.length > 0) {
        html += `缺少连接：${missingConnections.join("、")}<br>`;
      }
      if (wrongConnections.length > 0) {
        html += `连接错误：${wrongConnections.length}个<br>`;
      }

      html += `</div>`;
    }

    if (warnings.length > 0) {
      html += `<div class="validation-result validation-warning">`;
      html += `<strong>⚠ 发现 ${warnings.length} 个警告</strong>`;
      html += `</div>`;
    }
  }

  resultDiv.innerHTML = html;
  modal.style.display = "block";
}

// 关闭模态框
function closeValidationModal() {
  const modal = document.getElementById("validationModal");
  modal.style.display = "none";
}

// 点击模态框外部关闭
window.onclick = function(event) {
  const modal = document.getElementById("validationModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
}

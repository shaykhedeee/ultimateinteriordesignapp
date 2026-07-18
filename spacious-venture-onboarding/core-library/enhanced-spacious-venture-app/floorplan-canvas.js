// Canvas and Overlay Renderer for Interior Floor Plans with Laser Scan Animations
// NOTE: ALL PRICING METRICS HAVE BEEN COMPLETELY REMOVED

const FLOORPLAN_CANVAS = {
  canvas: null,
  ctx: null,
  container: null,
  image: null,
  nodes: [],
  onNodeSelect: null,
  activeNodeId: null,
  
  // Laser Scanning Animation State
  isScanning: false,
  scanY: 0,
  scanDirection: 1, // 1 down, -1 up
  scanGlowPoints: [],

  init: function(canvasElement, containerElement, onNodeSelectCallback) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.container = containerElement;
    this.onNodeSelect = onNodeSelectCallback;
    this.image = null;
    this.activeNodeId = null;
    this.isScanning = false;
    this.scanY = 0;
    this.scanGlowPoints = [];

    // Editor Drag State
    this.isEditorMode = false;
    this.draggedNodeId = null;
    this.draggedType = null;
    this.dragStartMouse = { x: 0, y: 0 };
    this.dragStartBounds = { x: 0, y: 0, w: 0, h: 0 };

    // Handle resizing
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Bind mouse events for editor mode
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isEditorMode) this.handleMouseDown(e);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isEditorMode) this.handleMouseMove(e);
    });
    this.canvas.addEventListener('mouseup', (e) => {
      if (this.isEditorMode) this.handleMouseUp(e);
    });
    
    // Add touch support for tablet devices
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.isEditorMode) this.handleMouseDown(e);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      if (this.isEditorMode) {
        e.preventDefault();
        this.handleMouseMove(e);
      }
    });
    this.canvas.addEventListener('touchend', (e) => {
      if (this.isEditorMode) this.handleMouseUp(e);
    });
  },

  resize: function() {
    if (!this.canvas) return;

    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    this.render();
  },

  setFloorplanImage: function(imageSrc) {
    const img = new Image();
    img.onload = () => {
      this.image = img;
      this.render();
    };
    img.src = imageSrc;
  },

  clearFloorplanImage: function() {
    this.image = null;
    this.render();
  },

  setNodes: function(nodes) {
    this.nodes = nodes;
    this.render();
    if (!this.isScanning) {
      this.renderHotspots();
    }
  },

  setActiveNode: function(nodeId) {
    this.activeNodeId = nodeId;
    
    // Update HTML hotspots classes
    const hotspots = this.container.querySelectorAll('.room-hotspot');
    hotspots.forEach(el => {
      if (el.dataset.id === nodeId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    this.render(); // Redraw canvas boundary highlights
  },

  /* -------------------------------------------------------------
     NEON COMPUTER VISION RADAR SCANNER ENGINE
  ------------------------------------------------------------- */
  startLaserScan: function(onDoneCallback) {
    this.isScanning = true;
    this.scanY = 0;
    this.scanGlowPoints = [];
    
    // Remove existing hotspots during scan
    const oldHotspots = this.container.querySelectorAll('.room-hotspot');
    oldHotspots.forEach(el => el.remove());

    // Generate random mock "cv vector detection points" on the blueprint
    for (let i = 0; i < 18; i++) {
      this.scanGlowPoints.push({
        x: 0.15 + Math.random() * 0.7,
        y: 0.15 + Math.random() * 0.7,
        label: ['Wall Segment', 'Door Arc', 'Column Node', 'Sink Plumbing', 'Electric Loop'][Math.floor(Math.random() * 5)],
        glowTime: Math.random() * 60 + 20,
        active: false
      });
    }

    const runScan = () => {
      if (!this.isScanning) return;

      this.scanY += 4.5; // step increment speed

      // Check if scan complete
      if (this.scanY >= this.canvas.height) {
        this.isScanning = false;
        this.render();
        this.renderHotspots();
        if (onDoneCallback) onDoneCallback();
        return;
      }

      this.render();
      this.drawLaserBeam();
      requestAnimationFrame(runScan);
    };

    requestAnimationFrame(runScan);
  },

  drawLaserBeam: function() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Draw the green horizontal scanning laser bar
    const gradient = ctx.createLinearGradient(0, this.scanY - 10, 0, this.scanY + 2);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
    gradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.75)');

    ctx.fillStyle = gradient;
    ctx.fillRect(w * 0.1, this.scanY - 15, w * 0.8, 17);

    // Glowing intense line
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, this.scanY);
    ctx.lineTo(w * 0.9, this.scanY);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Draw CV computer vision tags as laser crosses them
    this.scanGlowPoints.forEach(pt => {
      const ptY = pt.y * h;
      const ptX = pt.x * w;

      if (this.scanY >= ptY && this.scanY <= ptY + 60) {
        pt.active = true;
      }

      if (pt.active) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ptX - 10, ptY); ctx.lineTo(ptX + 10, ptY);
        ctx.moveTo(ptX, ptY - 10); ctx.lineTo(ptX, ptY + 10);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.strokeRect(ptX - 12, ptY - 12, 24, 24);

        ctx.fillStyle = '#10B981';
        ctx.font = '9px monospace';
        ctx.fillText(pt.label, ptX + 16, ptY + 3);
      }
    });
  },

  render: function() {
    if (!this.canvas || !this.ctx) return;
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    if (this.image) {
      // Draw uploaded image fitted to canvas
      const imgRatio = this.image.width / this.image.height;
      const canvasRatio = w / h;
      
      let drawW, drawH, drawX, drawY;
      if (imgRatio > canvasRatio) {
        drawW = w * 0.9;
        drawH = drawW / imgRatio;
        drawX = w * 0.05;
        drawY = (h - drawH) / 2;
      } else {
        drawH = h * 0.9;
        drawW = drawH * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = h * 0.05;
      }
      
      this.ctx.shadowColor = 'rgba(212, 175, 55, 0.1)';
      this.ctx.shadowBlur = 20;
      this.ctx.drawImage(this.image, drawX, drawY, drawW, drawH);
      this.ctx.shadowBlur = 0; 
    } else {
      // Render Premium Vector Blueprint
      this.drawVectorBlueprint(w, h);
    }

    // Render color-coded spatial room bounds overlays!
    this.drawRoomBounds(w, h);
  },

  drawRoomBounds: function(w, h) {
    const ctx = this.ctx;
    
    this.nodes.forEach(node => {
      if (!node.bounds) return;

      const rX = node.bounds.x * w;
      const rY = node.bounds.y * h;
      const rW = node.bounds.w * w;
      const rH = node.bounds.h * h;

      // Draw bounding box if scanner passed it, or if scanning is finished
      if (!this.isScanning || this.scanY >= rY) {
        let overlayColor = 'rgba(6, 182, 212, 0.03)'; // Default Living (Teal)
        let strokeColor = 'rgba(6, 182, 212, 0.2)';
        
        if (node.id === 'kitchen') {
          overlayColor = 'rgba(212, 175, 55, 0.03)'; // Gold
          strokeColor = 'rgba(212, 175, 55, 0.2)';
        } else if (node.id.includes('Bed') || node.id === 'masterBed') {
          overlayColor = 'rgba(16, 185, 129, 0.03)'; // Emerald
          strokeColor = 'rgba(16, 185, 129, 0.2)';
        } else if (node.id === 'temple') {
          overlayColor = 'rgba(244, 63, 94, 0.03)'; // Rose
          strokeColor = 'rgba(244, 63, 94, 0.2)';
        } else if (node.id === 'foyer') {
          overlayColor = 'rgba(245, 158, 11, 0.03)'; // Amber
          strokeColor = 'rgba(245, 158, 11, 0.2)';
        }

        // Highlight selected node zone
        const isSelected = node.id === this.activeNodeId;
        if (isSelected) {
          overlayColor = overlayColor.replace('0.03', '0.08');
          strokeColor = strokeColor.replace('0.2', '0.65');
        }

        ctx.fillStyle = overlayColor;
        ctx.fillRect(rX, rY, rW, rH);

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.setLineDash(isSelected ? [] : [4, 4]);
        ctx.strokeRect(rX, rY, rW, rH);
        ctx.setLineDash([]); // Reset
        
        // Faint label in upper-left corner of bounding box
        if (isSelected) {
          ctx.fillStyle = strokeColor;
          ctx.font = '9px monospace';
          ctx.fillText(`ZONE: ${node.name.toUpperCase()}`, rX + 8, rY + 16);
          
          // Draw handles if in editor mode
          if (this.isEditorMode) {
            ctx.fillStyle = '#D4AF37'; // gold handles
            ctx.shadowColor = '#D4AF37';
            ctx.shadowBlur = 8;
            const handleSize = 8;
            
            ctx.fillRect(rX - handleSize/2, rY - handleSize/2, handleSize, handleSize);
            ctx.fillRect(rX + rW - handleSize/2, rY - handleSize/2, handleSize, handleSize);
            ctx.fillRect(rX - handleSize/2, rY + rH - handleSize/2, handleSize, handleSize);
            ctx.fillRect(rX + rW - handleSize/2, rY + rH - handleSize/2, handleSize, handleSize);
            ctx.shadowBlur = 0; // reset
          }
        }
      }
    });
  },

  drawVectorBlueprint: function(w, h) {
    const ctx = this.ctx;
    
    // Grid Lines (Architectural Grid)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer boundary walls (Simulated 3BHK)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
    ctx.stroke();

    // Wall hatch fill
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < w + h; i += 20) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
    }
    ctx.stroke();

    // Clear inside for clean layout
    ctx.fillStyle = '#090A0F';
    ctx.fillRect(w * 0.11, h * 0.11, w * 0.78, h * 0.78);

    // Grid lines inside
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    for (let x = Math.ceil(w * 0.11); x < w * 0.89; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.11);
      ctx.lineTo(x, h * 0.89);
      ctx.stroke();
    }
    for (let y = Math.ceil(h * 0.11); y < h * 0.89; y += 40) {
      ctx.beginPath();
      ctx.moveTo(w * 0.11, y);
      ctx.lineTo(w * 0.89, y);
      ctx.stroke();
    }

    // Partition Walls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    
    // Horizontal divider
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.5);
    ctx.lineTo(w * 0.9, h * 0.5);
    ctx.stroke();

    // Vertical dividers
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.1);
    ctx.lineTo(w * 0.5, h * 0.9);
    ctx.stroke();

    // Bedroom separation on bottom right
    ctx.beginPath();
    ctx.moveTo(w * 0.7, h * 0.5);
    ctx.lineTo(w * 0.7, h * 0.9);
    ctx.stroke();

    // Door Swings (Dotted Arches)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Doors for rooms
    this.drawDoorSwing(ctx, w * 0.5, h * 0.25, 30, 'right-up');
    this.drawDoorSwing(ctx, w * 0.5, h * 0.75, 30, 'left-down');
    this.drawDoorSwing(ctx, w * 0.7, h * 0.75, 30, 'right-down');
    this.drawDoorSwing(ctx, w * 0.3, h * 0.5, 30, 'left-up');

    ctx.setLineDash([]); // Reset dash

    // Blueprint annotations & dimensions
    ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('12,000 mm', w * 0.5 - 25, h * 0.08);
    ctx.fillText('9,000 mm', w * 0.05, h * 0.5);
  },

  drawDoorSwing: function(ctx, x, y, r, direction) {
    ctx.beginPath();
    if (direction === 'right-up') {
      ctx.arc(x, y, r, 1.5 * Math.PI, 2 * Math.PI);
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y - r);
    } else if (direction === 'left-down') {
      ctx.arc(x, y, r, 0.5 * Math.PI, Math.PI);
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r, y + r);
    } else if (direction === 'right-down') {
      ctx.arc(x, y, r, 0, 0.5 * Math.PI);
      ctx.moveTo(x, y + r);
      ctx.lineTo(x + r, y + r);
    } else if (direction === 'left-up') {
      ctx.arc(x, y, r, Math.PI, 1.5 * Math.PI);
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r, y - r);
    }
    ctx.stroke();
  },

  renderHotspots: function() {
    if (!this.container) return;

    const oldHotspots = this.container.querySelectorAll('.room-hotspot');
    oldHotspots.forEach(el => el.remove());

    this.nodes.forEach(node => {
      const pin = document.createElement('div');
      pin.className = 'room-hotspot';
      pin.dataset.id = node.id;
      pin.style.left = node.x + '%';
      pin.style.top = node.y + '%';

      if (node.id === this.activeNodeId) {
        pin.classList.add('active');
      }

      pin.innerHTML = `
        <div class="hotspot-ring">
          <span class="hotspot-icon">${node.icon}</span>
        </div>
        <div class="hotspot-label">${node.name} <span style="font-size:9px;color:rgba(255,255,255,0.4)">(${node.vastu})</span></div>
      `;

      pin.addEventListener('click', () => {
        if (this.isEditorMode) return;
        this.setActiveNode(node.id);
        if (this.onNodeSelect) {
          this.onNodeSelect(node.id);
        }
      });

      this.container.appendChild(pin);
    });
  },

  toggleEditorMode: function() {
    this.isEditorMode = !this.isEditorMode;
    const toggleBtn = document.getElementById('btn-editor-toggle');
    const actionsGroup = document.getElementById('editor-actions-group');
    
    if (toggleBtn) {
      toggleBtn.innerHTML = this.isEditorMode ? '<span>Toggle: ON 🟢</span>' : '<span>Toggle: OFF 🔴</span>';
      toggleBtn.style.background = this.isEditorMode ? 'rgba(16, 185, 129, 0.2)' : 'none';
      toggleBtn.style.border = this.isEditorMode ? '1px solid var(--accent-mint)' : 'none';
    }
    
    if (actionsGroup) {
      actionsGroup.style.display = this.isEditorMode ? 'flex' : 'none';
    }
    
    this.render();
  },

  deleteSelectedRoom: function() {
    if (!this.activeNodeId) {
      alert("Please select a room zone first.");
      return;
    }
    
    const index = this.nodes.findIndex(n => n.id === this.activeNodeId);
    if (index === -1) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete the ${this.nodes[index].name} zone?`);
    if (!confirmDelete) return;
    
    this.nodes.splice(index, 1);
    
    // Select another node
    if (this.nodes.length > 0) {
      this.setActiveNode(this.nodes[0].id);
      if (this.onNodeSelect) {
        this.onNodeSelect(this.nodes[0].id);
      }
    } else {
      this.activeNodeId = null;
    }
    
    this.render();
    this.renderHotspots();
    
    // Trigger global updates
    if (typeof window.recalculateVastuCompliance === 'function') {
      window.recalculateVastuCompliance();
    }
    if (typeof window.updateBlueprintSummaryView === 'function') {
      window.updateBlueprintSummaryView();
    }
  },

  showAddRoomDialog: function() {
    const dialog = document.getElementById('add-room-dialog');
    if (dialog) {
      dialog.style.display = 'flex';
    }
  },

  addRoomNode: function() {
    const typeSelect = document.getElementById('new-room-type');
    const vastuSelect = document.getElementById('new-room-vastu');
    
    if (!typeSelect || !vastuSelect) return;
    
    const type = typeSelect.value;
    const vastu = vastuSelect.value;
    
    const id = `${type}_${Date.now()}`;
    let name = 'Custom Space';
    let icon = '🚪';
    
    if (type === 'living') { name = 'Custom Living'; icon = '🛋️'; }
    else if (type === 'kitchen') { name = 'Custom Kitchen'; icon = '🍳'; }
    else if (type === 'masterBed') { name = 'Custom Suite'; icon = '👑'; }
    else if (type === 'kidsBed') { name = 'Custom Kids Room'; icon = '🧸'; }
    else if (type === 'temple') { name = 'Custom Mandir'; icon = '🙏'; }
    else if (type === 'foyer') { name = 'Custom Foyer'; icon = '👞'; }
    
    const newNode = {
      id: id,
      name: name,
      x: 50,
      y: 50,
      icon: icon,
      vastu: vastu,
      bounds: { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }
    };
    
    this.nodes.push(newNode);
    
    const dialog = document.getElementById('add-room-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
    
    this.setActiveNode(id);
    if (this.onNodeSelect) {
      this.onNodeSelect(id);
    }
    
    this.render();
    this.renderHotspots();
    
    // Trigger global updates
    if (typeof window.recalculateVastuCompliance === 'function') {
      window.recalculateVastuCompliance();
    }
    if (typeof window.updateBlueprintSummaryView === 'function') {
      window.updateBlueprintSummaryView();
    }
  },

  getMousePos: function(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  },

  handleMouseDown: function(e) {
    const mousePos = this.getMousePos(e);
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // 1. Check if active node corner handles were clicked
    const activeNode = this.nodes.find(n => n.id === this.activeNodeId);
    if (activeNode && activeNode.bounds) {
      const rX = activeNode.bounds.x * w;
      const rY = activeNode.bounds.y * h;
      const rW = activeNode.bounds.w * w;
      const rH = activeNode.bounds.h * h;
      const handleSize = 12; // padding for hit detection
      
      const corners = [
        { name: 'tl', x: rX, y: rY },
        { name: 'tr', x: rX + rW, y: rY },
        { name: 'bl', x: rX, y: rY + rH },
        { name: 'br', x: rX + rW, y: rY + rH }
      ];
      
      for (const corner of corners) {
        const dist = Math.hypot(mousePos.x - corner.x, mousePos.y - corner.y);
        if (dist <= handleSize) {
          this.draggedNodeId = activeNode.id;
          this.draggedType = 'resize';
          this.draggedCorner = corner.name;
          this.dragStartMouse = mousePos;
          this.dragStartBounds = { ...activeNode.bounds };
          return;
        }
      }
      
      // 2. Check if clicked inside active node bounding box to move it
      if (mousePos.x >= rX && mousePos.x <= rX + rW && mousePos.y >= rY && mousePos.y <= rY + rH) {
        this.draggedNodeId = activeNode.id;
        this.draggedType = 'move_box';
        this.dragStartMouse = mousePos;
        this.dragStartBounds = { ...activeNode.bounds };
        return;
      }
    }
    
    // 3. Check if clicked on/near a pin hotspot
    for (const node of this.nodes) {
      const pX = (node.x / 100) * w;
      const pY = (node.y / 100) * h;
      const dist = Math.hypot(mousePos.x - pX, mousePos.y - pY);
      
      if (dist <= 25) { // pin radius size
        this.setActiveNode(node.id);
        if (this.onNodeSelect) {
          this.onNodeSelect(node.id);
        }
        
        this.draggedNodeId = node.id;
        this.draggedType = 'move_pin';
        this.dragStartMouse = mousePos;
        this.dragStartPin = { x: node.x, y: node.y };
        return;
      }
    }
    
    // 4. Click inside any other node bounds to select it
    for (const node of this.nodes) {
      if (node.bounds) {
        const rX = node.bounds.x * w;
        const rY = node.bounds.y * h;
        const rW = node.bounds.w * w;
        const rH = node.bounds.h * h;
        
        if (mousePos.x >= rX && mousePos.x <= rX + rW && mousePos.y >= rY && mousePos.y <= rY + rH) {
          this.setActiveNode(node.id);
          if (this.onNodeSelect) {
            this.onNodeSelect(node.id);
          }
          this.render();
          return;
        }
      }
    }
  },

  handleMouseMove: function(e) {
    if (!this.draggedNodeId) return;
    
    const node = this.nodes.find(n => n.id === this.draggedNodeId);
    if (!node) return;
    
    const mousePos = this.getMousePos(e);
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    const dx = mousePos.x - this.dragStartMouse.x;
    const dy = mousePos.y - this.dragStartMouse.y;
    
    if (this.draggedType === 'move_pin') {
      let newX = this.dragStartPin.x + (dx / w) * 100;
      let newY = this.dragStartPin.y + (dy / h) * 100;
      
      // Clamp to margins
      node.x = Math.max(12, Math.min(88, newX));
      node.y = Math.max(12, Math.min(88, newY));
      
      // Coordinate dragging movements dynamically recalculate Vastu orientations:
      const pctX = node.x;
      const pctY = node.y;
      let vastu = 'C';
      if (pctX < 40 && pctY < 40) vastu = 'NW';
      else if (pctX > 60 && pctY < 40) vastu = 'NE';
      else if (pctX < 40 && pctY > 60) vastu = 'SW';
      else if (pctX > 60 && pctY > 60) vastu = 'SE';
      else if (pctY < 40) vastu = 'N';
      else if (pctY > 60) vastu = 'S';
      else if (pctX < 40) vastu = 'W';
      else if (pctX > 60) vastu = 'E';
      node.vastu = vastu;
      
    } else if (this.draggedType === 'move_box') {
      let newBx = this.dragStartBounds.x + dx / w;
      let newBy = this.dragStartBounds.y + dy / h;
      
      // Clamp to stay within floor boundary walls (0.1 to 0.9)
      node.bounds.x = Math.max(0.1, Math.min(0.9 - node.bounds.w, newBx));
      node.bounds.y = Math.max(0.1, Math.min(0.9 - node.bounds.h, newBy));
      
    } else if (this.draggedType === 'resize') {
      const minSize = 0.05;
      
      if (this.draggedCorner === 'tl') {
        let newX = this.dragStartBounds.x + dx / w;
        let newW = this.dragStartBounds.w - dx / w;
        let newY = this.dragStartBounds.y + dy / h;
        let newH = this.dragStartBounds.h - dy / h;
        
        if (newW >= minSize && newX >= 0.1) {
          node.bounds.x = newX;
          node.bounds.w = newW;
        }
        if (newH >= minSize && newY >= 0.1) {
          node.bounds.y = newY;
          node.bounds.h = newH;
        }
      } else if (this.draggedCorner === 'tr') {
        let newW = this.dragStartBounds.w + dx / w;
        let newY = this.dragStartBounds.y + dy / h;
        let newH = this.dragStartBounds.h - dy / h;
        
        if (newW >= minSize && (this.dragStartBounds.x + newW) <= 0.9) {
          node.bounds.w = newW;
        }
        if (newH >= minSize && newY >= 0.1) {
          node.bounds.y = newY;
          node.bounds.h = newH;
        }
      } else if (this.draggedCorner === 'bl') {
        let newX = this.dragStartBounds.x + dx / w;
        let newW = this.dragStartBounds.w - dx / w;
        let newH = this.dragStartBounds.h + dy / h;
        
        if (newW >= minSize && newX >= 0.1) {
          node.bounds.x = newX;
          node.bounds.w = newW;
        }
        if (newH >= minSize && (this.dragStartBounds.y + newH) <= 0.9) {
          node.bounds.h = newH;
        }
      } else if (this.draggedCorner === 'br') {
        let newW = this.dragStartBounds.w + dx / w;
        let newH = this.dragStartBounds.h + dy / h;
        
        if (newW >= minSize && (this.dragStartBounds.x + newW) <= 0.9) {
          node.bounds.w = newW;
        }
        if (newH >= minSize && (this.dragStartBounds.y + newH) <= 0.9) {
          node.bounds.h = newH;
        }
      }
    }
    
    this.render();
    this.renderHotspots();
    
    // Trigger global updates instantly
    if (typeof window.recalculateVastuCompliance === 'function') {
      window.recalculateVastuCompliance();
    }
    if (typeof window.updateBlueprintSummaryView === 'function') {
      window.updateBlueprintSummaryView();
    }
  },

  handleMouseUp: function(e) {
    this.draggedNodeId = null;
    this.draggedType = null;
    this.draggedCorner = null;
  }
};

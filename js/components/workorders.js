/**
 * Work Order (WO) Management Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, formatDate, formatDateTime, showToast, generateID } from '../utils/helpers.js';

let currentWOSearchTerm = '';
let currentViewMode = 'list'; // 'list' or 'kanban'

export function renderWorkOrders() {
  const container = document.getElementById('workorders-list-container');
  if (!container) return;

  const workOrders = StorageManager.getWorkOrders();
  const assets = StorageManager.getAssets();
  const technicians = StorageManager.getTechnicians();
  const inventory = StorageManager.getInventory();

  // Populate Asset Select in Form if empty
  populateAssetSelect(assets);
  populateTechnicianSelect(technicians);

  // Apply filters
  let filtered = workOrders.filter(wo => {
    if (!currentWOSearchTerm) return true;
    const term = currentWOSearchTerm.toLowerCase();
    return wo.id.toLowerCase().includes(term) ||
           wo.title.toLowerCase().includes(term) ||
           wo.assetName.toLowerCase().includes(term) ||
           wo.type.toLowerCase().includes(term) ||
           wo.priority.toLowerCase().includes(term) ||
           wo.status.toLowerCase().includes(term) ||
           (wo.assignedTech && wo.assignedTech.toLowerCase().includes(term));
  });

  if (currentViewMode === 'kanban') {
    renderKanbanBoard(container, filtered);
  } else {
    renderListView(container, filtered);
  }

  if (window.lucide) window.lucide.createIcons();
}

function renderListView(container, workOrders) {
  if (workOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file-x"></i>
        <h3>Tidak ada Work Order yang cocok</h3>
        <p>Coba sesuaikan filter atau tambahkan Work Order baru.</p>
        <button class="btn btn-primary" onclick="window.openWorkOrderModal()">
          <i data-lucide="plus"></i> Buat WO
        </button>
      </div>
    `;
    return;
  }

  const priorityPills = {
    'Darurat': 'status-pill status-red',
    'Tinggi': 'status-pill status-orange',
    'Sedang': 'status-pill status-blue',
    'Rendah': 'status-pill status-gray'
  };

  const statusBadges = {
    'Draft': 'badge-gray',
    'Disetujui': 'badge-info',
    'Dalam Proses': 'badge-warning',
    'Menunggu Part': 'badge-purple',
    'Selesai': 'badge-success',
    'Dibatalkan': 'badge-danger'
  };

  container.innerHTML = `
    <div class="table-responsive glass-card padding-0">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="col-no">NO</th>
            <th class="col-id">No. WO</th>
            <th class="col-title">Deskripsi</th>
            <th class="col-asset">Aset</th>
            <th class="col-type">Tipe</th>
            <th class="col-priority">Prioritas</th>
            <th class="col-status">Status</th>
            <th class="col-tech">Teknisi</th>
            <th class="col-date multiline-header">Target<br>Selesai</th>
            <th class="col-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${workOrders.map((wo, index) => `
            <tr>
              <td class="col-no"><strong>${index + 1}</strong></td>
              <td class="col-id"><strong>${wo.id}</strong></td>
              <td class="col-title">
                <div class="font-medium">${wo.title}</div>
                <small class="text-muted">${wo.problemDescription ? wo.problemDescription.substring(0, 50) + '...' : ''}</small>
              </td>
              <td class="col-asset">${wo.assetName}</td>
              <td class="col-type"><span class="badge badge-outline">${wo.type}</span></td>
              <td class="col-priority"><span class="${priorityPills[wo.priority] || ''}">${wo.priority}</span></td>
              <td class="col-status"><span class="badge ${statusBadges[wo.status] || ''}">${wo.status}</span></td>
              <td class="col-tech">${wo.assignedTech || '<em class="text-muted">Belum ditunjuk</em>'}</td>
              <td class="col-date">${formatDate(wo.targetDate)}</td>
              <td class="col-actions">
                <div class="btn-group" style="justify-content: flex-end;">
                  ${wo.status !== 'Selesai' && wo.status !== 'Dibatalkan' ? `
                    <button class="btn btn-icon btn-sm btn-outline-success" title="Selesaikan WO" onclick="window.openCompleteWOModal('${wo.id}')">
                      <i data-lucide="check-square"></i>
                    </button>
                  ` : ''}
                  <button class="btn btn-icon btn-sm btn-outline-primary" title="Cetak Work Order (WO)" onclick="window.printWorkOrder('${wo.id}')">
                    <i data-lucide="printer"></i>
                  </button>
                  <button class="btn btn-icon btn-sm btn-outline-secondary" title="Edit WO" onclick="window.openWorkOrderModal('${wo.id}')">
                    <i data-lucide="edit"></i>
                  </button>
                  <button class="btn btn-icon btn-sm btn-outline-danger" title="Hapus WO" onclick="window.deleteWorkOrder('${wo.id}')">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderKanbanBoard(container, workOrders) {
  const columns = ['Disetujui', 'Dalam Proses', 'Menunggu Part', 'Selesai'];

  container.innerHTML = `
    <div class="kanban-board">
      ${columns.map(col => {
        const colWOs = workOrders.filter(w => w.status === col);
        return `
          <div class="kanban-column glass-card">
            <div class="kanban-header">
              <h4>${col}</h4>
              <span class="badge badge-info">${colWOs.length}</span>
            </div>
            <div class="kanban-cards">
              ${colWOs.length ? colWOs.map(wo => `
                <div class="kanban-card">
                  <div class="kanban-card-top">
                    <span class="kanban-wo-id">${wo.id}</span>
                    <span class="badge badge-outline">${wo.priority}</span>
                  </div>
                  <div class="kanban-card-title">${wo.title}</div>
                  <div class="kanban-card-asset"><i data-lucide="box"></i> ${wo.assetName}</div>
                  <div class="kanban-card-footer">
                    <small class="text-muted"><i data-lucide="user"></i> ${wo.assignedTech || 'Belum ditunjuk'}</small>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.printWorkOrder('${wo.id}')">
                      <i data-lucide="printer"></i>
                    </button>
                  </div>
                </div>
              `).join('') : '<div class="kanban-empty">Kosong</div>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function populateAssetSelect(assets) {
  const select = document.getElementById('wo-form-asset');
  if (!select || select.children.length > 1) return;

  assets.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.id} - ${a.name} (${a.location})`;
    select.appendChild(opt);
  });
}

function populateTechnicianSelect(technicians) {
  const select = document.getElementById('wo-form-tech');
  if (!select || select.children.length > 1) return;

  technicians.forEach(t => {
    const opt = document.createElement('option');
    opt.value = `${t.name} (${t.role})`;
    opt.textContent = `${t.name} - ${t.role}`;
    select.appendChild(opt);
  });
}

export function setupWorkOrderListeners() {
  const searchInput = document.getElementById('wo-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentWOSearchTerm = e.target.value;
      renderWorkOrders();
    });
  }

  const viewModeBtn = document.getElementById('btn-toggle-wo-view');
  if (viewModeBtn) {
    viewModeBtn.addEventListener('click', () => {
      currentViewMode = currentViewMode === 'list' ? 'kanban' : 'list';
      viewModeBtn.innerHTML = currentViewMode === 'list' ? 
        '<i data-lucide="layout-grid"></i> Kanban View' : 
        '<i data-lucide="list"></i> Table View';
      renderWorkOrders();
    });
  }
}

// Open Work Order Form Modal
window.openWorkOrderModal = function(woId = null) {
  const modal = document.getElementById('modal-wo-form');
  const titleEl = document.getElementById('modal-wo-title');
  const form = document.getElementById('form-wo');

  if (!modal || !form) return;

  form.reset();

  if (woId) {
    titleEl.textContent = 'Edit Work Order (WO)';
    const wos = StorageManager.getWorkOrders();
    const wo = wos.find(w => w.id === woId);

    if (wo) {
      document.getElementById('wo-form-id').value = wo.id;
      document.getElementById('wo-form-title').value = wo.title;
      document.getElementById('wo-form-asset').value = wo.assetId;
      document.getElementById('wo-form-type').value = wo.type;
      document.getElementById('wo-form-priority').value = wo.priority;
      document.getElementById('wo-form-status').value = wo.status;
      document.getElementById('wo-form-tech').value = wo.assignedTech || '';
      document.getElementById('wo-form-target-date').value = wo.targetDate ? wo.targetDate.substring(0, 16) : '';
      document.getElementById('wo-form-est-hours').value = wo.estimatedHours || 0;
      document.getElementById('wo-form-desc').value = wo.problemDescription || '';
    }
  } else {
    titleEl.textContent = 'Buat Work Order (WO) Baru';
    document.getElementById('wo-form-id').value = '';
    // Set default target date to 2 days from now
    const nextDate = new Date(Date.now() + 48*60*60*1000).toISOString().slice(0, 16);
    document.getElementById('wo-form-target-date').value = nextDate;
  }

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.saveWorkOrderForm = function(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('wo-form-id').value;
  const title = document.getElementById('wo-form-title').value.trim();
  const assetId = document.getElementById('wo-form-asset').value;
  const type = document.getElementById('wo-form-type').value;
  const priority = document.getElementById('wo-form-priority').value;
  const status = document.getElementById('wo-form-status').value;
  const assignedTech = document.getElementById('wo-form-tech').value;
  const targetDate = document.getElementById('wo-form-target-date').value;
  const estimatedHours = parseFloat(document.getElementById('wo-form-est-hours').value) || 0;
  const problemDescription = document.getElementById('wo-form-desc').value.trim();

  if (!title || !assetId) {
    showToast('Harap isi Judul Work Order (WO) dan pilih Aset terkait.', 'warning');
    return;
  }

  const assets = StorageManager.getAssets();
  const selectedAsset = assets.find(a => a.id === assetId);
  const assetName = selectedAsset ? selectedAsset.name : 'Unknown Asset';

  let wos = StorageManager.getWorkOrders();

  if (id) {
    wos = wos.map(w => {
      if (w.id === id) {
        return {
          ...w,
          title, assetId, assetName, type, priority, status,
          assignedTech, targetDate, estimatedHours, problemDescription
        };
      }
      return w;
    });
    showToast(`Work Order ${id} berhasil diperbarui`, 'success');
  } else {
    const newWO = {
      id: generateID('WO-' + new Date().getFullYear() + '-'),
      title, assetId, assetName, type, priority, status,
      assignedTech,
      createdDate: new Date().toISOString(),
      targetDate: targetDate || new Date(Date.now() + 48*60*60*1000).toISOString(),
      completedDate: null,
      problemDescription,
      resolutionNotes: '',
      estimatedHours,
      actualHours: 0,
      partsUsed: [],
      totalCost: 0
    };
    wos.unshift(newWO);
    showToast(`Work Order Baru ${newWO.id} berhasil diterbitkan`, 'success');
  }

  StorageManager.saveWorkOrders(wos);
  document.getElementById('modal-wo-form').classList.remove('active');
  renderWorkOrders();
};

// Complete Work Order Modal
window.openCompleteWOModal = function(woId) {
  const modal = document.getElementById('modal-complete-wo');
  const form = document.getElementById('form-complete-wo');
  const wos = StorageManager.getWorkOrders();
  const wo = wos.find(w => w.id === woId);

  if (!modal || !wo) return;

  document.getElementById('complete-wo-id').value = wo.id;
  document.getElementById('complete-wo-title-display').textContent = `${wo.id} - ${wo.title}`;
  document.getElementById('complete-wo-hours').value = wo.actualHours || wo.estimatedHours || 2;
  document.getElementById('complete-wo-cost').value = wo.totalCost || 0;
  document.getElementById('complete-wo-notes').value = wo.resolutionNotes || '';

  modal.classList.add('active');
};

window.saveCompleteWO = function(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('complete-wo-id').value;
  const actualHours = parseFloat(document.getElementById('complete-wo-hours').value) || 0;
  const totalCost = parseFloat(document.getElementById('complete-wo-cost').value) || 0;
  const resolutionNotes = document.getElementById('complete-wo-notes').value.trim();

  let wos = StorageManager.getWorkOrders();
  wos = wos.map(w => {
    if (w.id === id) {
      return {
        ...w,
        status: 'Selesai',
        completedDate: new Date().toISOString(),
        actualHours,
        totalCost,
        resolutionNotes
      };
    }
    return w;
  });

  StorageManager.saveWorkOrders(wos);
  showToast(`Work Order ${id} berhasil diselesaikan!`, 'success');
  document.getElementById('modal-complete-wo').classList.remove('active');
  renderWorkOrders();
};

// Printable Work Order (WO) Sheet Generator
window.printWorkOrder = function(woId) {
  const wos = StorageManager.getWorkOrders();
  const assets = StorageManager.getAssets();
  const wo = wos.find(w => w.id === woId);

  if (!wo) return;

  const asset = assets.find(a => a.id === wo.assetId) || {};

  const modal = document.getElementById('modal-print-wo');
  const printArea = document.getElementById('print-spk-content');

  printArea.innerHTML = `
    <div class="spk-paper">
      <div class="spk-header">
        <div class="spk-brand">
          <h2>PT INDUSTRI MANUFAKTUR INDONESIA</h2>
          <p>Departemen Maintenance & Engineering Facilities</p>
        </div>
        <div class="spk-title-box">
          <h1>WORK ORDER (WO)</h1>
          <div class="spk-no">${wo.id}</div>
        </div>
      </div>

      <div class="spk-divider"></div>

      <table class="spk-meta-table">
        <tr>
          <td><strong>Aset / Mesin:</strong></td>
          <td>${wo.assetName} (${wo.assetId})</td>
          <td><strong>Tanggal Terbit:</strong></td>
          <td>${formatDateTime(wo.createdDate)}</td>
        </tr>
        <tr>
          <td><strong>Lokasi Aset:</strong></td>
          <td>${asset.location || '-'}</td>
          <td><strong>Target Selesai:</strong></td>
          <td>${formatDate(wo.targetDate)}</td>
        </tr>
        <tr>
          <td><strong>Kategori Maintenance:</strong></td>
          <td>${wo.type} Maintenance</td>
          <td><strong>Prioritas Kerja:</strong></td>
          <td><strong style="color: ${wo.priority === 'Darurat' ? 'red' : 'black'};">${wo.priority}</strong></td>
        </tr>
        <tr>
          <td><strong>Teknisi Penanggung Jawab:</strong></td>
          <td>${wo.assignedTech || 'Mekanik Shift On-Duty'}</td>
          <td><strong>Status Work Order (WO):</strong></td>
          <td>${wo.status}</td>
        </tr>
      </table>

      <div class="spk-section-title">DESKRIPSI MASALAH & ANOMALI</div>
      <div class="spk-box-content">${wo.problemDescription || 'Pemeriksaan dan perbaikan sesuai jadwal rutin.'}</div>

      <div class="spk-section-title">PENJELASAN TINDAKAN PERBAIKAN (ISIAN TEKNISI)</div>
      <div class="spk-box-content spk-blank-box">
        ${wo.resolutionNotes ? wo.resolutionNotes : '(Kosongkan untuk diisi teknisi setelah pengerjaan selesai...)'}
      </div>

      <div class="spk-section-title">SUKU CADANG & MATERIAL YANG DIGUNAKAN</div>
      <table class="table table-bordered spk-parts-table">
        <thead>
          <tr>
            <th>NO</th>
            <th>Kode Part</th>
            <th>Nama Spare Part</th>
            <th>Jumlah (Qty)</th>
            <th>Harga Satuan</th>
            <th>Total (IDR)</th>
          </tr>
        </thead>
        <tbody>
          ${wo.partsUsed && wo.partsUsed.length ? wo.partsUsed.map((p, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${p.partId}</td>
              <td>${p.partName}</td>
              <td>${p.qty}</td>
              <td>${formatIDR(p.unitPrice)}</td>
              <td>${formatIDR(p.qty * p.unitPrice)}</td>
            </tr>
          `).join('') : `
            <tr><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
            <tr><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          `}
        </tbody>
      </table>

      <div class="spk-signatures">
        <div class="sig-box">
          <p>Dibuat Oleh,</p>
          <div class="sig-space"></div>
          <p><strong>Supervisor Maintenance</strong></p>
        </div>
        <div class="sig-box">
          <p>Disetujui Oleh,</p>
          <div class="sig-space"></div>
          <p><strong>Manajer Operasional</strong></p>
        </div>
        <div class="sig-box">
          <p>Dikerjakan Oleh,</p>
          <div class="sig-space"></div>
          <p><strong>${wo.assignedTech ? wo.assignedTech.split(' ')[0] : 'Teknisi'}</strong></p>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.executePrint = function() {
  window.print();
};

window.deleteWorkOrder = function(woId) {
  if (!confirm(`Hapus Work Order ${woId}?`)) return;

  let wos = StorageManager.getWorkOrders();
  wos = wos.filter(w => w.id !== woId);

  StorageManager.saveWorkOrders(wos);
  StorageManager.deleteFromSupabase('work_orders', woId);
  showToast(`Work Order ${woId} berhasil dihapus`, 'success');
  renderWorkOrders();
};

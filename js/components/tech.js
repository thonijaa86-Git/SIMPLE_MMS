/**
 * Technician Performance Dashboard & Execution Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, formatDate, formatDateTime, showToast } from '../utils/helpers.js';

let chartTechStatus = null;
let chartTechHours = null;

let currentTechDashName = '';
let currentTechWOSearch = '';
let currentTechWOFilterTech = '';
let currentTechWOFilterStatus = '';

// ==========================================
// 1. TECHNICIAN DASHBOARD (PERFORMANCE)
// ==========================================

export function renderTechDashboard() {
  const workOrders = StorageManager.getWorkOrders();
  const technicians = StorageManager.getTechnicians();
  const team = StorageManager.getTeam();

  // Combine technicians list from storage
  const techList = technicians.length ? technicians : team.filter(t => t.role === 'Teknisi');

  // Populate technician dropdown filter
  populateTechDashDropdown(techList);

  // Filter WOs by selected technician
  let filteredWOs = workOrders;
  if (currentTechDashName) {
    filteredWOs = workOrders.filter(w => w.assignedTech === currentTechDashName);
  }

  // Calculate Metrics
  const totalReceived = filteredWOs.length;
  const completedWOs = filteredWOs.filter(w => w.status === 'Selesai');
  const inProgressWOs = filteredWOs.filter(w => w.status === 'Dalam Proses');
  const waitingPartWOs = filteredWOs.filter(w => w.status === 'Menunggu Part');

  const completionRate = totalReceived > 0 ? Math.round((completedWOs.length / totalReceived) * 100) : 0;

  // Calculate Actual Hours and Time Efficiency Score
  let totalEstHours = 0;
  let totalActualHours = 0;
  
  completedWOs.forEach(w => {
    totalEstHours += (w.estimatedHours || 0);
    totalActualHours += (w.actualHours || 0);
  });

  const avgActualHours = completedWOs.length > 0 ? (totalActualHours / completedWOs.length).toFixed(1) : 0;
  
  // Efficiency: (Est Hours / Actual Hours) * 100
  let efficiencyRate = 100;
  if (totalActualHours > 0 && totalEstHours > 0) {
    efficiencyRate = Math.round((totalEstHours / totalActualHours) * 100);
  }

  // Render KPI Grid
  const kpiContainer = document.getElementById('tech-dashboard-kpi-grid');
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-orange"><i data-lucide="inbox"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Total WO Diterima</div>
          <div class="kpi-value">${totalReceived} <span class="kpi-sub">WO</span></div>
          <div class="kpi-badge badge-info"><i data-lucide="user-check"></i> ${currentTechDashName || 'Seluruh Teknisi'}</div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-green"><i data-lucide="check-circle-2"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">WO Selesai Dieksekusi</div>
          <div class="kpi-value">${completedWOs.length} <span class="kpi-sub">WO</span></div>
          <div class="kpi-badge badge-success"><i data-lucide="trending-up"></i> Performa ${completionRate}%</div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-blue"><i data-lucide="clock"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">WO Sedang Berjalan</div>
          <div class="kpi-value">${inProgressWOs.length} <span class="kpi-sub">Aktif</span></div>
          <div class="kpi-badge ${inProgressWOs.length > 0 ? 'badge-warning' : 'badge-gray'}">
            <i data-lucide="flame"></i> Dalam Pengerjaan
          </div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-purple"><i data-lucide="award"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Skor Efisiensi Waktu</div>
          <div class="kpi-value">${efficiencyRate}%</div>
          <div class="kpi-badge ${efficiencyRate >= 100 ? 'badge-success' : 'badge-warning'}">
            <i data-lucide="zap"></i> ${efficiencyRate >= 100 ? 'Sangat Efisien' : 'Perlu Tingkat Respon'}
          </div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-red"><i data-lucide="timer"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Total Jam Kerja Riil</div>
          <div class="kpi-value">${totalActualHours} <span class="kpi-sub">Jam</span></div>
          <div class="kpi-badge badge-info"><i data-lucide="bar-chart"></i> Rata-rata ${avgActualHours} Jam/WO</div>
        </div>
      </div>
    `;
  }

  // Render Table of Technician Performance Breakdown
  renderTechPerformanceTable(filteredWOs);

  // Render Charts
  initTechCharts(filteredWOs);

  if (window.lucide) window.lucide.createIcons();
}

function populateTechDashDropdown(techList) {
  const select = document.getElementById('tech-dash-filter-name');
  if (!select) return;

  const currentVal = select.value;
  let optionsHTML = `<option value="">Semua Teknisi (Seluruh Tim)</option>`;

  techList.forEach(t => {
    optionsHTML += `<option value="${t.name}" ${t.name === currentTechDashName ? 'selected' : ''}>${t.name} (${t.position || t.role || 'Teknisi'})</option>`;
  });

  select.innerHTML = optionsHTML;
}

function renderTechPerformanceTable(workOrders) {
  const tableBody = document.getElementById('tech-dashboard-performance-table');
  if (!tableBody) return;

  if (workOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-4 text-muted">
          Tidak ada data Work Order untuk teknisi ini.
        </td>
      </tr>
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

  tableBody.innerHTML = workOrders.map((wo, index) => {
    const est = wo.estimatedHours || 0;
    const act = wo.actualHours || 0;

    let effBadge = '<span class="badge badge-gray">-</span>';
    if (wo.status === 'Selesai' && act > 0 && est > 0) {
      const eff = Math.round((est / act) * 100);
      if (eff >= 110) {
        effBadge = `<span class="badge badge-success"><i data-lucide="trending-up"></i> ${eff}% (Sangat Cepat)</span>`;
      } else if (eff >= 90) {
        effBadge = `<span class="badge badge-info"><i data-lucide="check"></i> ${eff}% (Sesuai Target)</span>`;
      } else {
        effBadge = `<span class="badge badge-warning"><i data-lucide="alert-circle"></i> ${eff}% (Overtime)</span>`;
      }
    } else if (wo.status === 'Dalam Proses') {
      effBadge = '<span class="badge badge-warning">Sedang Berjalan</span>';
    }

    return `
      <tr>
        <td class="col-no"><strong>${index + 1}</strong></td>
        <td class="col-id"><strong>${wo.id}</strong></td>
        <td class="col-title">
          <div class="font-medium">${wo.title}</div>
          <small class="text-muted">${wo.problemDescription ? wo.problemDescription.substring(0, 45) + '...' : '-'}</small>
        </td>
        <td class="col-asset">${wo.assetName}</td>
        <td class="col-priority"><span class="${priorityPills[wo.priority] || ''}">${wo.priority}</span></td>
        <td class="col-status"><span class="badge ${statusBadges[wo.status] || ''}">${wo.status}</span></td>
        <td class="col-tech"><strong>${wo.assignedTech || 'Mekanik Shift'}</strong></td>
        <td class="col-date">${est} Jam</td>
        <td class="col-date">${act ? `${act} Jam` : '-'}</td>
        <td class="col-status">${effBadge}</td>
      </tr>
    `;
  }).join('');
}

function initTechCharts(workOrders) {
  const statusCtx = document.getElementById('chartTechWOStatus');
  const hoursCtx = document.getElementById('chartTechPerformanceHours');

  if (statusCtx && window.Chart) {
    if (chartTechStatus) chartTechStatus.destroy();

    const counts = {
      'Disetujui': workOrders.filter(w => w.status === 'Disetujui').length,
      'Dalam Proses': workOrders.filter(w => w.status === 'Dalam Proses').length,
      'Menunggu Part': workOrders.filter(w => w.status === 'Menunggu Part').length,
      'Selesai': workOrders.filter(w => w.status === 'Selesai').length,
      'Dibatalkan': workOrders.filter(w => w.status === 'Dibatalkan').length
    };

    chartTechStatus = new window.Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } }
        }
      }
    });
  }

  if (hoursCtx && window.Chart) {
    if (chartTechHours) chartTechHours.destroy();

    const completedWOs = workOrders.filter(w => w.status === 'Selesai').slice(-6);
    const labels = completedWOs.map(w => w.id);
    const estData = completedWOs.map(w => w.estimatedHours || 0);
    const actData = completedWOs.map(w => w.actualHours || 0);

    chartTechHours = new window.Chart(hoursCtx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['WO-001', 'WO-002', 'WO-003'],
        datasets: [
          {
            label: 'Estimasi Jam (Target)',
            data: estData.length ? estData : [4, 6, 2],
            backgroundColor: '#3b82f6'
          },
          {
            label: 'Realisasi Jam (Riil Teknisi)',
            data: actData.length ? actData : [3.5, 5, 2],
            backgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } },
          y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') }, beginAtZero: true }
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } }
        }
      }
    });
  }
}


// ==========================================
// 2. TECHNICIAN WORK ORDERS (EXECUTION AREA)
// ==========================================

export function renderTechWorkOrders() {
  const container = document.getElementById('tech-workorders-list-container');
  if (!container) return;

  const workOrders = StorageManager.getWorkOrders();
  const technicians = StorageManager.getTechnicians();
  const team = StorageManager.getTeam();

  const techList = technicians.length ? technicians : team.filter(t => t.role === 'Teknisi');
  populateTechWODropdown(techList);

  // Apply Search & Dropdown Filters
  let filtered = workOrders.filter(wo => {
    if (currentTechWOFilterTech && wo.assignedTech !== currentTechWOFilterTech) {
      return false;
    }
    if (currentTechWOFilterStatus && wo.status !== currentTechWOFilterStatus) {
      return false;
    }
    if (currentTechWOSearch) {
      const term = currentTechWOSearch.toLowerCase();
      return wo.id.toLowerCase().includes(term) ||
             wo.title.toLowerCase().includes(term) ||
             wo.assetName.toLowerCase().includes(term) ||
             wo.priority.toLowerCase().includes(term) ||
             wo.status.toLowerCase().includes(term) ||
             (wo.problemDescription && wo.problemDescription.toLowerCase().includes(term));
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card py-5">
        <i data-lucide="wrench"></i>
        <h3>Tidak ada Work Order yang cocok untuk Teknisi</h3>
        <p>Semua perintah kerja telah diselesaikan atau tidak ditemukan dengan filter ini.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
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
            <th class="col-title">Instruksi Manager / Supervisor</th>
            <th class="col-asset">Aset & Lokasi</th>
            <th class="col-priority">Prioritas</th>
            <th class="col-status">Status</th>
            <th class="col-tech">Teknisi</th>
            <th class="col-date">Target Selesai</th>
            <th class="col-actions text-center" style="width: 220px;">Aksi Eksekusi Teknisi</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((wo, index) => `
            <tr>
              <td class="col-no"><strong>${index + 1}</strong></td>
              <td class="col-id"><strong>${wo.id}</strong></td>
              <td class="col-title">
                <div class="font-medium" style="font-size: 15px;">${wo.title}</div>
                <div class="text-muted" style="font-size: 12px; margin-top: 4px;">
                  <i data-lucide="info" style="width: 12px; height: 12px;"></i> ${wo.problemDescription || 'Instruksi perbaikan lapangan.'}
                </div>
              </td>
              <td class="col-asset">
                <strong>${wo.assetName}</strong>
                <div class="text-muted" style="font-size: 11px;">ID: ${wo.assetId}</div>
              </td>
              <td class="col-priority"><span class="${priorityPills[wo.priority] || ''}">${wo.priority}</span></td>
              <td class="col-status"><span class="badge ${statusBadges[wo.status] || ''}">${wo.status}</span></td>
              <td class="col-tech">
                <span class="badge badge-outline"><i data-lucide="user"></i> ${wo.assignedTech || 'Belum ditunjuk'}</span>
              </td>
              <td class="col-date">${formatDate(wo.targetDate)}</td>
              <td class="col-actions">
                <div class="btn-group" style="justify-content: center; gap: 4px;">
                  ${wo.status === 'Disetujui' || wo.status === 'Draft' ? `
                    <button class="btn btn-sm btn-primary" title="Mulai Pengerjaan WO" onclick="window.startTechWorkOrder('${wo.id}')">
                      <i data-lucide="play"></i> Mulai
                    </button>
                  ` : ''}

                  ${wo.status === 'Dalam Proses' ? `
                    <button class="btn btn-sm btn-warning" title="Status Menunggu Part" onclick="window.requestPartsTechWorkOrder('${wo.id}')">
                      <i data-lucide="package"></i> Minta Part
                    </button>
                  ` : ''}

                  ${wo.status !== 'Selesai' && wo.status !== 'Dibatalkan' ? `
                    <button class="btn btn-sm btn-success" title="Selesaikan Pekerjaan WO" onclick="window.openCompleteWOModal('${wo.id}')">
                      <i data-lucide="check-circle"></i> Selesai
                    </button>
                  ` : ''}

                  <button class="btn btn-icon btn-sm btn-outline-secondary" title="Cetak SPK Lembar Kerja" onclick="window.printWorkOrder('${wo.id}')">
                    <i data-lucide="printer"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function populateTechWODropdown(techList) {
  const select = document.getElementById('tech-wo-filter-tech');
  if (!select) return;

  let optionsHTML = `<option value="">Semua Teknisi</option>`;
  techList.forEach(t => {
    optionsHTML += `<option value="${t.name}" ${t.name === currentTechWOFilterTech ? 'selected' : ''}>${t.name}</option>`;
  });
  select.innerHTML = optionsHTML;
}

// Setup Event Listeners for Technician Views
export function setupTechListeners() {
  // Technician Dashboard Filter
  const techDashSelect = document.getElementById('tech-dash-filter-name');
  if (techDashSelect) {
    techDashSelect.addEventListener('change', (e) => {
      currentTechDashName = e.target.value;
      renderTechDashboard();
    });
  }

  // Technician WO Filters
  const techWOFilterTech = document.getElementById('tech-wo-filter-tech');
  if (techWOFilterTech) {
    techWOFilterTech.addEventListener('change', (e) => {
      currentTechWOFilterTech = e.target.value;
      renderTechWorkOrders();
    });
  }

  const techWOFilterStatus = document.getElementById('tech-wo-filter-status');
  if (techWOFilterStatus) {
    techWOFilterStatus.addEventListener('change', (e) => {
      currentTechWOFilterStatus = e.target.value;
      renderTechWorkOrders();
    });
  }

  const techWOSearch = document.getElementById('tech-wo-search');
  if (techWOSearch) {
    techWOSearch.addEventListener('input', (e) => {
      currentTechWOSearch = e.target.value;
      renderTechWorkOrders();
    });
  }
}

// Global Action Handlers for Technicians
window.startTechWorkOrder = function(woId) {
  let wos = StorageManager.getWorkOrders();
  wos = wos.map(w => {
    if (w.id === woId) {
      return { ...w, status: 'Dalam Proses' };
    }
    return w;
  });

  StorageManager.saveWorkOrders(wos);
  showToast(`⚡ Work Order ${woId} mulai dikerjakan (Dalam Proses)`, 'info');
  if (window.navigateTo && window.currentView) {
    window.navigateTo(window.currentView);
  }
};

window.requestPartsTechWorkOrder = function(woId) {
  let wos = StorageManager.getWorkOrders();
  wos = wos.map(w => {
    if (w.id === woId) {
      return { ...w, status: 'Menunggu Part' };
    }
    return w;
  });

  StorageManager.saveWorkOrders(wos);
  showToast(`📦 Status Work Order ${woId} diperbarui ke Menunggu Part`, 'warning');
  if (window.navigateTo && window.currentView) {
    window.navigateTo(window.currentView);
  }
};

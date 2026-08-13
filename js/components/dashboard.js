/**
 * Dashboard & Analytics Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, formatDate } from '../utils/helpers.js';

let woStatusChart = null;
let costTrendChart = null;
let assetConditionChart = null;

export function renderDashboard() {
  const assets = StorageManager.getAssets();
  const workOrders = StorageManager.getWorkOrders();
  const pmSchedules = StorageManager.getPMSchedules();
  const inventory = StorageManager.getInventory();

  // Metrics Calculations
  const totalAssets = assets.length;
  const operationalAssets = assets.filter(a => a.status === 'Operasional').length;
  const breakdownAssets = assets.filter(a => a.status === 'Breakdown').length;
  const healthIndex = totalAssets ? Math.round((operationalAssets / totalAssets) * 100) : 0;

  const activeWorkOrders = workOrders.filter(w => ['Disetujui', 'Dalam Proses', 'Menunggu Part'].includes(w.status)).length;
  const emergencyWorkOrders = workOrders.filter(w => w.priority === 'Darurat' && w.status !== 'Selesai').length;

  const totalPM = pmSchedules.length;
  const normalPM = pmSchedules.filter(p => p.status === 'Normal').length;
  const pmCompliance = totalPM ? Math.round((normalPM / totalPM) * 100) : 0;

  const lowStockCount = inventory.filter(i => i.stock <= i.minStock).length;

  // Render KPI Cards
  const kpiContainer = document.getElementById('dashboard-kpi-grid');
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-blue"><i data-lucide="box"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Total Aset</div>
          <div class="kpi-value">${totalAssets} <span class="kpi-sub">Unit</span></div>
          <div class="kpi-badge badge-success"><i data-lucide="check-circle-2"></i> ${operationalAssets} Operasional</div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-orange"><i data-lucide="file-text"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Work Order Aktif</div>
          <div class="kpi-value">${activeWorkOrders} <span class="kpi-sub">WO</span></div>
          <div class="kpi-badge ${emergencyWorkOrders > 0 ? 'badge-danger' : 'badge-info'}">
            <i data-lucide="${emergencyWorkOrders > 0 ? 'alert-triangle' : 'clock'}"></i>
            ${emergencyWorkOrders > 0 ? `${emergencyWorkOrders} Darurat!` : 'Dalam Penanganan'}
          </div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-green"><i data-lucide="shield-check"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">PM Compliance Rate</div>
          <div class="kpi-value">${pmCompliance}%</div>
          <div class="kpi-badge badge-success"><i data-lucide="trending-up"></i> Performa Baik</div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-purple"><i data-lucide="activity"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Equipment Health</div>
          <div class="kpi-value">${healthIndex}%</div>
          <div class="kpi-badge ${breakdownAssets > 0 ? 'badge-warning' : 'badge-success'}">
            <i data-lucide="alert-octagon"></i> ${breakdownAssets} Breakdown
          </div>
        </div>
      </div>

      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-red"><i data-lucide="package-search"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Low Stock Parts</div>
          <div class="kpi-value">${lowStockCount} <span class="kpi-sub">Item</span></div>
          <div class="kpi-badge ${lowStockCount > 0 ? 'badge-danger' : 'badge-success'}">
            ${lowStockCount > 0 ? 'Perlu Restock!' : 'Stok Aman'}
          </div>
        </div>
      </div>
    `;
  }

  // Render Urgent Alert Banner if emergency WO or low stock exists
  const alertContainer = document.getElementById('dashboard-alerts-banner');
  if (alertContainer) {
    if (emergencyWorkOrders > 0 || breakdownAssets > 0 || lowStockCount > 0) {
      alertContainer.style.display = 'block';
      alertContainer.innerHTML = `
        <div class="alert-banner alert-warning-glass">
          <div class="alert-icon"><i data-lucide="alert-triangle"></i></div>
          <div class="alert-content">
            <strong>Peringatan Sistem:</strong> 
            ${breakdownAssets > 0 ? `Terdapat <b>${breakdownAssets} Aset dalam kondisi Breakdown</b>.` : ''}
            ${emergencyWorkOrders > 0 ? ` <b>${emergencyWorkOrders} Work Order berprioritas Darurat</b> membutuhkan tindakan segera.` : ''}
            ${lowStockCount > 0 ? ` <b>${lowStockCount} suku cadang</b> berada di bawah batas stok minimum.` : ''}
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="window.navigateTo('workorders')">Tinjau WO</button>
        </div>
      `;
    } else {
      alertContainer.style.display = 'none';
    }
  }

  // Render Recent Work Orders Table preview
  renderRecentWorkOrders(workOrders);

  // Render Charts
  initCharts(workOrders, assets);

  if (window.lucide) window.lucide.createIcons();
}

function renderRecentWorkOrders(workOrders) {
  const tableBody = document.getElementById('dashboard-recent-wo-table');
  if (!tableBody) return;

  const sortedWOs = [...workOrders].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).slice(0, 5);

  tableBody.innerHTML = sortedWOs.map(wo => {
    const priorityClasses = {
      'Darurat': 'status-pill status-red',
      'Tinggi': 'status-pill status-orange',
      'Sedang': 'status-pill status-blue',
      'Rendah': 'status-pill status-gray'
    };

    const statusClasses = {
      'Draft': 'badge-gray',
      'Disetujui': 'badge-info',
      'Dalam Proses': 'badge-warning',
      'Menunggu Part': 'badge-purple',
      'Selesai': 'badge-success',
      'Dibatalkan': 'badge-danger'
    };

    return `
      <tr>
        <td><strong>${wo.id}</strong></td>
        <td>
          <div class="font-medium">${wo.title}</div>
          <small class="text-muted">${wo.assetName}</small>
        </td>
        <td><span class="${priorityClasses[wo.priority] || ''}">${wo.priority}</span></td>
        <td><span class="badge ${statusClasses[wo.status] || ''}">${wo.status}</span></td>
        <td>${wo.assignedTech || '-'}</td>
        <td>${formatDate(wo.createdDate)}</td>
      </tr>
    `;
  }).join('');
}

function initCharts(workOrders, assets) {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Work Order Status Distribution
  const ctxStatus = document.getElementById('chartWOStatus');
  if (ctxStatus) {
    if (woStatusChart) woStatusChart.destroy();

    const statusCounts = {
      'Disetujui': 0,
      'Dalam Proses': 0,
      'Menunggu Part': 0,
      'Selesai': 0,
      'Dibatalkan': 0
    };

    workOrders.forEach(w => {
      if (statusCounts[w.status] !== undefined) statusCounts[w.status]++;
    });

    woStatusChart = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: 'var(--text-color)', font: { family: 'Outfit' } } }
        }
      }
    });
  }

  // Chart 2: Asset Condition Breakdown
  const ctxCondition = document.getElementById('chartAssetCondition');
  if (ctxCondition) {
    if (assetConditionChart) assetConditionChart.destroy();

    const conditionCounts = {
      'Operasional': 0,
      'Maintenance': 0,
      'Standby': 0,
      'Breakdown': 0
    };

    assets.forEach(a => {
      if (conditionCounts[a.status] !== undefined) conditionCounts[a.status]++;
    });

    assetConditionChart = new Chart(ctxCondition, {
      type: 'pie',
      data: {
        labels: Object.keys(conditionCounts),
        datasets: [{
          data: Object.values(conditionCounts),
          backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: 'var(--text-color)', font: { family: 'Outfit' } } }
        }
      }
    });
  }

  // Chart 3: Monthly Maintenance Expense Trend
  const ctxCost = document.getElementById('chartMaintenanceCost');
  if (ctxCost) {
    if (costTrendChart) costTrendChart.destroy();

    costTrendChart = new Chart(ctxCost, {
      type: 'bar',
      data: {
        labels: ['Mei 2026', 'Jun 2026', 'Jul 2026', 'Agu 2026 (Est)'],
        datasets: [
          {
            label: 'Biaya Spare Parts (IDR)',
            data: [3500000, 2800000, 4250000, 5800000],
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            borderRadius: 6
          },
          {
            label: 'Biaya Jasa / Service (IDR)',
            data: [1200000, 1500000, 2100000, 1850000],
            backgroundColor: 'rgba(245, 158, 11, 0.85)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: 'var(--text-muted)' }, grid: { display: false } },
          y: { 
            ticks: { 
              color: 'var(--text-muted)',
              callback: value => 'Rp ' + (value / 1000000) + ' Jt'
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { color: 'var(--text-color)', font: { family: 'Outfit' } } }
        }
      }
    });
  }
}

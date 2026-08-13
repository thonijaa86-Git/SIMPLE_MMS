/**
 * Reports & Data Export Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, formatDate, exportToCSV, showToast } from '../utils/helpers.js';

export function renderReports() {
  const container = document.getElementById('reports-content-container');
  if (!container) return;

  const assets = StorageManager.getAssets();
  const workOrders = StorageManager.getWorkOrders();
  const pmSchedules = StorageManager.getPMSchedules();
  const inventory = StorageManager.getInventory();

  // Summary Metrics
  const totalCompletedWO = workOrders.filter(w => w.status === 'Selesai').length;
  const totalWOCost = workOrders.reduce((sum, w) => sum + (w.totalCost || 0), 0);
  const totalInventoryValuation = inventory.reduce((sum, i) => sum + (i.stock * i.unitPrice), 0);

  // Breakdown by Category
  const categoryStats = {};
  assets.forEach(a => {
    if (!categoryStats[a.category]) {
      categoryStats[a.category] = { count: 0, breakdownCount: 0 };
    }
    categoryStats[a.category].count++;
    if (a.status === 'Breakdown') categoryStats[a.category].breakdownCount++;
  });

  // Technician performance breakdown
  const techPerformance = {};
  workOrders.forEach(w => {
    const tech = w.assignedTech || 'Unassigned';
    if (!techPerformance[tech]) {
      techPerformance[tech] = { total: 0, completed: 0, totalHours: 0 };
    }
    techPerformance[tech].total++;
    if (w.status === 'Selesai') techPerformance[tech].completed++;
    techPerformance[tech].totalHours += (w.actualHours || 0);
  });

  container.innerHTML = `
    <div class="reports-header-grid margin-bottom-20">
      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-green"><i data-lucide="check-circle-2"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">WO Terselesaikan</div>
          <div class="kpi-value">${totalCompletedWO} <span class="kpi-sub">SPK</span></div>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-purple"><i data-lucide="dollar-sign"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Total Realisasi Biaya WO</div>
          <div class="kpi-value">${formatIDR(totalWOCost)}</div>
        </div>
      </div>
      <div class="kpi-card glass-card">
        <div class="kpi-icon icon-blue"><i data-lucide="package"></i></div>
        <div class="kpi-details">
          <div class="kpi-label">Valuasi Stok Spare Part</div>
          <div class="kpi-value">${formatIDR(totalInventoryValuation)}</div>
        </div>
      </div>
    </div>

    <!-- Quick Export Actions Bar -->
    <div class="glass-card padding-20 margin-bottom-20">
      <h3><i data-lucide="download"></i> Ekspor Laporan Data (CSV)</h3>
      <p class="text-muted">Unduh file spreadsheet CSV untuk analisis lebih lanjut di Excel atau Google Sheets.</p>
      <div class="btn-group margin-top-15">
        <button class="btn btn-primary" onclick="window.exportAssetsCSV()">
          <i data-lucide="file-spreadsheet"></i> Ekspor Data Aset
        </button>
        <button class="btn btn-success" onclick="window.exportWorkOrdersCSV()">
          <i data-lucide="file-spreadsheet"></i> Ekspor Data Work Order
        </button>
        <button class="btn btn-warning" onclick="window.exportInventoryCSV()">
          <i data-lucide="file-spreadsheet"></i> Ekspor Data Spare Parts
        </button>
      </div>
    </div>

    <!-- Technical Workload Table -->
    <div class="glass-card padding-20 margin-bottom-20">
      <h3><i data-lucide="users"></i> Rekap Performa & Beban Kerja Teknisi</h3>
      <div class="table-responsive margin-top-15">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>NO</th>
              <th>Teknisi / Staff</th>
              <th>Total WO Ditugaskan</th>
              <th>WO Selesai</th>
              <th>Persentase Selesai</th>
              <th>Total Jam Kerja (Labor Hours)</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(techPerformance).map((tech, index) => {
              const stats = techPerformance[tech];
              const pct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
              return `
                <tr>
                  <td><strong>${index + 1}</strong></td>
                  <td><strong>${tech}</strong></td>
                  <td>${stats.total} WO</td>
                  <td><span class="badge badge-success">${stats.completed}</span></td>
                  <td>
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" style="width: ${pct}%"></div>
                    </div>
                    <small>${pct}%</small>
                  </td>
                  <td>${stats.totalHours} Jam</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Backup & System Maintenance -->
    <div class="glass-card padding-20">
      <h3><i data-lucide="database"></i> Cadangan Data & Restorasi Sistem</h3>
      <p class="text-muted">Kelola data cadangan (JSON) atau atur ulang aplikasi ke data sampel default awal.</p>
      <div class="btn-group margin-top-15">
        <button class="btn btn-outline-primary" onclick="window.backupJSON()">
          <i data-lucide="database-backup"></i> Backup Cadangan JSON
        </button>
        <button class="btn btn-outline-danger" onclick="window.resetSystemData()">
          <i data-lucide="rotate-ccw"></i> Reset & Seed Data Sampel
        </button>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

window.exportAssetsCSV = function() {
  const assets = StorageManager.getAssets();
  exportToCSV('MMS_Data_Aset', assets);
};

window.exportWorkOrdersCSV = function() {
  const wos = StorageManager.getWorkOrders();
  exportToCSV('MMS_Data_WorkOrders', wos);
};

window.exportInventoryCSV = function() {
  const inv = StorageManager.getInventory();
  exportToCSV('MMS_Data_SpareParts', inv);
};

window.backupJSON = function() {
  const backupObj = {
    assets: StorageManager.getAssets(),
    workOrders: StorageManager.getWorkOrders(),
    pmSchedules: StorageManager.getPMSchedules(),
    inspections: StorageManager.getInspections(),
    inventory: StorageManager.getInventory(),
    exportDate: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `MMS_Full_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast('Backup data JSON berhasil diunduh!', 'success');
};

window.resetSystemData = function() {
  if (!confirm('Apakah Anda yakin ingin mereset seluruh data aplikasi kembali ke sampel default awal? Data perubahan Anda saat ini akan ditimpa.')) return;

  StorageManager.resetToDefault();
  showToast('Data sistem berhasil di-reset ke sampel default!', 'success');

  // Reload current view
  if (window.navigateTo) window.navigateTo('dashboard');
};

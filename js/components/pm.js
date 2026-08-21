/**
 * Preventive Maintenance (PM) Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatDate, showToast, generateID } from '../utils/helpers.js';

export function renderPM() {
  const container = document.getElementById('pm-list-container');
  if (!container) return;

  const pmSchedules = StorageManager.getPMSchedules();
  const assets = StorageManager.getAssets();

  populateAssetSelectPM(assets);

  if (pmSchedules.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="calendar-off"></i>
        <h3>Belum ada Jadwal Preventive Maintenance</h3>
        <p>Buat jadwal rutin untuk mencegah breakdown mesin.</p>
        <button class="btn btn-primary" onclick="window.openPMModal()">
          <i data-lucide="plus"></i> Tambah Jadwal PM
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const statusPills = {
    'Normal': 'badge-success',
    'Jatuh Tempo': 'badge-warning',
    'Overdue': 'badge-danger'
  };

  container.innerHTML = `
    <div class="table-responsive glass-card padding-0">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="col-no">NO</th>
            <th class="col-id">Kode PM</th>
            <th class="col-title">Judul Pemeliharaan</th>
            <th class="col-asset">Aset</th>
            <th class="col-type">Frekuensi</th>
            <th class="col-date multiline-header">Terakhir<br>Dikerjakan</th>
            <th class="col-date multiline-header">Jadwal<br>Berikutnya</th>
            <th class="col-status">Status</th>
            <th class="col-tech">Teknisi</th>
            <th class="col-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${pmSchedules.map((pm, index) => `
            <tr>
              <td class="col-no"><strong>${index + 1}</strong></td>
              <td class="col-id"><strong>${pm.id}</strong></td>
              <td class="col-title">
                <div class="font-medium">${pm.title}</div>
                <small class="text-muted">${pm.checklist ? pm.checklist.length + ' Poin Checklist' : ''}</small>
              </td>
              <td class="col-asset">${pm.assetName}</td>
              <td class="col-type"><span class="badge badge-outline">${pm.frequency}</span></td>
              <td class="col-date">${formatDate(pm.lastCompleted)}</td>
              <td class="col-date"><strong>${formatDate(pm.nextDueDate)}</strong></td>
              <td class="col-status"><span class="badge ${statusPills[pm.status] || 'badge-gray'}">${pm.status}</span></td>
              <td class="col-tech">${pm.assignedTech}</td>
              <td class="col-actions">
                <div class="btn-group" style="justify-content: flex-end;">
                  <button class="btn btn-icon btn-sm btn-primary" title="Generate WO Otomatis" onclick="window.triggerWOFromPM('${pm.id}')">
                    <i data-lucide="play-circle"></i>
                  </button>
                  <button class="btn btn-icon btn-sm btn-outline-danger" title="Hapus Jadwal" onclick="window.deletePM('${pm.id}')">
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

  if (window.lucide) window.lucide.createIcons();
}

function populateAssetSelectPM(assets) {
  const select = document.getElementById('pm-form-asset');
  if (!select || select.children.length > 1) return;

  assets.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.id} - ${a.name}`;
    select.appendChild(opt);
  });
}

window.openPMModal = function() {
  const modal = document.getElementById('modal-pm-form');
  const form = document.getElementById('form-pm');
  if (!modal || !form) return;

  form.reset();
  modal.classList.add('active');
};

window.savePMForm = function(e) {
  if (e) e.preventDefault();

  const title = document.getElementById('pm-form-title').value.trim();
  const assetId = document.getElementById('pm-form-asset').value;
  const frequency = document.getElementById('pm-form-frequency').value;
  const nextDueDate = document.getElementById('pm-form-next-date').value;
  const assignedTech = document.getElementById('pm-form-tech').value.trim();
  const checklistRaw = document.getElementById('pm-form-checklist').value.trim();

  if (!title || !assetId || !nextDueDate) {
    showToast('Harap isi Judul, Aset, dan Tanggal Jatuh Tempo.', 'warning');
    return;
  }

  const assets = StorageManager.getAssets();
  const asset = assets.find(a => a.id === assetId);

  const checklist = checklistRaw ? checklistRaw.split('\n').filter(line => line.trim()) : ['Pemeriksaan visual kondisi fisik'];

  const pms = StorageManager.getPMSchedules();
  const newPM = {
    id: generateID('PM-SCH'),
    title,
    assetId,
    assetName: asset ? asset.name : 'Unknown Asset',
    frequency,
    intervalDays: frequency === 'Harian' ? 1 : frequency === 'Mingguan' ? 7 : frequency === 'Bulanan' ? 30 : 90,
    lastCompleted: new Date().toISOString().slice(0, 10),
    nextDueDate,
    status: 'Normal',
    assignedTech: assignedTech || 'Mekanik Shift',
    checklist
  };

  pms.unshift(newPM);
  StorageManager.savePMSchedules(pms);

  showToast(`Jadwal PM ${newPM.id} berhasil ditambahkan!`, 'success');
  document.getElementById('modal-pm-form').classList.remove('active');
  renderPM();
};

window.triggerWOFromPM = function(pmId) {
  const pmSchedules = StorageManager.getPMSchedules();
  const pm = pmSchedules.find(p => p.id === pmId);

  if (!pm) return;

  const wos = StorageManager.getWorkOrders();

  const newWO = {
    id: generateID('WO-' + new Date().getFullYear() + '-'),
    title: `[PM Auto-Gen] ${pm.title}`,
    assetId: pm.assetId,
    assetName: pm.assetName,
    type: 'Preventive',
    priority: 'Sedang',
    status: 'Disetujui',
    assignedTech: pm.assignedTech,
    createdDate: new Date().toISOString(),
    targetDate: new Date(Date.now() + 48*60*60*1000).toISOString(),
    completedDate: null,
    problemDescription: `Jadwal Preventive Maintenance Rutin (${pm.frequency}). Checklist:\n` + pm.checklist.map(c => `- ${c}`).join('\n'),
    resolutionNotes: '',
    estimatedHours: 4,
    actualHours: 0,
    partsUsed: [],
    totalCost: 0
  };

  wos.unshift(newWO);
  StorageManager.saveWorkOrders(wos);

  // Update PM last completed date
  pm.lastCompleted = new Date().toISOString().slice(0, 10);
  StorageManager.savePMSchedules(pmSchedules);

  showToast(`Work Order ${newWO.id} berhasil diterbitkan dari PM Schedule!`, 'success');
};

window.deletePM = function(pmId) {
  if (!confirm(`Hapus Jadwal PM ${pmId}?`)) return;

  let pms = StorageManager.getPMSchedules();
  pms = pms.filter(p => p.id !== pmId);

  StorageManager.savePMSchedules(pms);
  StorageManager.deleteFromSupabase('pm_schedules', pmId);
  showToast(`Jadwal PM ${pmId} berhasil dihapus`, 'success');
  renderPM();
};

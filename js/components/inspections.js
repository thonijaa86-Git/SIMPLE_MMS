/**
 * Inspection & Checklist Execution Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatDate, formatDateTime, showToast, generateID } from '../utils/helpers.js';

export function renderInspections() {
  const container = document.getElementById('inspections-list-container');
  if (!container) return;

  const inspections = StorageManager.getInspections();
  const assets = StorageManager.getAssets();

  populateAssetSelectInspection(assets);

  if (inspections.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="clipboard-x"></i>
        <h3>Belum Ada Log Inspeksi</h3>
        <p>Lakukan inspeksi rutin peralatan untuk mencegah potensi kegagalan.</p>
        <button class="btn btn-primary" onclick="window.openInspectionModal()">
          <i data-lucide="plus"></i> Eksekusi Inspeksi Baru
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="table-responsive glass-card padding-0">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="col-no">NO</th>
            <th class="col-id">Kode Inspeksi</th>
            <th class="col-title">Judul Inspeksi</th>
            <th class="col-asset">Aset / Peralatan</th>
            <th class="col-inspector">Inspektur</th>
            <th class="col-date">Tanggal</th>
            <th class="col-number">Meter Reading</th>
            <th class="col-status">Hasil Akhir</th>
            <th class="col-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${inspections.map((insp, index) => `
            <tr>
              <td class="col-no"><strong>${index + 1}</strong></td>
              <td class="col-id"><strong>${insp.id}</strong></td>
              <td class="col-title">${insp.title}</td>
              <td class="col-asset">${insp.assetName}</td>
              <td class="col-inspector">${insp.inspector}</td>
              <td class="col-date">${formatDateTime(insp.date)}</td>
              <td class="col-number">${insp.meterReading || '-'}</td>
              <td class="col-status">
                <span class="badge ${insp.overallResult === 'Lulus' ? 'badge-success' : 'badge-danger'}">
                  ${insp.overallResult === 'Lulus' ? '✓ LULUS' : '✗ GAGAL'}
                </span>
              </td>
              <td class="col-actions">
                <div class="btn-group" style="justify-content: flex-end;">
                  <button class="btn btn-icon btn-sm btn-outline-primary" title="Lihat Detail Inspeksi" onclick="window.viewInspectionDetail('${insp.id}')">
                    <i data-lucide="eye"></i>
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

function populateAssetSelectInspection(assets) {
  const select = document.getElementById('insp-form-asset');
  if (!select || select.children.length > 1) return;

  assets.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.id} - ${a.name}`;
    select.appendChild(opt);
  });
}

window.openInspectionModal = function() {
  const modal = document.getElementById('modal-insp-form');
  const form = document.getElementById('form-insp');
  if (!modal || !form) return;

  form.reset();
  
  // Render sample checklist rows
  const checklistBox = document.getElementById('insp-checklist-rows');
  checklistBox.innerHTML = `
    <div class="insp-item-row">
      <input type="text" class="form-control" value="Kondisi Fisik & Kebersihan Unit" placeholder="Poin inspeksi..." required />
      <select class="form-control insp-status-select">
        <option value="Pass">✓ Pass</option>
        <option value="Warning">⚠ Warning</option>
        <option value="Fail">✗ Fail</option>
      </select>
      <input type="text" class="form-control" placeholder="Catatan inspektur..." />
    </div>
    <div class="insp-item-row">
      <input type="text" class="form-control" value="Sistem Kelistrikan & Sensor Safety" placeholder="Poin inspeksi..." required />
      <select class="form-control insp-status-select">
        <option value="Pass">✓ Pass</option>
        <option value="Warning">⚠ Warning</option>
        <option value="Fail">✗ Fail</option>
      </select>
      <input type="text" class="form-control" placeholder="Catatan inspektur..." />
    </div>
    <div class="insp-item-row">
      <input type="text" class="form-control" value="Kebocoran Oli / Fluida / Tekanan" placeholder="Poin inspeksi..." required />
      <select class="form-control insp-status-select">
        <option value="Pass">✓ Pass</option>
        <option value="Warning">⚠ Warning</option>
        <option value="Fail">✗ Fail</option>
      </select>
      <input type="text" class="form-control" placeholder="Catatan inspektur..." />
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.addChecklistRow = function() {
  const checklistBox = document.getElementById('insp-checklist-rows');
  const div = document.createElement('div');
  div.className = 'insp-item-row';
  div.innerHTML = `
    <input type="text" class="form-control" placeholder="Poin inspeksi..." required />
    <select class="form-control insp-status-select">
      <option value="Pass">✓ Pass</option>
      <option value="Warning">⚠ Warning</option>
      <option value="Fail">✗ Fail</option>
    </select>
    <input type="text" class="form-control" placeholder="Catatan inspektur..." />
    <button type="button" class="btn btn-sm btn-icon btn-outline-danger" onclick="this.parentElement.remove()">&times;</button>
  `;
  checklistBox.appendChild(div);
};

window.saveInspectionForm = function(e) {
  if (e) e.preventDefault();

  const title = document.getElementById('insp-form-title').value.trim();
  const assetId = document.getElementById('insp-form-asset').value;
  const inspector = document.getElementById('insp-form-inspector').value.trim();
  const meterReading = document.getElementById('insp-form-meter').value.trim();

  if (!title || !assetId || !inspector) {
    showToast('Harap isi Judul, Aset, dan Nama Inspektur.', 'warning');
    return;
  }

  const rows = document.querySelectorAll('#insp-checklist-rows .insp-item-row');
  let hasFail = false;
  const checklistItems = [];

  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const select = row.querySelector('select');
    const item = inputs[0].value.trim();
    const status = select.value;
    const notes = inputs[1] ? inputs[1].value.trim() : '';

    if (status === 'Fail') hasFail = true;
    if (item) {
      checklistItems.push({ item, status, notes });
    }
  });

  const assets = StorageManager.getAssets();
  const asset = assets.find(a => a.id === assetId);

  const inspections = StorageManager.getInspections();
  const newInsp = {
    id: generateID('INSP-' + new Date().getFullYear() + '-'),
    title,
    assetId,
    assetName: asset ? asset.name : 'Unknown Asset',
    inspector,
    date: new Date().toISOString(),
    overallResult: hasFail ? 'Gagal' : 'Lulus',
    checklistItems,
    meterReading
  };

  inspections.unshift(newInsp);
  StorageManager.saveInspections(inspections);

  // If inspection failed, auto create breakdown work order!
  if (hasFail) {
    const wos = StorageManager.getWorkOrders();
    const failedItemsText = checklistItems.filter(i => i.status === 'Fail').map(i => `- ${i.item} (${i.notes || 'Gagal inspeksi'})`).join('\n');

    const newWO = {
      id: generateID('WO-' + new Date().getFullYear() + '-'),
      title: `[Inspeksi Gagal] Perbaikan ${title}`,
      assetId,
      assetName: asset ? asset.name : 'Unknown Asset',
      type: 'Corrective',
      priority: 'Darurat',
      status: 'Disetujui',
      assignedTech: inspector,
      createdDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
      completedDate: null,
      problemDescription: `Otomatis diterbitkan dari Hasil Inspeksi GAGAL ${newInsp.id}.\nDetail Poin Gagal:\n${failedItemsText}`,
      resolutionNotes: '',
      estimatedHours: 4,
      actualHours: 0,
      partsUsed: [],
      totalCost: 0
    };
    wos.unshift(newWO);
    StorageManager.saveWorkOrders(wos);

    // Update asset status to Breakdown if needed
    if (asset) {
      asset.status = 'Breakdown';
      StorageManager.saveAssets(assets);
    }

    showToast(`Inspeksi GAGAL! Work Order Darurat ${newWO.id} otomatis dibuat.`, 'error');
  } else {
    showToast(`Inspeksi LULUS dan tersimpan!`, 'success');
  }

  document.getElementById('modal-insp-form').classList.remove('active');
  renderInspections();
};

window.viewInspectionDetail = function(inspId) {
  const inspections = StorageManager.getInspections();
  const insp = inspections.find(i => i.id === inspId);
  if (!insp) return;

  const modal = document.getElementById('modal-insp-detail');
  const body = document.getElementById('insp-detail-body');

  body.innerHTML = `
    <div class="margin-bottom-15">
      <span class="badge ${insp.overallResult === 'Lulus' ? 'badge-success' : 'badge-danger'} font-large">
        HASIL: ${insp.overallResult.toUpperCase()}
      </span>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><label>Kode Inspeksi</label><div>${insp.id}</div></div>
      <div class="detail-item"><label>Aset</label><div>${insp.assetName} (${insp.assetId})</div></div>
      <div class="detail-item"><label>Inspektur</label><div>${insp.inspector}</div></div>
      <div class="detail-item"><label>Waktu Inspeksi</label><div>${formatDateTime(insp.date)}</div></div>
    </div>

    <h4 class="margin-top-20">Detail Item Checklist</h4>
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>NO</th>
            <th>Item Checklist</th>
            <th>Status</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          ${insp.checklistItems.map((item, index) => `
            <tr>
              <td><strong>${index + 1}</strong></td>
              <td>${item.item}</td>
              <td>
                <span class="badge ${item.status === 'Pass' ? 'badge-success' : item.status === 'Warning' ? 'badge-warning' : 'badge-danger'}">
                  ${item.status}
                </span>
              </td>
              <td>${item.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

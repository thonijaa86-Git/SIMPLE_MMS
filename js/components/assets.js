/**
 * Asset Management Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, formatDate, showToast, generateID } from '../utils/helpers.js';

let currentSearchTerm = '';
let currentCategoryFilter = '';
let currentLocationFilter = '';

export function renderAssets() {
  const container = document.getElementById('assets-list-container');
  if (!container) return;

  const assets = StorageManager.getAssets();

  // Populate filter dropdown options
  populateFilterDropdowns(assets);

  // Apply filters
  let filtered = assets.filter(asset => {
    if (currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();
      const match = asset.name.toLowerCase().includes(term) ||
                    asset.id.toLowerCase().includes(term) ||
                    asset.category.toLowerCase().includes(term) ||
                    asset.status.toLowerCase().includes(term) ||
                    asset.location.toLowerCase().includes(term) ||
                    (asset.serialNumber && asset.serialNumber.toLowerCase().includes(term));
      if (!match) return false;
    }
    if (currentCategoryFilter && asset.category !== currentCategoryFilter) {
      return false;
    }
    if (currentLocationFilter && asset.location !== currentLocationFilter) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <i data-lucide="box-select"></i>
        <h3>Tidak ada aset yang ditemukan</h3>
        <p>Coba sesuaikan kata kunci pencarian atau filter Kategori & Lokasi.</p>
        <button class="btn btn-primary" onclick="window.openAssetModal()">
          <i data-lucide="plus"></i> Tambah Aset Baru
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
            <th class="col-id">NO ASET</th>
            <th class="col-main">NAMA ASET</th>
            <th class="col-category">KATEGORI</th>
            <th class="col-asset">LOKASI</th>
            <th class="col-main">SPESIFIKASI</th>
            <th class="col-date">THN BUAT</th>
            <th class="col-date multiline-header">THN<br>INSTALASI</th>
            <th class="col-actions">AKSI</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((asset, index) => {
            const yearMade = asset.yearMade || (asset.purchaseDate ? asset.purchaseDate.slice(0, 4) : '2021');
            const yearInstalled = asset.installationYear || yearMade;

            return `
              <tr>
                <td class="col-no"><strong>${index + 1}</strong></td>
                <td class="col-id"><strong style="color: var(--primary-color);">${asset.id}</strong></td>
                <td class="col-main"><div style="font-weight: 600;">${asset.name}</div></td>
                <td class="col-category"><span class="badge badge-gray">${asset.category}</span></td>
                <td class="col-asset"><small><i data-lucide="map-pin"></i> ${asset.location}</small></td>
                <td class="col-main"><small style="color: var(--text-muted);">${asset.specifications || asset.manufacturer || (asset.serialNumber ? 'SN: ' + asset.serialNumber : '-')}</small></td>
                <td class="col-date"><small>${yearMade}</small></td>
                <td class="col-date"><small>${yearInstalled}</small></td>
                <td class="col-actions">
                  <div class="btn-group" style="justify-content: flex-end;">
                    <button class="btn btn-icon btn-sm btn-outline-secondary" title="Edit Aset" onclick="window.openAssetModal('${asset.id}')">
                      <i data-lucide="edit"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-danger" title="Hapus Aset" onclick="window.deleteAsset('${asset.id}')">
                      <i data-lucide="trash-2"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function populateFilterDropdowns(assets) {
  const catSelect = document.getElementById('asset-filter-category');
  const locSelect = document.getElementById('asset-filter-location');

  if (catSelect && catSelect.options.length <= 1) {
    const categories = Array.from(new Set(assets.map(a => a.category).filter(Boolean))).sort();
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
  }

  if (locSelect && locSelect.options.length <= 1) {
    const locations = Array.from(new Set(assets.map(a => a.location).filter(Boolean))).sort();
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      locSelect.appendChild(opt);
    });
  }
}

// Bind Filter Listeners
export function setupAssetListeners() {
  const searchInput = document.getElementById('asset-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderAssets();
    });
  }

  const catSelect = document.getElementById('asset-filter-category');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      renderAssets();
    });
  }

  const locSelect = document.getElementById('asset-filter-location');
  if (locSelect) {
    locSelect.addEventListener('change', (e) => {
      currentLocationFilter = e.target.value;
      renderAssets();
    });
  }
}

// Modal Handlers
window.openAssetModal = function (assetId = null) {
  const modal = document.getElementById('modal-asset-form');
  const titleEl = document.getElementById('modal-asset-title');
  const form = document.getElementById('form-asset');

  if (!modal || !form) return;

  form.reset();

  if (assetId) {
    titleEl.textContent = 'Edit Data Aset';
    const assets = StorageManager.getAssets();
    const asset = assets.find(a => a.id === assetId);

    if (asset) {
      document.getElementById('asset-form-id').value = asset.id;
      if (document.getElementById('asset-form-no-aset')) {
        document.getElementById('asset-form-no-aset').value = asset.id;
      }
      document.getElementById('asset-form-location').value = asset.location || '';
      
      const catSelect = document.getElementById('asset-form-category');
      if (catSelect && asset.category) {
        const optExists = Array.from(catSelect.options).some(opt => opt.value === asset.category);
        if (!optExists) {
          const opt = document.createElement('option');
          opt.value = asset.category;
          opt.textContent = asset.category;
          catSelect.appendChild(opt);
        }
        catSelect.value = asset.category;
      }
      
      document.getElementById('asset-form-name').value = asset.name || '';
      if (document.getElementById('asset-form-year-made')) {
        document.getElementById('asset-form-year-made').value = asset.yearMade || (asset.purchaseDate ? asset.purchaseDate.slice(0, 4) : '');
      }
      if (document.getElementById('asset-form-installation-year')) {
        document.getElementById('asset-form-installation-year').value = asset.installationYear || (asset.purchaseDate ? asset.purchaseDate.slice(0, 4) : '');
      }
      document.getElementById('asset-form-specs').value = asset.specifications || '';
    }
  } else {
    titleEl.textContent = 'Tambah Aset Baru';
    document.getElementById('asset-form-id').value = '';
    if (document.getElementById('asset-form-no-aset')) {
      document.getElementById('asset-form-no-aset').value = generateID('AST');
    }
    if (document.getElementById('asset-form-year-made')) {
      document.getElementById('asset-form-year-made').value = new Date().getFullYear();
    }
    if (document.getElementById('asset-form-installation-year')) {
      document.getElementById('asset-form-installation-year').value = new Date().getFullYear();
    }
  }

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.saveAssetForm = function (e) {
  if (e) e.preventDefault();

  const id = document.getElementById('asset-form-id').value;
  const customNoAset = document.getElementById('asset-form-no-aset')?.value.trim();
  const location = document.getElementById('asset-form-location').value.trim();
  const category = document.getElementById('asset-form-category').value;
  const name = document.getElementById('asset-form-name').value.trim();
  const yearMade = parseInt(document.getElementById('asset-form-year-made')?.value) || new Date().getFullYear();
  const installationYear = parseInt(document.getElementById('asset-form-installation-year')?.value) || yearMade;
  const specifications = document.getElementById('asset-form-specs').value.trim();

  if (!name || !category || !location) {
    showToast('Harap isi bidang Nama Aset, Kategori, dan Lokasi.', 'warning');
    return;
  }

  let assets = StorageManager.getAssets();

  if (id) {
    // Update
    assets = assets.map(a => {
      if (a.id === id) {
        return {
          ...a,
          name, category, location, yearMade, installationYear, specifications
        };
      }
      return a;
    });
    showToast(`Aset ${id} berhasil diperbarui`, 'success');
  } else {
    // Insert
    const newAssetId = customNoAset || generateID('AST');
    const newAsset = {
      id: newAssetId,
      name, category, location,
      status: 'Operasional',
      criticality: 'Sedang',
      yearMade, installationYear, specifications,
      lastMaintenance: new Date().toISOString().slice(0, 10),
      nextPMDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
    };
    assets.unshift(newAsset);
    showToast(`Aset baru ${newAsset.id} berhasil ditambahkan`, 'success');
  }

  StorageManager.saveAssets(assets);
  document.getElementById('modal-asset-form').classList.remove('active');
  renderAssets();
};

window.viewAssetDetail = function (assetId) {
  const assets = StorageManager.getAssets();
  const workOrders = StorageManager.getWorkOrders();
  const asset = assets.find(a => a.id === assetId);

  if (!asset) return;

  const modal = document.getElementById('modal-asset-detail');
  const container = document.getElementById('asset-detail-content');

  const assetWOs = workOrders.filter(w => w.assetId === asset.id);

  container.innerHTML = `
    <div class="asset-detail-header">
      <div class="asset-detail-img" style="background-image: url('${asset.image}')"></div>
      <div class="asset-detail-title-section">
        <div class="badge badge-info">${asset.id}</div>
        <h2>${asset.name}</h2>
        <div class="asset-detail-tags">
          <span class="status-pill status-blue"><i data-lucide="folder"></i> ${asset.category}</span>
          <span class="status-pill status-gray"><i data-lucide="map-pin"></i> ${asset.location}</span>
          <span class="badge ${asset.status === 'Operasional' ? 'badge-success' : 'badge-danger'}">${asset.status}</span>
        </div>
      </div>
    </div>

    <div class="detail-grid margin-top-20">
      <div class="detail-item">
        <label>Nomor Seri / S/N</label>
        <div>${asset.serialNumber || '-'}</div>
      </div>
      <div class="detail-item">
        <label>Produsen / Merk</label>
        <div>${asset.manufacturer || '-'}</div>
      </div>
      <div class="detail-item">
        <label>Tingkat Kritikalitas</label>
        <div>${asset.criticality}</div>
      </div>
      <div class="detail-item">
        <label>Harga Perolehan</label>
        <div>${formatIDR(asset.purchaseCost)}</div>
      </div>
      <div class="detail-item">
        <label>Tanggal Pembelian</label>
        <div>${formatDate(asset.purchaseDate)}</div>
      </div>
      <div class="detail-item">
        <label>Next PM Due</label>
        <div><strong>${formatDate(asset.nextPMDate)}</strong></div>
      </div>
    </div>

    <div class="margin-top-20">
      <label class="form-label">Spesifikasi Teknis:</label>
      <div class="specs-box">${asset.specifications || 'Tidak ada spesifikasi khusus.'}</div>
    </div>

    <div class="margin-top-20">
      <h3>Riwayat Work Order Terkait (${assetWOs.length})</h3>
      <div class="table-responsive margin-top-10">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>NO</th>
              <th>No. WO</th>
              <th>Judul</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            ${assetWOs.length ? assetWOs.map((w, index) => `
              <tr>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${w.id}</strong></td>
                <td>${w.title}</td>
                <td>${w.type}</td>
                <td><span class="badge badge-info">${w.status}</span></td>
                <td>${formatDate(w.createdDate)}</td>
              </tr>
            `).join('') : '<tr><td colspan="5" class="text-center text-muted">Belum ada riwayat Work Order</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.deleteAsset = function (assetId) {
  if (!confirm(`Apakah Anda yakin ingin menghapus aset ${assetId}?`)) return;

  let assets = StorageManager.getAssets();
  assets = assets.filter(a => a.id !== assetId);

  StorageManager.saveAssets(assets);
  StorageManager.deleteFromSupabase('assets', assetId);

  showToast(`Aset ${assetId} berhasil dihapus`, 'success');
  renderAssets();
};

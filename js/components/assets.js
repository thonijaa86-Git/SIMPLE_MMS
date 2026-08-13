/**
 * Asset Management Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, formatDate, showToast, generateID } from '../utils/helpers.js';

let currentFilterCategory = 'ALL';
let currentFilterStatus = 'ALL';
let currentSearchTerm = '';

export function renderAssets() {
  const container = document.getElementById('assets-list-container');
  if (!container) return;

  const assets = StorageManager.getAssets();
  const workOrders = StorageManager.getWorkOrders();

  // Populate Filter Dropdowns if empty
  populateCategories(assets);

  // Apply filters
  let filtered = assets.filter(asset => {
    const matchCategory = currentFilterCategory === 'ALL' || asset.category === currentFilterCategory;
    const matchStatus = currentFilterStatus === 'ALL' || asset.status === currentFilterStatus;
    const matchSearch = !currentSearchTerm || 
      asset.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(currentSearchTerm.toLowerCase()));

    return matchCategory && matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="box-select"></i>
        <h3>Tidak ada aset yang ditemukan</h3>
        <p>Coba ubah kata kunci pencarian atau filter yang diterapkan.</p>
        <button class="btn btn-primary" onclick="window.openAssetModal()">
          <i data-lucide="plus"></i> Tambah Aset Baru
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const statusBadgeClasses = {
    'Operasional': 'badge-success',
    'Maintenance': 'badge-warning',
    'Standby': 'badge-info',
    'Breakdown': 'badge-danger'
  };

  const criticalityClasses = {
    'Tinggi': 'status-pill status-red',
    'Sedang': 'status-pill status-orange',
    'Rendah': 'status-pill status-gray'
  };

  container.innerHTML = `
    <div class="assets-grid">
      ${filtered.map(asset => {
        const activeWO = workOrders.filter(w => w.assetId === asset.id && w.status !== 'Selesai').length;
        
        return `
          <div class="asset-card glass-card">
            <div class="asset-card-image" style="background-image: url('${asset.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'}')">
              <span class="badge ${statusBadgeClasses[asset.status] || 'badge-gray'} asset-status-badge">
                ${asset.status}
              </span>
              <span class="${criticalityClasses[asset.criticality] || ''} asset-criticality-badge">
                Kritis: ${asset.criticality}
              </span>
            </div>
            
            <div class="asset-card-body">
              <div class="asset-id-tag">${asset.id}</div>
              <h3 class="asset-title" title="${asset.name}">${asset.name}</h3>
              
              <div class="asset-meta">
                <div><i data-lucide="folder"></i> ${asset.category}</div>
                <div><i data-lucide="map-pin"></i> ${asset.location}</div>
                <div><i data-lucide="calendar"></i> Next PM: <strong>${formatDate(asset.nextPMDate)}</strong></div>
              </div>

              ${activeWO > 0 ? `
                <div class="asset-wo-alert">
                  <i data-lucide="wrench"></i> ${activeWO} Work Order Aktif
                </div>
              ` : ''}

              <div class="asset-card-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="window.viewAssetDetail('${asset.id}')">
                  <i data-lucide="eye"></i> Detail
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="window.openAssetModal('${asset.id}')">
                  <i data-lucide="edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.deleteAsset('${asset.id}')">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function populateCategories(assets) {
  const select = document.getElementById('asset-filter-category');
  if (!select || select.children.length > 1) return;

  const categories = [...new Set(assets.map(a => a.category))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
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

  const categoryFilter = document.getElementById('asset-filter-category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilterCategory = e.target.value;
      renderAssets();
    });
  }

  const statusFilter = document.getElementById('asset-filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilterStatus = e.target.value;
      renderAssets();
    });
  }
}

// Modal Handlers
window.openAssetModal = function(assetId = null) {
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
      document.getElementById('asset-form-name').value = asset.name;
      document.getElementById('asset-form-category').value = asset.category;
      document.getElementById('asset-form-location').value = asset.location;
      document.getElementById('asset-form-status').value = asset.status;
      document.getElementById('asset-form-criticality').value = asset.criticality;
      document.getElementById('asset-form-serial').value = asset.serialNumber || '';
      document.getElementById('asset-form-manufacturer').value = asset.manufacturer || '';
      document.getElementById('asset-form-cost').value = asset.purchaseCost || 0;
      document.getElementById('asset-form-purchase-date').value = asset.purchaseDate || '';
      document.getElementById('asset-form-specs').value = asset.specifications || '';
    }
  } else {
    titleEl.textContent = 'Tambah Aset Baru';
    document.getElementById('asset-form-id').value = '';
  }

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.saveAssetForm = function(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('asset-form-id').value;
  const name = document.getElementById('asset-form-name').value.trim();
  const category = document.getElementById('asset-form-category').value;
  const location = document.getElementById('asset-form-location').value.trim();
  const status = document.getElementById('asset-form-status').value;
  const criticality = document.getElementById('asset-form-criticality').value;
  const serialNumber = document.getElementById('asset-form-serial').value.trim();
  const manufacturer = document.getElementById('asset-form-manufacturer').value.trim();
  const purchaseCost = parseFloat(document.getElementById('asset-form-cost').value) || 0;
  const purchaseDate = document.getElementById('asset-form-purchase-date').value;
  const specifications = document.getElementById('asset-form-specs').value.trim();

  if (!name || !category || !location) {
    showToast('Harap isi bidang Nama, Kategori, dan Lokasi Aset.', 'warning');
    return;
  }

  let assets = StorageManager.getAssets();

  if (id) {
    // Update
    assets = assets.map(a => {
      if (a.id === id) {
        return {
          ...a,
          name, category, location, status, criticality,
          serialNumber, manufacturer, purchaseCost, purchaseDate, specifications
        };
      }
      return a;
    });
    showToast(`Aset ${id} berhasil diperbarui`, 'success');
  } else {
    // Insert
    const newAsset = {
      id: generateID('AST'),
      name, category, location, status, criticality,
      serialNumber, manufacturer, purchaseCost, purchaseDate, specifications,
      lastMaintenance: new Date().toISOString().slice(0, 10),
      nextPMDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
    };
    assets.unshift(newAsset);
    showToast(`Aset baru ${newAsset.id} berhasil ditambahkan`, 'success');
  }

  StorageManager.saveAssets(assets);
  document.getElementById('modal-asset-form').classList.remove('active');
  renderAssets();
};

window.viewAssetDetail = function(assetId) {
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
              <th>No. WO</th>
              <th>Judul</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            ${assetWOs.length ? assetWOs.map(w => `
              <tr>
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

window.deleteAsset = function(assetId) {
  if (!confirm(`Apakah Anda yakin ingin menghapus aset ${assetId}?`)) return;

  let assets = StorageManager.getAssets();
  assets = assets.filter(a => a.id !== assetId);

  StorageManager.saveAssets(assets);
  showToast(`Aset ${assetId} berhasil dihapus`, 'success');
  renderAssets();
};

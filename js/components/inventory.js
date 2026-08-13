/**
 * Inventory & Spare Parts Component for MMS
 */

import { StorageManager } from '../storage.js';
import { formatIDR, showToast, generateID } from '../utils/helpers.js';

let currentInventorySearch = '';

export function renderInventory() {
  const container = document.getElementById('inventory-list-container');
  if (!container) return;

  const inventory = StorageManager.getInventory();

  let filtered = inventory.filter(item => {
    if (!currentInventorySearch) return true;
    const term = currentInventorySearch.toLowerCase();
    return item.name.toLowerCase().includes(term) ||
           item.code.toLowerCase().includes(term) ||
           item.category.toLowerCase().includes(term) ||
           (item.supplier && item.supplier.toLowerCase().includes(term));
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package-search"></i>
        <h3>Suku Cadang Tidak Ditemukan</h3>
        <p>Tidak ada barang yang sesuai dengan pencarian Anda.</p>
        <button class="btn btn-primary" onclick="window.openInventoryModal()">
          <i data-lucide="plus"></i> Tambah Spare Part Baru
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
            <th>NO</th>
            <th>Kode Part</th>
            <th>Nama Suku Cadang</th>
            <th>Kategori</th>
            <th>Stok / Satuan</th>
            <th>Stok Min.</th>
            <th>Harga Satuan</th>
            <th>Lokasi Rak</th>
            <th>Supplier</th>
            <th>Status Stok</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((item, index) => {
            const isLowStock = item.stock <= item.minStock;
            return `
              <tr class="${isLowStock ? 'row-low-stock' : ''}">
                <td><strong>${index + 1}</strong></td>
                <td><strong>${item.code}</strong></td>
                <td>
                  <div class="font-medium">${item.name}</div>
                  <small class="text-muted">ID: ${item.id}</small>
                </td>
                <td><span class="badge badge-outline">${item.category}</span></td>
                <td><strong>${item.stock}</strong> ${item.unit}</td>
                <td>${item.minStock} ${item.unit}</td>
                <td>${formatIDR(item.unitPrice)}</td>
                <td>${item.location || '-'}</td>
                <td>${item.supplier || '-'}</td>
                <td>
                  <span class="badge ${isLowStock ? 'badge-danger' : 'badge-success'}">
                    ${isLowStock ? '⚠ Stok Minim' : '✓ Normal'}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-icon btn-sm btn-outline-success" title="Tambah Stok (+1)" onclick="window.adjustStock('${item.id}', 1)">
                      <i data-lucide="plus"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-danger" title="Kurangi Stok (-1)" onclick="window.adjustStock('${item.id}', -1)">
                      <i data-lucide="minus"></i>
                    </button>
                    <button class="btn btn-icon btn-sm btn-outline-secondary" title="Edit Spare Part" onclick="window.openInventoryModal('${item.id}')">
                      <i data-lucide="edit"></i>
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

export function setupInventoryListeners() {
  const searchInput = document.getElementById('inventory-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentInventorySearch = e.target.value;
      renderInventory();
    });
  }
}

window.adjustStock = function(itemId, delta) {
  let inventory = StorageManager.getInventory();
  let updatedItem = null;

  inventory = inventory.map(item => {
    if (item.id === itemId) {
      const newStock = Math.max(0, item.stock + delta);
      updatedItem = { ...item, stock: newStock };
      return updatedItem;
    }
    return item;
  });

  StorageManager.saveInventory(inventory);
  if (updatedItem) {
    showToast(`Stok ${updatedItem.name} diperbarui: ${updatedItem.stock} ${updatedItem.unit}`, 'info');
  }
  renderInventory();
};

function populateSupplierSelect(selectedSupplier = '') {
  const select = document.getElementById('inv-form-supplier');
  if (!select) return;

  const vendors = StorageManager.getVendors();
  let optionsHTML = '<option value="">Pilih Supplier / Vendor...</option>';

  vendors.forEach(v => {
    optionsHTML += `<option value="${v.name}">${v.name}</option>`;
  });

  if (selectedSupplier && !vendors.some(v => v.name === selectedSupplier)) {
    optionsHTML += `<option value="${selectedSupplier}">${selectedSupplier}</option>`;
  }

  select.innerHTML = optionsHTML;
  if (selectedSupplier) select.value = selectedSupplier;
}

window.openInventoryModal = function(itemId = null) {
  const modal = document.getElementById('modal-inv-form');
  const titleEl = document.getElementById('modal-inv-title');
  const form = document.getElementById('form-inv');

  if (!modal || !form) return;

  form.reset();

  if (itemId) {
    titleEl.textContent = 'Edit Data Spare Part';
    const inventory = StorageManager.getInventory();
    const item = inventory.find(i => i.id === itemId);

    if (item) {
      document.getElementById('inv-form-id').value = item.id;
      document.getElementById('inv-form-code').value = item.code;
      document.getElementById('inv-form-name').value = item.name;
      document.getElementById('inv-form-category').value = item.category;
      document.getElementById('inv-form-stock').value = item.stock;
      document.getElementById('inv-form-minstock').value = item.minStock;
      document.getElementById('inv-form-unit').value = item.unit;
      document.getElementById('inv-form-price').value = item.unitPrice;
      document.getElementById('inv-form-location').value = item.location || '';
      populateSupplierSelect(item.supplier || '');
    }
  } else {
    titleEl.textContent = 'Tambah Suku Cadang Baru';
    document.getElementById('inv-form-id').value = '';
    populateSupplierSelect('');
  }

  modal.classList.add('active');
};

window.saveInventoryForm = function(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('inv-form-id').value;
  const code = document.getElementById('inv-form-code').value.trim();
  const name = document.getElementById('inv-form-name').value.trim();
  const category = document.getElementById('inv-form-category').value;
  const stock = parseInt(document.getElementById('inv-form-stock').value) || 0;
  const minStock = parseInt(document.getElementById('inv-form-minstock').value) || 0;
  const unit = document.getElementById('inv-form-unit').value.trim();
  const unitPrice = parseFloat(document.getElementById('inv-form-price').value) || 0;
  const location = document.getElementById('inv-form-location').value.trim();
  const supplier = document.getElementById('inv-form-supplier').value.trim();

  if (!code || !name || !unit) {
    showToast('Harap isi Kode Part, Nama, dan Satuan.', 'warning');
    return;
  }

  let inventory = StorageManager.getInventory();

  if (id) {
    inventory = inventory.map(i => {
      if (i.id === id) {
        return { ...i, code, name, category, stock, minStock, unit, unitPrice, location, supplier };
      }
      return i;
    });
    showToast(`Data part ${code} berhasil diperbarui`, 'success');
  } else {
    const newItem = {
      id: generateID('PRT'),
      code, name, category, stock, minStock, unit, unitPrice, location, supplier
    };
    inventory.unshift(newItem);
    showToast(`Part baru ${newItem.code} berhasil ditambahkan!`, 'success');
  }

  StorageManager.saveInventory(inventory);
  document.getElementById('modal-inv-form').classList.remove('active');
  renderInventory();
};

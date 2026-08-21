/**
 * Vendor Management Component for MMS
 */

import { StorageManager } from '../storage.js';
import { showToast, generateID } from '../utils/helpers.js';

let currentVendorSearch = '';

export function renderVendors() {
  const container = document.getElementById('vendors-list-container');
  if (!container) return;

  const vendors = StorageManager.getVendors();

  let filtered = vendors.filter(vendor => {
    if (!currentVendorSearch) return true;
    const term = currentVendorSearch.toLowerCase();
    return vendor.name.toLowerCase().includes(term) ||
           (vendor.contactPerson && vendor.contactPerson.toLowerCase().includes(term)) ||
           (vendor.email && vendor.email.toLowerCase().includes(term)) ||
           (vendor.phone && vendor.phone.toLowerCase().includes(term)) ||
           (vendor.address && vendor.address.toLowerCase().includes(term));
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <i data-lucide="building-2"></i>
        <h3>Tidak ada data perusahaan yang ditemukan</h3>
        <p>Coba sesuaikan kata kunci pencarian atau tambah perusahaan baru.</p>
        <button class="btn btn-primary" onclick="window.openVendorModal()">
          <i data-lucide="plus"></i> Tambah Perusahaan Baru
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
            <th class="col-main">Nama Perusahaan</th>
            <th class="col-person">Contact Person</th>
            <th class="col-person">Email</th>
            <th class="col-date">No. Telepon</th>
            <th class="col-asset">Alamat</th>
            <th class="col-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((vendor, index) => `
            <tr>
              <td class="col-no"><strong>${index + 1}</strong></td>
              <td class="col-main">
                <div class="font-medium">${vendor.name}</div>
                <small class="text-muted">ID: ${vendor.id}</small>
              </td>
              <td class="col-person"><i data-lucide="user" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${vendor.contactPerson || '-'}</td>
              <td class="col-person"><i data-lucide="mail" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${vendor.email || '-'}</td>
              <td class="col-date"><i data-lucide="phone" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${vendor.phone || '-'}</td>
              <td class="col-asset"><small><i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${vendor.address || '-'}</small></td>
              <td class="col-actions">
                <div class="btn-group" style="justify-content: flex-end;">
                  <button class="btn btn-icon btn-sm btn-outline-secondary" title="Edit Perusahaan" onclick="window.openVendorModal('${vendor.id}')">
                    <i data-lucide="edit"></i>
                  </button>
                  <button class="btn btn-icon btn-sm btn-outline-danger" title="Hapus Perusahaan" onclick="window.deleteVendor('${vendor.id}')">
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

export function setupVendorListeners() {
  const searchInput = document.getElementById('vendors-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentVendorSearch = e.target.value;
      renderVendors();
    });
  }
}

window.openVendorModal = function(id = null) {
  const modal = document.getElementById('modal-vendor-form');
  const form = document.getElementById('form-vendor');
  const modalTitle = document.getElementById('modal-vendor-title');
  if (!modal || !form) return;

  form.reset();

  if (id) {
    const vendors = StorageManager.getVendors();
    const vendor = vendors.find(v => v.id === id);
    if (vendor) {
      if (modalTitle) modalTitle.textContent = 'Edit Data Perusahaan';
      document.getElementById('vendor-form-id').value = vendor.id;
      document.getElementById('vendor-form-name').value = vendor.name || '';
      document.getElementById('vendor-form-email').value = vendor.email || '';
      document.getElementById('vendor-form-contact').value = vendor.contactPerson || '';
      document.getElementById('vendor-form-phone').value = vendor.phone || '';
      document.getElementById('vendor-form-address').value = vendor.address || '';
    }
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Perusahaan Baru';
    document.getElementById('vendor-form-id').value = '';
  }

  modal.classList.add('active');
};

window.saveVendorForm = function(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('vendor-form-id').value;
  const name = document.getElementById('vendor-form-name').value.trim();
  const email = document.getElementById('vendor-form-email').value.trim();
  const contactPerson = document.getElementById('vendor-form-contact').value.trim();
  const phone = document.getElementById('vendor-form-phone').value.trim();
  const address = document.getElementById('vendor-form-address').value.trim();

  if (!name || !contactPerson || !phone) {
    showToast('Harap isi Nama Perusahaan, Contact Person, dan No. Telepon!', 'warning');
    return;
  }

  const vendorData = {
    name,
    email: email || '',
    contactPerson,
    phone,
    address: address || ''
  };

  if (id) {
    vendorData.id = id;
    let vendors = StorageManager.getVendors();
    vendors = vendors.map(v => v.id === id ? { ...v, ...vendorData } : v);
    StorageManager.saveVendors(vendors);
    showToast('Data perusahaan berhasil diperbarui!', 'success');
  } else {
    vendorData.id = generateID('VND');
    const vendors = StorageManager.getVendors();
    vendors.unshift(vendorData);
    StorageManager.saveVendors(vendors);
    showToast('Perusahaan baru berhasil ditambahkan!', 'success');
  }

  document.getElementById('modal-vendor-form').classList.remove('active');
  renderVendors();
};

window.deleteVendor = function(id) {
  if (!confirm(`Apakah Anda yakin ingin menghapus perusahaan ID: ${id}?`)) return;

  let vendors = StorageManager.getVendors();
  vendors = vendors.filter(v => v.id !== id);
  StorageManager.saveVendors(vendors);
  StorageManager.deleteFromSupabase('vendors', id);

  showToast('Data perusahaan berhasil dihapus!', 'info');
  renderVendors();
};

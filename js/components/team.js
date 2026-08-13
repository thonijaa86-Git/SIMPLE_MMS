/**
 * Team Management Component for MMS
 */

import { StorageManager } from '../storage.js';
import { showToast, generateID } from '../utils/helpers.js';

let currentTeamSearch = '';

export function renderTeam() {
  const container = document.getElementById('team-list-container');
  if (!container) return;

  const team = StorageManager.getTeam();

  let filtered = team.filter(member => {
    if (!currentTeamSearch) return true;
    const term = currentTeamSearch.toLowerCase();
    return member.name.toLowerCase().includes(term) ||
           (member.phone && member.phone.toLowerCase().includes(term)) ||
           (member.email && member.email.toLowerCase().includes(term)) ||
           (member.company && member.company.toLowerCase().includes(term)) ||
           (member.role && member.role.toLowerCase().includes(term)) ||
           (member.position && member.position.toLowerCase().includes(term));
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-card">
        <i data-lucide="users"></i>
        <h3>Tidak ada personil tim yang ditemukan</h3>
        <p>Coba sesuaikan kata kunci pencarian atau tambah personil tim baru.</p>
        <button class="btn btn-primary" onclick="window.openTeamModal()">
          <i data-lucide="user-plus"></i> Tambah Personil Tim
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const roleBadgeClasses = {
    'Manager': 'badge-purple',
    'Supervisor': 'badge-info',
    'Teknisi': 'badge-success',
    'Admin': 'badge-warning'
  };

  container.innerHTML = `
    <div class="table-responsive glass-card padding-0">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>NO</th>
            <th>Nama Personil</th>
            <th>Role & Jabatan</th>
            <th>No. Telepon</th>
            <th>Email</th>
            <th>Perusahaan</th>
            <th style="text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((member, index) => `
            <tr>
              <td><strong>${index + 1}</strong></td>
              <td>
                <div class="font-medium">${member.name}</div>
                <small class="text-muted">ID: ${member.id}</small>
              </td>
              <td>
                <span class="badge ${roleBadgeClasses[member.role] || 'badge-gray'}">${member.role || 'Personil'}</span>
                <div style="font-size: 12px; font-weight: 500; margin-top: 2px;">${member.position || '-'}</div>
              </td>
              <td><i data-lucide="phone" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${member.phone || '-'}</td>
              <td><i data-lucide="mail" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${member.email || '-'}</td>
              <td><i data-lucide="building-2" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${member.company || '-'}</td>
              <td style="text-align: right;">
                <div class="btn-group" style="justify-content: flex-end;">
                  <button class="btn btn-icon btn-sm btn-outline-secondary" title="Edit Personil" onclick="window.openTeamModal('${member.id}')">
                    <i data-lucide="edit"></i>
                  </button>
                  <button class="btn btn-icon btn-sm btn-outline-danger" title="Hapus Personil" onclick="window.deleteTeamMember('${member.id}')">
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

export function setupTeamListeners() {
  const searchInput = document.getElementById('team-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentTeamSearch = e.target.value;
      renderTeam();
    });
  }
}

function populateCompanySelect(selectedCompany = '') {
  const select = document.getElementById('team-form-company');
  if (!select) return;

  const defaultCompany = 'PT Industri Manufaktur Indonesia (Internal)';
  const vendors = StorageManager.getVendors();

  let optionsHTML = `<option value="${defaultCompany}">${defaultCompany}</option>`;

  const vendorNames = vendors.map(v => v.name).filter(Boolean);
  vendorNames.forEach(vName => {
    if (vName !== defaultCompany) {
      optionsHTML += `<option value="${vName}">${vName}</option>`;
    }
  });

  if (selectedCompany && selectedCompany !== defaultCompany && !vendorNames.includes(selectedCompany)) {
    optionsHTML += `<option value="${selectedCompany}">${selectedCompany}</option>`;
  }

  select.innerHTML = optionsHTML;
  if (selectedCompany) {
    select.value = selectedCompany;
  } else {
    select.value = defaultCompany;
  }
}

window.openTeamModal = function(id = null) {
  const modal = document.getElementById('modal-team-form');
  const form = document.getElementById('form-team');
  const modalTitle = document.getElementById('modal-team-title');
  if (!modal || !form) return;

  form.reset();

  if (id) {
    const team = StorageManager.getTeam();
    const member = team.find(m => m.id === id);
    if (member) {
      if (modalTitle) modalTitle.textContent = 'Edit Data Personil Tim';
      document.getElementById('team-form-id').value = member.id;
      document.getElementById('team-form-name').value = member.name || '';
      document.getElementById('team-form-phone').value = member.phone || '';
      document.getElementById('team-form-email').value = member.email || '';
      populateCompanySelect(member.company || '');
      document.getElementById('team-form-role').value = member.role || 'Teknisi';
      document.getElementById('team-form-position').value = member.position || '';
    }
  } else {
    if (modalTitle) modalTitle.textContent = 'Tambah Personil Tim Baru';
    document.getElementById('team-form-id').value = '';
    populateCompanySelect('');
    document.getElementById('team-form-role').value = 'Teknisi';
  }

  modal.classList.add('active');
};

window.saveTeamForm = function(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('team-form-id').value;
  const name = document.getElementById('team-form-name').value.trim();
  const phone = document.getElementById('team-form-phone').value.trim();
  const email = document.getElementById('team-form-email').value.trim();
  const company = document.getElementById('team-form-company').value.trim();
  const role = document.getElementById('team-form-role').value;
  const position = document.getElementById('team-form-position').value.trim();

  if (!name || !phone || !email) {
    showToast('Harap isi Nama, No. Telepon, dan Email!', 'warning');
    return;
  }

  const teamData = {
    name,
    phone,
    email,
    company: company || 'PT Industri Manufaktur Indonesia',
    role: role || 'Teknisi',
    position: position || 'Staff'
  };

  if (id) {
    teamData.id = id;
    let team = StorageManager.getTeam();
    team = team.map(m => m.id === id ? { ...m, ...teamData } : m);
    StorageManager.saveTeam(team);
    showToast('Data personil tim berhasil diperbarui!', 'success');
  } else {
    teamData.id = generateID('TM');
    const team = StorageManager.getTeam();
    team.unshift(teamData);
    StorageManager.saveTeam(team);
    showToast('Personil tim baru berhasil ditambahkan!', 'success');
  }

  document.getElementById('modal-team-form').classList.remove('active');
  renderTeam();
};

window.deleteTeamMember = function(id) {
  if (!confirm(`Apakah Anda yakin ingin menghapus personil ID: ${id}?`)) return;

  let team = StorageManager.getTeam();
  team = team.filter(m => m.id !== id);
  StorageManager.saveTeam(team);

  showToast('Personil tim berhasil dihapus!', 'info');
  renderTeam();
};

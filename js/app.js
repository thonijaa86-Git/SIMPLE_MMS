/**
 * Main Application Orchestrator for Maintenance Management System (MMS)
 */

import { StorageManager, getSupabaseClient, resetSupabaseClient } from './storage.js';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from './config.js';
import { showToast } from './utils/helpers.js';
import { renderDashboard } from './components/dashboard.js';
import { renderAssets, setupAssetListeners } from './components/assets.js';
import { renderWorkOrders, setupWorkOrderListeners } from './components/workorders.js';
import { renderPM } from './components/pm.js';
import { renderInspections } from './components/inspections.js';
import { renderInventory, setupInventoryListeners } from './components/inventory.js';
import { renderReports } from './components/reports.js';
import { renderTeam, setupTeamListeners } from './components/team.js';
import { renderVendors, setupVendorListeners } from './components/vendors.js';

let currentView = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Storage Data
  StorageManager.init();

  // Setup Theme (Dark / Light mode)
  initTheme();

  // Setup Navigation
  initNavigation();

  // Setup Component Event Listeners
  setupAssetListeners();
  setupWorkOrderListeners();
  setupInventoryListeners();
  setupTeamListeners();
  setupVendorListeners();

  // Setup Global Modal Close listeners
  initModals();

  // Update Supabase Status Badge
  updateSupabaseStatusBadge();

  // Initial View Render
  navigateTo('dashboard');
});

// View Navigation Router
export function navigateTo(viewName) {
  currentView = viewName;

  // Update Sidebar & Mobile Bottom Nav Active State
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
  navItems.forEach(item => {
    const target = item.getAttribute('data-view');
    if (target === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Page Title
  const titles = {
    dashboard: 'Dashboard Utama & Analitik',
    assets: 'Pengelolaan Aset & Peralatan',
    workorders: 'Surat Perintah Kerja (Work Order / SPK)',
    pm: 'Preventive Maintenance (Pemeliharaan Rutin)',
    inspections: 'Pengelolaan Inspeksi & Safety Checklist',
    inventory: 'Manajemen Suku Cadang & Stok',
    reports: 'Laporan Performa & Ekspor Data',
    team: 'Pengelolaan Tim & Personil',
    vendors: 'Pengelolaan Perusahaan'
  };

  const titleEl = document.getElementById('page-header-title');
  if (titleEl) titleEl.textContent = titles[viewName] || 'Maintenance Management System';

  // Hide all view containers & show target view
  const views = document.querySelectorAll('.view-container');
  views.forEach(v => v.classList.remove('active'));

  const activeViewEl = document.getElementById(`view-${viewName}`);
  if (activeViewEl) {
    activeViewEl.classList.add('active');
  }

  // Render view specific logic
  switch (viewName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'assets':
      renderAssets();
      break;
    case 'workorders':
      renderWorkOrders();
      break;
    case 'pm':
      renderPM();
      break;
    case 'inspections':
      renderInspections();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'reports':
      renderReports();
      break;
    case 'team':
      renderTeam();
      break;
    case 'vendors':
      renderVendors();
      break;
    default:
      renderDashboard();
  }

  if (window.lucide) window.lucide.createIcons();
}

window.navigateTo = navigateTo;

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      if (targetView) {
        navigateTo(targetView);
        closeMobileSidebar();
      }
    });
  });

  // Desktop sidebar collapse toggle
  const sidebarToggle = document.getElementById('btn-sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Mobile menu buttons & backdrop
  const mobileMenuBtn = document.getElementById('btn-mobile-menu');
  const sidebarCloseBtn = document.getElementById('btn-sidebar-close');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar?.classList.add('mobile-open');
      backdrop?.classList.add('active');
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar?.classList.remove('mobile-open');
  backdrop?.classList.remove('active');
}

function initTheme() {
  const themeToggle = document.getElementById('btn-theme-toggle');
  const currentTheme = localStorage.getItem('mms_theme') || 'dark';

  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('mms_theme', newTheme);
      updateThemeIcon(newTheme);

      // Re-render charts to update colors
      if (currentView === 'dashboard') renderDashboard();
    });
  }
}

function updateThemeIcon(theme) {
  const iconContainer = document.getElementById('theme-icon');
  if (!iconContainer) return;
  iconContainer.innerHTML = theme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  if (window.lucide) window.lucide.createIcons();
}

export function closeModal(modalEl = null) {
  if (modalEl) {
    modalEl.classList.remove('active');
    return;
  }
  const activeModals = document.querySelectorAll('.modal-backdrop.active');
  activeModals.forEach(m => m.classList.remove('active'));
}

window.closeModal = closeModal;

function initModals() {
  // Close modals when clicking backdrop or close button
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.btn-modal-close');
    const isBackdrop = e.target.classList.contains('modal-backdrop');

    if (closeBtn) {
      e.preventDefault();
      const parentModal = closeBtn.closest('.modal-backdrop');
      if (parentModal) {
        parentModal.classList.remove('active');
      } else {
        closeModal();
      }
    } else if (isBackdrop) {
      e.target.classList.remove('active');
    }
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Supabase UI Handlers & Status Badge
function updateSupabaseStatusBadge() {
  const badge = document.getElementById('supabase-status-badge');
  if (!badge) return;

  const client = getSupabaseClient();
  if (client) {
    badge.className = 'badge badge-success';
    badge.innerHTML = '<i data-lucide="cloud"></i> Supabase: Connected';
  } else {
    badge.className = 'badge badge-gray';
    badge.innerHTML = '<i data-lucide="database"></i> Supabase: Offline';
  }
  if (window.lucide) window.lucide.createIcons();
}

window.openSupabaseModal = function() {
  const modal = document.getElementById('modal-supabase-config');
  if (!modal) return;

  const cfg = getSupabaseConfig();
  document.getElementById('sb-form-url').value = cfg.url || '';
  document.getElementById('sb-form-key').value = cfg.key || '';

  modal.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
};

window.saveSupabaseForm = async function(e) {
  if (e) e.preventDefault();

  const url = document.getElementById('sb-form-url').value.trim();
  const key = document.getElementById('sb-form-key').value.trim();

  if (!url || !key) {
    showToast('Harap isi Supabase Project URL dan Anon Key.', 'warning');
    return;
  }

  saveSupabaseConfig(url, key);
  resetSupabaseClient();
  const client = getSupabaseClient();

  if (client) {
    showToast('Mencoba menghubungkan ke Supabase...', 'info');
    try {
      const { data, error } = await client.from('assets').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        showToast(`Koneksi Gagal: ${error.message}`, 'error');
      } else {
        showToast('BERHASIL terhubung ke Supabase Cloud Database!', 'success');
        document.getElementById('modal-supabase-config').classList.remove('active');
      }
    } catch (err) {
      showToast(`Kesalahan koneksi: ${err.message}`, 'error');
    }
  } else {
    showToast('Gagal menginisialisasi client Supabase. Cek URL & Key.', 'error');
  }

  updateSupabaseStatusBadge();
};

window.disconnectSupabase = function() {
  if (!confirm('Putuskan koneksi Supabase dan kembali ke LocalStorage mode?')) return;
  clearSupabaseConfig();
  resetSupabaseClient();
  updateSupabaseStatusBadge();
  document.getElementById('modal-supabase-config').classList.remove('active');
  showToast('Koneksi Supabase telah diputuskan.', 'info');
};

window.copySQLSchema = async function() {
  const sqlText = `-- ==========================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR SIMPLE MMS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.assets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Operasional',
  criticality VARCHAR(50) DEFAULT 'Sedang',
  serial_number VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  purchase_date DATE,
  purchase_cost NUMERIC(15, 2) DEFAULT 0,
  last_maintenance DATE,
  next_pm_date DATE,
  specifications TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.work_orders (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name VARCHAR(255),
  type VARCHAR(50) DEFAULT 'Corrective',
  priority VARCHAR(50) DEFAULT 'Sedang',
  status VARCHAR(50) DEFAULT 'Disetujui',
  assigned_tech VARCHAR(100),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  target_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  problem_description TEXT,
  resolution_notes TEXT,
  estimated_hours NUMERIC(5, 2) DEFAULT 0,
  actual_hours NUMERIC(5, 2) DEFAULT 0,
  parts_used JSONB DEFAULT '[]'::jsonb,
  total_cost NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.pm_schedules (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name VARCHAR(255),
  frequency VARCHAR(50) DEFAULT 'Bulanan',
  interval_days INT DEFAULT 30,
  last_completed DATE,
  next_due_date DATE,
  status VARCHAR(50) DEFAULT 'Normal',
  assigned_tech VARCHAR(100),
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.inspections (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  asset_id VARCHAR(50) REFERENCES public.assets(id) ON DELETE SET NULL,
  asset_name VARCHAR(255),
  inspector VARCHAR(100),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  overall_result VARCHAR(50) DEFAULT 'Lulus',
  checklist_items JSONB DEFAULT '[]'::jsonb,
  meter_reading VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  unit VARCHAR(50) DEFAULT 'Pcs',
  unit_price NUMERIC(15, 2) DEFAULT 0,
  location VARCHAR(100),
  supplier VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Write Assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Write Work Orders" ON public.work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Write PM Schedules" ON public.pm_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Write Inspections" ON public.inspections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Write Inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
`;

  try {
    await navigator.clipboard.writeText(sqlText);
    showToast('Script SQL Schema (schema.sql) berhasil disalin ke Clipboard! Paste di Supabase SQL Editor.', 'success');
  } catch (err) {
    showToast('Gagal menyalin otomatis. Buka file schema.sql secara manual.', 'warning');
  }
};

window.syncDataToSupabaseNow = async function() {
  await StorageManager.syncAllLocalToSupabase();
};

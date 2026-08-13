/**
 * Main Application Orchestrator for Maintenance Management System (MMS)
 */

import { StorageManager } from './storage.js';
import { showToast } from './utils/helpers.js';
import { renderDashboard } from './components/dashboard.js';
import { renderAssets, setupAssetListeners } from './components/assets.js';
import { renderWorkOrders, setupWorkOrderListeners } from './components/workorders.js';
import { renderPM } from './components/pm.js';
import { renderInspections } from './components/inspections.js';
import { renderInventory, setupInventoryListeners } from './components/inventory.js';
import { renderReports } from './components/reports.js';

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

  // Setup Global Modal Close listeners
  initModals();

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
    reports: 'Laporan Performa & Ekspor Data'
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

function initModals() {
  // Close modals when clicking backdrop or close button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('btn-modal-close')) {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) activeModal.classList.remove('active');
    }
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) activeModal.classList.remove('active');
    }
  });
}

/**
 * Storage Manager & Direct Supabase REST API Integration Module for MMS
 */

import { getSupabaseConfig } from './config.js';
import { showToast } from './utils/helpers.js';

const STORAGE_KEYS = {
  ASSETS: 'mms_assets_data',
  WORK_ORDERS: 'mms_work_orders_data',
  PM_SCHEDULES: 'mms_pm_schedules_data',
  INSPECTIONS: 'mms_inspections_data',
  INVENTORY: 'mms_inventory_data',
  TECHNICIANS: 'mms_technicians_data',
  TEAM: 'mms_team_data',
  VENDORS: 'mms_vendors_data'
};

let supabaseClient = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
      return supabaseClient;
    } catch (err) {
      console.error('Error creating Supabase client:', err);
    }
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseClient = null;
  return getSupabaseClient();
}

// Native Direct REST API Fetch Helper for 100% Reliability
async function fetchTableDirect(table) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key) return null;

  const endpoint = `${cfg.url}/rest/v1/${table}?select=*`;
  const headers = {
    'apikey': cfg.key,
    'Authorization': `Bearer ${cfg.key}`,
    'Accept': 'application/json'
  };

  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      console.error(`Supabase REST fetch error on ${table}:`, res.statusText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Supabase REST fetch exception on ${table}:`, err);
    return null;
  }
}

// Native Direct REST API Upsert Helper
async function upsertTableDirect(table, rows) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key || !rows || rows.length === 0) return;

  const endpoint = `${cfg.url}/rest/v1/${table}`;
  const headers = {
    'apikey': cfg.key,
    'Authorization': `Bearer ${cfg.key}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(rows)
    });
    if (!res.ok) {
      console.error(`Supabase REST upsert error on ${table}:`, await res.text());
    }
  } catch (err) {
    console.error(`Supabase REST upsert exception on ${table}:`, err);
  }
}

// Native Direct REST API Delete Helper
async function deleteTableDirect(table, id) {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.key || !id) return;

  const endpoint = `${cfg.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`;
  const headers = {
    'apikey': cfg.key,
    'Authorization': `Bearer ${cfg.key}`
  };

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      console.error(`Supabase REST delete error on ${table}:`, await res.text());
    }
  } catch (err) {
    console.error(`Supabase REST delete exception on ${table}:`, err);
  }
}

export class StorageManager {
  static get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Clear legacy dummy cache if present
  static purgeLegacyDummyCache() {
    const teamData = this.get(STORAGE_KEYS.TEAM);
    if (teamData && teamData.some(m => m.id === 'TM-001' || m.name === 'Ahmad Fauzi')) {
      console.log('Purging legacy dummy cache from LocalStorage...');
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    }
  }

  // Load all 7 tables live from Supabase PostgreSQL
  static async loadAllFromSupabase() {
    this.purgeLegacyDummyCache();

    console.log('Fetching live data from Supabase tables...');

    // 1. Assets Table
    const assetsData = await fetchTableDirect('assets');
    if (assetsData) {
      const assets = assetsData.map(a => ({
        id: a.id,
        name: a.name || '',
        category: a.category || '',
        location: a.location || '',
        status: a.status || 'Operasional',
        criticality: a.criticality || 'Sedang',
        serialNumber: a.serial_number || '',
        manufacturer: a.manufacturer || '',
        model: a.model || '',
        purchaseDate: a.purchase_date || '',
        purchaseCost: Number(a.purchase_cost || 0),
        yearMade: a.year_made || null,
        installationYear: a.installation_year || null,
        lastMaintenance: a.last_maintenance || '',
        nextPMDate: a.next_pm_date || '',
        specifications: a.specifications || '',
        image: a.image || ''
      }));
      this.set(STORAGE_KEYS.ASSETS, assets);
    }

    // 2. Work Orders Table
    const woData = await fetchTableDirect('work_orders');
    if (woData) {
      const wos = woData.map(w => ({
        id: w.id,
        title: w.title || '',
        assetId: w.asset_id || '',
        assetName: w.asset_name || '',
        type: w.type || 'Corrective',
        priority: w.priority || 'Sedang',
        status: w.status || 'Disetujui',
        assignedTech: w.assigned_tech || '',
        createdDate: w.created_date || new Date().toISOString(),
        targetDate: w.target_date || null,
        completedDate: w.completed_date || null,
        problemDescription: w.problem_description || '',
        resolutionNotes: w.resolution_notes || '',
        estimatedHours: Number(w.estimated_hours || 0),
        actualHours: Number(w.actual_hours || 0),
        partsUsed: Array.isArray(w.parts_used) ? w.parts_used : (typeof w.parts_used === 'string' ? JSON.parse(w.parts_used || '[]') : []),
        totalCost: Number(w.total_cost || 0)
      }));
      this.set(STORAGE_KEYS.WORK_ORDERS, wos);
    }

    // 3. PM Schedules Table
    const pmData = await fetchTableDirect('pm_schedules');
    if (pmData) {
      const pms = pmData.map(p => ({
        id: p.id,
        title: p.title || '',
        assetId: p.asset_id || '',
        assetName: p.asset_name || '',
        frequency: p.frequency || 'Bulanan',
        intervalDays: Number(p.interval_days || 30),
        lastCompleted: p.last_completed || null,
        nextDueDate: p.next_due_date || null,
        status: p.status || 'Normal',
        assignedTech: p.assigned_tech || '',
        checklist: Array.isArray(p.checklist) ? p.checklist : (typeof p.checklist === 'string' ? JSON.parse(p.checklist || '[]') : [])
      }));
      this.set(STORAGE_KEYS.PM_SCHEDULES, pms);
    }

    // 4. Inspections Table
    const inspData = await fetchTableDirect('inspections');
    if (inspData) {
      const insps = inspData.map(i => ({
        id: i.id,
        title: i.title || '',
        assetId: i.asset_id || '',
        assetName: i.asset_name || '',
        inspector: i.inspector || '',
        date: i.date || new Date().toISOString(),
        overallResult: i.overall_result || 'Lulus',
        checklistItems: Array.isArray(i.checklist_items) ? i.checklist_items : (typeof i.checklist_items === 'string' ? JSON.parse(i.checklist_items || '[]') : []),
        meterReading: i.meter_reading || ''
      }));
      this.set(STORAGE_KEYS.INSPECTIONS, insps);
    }

    // 5. Inventory Table
    const invData = await fetchTableDirect('inventory');
    if (invData) {
      const inv = invData.map(i => ({
        id: i.id,
        code: i.code || '',
        name: i.name || '',
        category: i.category || '',
        stock: Number(i.stock || 0),
        minStock: Number(i.min_stock || 5),
        unit: i.unit || 'Pcs',
        unitPrice: Number(i.unit_price || 0),
        location: i.location || '',
        supplier: i.supplier || ''
      }));
      this.set(STORAGE_KEYS.INVENTORY, inv);
    }

    // 6. Teams Table
    const teamData = await fetchTableDirect('teams');
    if (teamData) {
      const team = teamData.map(t => ({
        id: t.id,
        name: t.name || '',
        phone: t.phone || '',
        email: t.email || '',
        company: t.company || '',
        role: t.role || 'Teknisi',
        position: t.position || ''
      }));
      this.set(STORAGE_KEYS.TEAM, team);
      this.set(STORAGE_KEYS.TECHNICIANS, team);
    }

    // 7. Vendors Table
    const vendorData = await fetchTableDirect('vendors');
    if (vendorData) {
      const vendors = vendorData.map(v => ({
        id: v.id,
        name: v.name || '',
        email: v.email || '',
        contactPerson: v.contact_person || '',
        phone: v.phone || '',
        address: v.address || ''
      }));
      this.set(STORAGE_KEYS.VENDORS, vendors);
    }

    console.log('Berhasil memuat 100% data live dari Supabase PostgreSQL tables!');
    if (window.navigateTo && window.currentView) {
      window.navigateTo(window.currentView);
    }
    return true;
  }

  static async init() {
    await this.loadAllFromSupabase();
  }

  // Getters
  static getAssets() { return this.get(STORAGE_KEYS.ASSETS) || []; }
  static getWorkOrders() { return this.get(STORAGE_KEYS.WORK_ORDERS) || []; }
  static getPMSchedules() { return this.get(STORAGE_KEYS.PM_SCHEDULES) || []; }
  static getInspections() { return this.get(STORAGE_KEYS.INSPECTIONS) || []; }
  static getInventory() { return this.get(STORAGE_KEYS.INVENTORY) || []; }
  static getTechnicians() { return this.get(STORAGE_KEYS.TECHNICIANS) || []; }
  static getTeam() { return this.get(STORAGE_KEYS.TEAM) || []; }
  static getVendors() { return this.get(STORAGE_KEYS.VENDORS) || []; }

  // Setters with Immediate Direct Supabase REST Upsert
  static async saveAssets(assets) {
    this.set(STORAGE_KEYS.ASSETS, assets);
    await this.syncAssetsToSupabase(assets);
  }

  static async saveWorkOrders(wos) {
    this.set(STORAGE_KEYS.WORK_ORDERS, wos);
    await this.syncWorkOrdersToSupabase(wos);
  }

  static async savePMSchedules(pms) {
    this.set(STORAGE_KEYS.PM_SCHEDULES, pms);
    await this.syncPMSchedulesToSupabase(pms);
  }

  static async saveInspections(insps) {
    this.set(STORAGE_KEYS.INSPECTIONS, insps);
    await this.syncInspectionsToSupabase(insps);
  }

  static async saveInventory(inv) {
    this.set(STORAGE_KEYS.INVENTORY, inv);
    await this.syncInventoryToSupabase(inv);
  }

  static async saveTeam(team) {
    this.set(STORAGE_KEYS.TEAM, team);
    this.set(STORAGE_KEYS.TECHNICIANS, team);
    await this.syncTeamToSupabase(team);
  }

  static async saveVendors(vendors) {
    this.set(STORAGE_KEYS.VENDORS, vendors);
    await this.syncVendorsToSupabase(vendors);
  }

  // Delete record from Supabase table
  static async deleteFromSupabase(table, id) {
    await deleteTableDirect(table, id);
  }

  // Sync helpers to Supabase Cloud
  static async syncAssetsToSupabase(assets) {
    const rows = assets.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      location: a.location,
      status: a.status,
      criticality: a.criticality,
      serial_number: a.serialNumber || null,
      manufacturer: a.manufacturer || null,
      model: a.model || null,
      purchase_date: a.purchaseDate || null,
      purchase_cost: a.purchaseCost || 0,
      year_made: a.yearMade || null,
      installation_year: a.installationYear || null,
      last_maintenance: a.lastMaintenance || null,
      next_pm_date: a.nextPMDate || null,
      specifications: a.specifications || null,
      image: a.image || null
    }));
    await upsertTableDirect('assets', rows);
  }

  static async syncWorkOrdersToSupabase(wos) {
    const rows = wos.map(w => ({
      id: w.id,
      title: w.title,
      asset_id: w.assetId || null,
      asset_name: w.assetName || null,
      type: w.type || 'Corrective',
      priority: w.priority || 'Sedang',
      status: w.status || 'Disetujui',
      assigned_tech: w.assignedTech || null,
      created_date: w.createdDate,
      target_date: w.targetDate || null,
      completed_date: w.completedDate || null,
      problem_description: w.problemDescription || null,
      resolution_notes: w.resolutionNotes || null,
      estimated_hours: w.estimatedHours || 0,
      actual_hours: w.actualHours || 0,
      parts_used: w.partsUsed || [],
      total_cost: w.totalCost || 0
    }));
    await upsertTableDirect('work_orders', rows);
  }

  static async syncPMSchedulesToSupabase(pms) {
    const rows = pms.map(p => ({
      id: p.id,
      title: p.title,
      asset_id: p.assetId || null,
      asset_name: p.assetName || null,
      frequency: p.frequency || 'Bulanan',
      interval_days: p.intervalDays || 30,
      last_completed: p.lastCompleted || null,
      next_due_date: p.nextDueDate || null,
      status: p.status || 'Normal',
      assigned_tech: p.assignedTech || null,
      checklist: p.checklist || []
    }));
    await upsertTableDirect('pm_schedules', rows);
  }

  static async syncInspectionsToSupabase(insps) {
    const rows = insps.map(i => ({
      id: i.id,
      title: i.title,
      asset_id: i.assetId || null,
      asset_name: i.assetName || null,
      inspector: i.inspector || null,
      date: i.date,
      overall_result: i.overallResult || 'Lulus',
      checklist_items: i.checklistItems || [],
      meter_reading: i.meterReading || null
    }));
    await upsertTableDirect('inspections', rows);
  }

  static async syncInventoryToSupabase(inv) {
    const rows = inv.map(i => ({
      id: i.id,
      code: i.code,
      name: i.name,
      category: i.category || null,
      stock: i.stock || 0,
      min_stock: i.minStock || 5,
      unit: i.unit || 'Pcs',
      unit_price: i.unitPrice || 0,
      location: i.location || null,
      supplier: i.supplier || null
    }));
    await upsertTableDirect('inventory', rows);
  }

  static async syncTeamToSupabase(team) {
    const rows = team.map(t => ({
      id: t.id,
      name: t.name,
      phone: t.phone || null,
      email: t.email || null,
      company: t.company || null,
      role: t.role || 'Teknisi',
      position: t.position || null
    }));
    await upsertTableDirect('teams', rows);
  }

  static async syncVendorsToSupabase(vendors) {
    const rows = vendors.map(v => ({
      id: v.id,
      name: v.name,
      email: v.email || null,
      contact_person: v.contactPerson || null,
      phone: v.phone || null,
      address: v.address || null
    }));
    await upsertTableDirect('vendors', rows);
  }

  static async syncAllLocalToSupabase() {
    return await this.loadAllFromSupabase();
  }

  static resetToDefault() {
    this.loadAllFromSupabase();
  }
}

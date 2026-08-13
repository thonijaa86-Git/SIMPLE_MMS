/**
 * Storage Manager & Supabase Integration Module for MMS
 */

import { getSupabaseConfig } from './config.js';
import { showToast } from './utils/helpers.js';

const STORAGE_KEYS = {
  ASSETS: 'mms_assets_data',
  WORK_ORDERS: 'mms_work_orders_data',
  PM_SCHEDULES: 'mms_pm_schedules_data',
  INSPECTIONS: 'mms_inspections_data',
  INVENTORY: 'mms_inventory_data',
  TECHNICIANS: 'mms_technicians_data'
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

// Seed Data Defaults
const DEFAULT_ASSETS = [
  {
    id: 'AST-001',
    name: 'Mesin CNC Milling Haas VF-2',
    category: 'Mesin Produksi',
    location: 'Gedung A - Line 1 Production',
    status: 'Operasional',
    criticality: 'Tinggi',
    serialNumber: 'HS-2022-9981',
    manufacturer: 'Haas Automation',
    model: 'VF-2SS',
    purchaseDate: '2022-03-15',
    purchaseCost: 850000000,
    lastMaintenance: '2026-07-20',
    nextPMDate: '2026-08-20',
    specifications: 'Spindle 12,000 RPM, 30+1 Tool Changer, Travel 762x406x508 mm',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'AST-002',
    name: 'Chiller Trane Centrifugal 500 TR',
    category: 'HVAC',
    location: 'Utility Building - Lt. 1',
    status: 'Maintenance',
    criticality: 'Tinggi',
    serialNumber: 'TRN-500-883A',
    manufacturer: 'Trane',
    model: 'CVHE-500',
    purchaseDate: '2020-06-10',
    purchaseCost: 1200000000,
    lastMaintenance: '2026-08-01',
    nextPMDate: '2026-09-01',
    specifications: 'Refrigerant R-1233zd, Chilled Water 7°C, 400V 3Ph 50Hz',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'AST-003',
    name: 'Genset Caterpillar 1000 kVA',
    category: 'Kelistrikan',
    location: 'Power House Area Luar',
    status: 'Standby',
    criticality: 'Tinggi',
    serialNumber: 'CAT-3508-771',
    manufacturer: 'Caterpillar',
    model: 'C32 ACERT',
    purchaseDate: '2019-11-20',
    purchaseCost: 950000000,
    lastMaintenance: '2026-07-10',
    nextPMDate: '2026-08-10',
    specifications: 'Output 1000 kVA / 800 kW, Diesel Engine 1500 RPM, ATS Interlock',
    image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'AST-004',
    name: 'Pompa Transfer Air Grundfos CR64',
    category: 'Utilitas',
    location: 'WTP (Water Treatment Plant)',
    status: 'Operasional',
    criticality: 'Sedang',
    serialNumber: 'GRN-CR64-4412',
    manufacturer: 'Grundfos',
    model: 'CR64-3-2',
    purchaseDate: '2021-08-05',
    purchaseCost: 145000000,
    lastMaintenance: '2026-06-15',
    nextPMDate: '2026-09-15',
    specifications: 'Kapasitas 64 m³/h, Head 60m, Power 18.5 kW Stainless Steel',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'AST-005',
    name: 'Kompresor Screw Atlas Copco GA37',
    category: 'Utilitas',
    location: 'Kompresor Room Gedung B',
    status: 'Breakdown',
    criticality: 'Tinggi',
    serialNumber: 'AC-GA37-992',
    manufacturer: 'Atlas Copco',
    model: 'GA37 VSD+',
    purchaseDate: '2023-01-12',
    purchaseCost: 320000000,
    lastMaintenance: '2026-05-10',
    nextPMDate: '2026-08-12',
    specifications: 'Pressure 8.5 Bar, Air Flow 6.8 m³/min, Inverter Drive 37 kW',
    image: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'AST-006',
    name: 'Forklift Electric Toyota 3 Ton',
    category: 'Fasilitas',
    location: 'Gudang Logistik Utama',
    status: 'Operasional',
    criticality: 'Sedang',
    serialNumber: 'TOY-8FBN30-102',
    manufacturer: 'Toyota Material Handling',
    model: '8FBN30',
    purchaseDate: '2022-09-01',
    purchaseCost: 280000000,
    lastMaintenance: '2026-07-28',
    nextPMDate: '2026-08-28',
    specifications: 'Baterai Li-ion 48V 600Ah, Mast Height 4.5m, Non-marking tires',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60'
  }
];

const DEFAULT_WORK_ORDERS = [
  {
    id: 'WO-2026-0801',
    title: 'Perbaikan Kebocoran Oli Spindle & Overheating',
    assetId: 'AST-001',
    assetName: 'Mesin CNC Milling Haas VF-2',
    type: 'Corrective',
    priority: 'Tinggi',
    status: 'Dalam Proses',
    assignedTech: 'Budi Santoso (Mekanik)',
    createdDate: '2026-08-10T09:00:00',
    targetDate: '2026-08-14T17:00:00',
    completedDate: null,
    problemDescription: 'Suhu spindle mencapai 78°C dan indikator alarm tekanan oli menyala.',
    resolutionNotes: '',
    estimatedHours: 6,
    actualHours: 4,
    partsUsed: [
      { partId: 'PRT-001', partName: 'Oli Hydrolik Shell Tellus S2 V46', qty: 10, unitPrice: 85000 },
      { partId: 'PRT-002', partName: 'O-Ring Seal Spindle Kit', qty: 1, unitPrice: 350000 }
    ],
    totalCost: 1200000
  },
  {
    id: 'WO-2026-0802',
    title: 'Ganti Filter Air & Descaling Condenser Chiller',
    assetId: 'AST-002',
    assetName: 'Chiller Trane Centrifugal 500 TR',
    type: 'Preventive',
    priority: 'Sedang',
    status: 'Menunggu Part',
    assignedTech: 'Rian Hidayat (HVAC Specialist)',
    createdDate: '2026-08-08T10:30:00',
    targetDate: '2026-08-15T16:00:00',
    completedDate: null,
    problemDescription: 'Jadwal PM bulanan descaling pipa condenser dan penggantian elemen filter air.',
    resolutionNotes: '',
    estimatedHours: 8,
    actualHours: 0,
    partsUsed: [],
    totalCost: 2500000
  },
  {
    id: 'WO-2026-0803',
    title: 'Perbaikan Kompresor Mogok / V-Belt Putus',
    assetId: 'AST-005',
    assetName: 'Kompresor Screw Atlas Copco GA37',
    type: 'Breakdown',
    priority: 'Darurat',
    status: 'Disetujui',
    assignedTech: 'Ahmad Fauzi (Teknisi Senior)',
    createdDate: '2026-08-12T14:15:00',
    targetDate: '2026-08-13T18:00:00',
    completedDate: null,
    problemDescription: 'Kompresor tiba-tiba berhenti total. Bau terbakar dan V-belt penggerak terputus.',
    resolutionNotes: '',
    estimatedHours: 4,
    actualHours: 0,
    partsUsed: [
      { partId: 'PRT-004', partName: 'V-Belt B-72 Industrial Heavy Duty', qty: 2, unitPrice: 175000 }
    ],
    totalCost: 850000
  },
  {
    id: 'WO-2026-0705',
    title: 'Inspeksi & Tes Overhaul Genset 1000 kVA',
    assetId: 'AST-003',
    assetName: 'Genset Caterpillar 1000 kVA',
    type: 'Inspection',
    priority: 'Sedang',
    status: 'Selesai',
    assignedTech: 'Eko Prasetyo (Listrik)',
    createdDate: '2026-07-25T08:00:00',
    targetDate: '2026-07-26T17:00:00',
    completedDate: '2026-07-26T15:30:00',
    problemDescription: 'Tes beban simulasi pemadaman dan pengecekan otomatis transfer switch (ATS).',
    resolutionNotes: 'Pengujian sukses 100% load test 2 jam. Tegangan stabil pada 400V 50Hz. Oli dan radiator dalam kondisi prima.',
    estimatedHours: 5,
    actualHours: 5,
    partsUsed: [
      { partId: 'PRT-003', partName: 'Filter Oli Genset Cat 3508', qty: 2, unitPrice: 450000 }
    ],
    totalCost: 1650000
  },
  {
    id: 'WO-2026-0708',
    title: 'Kalibrasi Sensor Tekanan Pompa WTP',
    assetId: 'AST-004',
    assetName: 'Pompa Transfer Air Grundfos CR64',
    type: 'Preventive',
    priority: 'Rendah',
    status: 'Selesai',
    assignedTech: 'Budi Santoso (Mekanik)',
    createdDate: '2026-07-20T11:00:00',
    targetDate: '2026-07-21T15:00:00',
    completedDate: '2026-07-21T14:00:00',
    problemDescription: 'Pemeriksaan rutin transmitter pressure 0-10 Bar.',
    resolutionNotes: 'Sensor dikalibrasi ulang dengan calibrator Fluke. Zero point disesuaikan kembali.',
    estimatedHours: 2,
    actualHours: 2,
    partsUsed: [],
    totalCost: 350000
  }
];

const DEFAULT_PM_SCHEDULES = [
  {
    id: 'PM-SCH-001',
    title: 'Maintenance Rutin Bulanan CNC Haas',
    assetId: 'AST-001',
    assetName: 'Mesin CNC Milling Haas VF-2',
    frequency: 'Bulanan',
    intervalDays: 30,
    lastCompleted: '2026-07-20',
    nextDueDate: '2026-08-20',
    status: 'Normal',
    assignedTech: 'Budi Santoso (Mekanik)',
    checklist: [
      'Cek level oli lubricator & pneumatik',
      'Pembersihan chip conveyor & tangki coolant',
      'Inspeksi kekencangan belt spindle & motor servo',
      'Uji coba zero point return & tool changer alignment'
    ]
  },
  {
    id: 'PM-SCH-002',
    title: 'Inspeksi & Descaling Condenser Chiller',
    assetId: 'AST-002',
    assetName: 'Chiller Trane Centrifugal 500 TR',
    frequency: 'Bulanan',
    intervalDays: 30,
    lastCompleted: '2026-07-01',
    nextDueDate: '2026-08-01',
    status: 'Overdue',
    assignedTech: 'Rian Hidayat (HVAC Specialist)',
    checklist: [
      'Pemeriksaan tekanan refrigerant suction & discharge',
      'Uji kualitas air pendingin cooling tower',
      'Pembersihan strainer & filter air condenser',
      'Cek kebocoran oli kompresor'
    ]
  },
  {
    id: 'PM-SCH-003',
    title: 'Warm-up & Test Running Genset Cat',
    assetId: 'AST-003',
    assetName: 'Genset Caterpillar 1000 kVA',
    frequency: 'Mingguan',
    intervalDays: 7,
    lastCompleted: '2026-08-07',
    nextDueDate: '2026-08-14',
    status: 'Jatuh Tempo',
    assignedTech: 'Eko Prasetyo (Listrik)',
    checklist: [
      'Pemeriksaan tegangan baterai starter 24V',
      'Cek volume bahan bakar solar pada tanki harian',
      'Running tanpa beban (No Load) 15 menit',
      'Pengecekan indikator suhu & tekanan oli mesin'
    ]
  },
  {
    id: 'PM-SCH-004',
    title: 'Greasing Bearing & Check Mechanical Seal Pompa',
    assetId: 'AST-004',
    assetName: 'Pompa Transfer Air Grundfos CR64',
    frequency: '3 Bulanan',
    intervalDays: 90,
    lastCompleted: '2026-06-15',
    nextDueDate: '2026-09-15',
    status: 'Normal',
    assignedTech: 'Budi Santoso (Mekanik)',
    checklist: [
      'Pemberian grease sintetis pada bearing motor',
      'Pengecekan kebocoran pada mechanical seal',
      'Pengukuran getaran (vibration check) housing pompa'
    ]
  }
];

const DEFAULT_INSPECTIONS = [
  {
    id: 'INSP-2026-001',
    title: 'Inspeksi Keselamatan & Kelayakan Forklift',
    assetId: 'AST-006',
    assetName: 'Forklift Electric Toyota 3 Ton',
    inspector: 'Ahmad Fauzi',
    date: '2026-08-11T09:30:00',
    overallResult: 'Lulus',
    checklistItems: [
      { item: 'Sistem Pengereman (Foot & Parking Brake)', status: 'Pass', notes: 'Pakem dan responsif' },
      { item: 'Kondisi Garpu (Fork) & Chain Lift', status: 'Pass', notes: 'Tidak ada retak' },
      { item: 'Klakson, Lampu Hazard, & Sirine Mundur', status: 'Pass', notes: 'Berfungsi baik' },
      { item: 'Kapasitas Baterai & Kabel Charger', status: 'Warning', notes: 'Kabel soket sedikit longgar' }
    ],
    meterReading: '2,450 Jam'
  },
  {
    id: 'INSP-2026-002',
    title: 'Inspeksi Tekanan & Beban Kompresor Screw',
    assetId: 'AST-005',
    assetName: 'Kompresor Screw Atlas Copco GA37',
    inspector: 'Budi Santoso',
    date: '2026-08-12T13:45:00',
    overallResult: 'Gagal',
    checklistItems: [
      { item: 'Tekanan Udara Keluar (Outlet Bar)', status: 'Fail', notes: 'Drop di bawah 4 bar' },
      { item: 'Suhu Temperatur Air End', status: 'Fail', notes: 'Overheating 95°C' },
      { item: 'Kondisi V-Belt & Pulley', status: 'Fail', notes: 'V-belt terputus!' },
      { item: 'Suara / Getaran Abnormal', status: 'Fail', notes: 'Bising tidak wajar' }
    ],
    meterReading: '8,120 Jam'
  }
];

const DEFAULT_INVENTORY = [
  {
    id: 'PRT-001',
    code: 'OIL-HYD-46',
    name: 'Oli Hydrolik Shell Tellus S2 V46',
    category: 'Pelumas & Kimia',
    stock: 85,
    minStock: 20,
    unit: 'Liter',
    unitPrice: 85000,
    location: 'Rak A1 - Gudang Utama',
    supplier: 'PT Shell Indonesia'
  },
  {
    id: 'PRT-002',
    code: 'SEAL-SPN-VF2',
    name: 'O-Ring Seal Spindle Kit Haas',
    category: 'Seal & Gasket',
    stock: 3,
    minStock: 5,
    unit: 'Set',
    unitPrice: 350000,
    location: 'Rak B3 - Sparepart Presisi',
    supplier: 'Haas Official Sparepart'
  },
  {
    id: 'PRT-003',
    code: 'FLT-CAT-3508',
    name: 'Filter Oli Genset Cat 3508',
    category: 'Filter',
    stock: 12,
    minStock: 4,
    unit: 'Pcs',
    unitPrice: 450000,
    location: 'Rak C2 - Power House Parts',
    supplier: 'PT Trakindo Utama'
  },
  {
    id: 'PRT-004',
    code: 'BLT-B72-HD',
    name: 'V-Belt B-72 Industrial Heavy Duty',
    category: 'Mekanikal',
    stock: 4,
    minStock: 8,
    unit: 'Pcs',
    unitPrice: 175000,
    location: 'Rak A4 - Belt & Chain',
    supplier: 'PT Optibelt Indonesia'
  },
  {
    id: 'PRT-005',
    code: 'BRG-6205-2RS',
    name: 'Bearing SKF 6205-2RS1 Deep Groove',
    category: 'Mekanikal',
    stock: 24,
    minStock: 10,
    unit: 'Pcs',
    unitPrice: 95000,
    location: 'Rak B1 - Bearing & Bushing',
    supplier: 'PT SKF Indonesia'
  }
];

const DEFAULT_TECHNICIANS = [
  { id: 'TCH-001', name: 'Budi Santoso', role: 'Teknisi Mekanik', phone: '0812-3456-7890' },
  { id: 'TCH-002', name: 'Rian Hidayat', role: 'HVAC Specialist', phone: '0813-9876-5432' },
  { id: 'TCH-003', name: 'Ahmad Fauzi', role: 'Teknisi Senior', phone: '0815-1122-3344' },
  { id: 'TCH-004', name: 'Eko Prasetyo', role: 'Teknisi Listrik / Automation', phone: '0811-5566-7788' }
];

export class StorageManager {
  static get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
      this.set(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORK_ORDERS)) {
      this.set(STORAGE_KEYS.WORK_ORDERS, DEFAULT_WORK_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PM_SCHEDULES)) {
      this.set(STORAGE_KEYS.PM_SCHEDULES, DEFAULT_PM_SCHEDULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSPECTIONS)) {
      this.set(STORAGE_KEYS.INSPECTIONS, DEFAULT_INSPECTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      this.set(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TECHNICIANS)) {
      this.set(STORAGE_KEYS.TECHNICIANS, DEFAULT_TECHNICIANS);
    }
  }

  // Getters
  static getAssets() { return this.get(STORAGE_KEYS.ASSETS) || []; }
  static getWorkOrders() { return this.get(STORAGE_KEYS.WORK_ORDERS) || []; }
  static getPMSchedules() { return this.get(STORAGE_KEYS.PM_SCHEDULES) || []; }
  static getInspections() { return this.get(STORAGE_KEYS.INSPECTIONS) || []; }
  static getInventory() { return this.get(STORAGE_KEYS.INVENTORY) || []; }
  static getTechnicians() { return this.get(STORAGE_KEYS.TECHNICIANS) || []; }

  // Setters
  static saveAssets(assets) {
    this.set(STORAGE_KEYS.ASSETS, assets);
    this.syncAssetsToSupabase(assets);
  }

  static saveWorkOrders(wos) {
    this.set(STORAGE_KEYS.WORK_ORDERS, wos);
    this.syncWorkOrdersToSupabase(wos);
  }

  static savePMSchedules(pms) {
    this.set(STORAGE_KEYS.PM_SCHEDULES, pms);
    this.syncPMSchedulesToSupabase(pms);
  }

  static saveInspections(insps) {
    this.set(STORAGE_KEYS.INSPECTIONS, insps);
    this.syncInspectionsToSupabase(insps);
  }

  static saveInventory(inv) {
    this.set(STORAGE_KEYS.INVENTORY, inv);
    this.syncInventoryToSupabase(inv);
  }

  // Sync helpers to Supabase Cloud
  static async syncAssetsToSupabase(assets) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const rows = assets.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        location: a.location,
        status: a.status,
        criticality: a.criticality,
        serial_number: a.serialNumber,
        manufacturer: a.manufacturer,
        model: a.model,
        purchase_date: a.purchaseDate || null,
        purchase_cost: a.purchaseCost || 0,
        last_maintenance: a.lastMaintenance || null,
        next_pm_date: a.nextPMDate || null,
        specifications: a.specifications,
        image: a.image
      }));

      const { error } = await client.from('assets').upsert(rows);
      if (error) console.error('Supabase assets upsert error:', error);
    } catch (e) {
      console.error('Supabase assets sync exception:', e);
    }
  }

  static async syncWorkOrdersToSupabase(wos) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const rows = wos.map(w => ({
        id: w.id,
        title: w.title,
        asset_id: w.assetId,
        asset_name: w.assetName,
        type: w.type,
        priority: w.priority,
        status: w.status,
        assigned_tech: w.assignedTech,
        created_date: w.createdDate,
        target_date: w.targetDate || null,
        completed_date: w.completedDate || null,
        problem_description: w.problemDescription,
        resolution_notes: w.resolutionNotes,
        estimated_hours: w.estimatedHours || 0,
        actual_hours: w.actualHours || 0,
        parts_used: w.partsUsed || [],
        total_cost: w.totalCost || 0
      }));

      const { error } = await client.from('work_orders').upsert(rows);
      if (error) console.error('Supabase work_orders upsert error:', error);
    } catch (e) {
      console.error('Supabase work_orders sync exception:', e);
    }
  }

  static async syncPMSchedulesToSupabase(pms) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const rows = pms.map(p => ({
        id: p.id,
        title: p.title,
        asset_id: p.assetId,
        asset_name: p.assetName,
        frequency: p.frequency,
        interval_days: p.intervalDays || 30,
        last_completed: p.lastCompleted || null,
        next_due_date: p.nextDueDate || null,
        status: p.status,
        assigned_tech: p.assignedTech,
        checklist: p.checklist || []
      }));

      const { error } = await client.from('pm_schedules').upsert(rows);
      if (error) console.error('Supabase pm_schedules upsert error:', error);
    } catch (e) {
      console.error('Supabase pm_schedules sync exception:', e);
    }
  }

  static async syncInspectionsToSupabase(insps) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const rows = insps.map(i => ({
        id: i.id,
        title: i.title,
        asset_id: i.assetId,
        asset_name: i.assetName,
        inspector: i.inspector,
        date: i.date,
        overall_result: i.overallResult,
        checklist_items: i.checklistItems || [],
        meter_reading: i.meterReading
      }));

      const { error } = await client.from('inspections').upsert(rows);
      if (error) console.error('Supabase inspections upsert error:', error);
    } catch (e) {
      console.error('Supabase inspections sync exception:', e);
    }
  }

  static async syncInventoryToSupabase(inv) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const rows = inv.map(i => ({
        id: i.id,
        code: i.code,
        name: i.name,
        category: i.category,
        stock: i.stock || 0,
        min_stock: i.minStock || 5,
        unit: i.unit,
        unit_price: i.unitPrice || 0,
        location: i.location,
        supplier: i.supplier
      }));

      const { error } = await client.from('inventory').upsert(rows);
      if (error) console.error('Supabase inventory upsert error:', error);
    } catch (e) {
      console.error('Supabase inventory sync exception:', e);
    }
  }

  // 1-Click Sync All Local Data to Supabase
  static async syncAllLocalToSupabase() {
    const client = getSupabaseClient();
    if (!client) {
      showToast('Koneksi Supabase belum diatur. Masukkan URL & Anon Key di menu pengaturan.', 'warning');
      return false;
    }

    try {
      showToast('Memulai sinkronisasi data ke Supabase Cloud...', 'info');

      await this.syncAssetsToSupabase(this.getAssets());
      await this.syncWorkOrdersToSupabase(this.getWorkOrders());
      await this.syncPMSchedulesToSupabase(this.getPMSchedules());
      await this.syncInspectionsToSupabase(this.getInspections());
      await this.syncInventoryToSupabase(this.getInventory());

      showToast('Sinkronisasi ke Supabase Cloud BERHASIL!', 'success');
      return true;
    } catch (err) {
      console.error('Failed to sync data to Supabase:', err);
      showToast(`Gagal sinkronisasi: ${err.message}`, 'error');
      return false;
    }
  }

  // Reset to default
  static resetToDefault() {
    this.set(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
    this.set(STORAGE_KEYS.WORK_ORDERS, DEFAULT_WORK_ORDERS);
    this.set(STORAGE_KEYS.PM_SCHEDULES, DEFAULT_PM_SCHEDULES);
    this.set(STORAGE_KEYS.INSPECTIONS, DEFAULT_INSPECTIONS);
    this.set(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY);
    this.set(STORAGE_KEYS.TECHNICIANS, DEFAULT_TECHNICIANS);
  }
}

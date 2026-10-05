import { getCurrentUser } from './api.js';

export const ACCESS = {
  MASTER_EQUIPMENT: 'master_equipment',
  MASTER_LAB: 'master_lab',
  MASTER_USERS: 'master_users',
  INPUT_EQUIPMENT: 'input_equipment',
  EQUIPMENT_USAGE: 'equipment_usage',
  EQUIPMENT_ELIGIBILITY: 'equipment_eligibility',
  LOAN_REQUEST: 'loan_request',
  RETURN_PROCESS: 'return_process',
  DIGITAL_CHECK_FORM: 'digital_check_form',
  LOCATION_TRACKING: 'location_tracking',
  LOAN_HISTORY: 'loan_history',
  LOCATION_HISTORY: 'location_history',
  REPORTS: 'reports',
  CALIBRATION_DOCUMENTS: 'calibration_documents',
  QR_CODE: 'qr_code',
  SYSTEM_SETTINGS: 'system_settings',
};

export const ACTIONS = {
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete',
  VIEW: 'view',
};

const VIEW = [ACTIONS.VIEW];
const CRUD = [ACTIONS.ADD, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.VIEW];
const ADD_EDIT_VIEW = [ACTIONS.ADD, ACTIONS.EDIT, ACTIONS.VIEW];

// Matriks mengikuti dokumen hak akses dan aturan backend:
// - Admin: Semua modul CRUD
// - Manager: Mengisi/mengajukan dan menyetujui verifikasi, pengawasan, dan master data tertentu
// - Staff pengelola: Boleh input peralatan dan mengajukan/menandatangani verifikasi (TLKM13/F/003)
// - Staff biasa: Dapat melihat verifikasi, tetapi hanya pengelola yang dapat mengisi/mengajukan
// - Pengajuan peminjaman hanya untuk staff; Admin dan Manager Lab tidak dapat mengajukan
//   peminjaman (TLKM13/IK/005 butir 3.a dan 3.c)
const ROLE_PERMISSIONS = {
  staff: {
    [ACCESS.MASTER_EQUIPMENT]: VIEW,
    [ACCESS.MASTER_LAB]: VIEW,
    [ACCESS.MASTER_USERS]: VIEW,
    [ACCESS.REPORTS]: VIEW,
    [ACCESS.LOAN_REQUEST]: ADD_EDIT_VIEW,
    [ACCESS.RETURN_PROCESS]: ADD_EDIT_VIEW,
    [ACCESS.DIGITAL_CHECK_FORM]: ADD_EDIT_VIEW,
    [ACCESS.LOCATION_TRACKING]: VIEW,
    [ACCESS.LOAN_HISTORY]: VIEW,
    [ACCESS.LOCATION_HISTORY]: VIEW,
    [ACCESS.QR_CODE]: VIEW,
  },
  manager: {
    [ACCESS.MASTER_EQUIPMENT]: VIEW,
    [ACCESS.MASTER_LAB]: VIEW,
    [ACCESS.MASTER_USERS]: [ACTIONS.VIEW, ACTIONS.EDIT],
    [ACCESS.INPUT_EQUIPMENT]: VIEW,
    [ACCESS.EQUIPMENT_USAGE]: CRUD,
    [ACCESS.EQUIPMENT_ELIGIBILITY]: [ACTIONS.VIEW, ACTIONS.EDIT],
    // Menyetujui peminjaman (butir 3.a), tidak mengajukan. ADD dikunci di dalam can().
    [ACCESS.LOAN_REQUEST]: VIEW,
    [ACCESS.RETURN_PROCESS]: ADD_EDIT_VIEW,
    [ACCESS.DIGITAL_CHECK_FORM]: ADD_EDIT_VIEW,
    [ACCESS.LOCATION_TRACKING]: CRUD,
    [ACCESS.LOAN_HISTORY]: VIEW,
    [ACCESS.LOCATION_HISTORY]: VIEW,
    [ACCESS.REPORTS]: ADD_EDIT_VIEW,
    [ACCESS.CALIBRATION_DOCUMENTS]: CRUD,
    [ACCESS.QR_CODE]: VIEW,
    [ACCESS.SYSTEM_SETTINGS]: VIEW,
  },
  // Admin memiliki hak penuh (CRUD) untuk semua fitur, kecuali Pengajuan Peminjaman
  // yang dikunci di atas. Aturan itu diterapkan terpisah dari matriks ini.
  admin: Object.fromEntries(Object.values(ACCESS).map((feature) => [feature, CRUD])),
};

export function getUserRole(user = getCurrentUser()) {
  return (user?.role || 'staff').toLowerCase();
}

export function isStaffPengelola(user = getCurrentUser()) {
  const role = getUserRole(user);
  if (role !== 'staff') return false;
  const pengelola = user?.pengelola;
  return pengelola === true || pengelola === 1 || pengelola === '1' || String(pengelola).toLowerCase() === 'true';
}

export function can(feature, action = ACTIONS.VIEW, user = getCurrentUser()) {
  const role = getUserRole(user);
  const isPengelola = isStaffPengelola(user);

  // 1. Pengajuan Peminjaman (TLKM13/IK/005 butir 8.1):
  // Peminjam adalah personel TTH yang menggunakan dan bertanggung jawab atas peralatan
  // (butir 3.c). Admin dan Manager Lab menjalankan peran pengawasan — Admin mengelola
  // sistem, Manager Lab menyetujui peminjaman (butir 3.a) — sehingga keduanya tidak
  // dapat mengajukan peminjaman atas nama sendiri. Aturan ini diperiksa sebelum
  // hak penuh Admin agar tidak membuka tombol Pinjam untuk Admin.
  if (feature === ACCESS.LOAN_REQUEST && action === ACTIONS.ADD) {
    return role === 'staff';
  }

  // 2. Admin memiliki hak penuh (CRUD) untuk semua fitur
  if (role === 'admin') {
    return true;
  }

  // 3. Input Peralatan (POST /api/peralatan):
  // Berdasarkan backend RequireAdminOrStaffPengelola(), hanya Admin dan Staff Pengelola yang diizinkan menambah.
  // Staff biasa tidak diizinkan dan memerlukan penetapan pengelola dari manager.
  if (feature === ACCESS.INPUT_EQUIPMENT) {
    if (action === ACTIONS.ADD) {
      return role === 'staff' && isPengelola;
    }
    if (action === ACTIONS.VIEW) {
      return true;
    }
    return false;
  }

  // 4. Verifikasi Kelayakan Peralatan (TLKM13/F/003):
  // - Semua staff dapat melihat, tetapi hanya staff pengelola yang dapat mengisi dan mengajukan.
  // - Staff pengelola boleh mengisi, menandatangani, dan mengajukan (ADD, EDIT, VIEW).
  // - Manager dapat mengisi/mengajukan serta meninjau, menyetujui, dan menolak.
  if (feature === ACCESS.EQUIPMENT_ELIGIBILITY) {
    if (role === 'staff') {
      if (action === ACTIONS.VIEW) return true;
      return isPengelola && [ACTIONS.ADD, ACTIONS.EDIT].includes(action);
    }
    if (role === 'manager') {
      return [ACTIONS.ADD, ACTIONS.VIEW, ACTIONS.EDIT].includes(action);
    }
  }

  return ROLE_PERMISSIONS[role]?.[feature]?.includes(action) || false;
}

export function canAny(feature, actions, user = getCurrentUser()) {
  return actions.some((action) => can(feature, action, user));
}
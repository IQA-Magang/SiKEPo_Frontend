import { getCurrentUser } from './api.js';

export const ACCESS = {
  MASTER_EQUIPMENT: 'master_equipment',
  MASTER_LAB: 'master_lab',
  MASTER_USER_PIC: 'master_user_pic',
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
// - Manager: Persetujuan verifikasi, pengawasan, dan master data tertentu
// - Staff PIC: Boleh input peralatan (POST /api/peralatan) dan mengajukan/menandatangani verifikasi (TLKM13/F/003)
// - Staff Biasa: Hanya dapat melihat (VIEW), tidak dapat menambah peralatan atau mengajukan verifikasi tanpa penugasan PIC oleh Admin
const ROLE_PERMISSIONS = {
  staff: {
    [ACCESS.MASTER_EQUIPMENT]: VIEW,
    [ACCESS.MASTER_LAB]: VIEW,
    [ACCESS.MASTER_USER_PIC]: VIEW,
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
    [ACCESS.MASTER_USER_PIC]: VIEW,
    [ACCESS.INPUT_EQUIPMENT]: VIEW,
    [ACCESS.EQUIPMENT_USAGE]: CRUD,
    [ACCESS.EQUIPMENT_ELIGIBILITY]: [ACTIONS.VIEW, ACTIONS.EDIT],
    [ACCESS.LOAN_REQUEST]: ADD_EDIT_VIEW,
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
  admin: Object.fromEntries(Object.values(ACCESS).map((feature) => [feature, CRUD])),
};

export function getUserRole(user = getCurrentUser()) {
  return (user?.role || 'staff').toLowerCase();
}

export function isStaffPic(user = getCurrentUser()) {
  return getUserRole(user) === 'staff' && Boolean(user?.pic);
}

export function can(feature, action = ACTIONS.VIEW, user = getCurrentUser()) {
  const role = getUserRole(user);
  const isPic = Boolean(user?.pic);

  // 1. Admin memiliki hak penuh (CRUD) untuk semua fitur
  if (role === 'admin') {
    return true;
  }

  // 2. Input Peralatan (POST /api/peralatan):
  // Berdasarkan backend RequireAdminOrStaffPIC(), hanya Admin dan Staff PIC yang diizinkan menambah.
  // Staff biasa tidak diizinkan dan butuh akses (ditetapkan sebagai PIC) dari admin.
  if (feature === ACCESS.INPUT_EQUIPMENT) {
    if (action === ACTIONS.ADD) {
      return role === 'staff' && isPic;
    }
    if (action === ACTIONS.VIEW) {
      return true;
    }
    return false;
  }

  // 3. Verifikasi Kelayakan Peralatan (TLKM13/F/003):
  // - Staff biasa yang bukan PIC tidak diizinkan (harus dapat penugasan PIC dari admin).
  // - Staff PIC boleh mengisi, menandatangani, dan mengajukan (ADD, EDIT, VIEW).
  // - Manager dapat meninjau, menyetujui, dan menolak (VIEW, EDIT).
  if (feature === ACCESS.EQUIPMENT_ELIGIBILITY) {
    if (role === 'staff') {
      if (!isPic) return false;
      return [ACTIONS.ADD, ACTIONS.EDIT, ACTIONS.VIEW].includes(action);
    }
    if (role === 'manager') {
      return [ACTIONS.VIEW, ACTIONS.EDIT].includes(action);
    }
  }

  return ROLE_PERMISSIONS[role]?.[feature]?.includes(action) || false;
}

export function canAny(feature, actions, user = getCurrentUser()) {
  return actions.some((action) => can(feature, action, user));
}
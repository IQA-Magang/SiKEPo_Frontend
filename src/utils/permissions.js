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

// Matriks mengikuti dokumen hak akses: staff = Personel TTH.
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
    [ACCESS.EQUIPMENT_ELIGIBILITY]: ADD_EDIT_VIEW,
    [ACCESS.QR_CODE]: VIEW,
  },
  manager: {
    [ACCESS.MASTER_EQUIPMENT]: VIEW,
    [ACCESS.MASTER_LAB]: VIEW,
    [ACCESS.MASTER_USER_PIC]: VIEW,
    [ACCESS.INPUT_EQUIPMENT]: CRUD,
    [ACCESS.EQUIPMENT_USAGE]: CRUD,
    [ACCESS.EQUIPMENT_ELIGIBILITY]: CRUD,
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

export function isUserPic(user = getCurrentUser()) {
  if (!user) return false;
  return Boolean(user.pic === true || user.pic === 1 || user.pic === '1' || user.pic === 'true');
}

export function isStaffPic(user = getCurrentUser()) {
  return getUserRole(user) === 'staff' && isUserPic(user);
}

export function can(feature, action = ACTIONS.VIEW, user = getCurrentUser()) {
  const role = getUserRole(user);
  const isPic = isUserPic(user);

  // Penambahan peralatan baru (INPUT_EQUIPMENT):
  // - Seluruh role yang berhak dapat melihat (VIEW)
  // - Admin: selalu diizinkan (CRUD)
  // - Staff PIC: diizinkan menambah (ADD) dan melihat (VIEW)
  // - Staff biasa: TIDAK diizinkan menambah (memerlukan hak PIC dari admin), hanya VIEW
  // - Manager: diizinkan VIEW & EDIT
  if (feature === ACCESS.INPUT_EQUIPMENT) {
    if (action === ACTIONS.VIEW) return true;
    if (role === 'admin' || role === 'manager') return true;
    if (role === 'staff') return isPic && action === ACTIONS.ADD;
    return false;
  }

  // Verifikasi kelayakan (EQUIPMENT_ELIGIBILITY):
  // - Seluruh role dapat MELIHAT (VIEW) status & riwayat verifikasi
  // - Pengisian / Pengajuan verifikasi (ADD/EDIT): hanya Staff PIC, Admin, dan Manager
  if (feature === ACCESS.EQUIPMENT_ELIGIBILITY) {
    if (action === ACTIONS.VIEW) return true;
    if (role === 'admin' || role === 'manager') return true;
    if (role === 'staff') return isPic;
    return false;
  }

  return ROLE_PERMISSIONS[role]?.[feature]?.includes(action) || false;
}

export function canAny(feature, actions, user = getCurrentUser()) {
  return actions.some((action) => can(feature, action, user));
}
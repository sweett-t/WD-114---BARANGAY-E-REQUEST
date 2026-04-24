// ============================================
// BARANGAY eREQUEST SYSTEM - CORE INFRASTRUCTURE
// ============================================

const STORAGE_KEYS = {
  USERS: 'barangay_users',
  RESIDENTS: 'barangay_residents',
  HOUSEHOLDS: 'barangay_households',
  REQUESTS: 'barangay_requests',
  BLOTTER: 'barangay_blotter',
  LOGS: 'barangay_logs',
  PAYMENTS: 'barangay_payments',
  SETTINGS: 'barangay_settings',
  CURRENT_USER: 'barangay_current_user',
  CURRENT_MODE: 'barangay_current_mode'
};

const REQUEST_TYPES = [
  'Barangay Clearance',
  'Barangay ID',
  'Barangay Permit',
  'Certificate of Indigency',
  'Certificate of Residency',
  'Certificate of Good Moral Character',
  'Travel Certification',
  'Senior Citizen',
  'Solo Parent'
];

const BLOTTER_SEVERITY = ['Minor', 'Moderate', 'Serious', 'Critical'];
const BLOTTER_STATUS = ['Pending', 'Ongoing', 'Resolved', 'Escalated'];
const REQUEST_STATUS = ['pending', 'approved', 'rejected', 'released'];

const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateControlNumber() {
  return 'CN' + Date.now();
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateAge(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function saveItem(key, item) {
  const items = getData(key);
  items.push(item);
  setData(key, items);
}

function updateItem(key, id, updates) {
  const items = getData(key);
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setData(key, items);
    return items[index];
  }
  return null;
}

function deleteItem(key, id) {
  const items = getData(key);
  const filtered = items.filter(item => item.id !== id);
  setData(key, filtered);
}

function findItem(key, id) {
  const items = getData(key);
  return items.find(item => item.id === id);
}

function findItems(key, predicate) {
  const items = getData(key);
  return items.filter(predicate);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

function getCurrentMode() {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_MODE) || 'user';
}

function setCurrentMode(mode) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, mode);
}

function login(identifier, password) {
  const users = getData(STORAGE_KEYS.USERS);
  const user = users.find(u => 
    (u.phone === identifier || u.email === identifier || u.username === identifier) && 
    u.password === password
  );
  
  if (user) {
    checkAdminTerm(user);
    setCurrentUser(user);
    setCurrentMode(ROLES.USER);
    logAction(user.id, user.roles[0] || ROLES.USER, 'login');
    return { success: true, user };
  }
  return { success: false, message: 'Invalid credentials' };
}

function logout() {
  const user = getCurrentUser();
  if (user) {
    logAction(user.id, getCurrentMode(), 'logout');
  }
  setCurrentUser(null);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_MODE);
  window.location.href = '../index.html';
}

function signup(userData) {
  const users = getData(STORAGE_KEYS.USERS);
  
  if (userData.phone && users.find(u => u.phone === userData.phone)) {
    return { success: false, message: 'Phone number already registered' };
  }
  
  if (userData.email && users.find(u => u.email === userData.email)) {
    return { success: false, message: 'Email already registered' };
  }
  
  if (userData.username && users.find(u => u.username === userData.username)) {
    return { success: false, message: 'Username already taken' };
  }
  
  if (!userData.phone && !userData.email && !userData.username) {
    return { success: false, message: 'At least one login identifier required (phone, email, or username)' };
  }
  
  const age = calculateAge(userData.birthdate);
  const roles = age >= 18 ? [ROLES.USER] : [];
  const dependent = age < 18;
  
  const newUser = {
    id: generateId(),
    username: userData.username || null,
    email: userData.email || null,
    phone: userData.phone || null,
    password: userData.password,
    fullName: `${userData.first_name} ${userData.middle_name || ''} ${userData.last_name}`.replace(/\s+/g, ' ').trim(),
    firstName: userData.first_name,
    middleName: userData.middle_name || null,
    lastName: userData.last_name,
    suffix: userData.suffix || null,
    birthdate: userData.birthdate,
    sex: userData.sex,
    civilStatus: userData.civil_status,
    phone: userData.phone,
    phoneVerified: phoneVerified,
    altContact: userData.alt_contact || null,
    emailVerified: emailVerified,
    roles: roles,
    dependent: dependent,
    createdAt: getCurrentTimestamp(),
    status: 'active'
  };
  
  users.push(newUser);
  setData(STORAGE_KEYS.USERS, users);
  
  const address = {
    country: 'Philippines',
    region: 'Region XI - Davao Region',
    province: 'Davao del Sur',
    city: 'Davao City',
    barangay: 'Obrero',
    purok: userData.purok,
    street: userData.street,
    houseNumber: userData.house_number,
    landmark: userData.landmark || ''
  };
  
  let householdId = userData.householdId || null;
  
  if (userData.create_new_household && userData.household_name) {
    const newHousehold = {
      id: generateId(),
      name: userData.household_name,
      address: address,
      headId: userData.is_household_head ? newUser.id : null,
      members: [newUser.id],
      createdAt: getCurrentTimestamp()
    };
    saveItem(STORAGE_KEYS.HOUSEHOLDS, newHousehold);
    householdId = newHousehold.id;
  }
  
  const dependents = [];
  if (userData.dependents && userData.dependents.length > 0) {
    userData.dependents.forEach(dep => {
      const dependent = {
        id: generateId(),
        headId: newUser.id,
        name: dep.name,
        relation: dep.relation,
        birthdate: dep.birthdate,
        householdId: householdId,
        createdAt: getCurrentTimestamp()
      };
      dependents.push(dependent);
      saveItem(STORAGE_KEYS.RESIDENTS, dependent);
    });
  }
  
  const resident = {
    id: generateId(),
    userId: newUser.id,
    fullName: newUser.fullName,
    firstName: userData.first_name,
    middleName: userData.middle_name || null,
    lastName: userData.last_name,
    suffix: userData.suffix || null,
    birthdate: userData.birthdate,
    sex: userData.sex,
    civilStatus: userData.civil_status,
    contact: {
      phone: userData.phone,
      email: userData.email || null,
      altContact: userData.alt_contact || null
    },
    address: address,
    householdId: householdId,
    profilePic: userData.profile_pic || null,
    idInfo: {
      type: userData.id_type || null,
      number: userData.id_number || null,
      front: userData.id_front || null,
      back: userData.id_back || null
    },
    verified: false,
    verificationStatus: userData.id_type ? 'pending' : 'unverified',
    blotterHistory: [],
    createdAt: getCurrentTimestamp()
  };
  
  saveItem(STORAGE_KEYS.RESIDENTS, resident);
  logAction(newUser.id, ROLES.USER, 'signup');
  
  setCurrentUser(newUser);
  setCurrentMode(ROLES.USER);
  
  return { success: true, user: newUser, resident };
}

// ============================================
// ROLE & PERMISSION FUNCTIONS
// ============================================

function hasRole(role) {
  const user = getCurrentUser();
  return user && user.roles && user.roles.includes(role);
}

function hasAnyRole(roles) {
  const user = getCurrentUser();
  return user && user.roles && user.roles.some(r => roles.includes(r));
}

function checkAdminTerm(user) {
  if (!user.roles || !user.roles.includes(ROLES.ADMIN)) return user;
  
  const now = new Date();
  const termEnd = user.termEnd ? new Date(user.termEnd) : null;
  
  if (termEnd && now > termEnd) {
    user.roles = user.roles.filter(r => r !== ROLES.ADMIN);
    user.adminStatus = 'expired';
    const users = getData(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      setData(STORAGE_KEYS.USERS, users);
    }
  }
  return user;
}

function canApproveRequest(requestId) {
  const user = getCurrentUser();
  const request = findItem(STORAGE_KEYS.REQUESTS, requestId);
  if (!request || !user) return false;
  if (request.userId === user.id) return false;
  return hasAnyRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
}

// ============================================
// HOUSEHOLD FUNCTIONS
// ============================================

function createHousehold(name, address, headId) {
  const households = getData(STORAGE_KEYS.HOUSEHOLDS);
  
  const exists = households.find(h => 
    h.address.street === address.street && 
    h.address.block === address.block &&
    h.headId === headId
  );
  
  if (exists) {
    return { success: false, message: 'Household already exists at this address' };
  }
  
  const household = {
    id: generateId(),
    name: name,
    address: address,
    headId: headId,
    members: [headId],
    createdAt: getCurrentTimestamp()
  };
  
  households.push(household);
  setData(STORAGE_KEYS.HOUSEHOLDS, households);
  
  return { success: true, household };
}

function joinHousehold(householdId, userId) {
  const households = getData(STORAGE_KEYS.HOUSEHOLDS);
  const household = households.find(h => h.id === householdId);
  
  if (!household) {
    return { success: false, message: 'Household not found' };
  }
  
  if (household.members.includes(userId)) {
    return { success: false, message: 'Already a member' };
  }
  
  household.members.push(userId);
  setData(STORAGE_KEYS.HOUSEHOLDS, households);
  
  const residents = getData(STORAGE_KEYS.RESIDENTS);
  const resident = residents.find(r => r.userId === userId);
  if (resident) {
    resident.householdId = householdId;
    setData(STORAGE_KEYS.RESIDENTS, residents);
  }
  
  return { success: true, household };
}

function getHousehold(householdId) {
  return findItem(STORAGE_KEYS.HOUSEHOLDS, householdId);
}

function searchHouseholds(query) {
  const households = getData(STORAGE_KEYS.HOUSEHOLDS);
  const q = query.toLowerCase();
  return households.filter(h => 
    h.name.toLowerCase().includes(q) ||
    h.address.street.toLowerCase().includes(q) ||
    h.address.block.toLowerCase().includes(q)
  );
}

// ============================================
// REQUEST FUNCTIONS
// ============================================

function createRequest(userId, type, residentData) {
  const request = {
    id: generateId(),
    userId: userId,
    type: type,
    status: 'pending',
    paymentStatus: 'unpaid',
    controlNumber: generateControlNumber(),
    residentName: residentData.fullName,
    residentAddress: formatAddress(residentData.address),
    householdId: residentData.householdId,
    createdAt: getCurrentTimestamp(),
    locked: false,
    rejectionReason: null
  };
  
  saveItem(STORAGE_KEYS.REQUESTS, request);
  logAction(userId, getCurrentMode(), 'create_request', request.id);
  
  return { success: true, request };
}

function approveRequest(requestId) {
  const user = getCurrentUser();
  const request = findItem(STORAGE_KEYS.REQUESTS, requestId);
  
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  
  if (!canApproveRequest(requestId)) {
    return { success: false, message: 'Cannot approve own request' };
  }
  
  if (request.locked) {
    return { success: false, message: 'Request already processed' };
  }
  
  request.status = 'approved';
  request.locked = true;
  request.approvedBy = user.id;
  request.approvedAt = getCurrentTimestamp();
  
  updateItem(STORAGE_KEYS.REQUESTS, requestId, request);
  logAction(user.id, getCurrentMode(), 'approve_request', requestId);
  
  return { success: true, request };
}

function rejectRequest(requestId, reason) {
  const user = getCurrentUser();
  const request = findItem(STORAGE_KEYS.REQUESTS, requestId);
  
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  
  if (!canApproveRequest(requestId)) {
    return { success: false, message: 'Cannot reject own request' };
  }
  
  if (request.locked) {
    return { success: false, message: 'Request already processed' };
  }
  
  request.status = 'rejected';
  request.locked = true;
  request.rejectionReason = reason;
  request.rejectedBy = user.id;
  request.rejectedAt = getCurrentTimestamp();
  
  updateItem(STORAGE_KEYS.REQUESTS, requestId, request);
  logAction(user.id, getCurrentMode(), 'reject_request', requestId);
  
  return { success: true, request };
}

function releaseRequest(requestId) {
  const request = findItem(STORAGE_KEYS.REQUESTS, requestId);
  
  if (!request) {
    return { success: false, message: 'Request not found' };
  }
  
  request.status = 'released';
  request.releasedAt = getCurrentTimestamp();
  
  updateItem(STORAGE_KEYS.REQUESTS, requestId, request);
  
  return { success: true, request };
}

function getUserRequests(userId) {
  return findItems(STORAGE_KEYS.REQUESTS, r => r.userId === userId);
}

function getAllRequests(filters = {}) {
  let requests = getData(STORAGE_KEYS.REQUESTS);
  
  if (filters.status) {
    requests = requests.filter(r => r.status === filters.status);
  }
  
  if (filters.type) {
    requests = requests.filter(r => r.type === filters.type);
  }
  
  if (filters.search) {
    const q = filters.search.toLowerCase();
    requests = requests.filter(r => 
      r.residentName.toLowerCase().includes(q) ||
      r.controlNumber.toLowerCase().includes(q)
    );
  }
  
  return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ============================================
// BLOTTER FUNCTIONS
// ============================================

function createBlotter(data) {
  const blotter = {
    id: generateId(),
    complainantId: data.complainantId,
    respondentId: data.respondentId || null,
    complainantName: data.complainantName,
    respondentName: data.respondentName || '',
    description: data.description,
    category: data.category || 'General',
    severity: data.severity || 'Minor',
    status: 'Pending',
    date: getCurrentTimestamp(),
    notes: [],
    createdBy: getCurrentUser().id,
    createdAt: getCurrentTimestamp()
  };
  
  saveItem(STORAGE_KEYS.BLOTTER, blotter);
  logAction(getCurrentUser().id, getCurrentMode(), 'create_blotter', blotter.id);
  
  const complainant = findItem(STORAGE_KEYS.RESIDENTS, data.complainantId);
  if (complainant) {
    complainant.blotterHistory.push(blotter.id);
    updateItem(STORAGE_KEYS.RESIDENTS, complainant.id, complainant);
  }
  
  return { success: true, blotter };
}

function updateBlotter(blotterId, updates) {
  const blotter = updateItem(STORAGE_KEYS.BLOTTER, blotterId, updates);
  if (blotter) {
    logAction(getCurrentUser().id, getCurrentMode(), 'update_blotter', blotterId);
  }
  return blotter;
}

function addBlotterNote(blotterId, note) {
  const blotter = findItem(STORAGE_KEYS.BLOTTER, blotterId);
  if (!blotter) return null;
  
  blotter.notes.push({
    id: generateId(),
    note: note,
    addedBy: getCurrentUser().id,
    addedAt: getCurrentTimestamp()
  });
  
  updateItem(STORAGE_KEYS.BLOTTER, blotterId, blotter);
  return blotter;
}

function evaluateGoodMoral(userId) {
  const resident = findItems(STORAGE_KEYS.RESIDENTS, r => r.userId === userId)[0];
  if (!resident) return { recommended: true, reason: 'Resident not found' };
  
  const blotterRecords = getData(STORAGE_KEYS.BLOTTER);
  const userBlotter = blotterRecords.filter(b => 
    b.complainantId === resident.id || b.respondentId === resident.id
  );
  
  const criticalCases = userBlotter.filter(b => b.severity === 'Critical' && b.status !== 'Resolved');
  if (criticalCases.length > 0) {
    return { recommended: false, needsReview: true, reason: 'Has unresolved critical cases' };
  }
  
  const seriousCases = userBlotter.filter(b => b.severity === 'Serious' && b.status !== 'Resolved');
  if (seriousCases.length > 0) {
    return { recommended: false, needsReview: true, reason: 'Has unresolved serious cases' };
  }
  
  return { recommended: true, needsReview: false, reason: 'No blotter records found' };
}

// ============================================
// ADMIN MANAGEMENT FUNCTIONS
// ============================================

function promoteToAdmin(userId, position, termStart, termEnd) {
  const user = findItem(STORAGE_KEYS.USERS, userId);
  if (!user) return { success: false, message: 'User not found' };
  
  if (!hasRole(ROLES.SUPER_ADMIN)) {
    return { success: false, message: 'Unauthorized' };
  }
  
  if (!user.roles) user.roles = [];
  if (!user.roles.includes(ROLES.ADMIN)) {
    user.roles.push(ROLES.ADMIN);
  }
  
  user.position = position;
  user.termStart = termStart;
  user.termEnd = termEnd;
  user.adminStatus = 'active';
  
  updateItem(STORAGE_KEYS.USERS, userId, user);
  logAction(getCurrentUser().id, ROLES.SUPER_ADMIN, 'promote_to_admin', userId);
  
  return { success: true, user };
}

function demoteToUser(userId) {
  const user = findItem(STORAGE_KEYS.USERS, userId);
  if (!user) return { success: false, message: 'User not found' };
  
  user.roles = user.roles.filter(r => r !== ROLES.ADMIN);
  user.position = null;
  user.termStart = null;
  user.termEnd = null;
  user.adminStatus = null;
  
  updateItem(STORAGE_KEYS.USERS, userId, user);
  logAction(getCurrentUser().id, getCurrentMode(), 'demote_to_user', userId);
  
  return { success: true, user };
}

// ============================================
// AUDIT LOG FUNCTIONS
// ============================================

function logAction(userId, role, action, targetId = null) {
  const log = {
    id: generateId(),
    userId: userId,
    role: role,
    action: action,
    targetId: targetId,
    timestamp: getCurrentTimestamp()
  };
  
  saveItem(STORAGE_KEYS.LOGS, log);
}

function getLogs(filters = {}) {
  let logs = getData(STORAGE_KEYS.LOGS);
  
  if (filters.userId) {
    logs = logs.filter(l => l.userId === filters.userId);
  }
  
  if (filters.action) {
    logs = logs.filter(l => l.action === filters.action);
  }
  
  if (filters.from) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.from));
  }
  
  if (filters.to) {
    logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.to));
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

function getAnalytics() {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const residents = getData(STORAGE_KEYS.RESIDENTS);
  const blotter = getData(STORAGE_KEYS.BLOTTER);
  const users = getData(STORAGE_KEYS.USERS);
  
  const analytics = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    approvedRequests: requests.filter(r => r.status === 'approved').length,
    rejectedRequests: requests.filter(r => r.status === 'rejected').length,
    releasedRequests: requests.filter(r => r.status === 'released').length,
    totalResidents: residents.length,
    verifiedResidents: residents.filter(r => r.verified).length,
    totalBlotter: blotter.length,
    blotterPending: blotter.filter(b => b.status === 'Pending').length,
    blotterResolved: blotter.filter(b => b.status === 'Resolved').length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length
  };
  
  return analytics;
}

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

function verifyDocument(controlNumber) {
  const request = findItems(STORAGE_KEYS.REQUESTS, r => 
    r.controlNumber === controlNumber
  )[0];
  
  if (!request) {
    return { valid: false, message: 'Document not found' };
  }
  
  const validityDays = 90;
  const createdDate = new Date(request.createdAt);
  const now = new Date();
  const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
  
  return {
    valid: request.status === 'approved' || request.status === 'released',
    name: request.residentName,
    type: request.type,
    status: request.status,
    controlNumber: request.controlNumber,
    createdAt: request.createdAt,
    isExpired: daysDiff > validityDays
  };
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
}

let phoneVerified = false;
let phoneVerificationCode = '12345';
let phoneVerificationSent = false;

function verifyPhone() {
  const phone = document.getElementById('phone');
  const codeInput = document.getElementById('verify-code');
  const btn = document.getElementById('btn-verify-phone');
  const statusDiv = document.getElementById('phone-verification-status');
  
  if (!phone || !codeInput || !btn) return;
  
  const phoneRegex = /^09\d{9}$/;
  if (!phoneRegex.test(phone.value)) {
    showToast('Phone must start with 09 and be 11 digits', 'error');
    phone.classList.add('error');
    return;
  }
  
  const users = getData(STORAGE_KEYS.USERS);
  if (users.find(u => u.phone === phone.value)) {
    showToast('Phone already registered', 'error');
    phone.classList.add('error');
    return;
  }
  
  phone.classList.remove('error');
  
  if (!phoneVerificationSent) {
    showToast('Verification code sent to ' + phone.value, 'success');
    phoneVerificationSent = true;
    return;
  }
  
  const code = codeInput.value.trim();
  if (code !== phoneVerificationCode) {
    showToast('Invalid code. Use 12345', 'error');
    codeInput.classList.add('error');
    return;
  }
  
  codeInput.classList.remove('error');
  phoneVerified = true;
  statusDiv.classList.remove('not-verified');
  statusDiv.classList.add('verified');
  statusDiv.textContent = 'Verified';
  btn.textContent = 'Verified';
  btn.disabled = true;
  showToast('Phone verified successfully!', 'success');
}

function isPhoneVerified() {
  return phoneVerified;
}

let emailVerified = false;
const emailVerificationCode = '12345';
let emailVerificationSent = false;

function verifyEmail() {
  const email = document.getElementById('email');
  const codeInput = document.getElementById('email-code');
  const btn = document.getElementById('btn-verify-email');
  const statusDiv = document.getElementById('email-verification-status');
  
  if (!email || !codeInput || !btn) return;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    showToast('Please enter a valid email address', 'error');
    email.classList.add('error');
    return;
  }
  
  const users = getData(STORAGE_KEYS.USERS);
  if (users.find(u => u.email === email.value)) {
    showToast('Email already registered', 'error');
    email.classList.add('error');
    return;
  }
  
  email.classList.remove('error');
  
  if (!emailVerificationSent) {
    showToast('Verification code sent to ' + email.value, 'success');
    emailVerificationSent = true;
    return;
  }
  
  const code = codeInput.value.trim();
  if (code !== emailVerificationCode) {
    showToast('Invalid code. Use 12345', 'error');
    codeInput.classList.add('error');
    return;
  }
  
  codeInput.classList.remove('error');
  emailVerified = true;
  statusDiv.classList.remove('not-verified');
  statusDiv.classList.add('verified');
  statusDiv.textContent = 'Verified';
  btn.textContent = 'Verified';
  btn.disabled = true;
  showToast('Email verified successfully!', 'success');
}

let currentStep = 1;
const totalSteps = 6;

function nextStep() {
  if (!validateStep(currentStep)) return;
  
  if (currentStep < totalSteps) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

function showStep(step) {
  document.querySelectorAll('.signup-section').forEach(section => {
    section.classList.add('hidden');
    if (section.dataset.step == step) {
      section.classList.remove('hidden');
    }
  });
  
  updateProgress(step);
  updateButtons();
}

function updateProgress(step) {
  document.querySelectorAll('.progress-dot').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.remove('active', 'done');
    if (s === step) {
      dot.classList.add('active');
    } else if (s < step) {
      dot.classList.add('done');
    }
  });
  
  document.querySelectorAll('.progress-label').forEach(label => {
    const s = parseInt(label.previousElementSibling.dataset.step);
    label.classList.remove('active', 'done');
    if (s === step) {
      label.classList.add('active');
    } else if (s < step) {
      label.classList.add('done');
    }
  });
  
  document.querySelectorAll('.progress-line').forEach(line => {
    const lineIndex = Array.from(line.parentElement.children).indexOf(line);
    const stepIndex = step - 1;
    if (lineIndex <= stepIndex) {
      line.classList.add('done');
    } else {
      line.classList.remove('done');
    }
  });
}

function updateButtons() {
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');
  
  if (prevBtn) {
    if (currentStep === 1) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }
  }
  
  if (nextBtn && submitBtn) {
    if (currentStep === totalSteps) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
  }
}

function validateStep(step) {
  const section = document.querySelector(`.signup-section[data-step="${step}"]`);
  if (!section) return true;
  
  const requiredFields = section.querySelectorAll('[required]');
  let valid = true;
  let firstError = null;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('error');
      valid = false;
      if (!firstError) firstError = field;
    } else {
      field.classList.remove('error');
      const errorMsg = field.parentElement.querySelector('.error-message');
      if (errorMsg) errorMsg.remove();
    }
});
   
  if (!valid) {
    showToast('Form is incomplete. Please fill in all required fields.', 'error');
    if (firstError) {
      firstError.focus();
    }
  }
   
  if (step === 2) {
    const phone = document.getElementById('phone');
    if (phone && phone.value) {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(phone.value)) {
        phone.classList.add('error');
        showToast('Phone number must start with 09 and be 11 digits', 'error');
        valid = false;
      } else if (!phoneVerified) {
        phone.classList.add('error');
        showToast('Please verify your phone number first', 'error');
        valid = false;
      } else {
        phone.classList.remove('error');
      }
    }
    
    const email = document.getElementById('email');
    if (email && email.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value)) {
        email.classList.add('error');
        showToast('Please enter a valid email address', 'error');
        valid = false;
      } else if (!emailVerified) {
        email.classList.add('error');
        showToast('Please verify your email first', 'error');
        valid = false;
      } else {
        email.classList.remove('error');
      }
    }
  }
  
  if (step === 5) {
    const password = document.getElementById('password');
    const confirm = document.getElementById('confirm-password');
    if (password && confirm && password.value !== confirm.value) {
      confirm.classList.add('error');
      showToast('Passwords do not match', 'error');
      valid = false;
    }
    
    const username = document.getElementById('username');
    if (username && username.value) {
      const users = getData(STORAGE_KEYS.USERS);
      if (users.find(u => u.username === username.value)) {
        username.classList.add('error');
        showToast('Username already taken', 'error');
        valid = false;
      }
    }
  }
  
  if (step === 6) {
    const termsCheckbox = document.getElementById('agree-terms');
    if (termsCheckbox && !termsCheckbox.checked) {
      showToast('Please accept the Terms and Conditions', 'error');
      valid = false;
    }
  }
  
  return valid;
}

function addDependent() {
  const list = document.getElementById('dependent-list');
  const count = list.children.length + 1;
  
  const item = document.createElement('div');
  item.className = 'dependent-item';
  item.dataset.id = count;
  item.innerHTML = `
    <div class="field-row cols-3">
      <div class="signup-field">
        <label>Name</label>
        <input type="text" name="dependent_name[]" placeholder="Full name" />
      </div>
      <div class="signup-field">
        <label>Relationship</label>
        <select name="dependent_relation[]">
          <option value="">Select</option>
          <option value="child">Child</option>
          <option value="parent">Parent</option>
          <option value="sibling">Sibling</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="signup-field">
        <label>Birthdate</label>
        <input type="date" name="dependent_birthdate[]" />
      </div>
    </div>
    <button type="button" class="btn-remove-dependent" onclick="removeDependent(this)">Remove</button>
  `;
  
  list.appendChild(item);
}

function removeDependent(button) {
  const item = button.closest('.dependent-item');
  item.remove();
}

function searchHouseholds() {
  const query = document.getElementById('household-search').value.trim();
  const resultsDiv = document.getElementById('household-results');
  
  if (!query) {
    resultsDiv.innerHTML = '<p class="no-results">Please enter a search term</p>';
    return;
  }
  
  const households = getData(STORAGE_KEYS.HOUSEHOLDS);
  const q = query.toLowerCase();
  const matches = households.filter(h => 
    h.name.toLowerCase().includes(q) ||
    (h.address && h.address.street && h.address.street.toLowerCase().includes(q))
  );
  
  if (matches.length === 0) {
    resultsDiv.innerHTML = '<p class="no-results">No households found</p>';
    return;
  }
  
  resultsDiv.innerHTML = matches.map(h => `
    <div class="household-option" data-id="${h.id}">
      <div class="household-option-header">
        <span class="household-name">${h.name}</span>
        <span class="household-members">${h.members?.length || 0} members</span>
      </div>
      <div class="household-option-address">${h.address ? formatAddress(h.address) : 'No address'}</div>
      <button type="button" class="btn-join-household" onclick="selectHousehold('${h.id}')">Join</button>
    </div>
  `).join('');
}

function selectHousehold(householdId) {
  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.id = 'household-id';
  hidden.name = 'householdId';
  hidden.value = householdId;
  
  const existing = document.getElementById('household-id');
  if (existing) existing.remove();
  
  document.getElementById('signupForm').appendChild(hidden);
  showToast('Household selected!', 'success');
}

function formatAddress(address) {
  if (!address) return '';
  const parts = [];
  if (address.purok) parts.push('Purok ' + address.purok);
  if (address.street) parts.push(address.street);
  if (address.block) parts.push('Block ' + address.block);
  return parts.join(', ');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showConfirm(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'modal confirm-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-confirm">Confirm</button>
      </div>
    </div>
  `;
  
  modal.querySelector('.btn-cancel').onclick = () => modal.remove();
  modal.querySelector('.btn-confirm').onclick = () => {
    onConfirm();
    modal.remove();
  };
  
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

function getStatusBadge(status) {
  const badges = {
    pending: '<span class="badge badge-pending">Pending</span>',
    approved: '<span class="badge badge-approved">Approved</span>',
    rejected: '<span class="badge badge-rejected">Rejected</span>',
    released: '<span class="badge badge-released">Released</span>'
  };
  return badges[status] || status;
}

function requireAuth(roles = []) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../auth/login.html';
    return false;
  }
  
  if (roles.length > 0 && !hasAnyRole(roles)) {
    window.location.href = '../user/user-dashboard.html';
    return false;
  }
  
  return true;
}

// ============================================
// INITIALIZATION
// ============================================

function initializeSystem() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setData(STORAGE_KEYS.USERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESIDENTS)) {
    setData(STORAGE_KEYS.RESIDENTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS)) {
    setData(STORAGE_KEYS.HOUSEHOLDS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
    setData(STORAGE_KEYS.REQUESTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BLOTTER)) {
    setData(STORAGE_KEYS.BLOTTER, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    setData(STORAGE_KEYS.LOGS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    setData(STORAGE_KEYS.PAYMENTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setData(STORAGE_KEYS.SETTINGS, {
      barangayName: 'Barangay Lunzuran',
      city: 'Zamboanga City',
      province: 'Zamboanga del Sur',
      logo: null
    });
  }
}

document.addEventListener('DOMContentLoaded', initializeSystem);

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!identifier || !password) {
          showToast('Please fill in all fields', 'error');
          return;
        }
        
        const result = login(identifier, password);
        if (result.success) {
          showToast('Login successful!');
          window.location.href = '../user/user-dashboard.html';
        } else {
          showToast(result.message, 'error');
        }
      });
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      const addDependentsCheckbox = document.getElementById('add-dependents');
      const dependentsSection = document.getElementById('dependents-fields');
      
      if (addDependentsCheckbox && dependentsSection) {
        addDependentsCheckbox.addEventListener('change', function() {
          if (this.checked) {
            dependentsSection.classList.remove('hidden');
          } else {
            dependentsSection.classList.add('hidden');
          }
        });
      }
      
      const emailVerificationWrapper = document.getElementById('email-verification-wrapper');
      
      if (emailInput && emailVerificationWrapper) {
        emailVerificationWrapper.style.display = 'none';
        
        emailInput.addEventListener('input', function() {
          if (this.value && this.value.includes('@')) {
            emailVerificationWrapper.style.display = 'block';
          } else {
            emailVerificationWrapper.style.display = 'none';
          }
        });
        
        emailInput.addEventListener('blur', function() {
          if (this.value && this.value.includes('@')) {
            emailVerificationWrapper.style.display = 'block';
          } else {
            emailVerificationWrapper.style.display = 'none';
          }
        });
      }
      
      signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateStep(currentStep)) return;
        
        const dependents = [];
        if (document.getElementById('add-dependents')?.checked) {
          const names = document.querySelectorAll('input[name="dependent_name[]"]');
          const relations = document.querySelectorAll('select[name="dependent_relation[]"]');
          const birthdates = document.querySelectorAll('input[name="dependent_birthdate[]"]');
          
          names.forEach((input, index) => {
            if (input.value.trim()) {
              dependents.push({
                name: input.value.trim(),
                relation: relations[index].value,
                birthdate: birthdates[index].value
              });
            }
          });
        }
        
        const formData = {
          first_name: document.getElementById('first-name').value.trim(),
          middle_name: document.getElementById('middle-name').value.trim(),
          last_name: document.getElementById('last-name').value.trim(),
          suffix: document.getElementById('suffix').value,
          birthdate: document.getElementById('birthdate').value,
          sex: document.getElementById('sex').value,
          civil_status: document.getElementById('civil-status').value,
          phone: document.getElementById('phone').value.trim(),
          email: document.getElementById('email').value.trim(),
          alt_contact: document.getElementById('alt-contact').value.trim(),
          purok: document.getElementById('purok').value.trim(),
          street: document.getElementById('street').value.trim(),
          house_number: document.getElementById('house-number').value.trim(),
          landmark: document.getElementById('landmark').value.trim(),
          householdId: document.getElementById('household-id')?.value,
          create_new_household: document.getElementById('create-new-household')?.checked,
          household_name: document.getElementById('household-name')?.value,
          is_household_head: document.getElementById('is-household-head')?.checked,
          dependents: dependents,
          username: document.getElementById('username').value.trim(),
          password: document.getElementById('password').value,
          profile_pic: document.getElementById('profile-pic')?.value,
          id_type: document.getElementById('id-type')?.value,
          id_number: document.getElementById('id-number')?.value,
          id_front: document.getElementById('id-front')?.value,
          id_back: document.getElementById('id-back')?.value
        };
        
        const result = signup(formData);
        if (result.success) {
          showToast('Account created successfully!');
          window.location.href = '../user/user-dashboard.html';
        } else {
          showToast(result.message, 'error');
        }
      });
    }
    
    const createNewHousehold = document.getElementById('create-new-household');
    if (createNewHousehold) {
      createNewHousehold.addEventListener('change', function() {
        const fields = document.getElementById('new-household-fields');
        if (this.checked) {
          fields.classList.remove('hidden');
        } else {
          fields.classList.add('hidden');
        }
      });
    }
  });
}

function acceptTerms() {
  const checkbox = document.getElementById('agree-terms');
  if (checkbox) {
    checkbox.checked = true;
  }
  closeTerms();
}

function showTerms(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const modal = document.getElementById('terms-modal');
  if (modal) {
    modal.classList.add('show');
  }
}

function closeTerms() {
  const modal = document.getElementById('terms-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}
// Request System JavaScript

let selectedServices = [];

const SERVICE_TYPES = {
  'clearance': {
    name: 'Barangay Clearance',
    multi: true,
    requiresPurpose: true,
    validatesBlotter: true,
    requiresResidency: true,
    requiresIdUpload: true,
    purposeOptions: ['Employment', 'School', 'Business', 'Government', 'Travel', 'Banking', 'Other'],
    fee: 50
  },
  'id': {
    name: 'Barangay ID',
    multi: true,
    requiresPhoto: true,          
    requiresSignature: true,     
    requiresIdUploadIfMissing: true,   
    requiresProofIfMissing: true,   
    requiresEmergencyContact: true,
    requiresBloodType: true,
    requiresYearsOfResidency: true,
    autoCheckAge: 18,               
    requiresVerifiedProfile: true,    
    autoFillFields: ['name', 'address', 'birthdate', 'civilStatus', 'gender', 'phone', 'email', 'purok', 'street', 'houseNumber'],
    yearsOfResidencyOptions: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
    fee: 50
  },
  'residency': {
    name: 'Certificate of Residency',
    multi: true,
    requiresPurpose: true,
    requiresLengthOfStay: true,
    requiresProof: true,
    purposeOptions: ['Employment', 'School', 'Housing', 'Government', 'Bank', 'Other'],
    fee: 50
  },
  'indigency': {
    name: 'Certificate of Indigency',
    multi: true,
    requiresPurpose: true,
    requiresIncomeRange: true,
    requiresEmploymentStatus: true,
    requiresHouseholdMembers: true,
    requiresOccupation: true,
    requiresProof: true,
    autoFillFields: ['name', 'address', 'birthdate', 'civilStatus', 'gender'],
    purposeOptions: ['Medical Assistance', 'Scholarship', 'Government Aid', 'Housing', 'Financial', 'Other'],
    proofOptions: ['DSWD Certificate', '4Ps ID', 'No Income Certificate', 'Medical Bill', 'Utility Bill', 'Other'],
    fee: 0
  },
  'good-moral': {
    name: 'Certificate of Good Moral Character',
    multi: true,
    requiresPurpose: true,
    validatesBlotter: true,
    validatesComplaint: true,
    requiresReference: true,
    purposeOptions: ['Employment', 'School', 'Travel', 'Visa Application', 'Court', 'Other'],
    fee: 50
  },
  'business-clearance': {
    name: 'Barangay Business Clearance',
    multi: true,
    requiresPurpose: true,
    requiresBusinessInfo: true,
    requiresIdUpload: true,
    isNewOrRenewal: true,
    purposeOptions: ['New Business', 'Renewal', 'Transfer', 'Other'],
    fee: 30
  },
  'solo-parent': {
    name: 'Certificate of Solo Parent',
    multi: false,
    requiresPurpose: true,
    requiresDependents: true,
    requiresInterview: true,
    requiresMaritalStatus: true,
    purposeOptions: ['Financial Assistance', 'Scholarship', 'Medical', 'Housing', 'Employment', 'Other'],
    fee: 0
  },
  'senior-citizen': {
    name: 'Certificate of Senior Citizen',
    multi: false,
    requiresPurpose: false,
    requiresAgeVerification: true,
    autoCheckAge: 60,
    requiresIdUpload: true,
    fee: 0
  }
};

const INCOME_RANGES = [
  { value: 'below5000', label: 'Below ₱5,000' },
  { value: '5000to10000', label: '₱5,000 - ₱10,000' },
  { value: '10000to15000', label: '₱10,000 - ₱15,000' },
  { value: '15000to25000', label: '₱15,000 - ₱25,000' },
  { value: 'above25000', label: 'Above ₱25,000' }
];

const EMPLOYMENT_STATUS = [
  { value: 'employed', label: 'Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'self-employed', label: 'Self-Employed' },
  { value: 'pensioner', label: 'Pensioner' }
];

const LENGTH_OF_STAY = [
  { value: 'lessthan6', label: 'Less than 6 months' },
  { value: '6to12', label: '6 months to 1 year' },
  { value: '1to3', label: '1-3 years' },
  { value: '3to5', label: '3-5 years' },
  { value: '5to10', label: '5-10 years' },
  { value: 'above10', label: '10+ years' }
];

document.addEventListener('DOMContentLoaded', function() {
  initRequestPage();
});

function initRequestPage() {
  loadUserInfo();
  initServiceSelection();
  initProfileToggle();
  initCertificationCheckbox();
}

function loadUserInfo() {
  const user = getCurrentUser();
  if (user) {
    document.getElementById('user-nav-name').textContent = user.fullName || 'User';
    const avatarEl = document.getElementById('user-avatar');
    if (user.photo || user.profilePic) {
      avatarEl.style.backgroundImage = 'url(' + (user.photo || user.profilePic) + ')';
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    } else {
      avatarEl.textContent = getInitials(user.fullName);
    }
  }
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

function initServiceSelection() {}

function selectService(card, type, isMulti) {
  if (selectedServices.includes(type)) {
    selectedServices = selectedServices.filter(s => s !== type);
    card.classList.remove('selected');
    card.querySelector('.request-btn').textContent = 'Select';
  } else {
    if (!isMulti && selectedServices.some(s => SERVICE_TYPES[s] && SERVICE_TYPES[s].multi === false)) {
      showToast('You can only select one solo service at a time', 'error');
      return;
    }
    selectedServices.push(type);
    card.classList.add('selected');
    card.querySelector('.request-btn').textContent = 'Selected';
  }
  updateSelectionCount();
}

// Make selectService globally accessible
window.selectService = selectService;

function updateSelectionCount() {
  const count = selectedServices.length;
  const countEl = document.getElementById('selection-count');
  const selectedEl = document.getElementById('selected-count');
  const btn = document.getElementById('btn-continue-step1');
  
  if (countEl) countEl.textContent = count;
  if (selectedEl) selectedEl.textContent = count;
  
  if (btn) {
    btn.disabled = count === 0;
    btn.innerHTML = count === 0 ? 'Select at least one service' : `Continue with ${count} request(s) →`;
  }
}

function initProfileToggle() {
  // Add event listeners for toggle buttons
  const btnProfile = document.getElementById('btn-use-profile');
  const btnOther = document.getElementById('btn-request-other');
  
  if (btnProfile) {
    btnProfile.addEventListener('click', function() {
      toggleProfileData(true);
    });
  }
  if (btnOther) {
    btnOther.addEventListener('click', function() {
      toggleProfileData(false);
    });
  }
  
  // Auto-load profile data on page load
  loadProfileData();
}

function toggleProfileData(useProfile) {
  const btnProfile = document.getElementById('btn-use-profile');
  const btnOther = document.getElementById('btn-request-other');
  
  if (useProfile) {
    if (btnProfile) btnProfile.classList.add('active');
    if (btnOther) btnOther.classList.remove('active');
    loadProfileData();
  } else {
    if (btnProfile) btnProfile.classList.remove('active');
    if (btnOther) btnOther.classList.add('active');
    clearFormFields();
  }
}

function clearFormFields() {
  const fields = ['req-last-name', 'req-first-name', 'req-middle-name', 'req-suffix', 'req-purok', 'req-street', 'req-house-number', 'req-landmark', 'req-phone', 'req-email', 'req-birthdate', 'req-age'];
  fields.forEach(function(id) {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    }
  });
}

function loadProfileData() {
  var user = getCurrentUser();
  var userId = user ? user.id : null;
  var allUsers = getData(STORAGE_KEYS.USERS);
  if (userId && allUsers.length > 0) {
    var storedUser = allUsers.find(function(u) { return u.id === userId; });
    if (storedUser) {
      user = storedUser;
      setCurrentUser(user);
    }
  }
  if (!user) return;
  
  var residents = getData(STORAGE_KEYS.RESIDENTS) || [];
  var resident = residents.find(function(r) { return r.userId === user.id; });
  
  var names = (resident?.name || user.fullName || '').split(' ');
  var lastName = names.pop() || '';
  var firstName = names.join(' ') || '';
  
  var purok = user.purok || (resident && resident.purok) || (resident && resident.address && resident.address.purok) || '';
  var street = user.street || (resident && resident.street) || (resident && resident.address && resident.address.street) || '';
  var houseNumber = user.houseNumber || (resident && resident.houseNumber) || (resident && resident.address && resident.address.houseNumber) || '';
  var landmark = user.landmark || (resident && resident.landmark) || (resident && resident.address && resident.address.landmark) || '';
  
  document.getElementById('req-last-name').value = lastName;
  document.getElementById('req-first-name').value = firstName;
  document.getElementById('req-middle-name').value = user.middleName || (resident && resident.middleName) || '';
  document.getElementById('req-suffix').value = user.suffix || (resident && resident.suffix) || '';
  document.getElementById('req-purok').value = purok;
  document.getElementById('req-street').value = street;
  document.getElementById('req-house-number').value = houseNumber;
  document.getElementById('req-landmark').value = landmark;
  document.getElementById('req-phone').value = user.phone || '';
  document.getElementById('req-email').value = user.email || '';
  
  if (document.getElementById('req-birthdate')) {
    document.getElementById('req-birthdate').value = user.birthdate || (resident && resident.birthdate) || '';
    if (user.birthdate || (resident && resident.birthdate)) {
      var birthdate = user.birthdate || resident.birthdate;
      var age = calculateAge(birthdate);
      var ageEl = document.getElementById('req-age');
      if (ageEl) ageEl.value = age;
    }
  }
  if (document.getElementById('req-civil-status')) {
    document.getElementById('req-civil-status').value = user.civilStatus || (resident && resident.civilStatus) || '';
  }
  if (document.getElementById('req-gender')) {
    document.getElementById('req-gender').value = user.sex || user.gender || (resident && resident.sex) || '';
  }
}

function calcAgeFromDOB(dateInput) {
  const ageEl = document.getElementById('req-age');
  if (ageEl && dateInput.value) {
    ageEl.value = calculateAge(dateInput.value);
  }
}

function goToStep(step) {
  var count = selectedServices.length;
  if (step === 2 && count === 0) {
    var msg = 'Please select at least one service';
    if (typeof showToast === 'function') {
      showToast(msg, 'error');
    } else {
      alert(msg);
    }
    return;
  }
  
  if (step === 3) {
    const infoForm = document.getElementById('info-form');
    if (infoForm && !infoForm.checkValidity()) {
      infoForm.reportValidity();
      return;
    }
    
    generateRequestCards();
    updatePaymentSummary();
  }
  
  if (step === 4) {
    const certCheckbox = document.getElementById('certification-checkbox');
    if (certCheckbox && !certCheckbox.checked) {
      showToast('Please confirm the certification', 'error');
      return;
    }
    
    // Generate review info
    generateReviewInfo();
    
    // Enable submit button based on payment status
    const totalFee = calculateTotalFee();
    const paymentMethod = document.getElementById('payment-method')?.value;
    const submitBtn = document.getElementById('btn-submit-final');
    
    if (submitBtn) {
      if (totalFee === 0 || paymentMethod === 'cash') {
        submitBtn.disabled = false;
      } else if (paymentMethod === 'online') {
        const transId = document.getElementById('transaction-id')?.value;
        const screenshot = document.getElementById('payment-screenshot')?.files.length;
        submitBtn.disabled = !(transId && screenshot);
      } else {
        submitBtn.disabled = true;
      }
    }
  }
  
  document.querySelectorAll('.request-step').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  
  const stepEl = document.getElementById(`step-${step}`);
  if (stepEl) {
    stepEl.classList.remove('hidden');
    stepEl.classList.add('active');
  }
  
  window.scrollTo(0, 0);
}

function generateReviewInfo() {
  // Review applicant info
  const reviewInfo = document.getElementById('review-info');
  if (reviewInfo) {
    const firstName = document.getElementById('req-first-name')?.value || '';
    const lastName = document.getElementById('req-last-name')?.value || '';
    const phone = document.getElementById('req-phone')?.value || '';
    const email = document.getElementById('req-email')?.value || '';
    
    reviewInfo.innerHTML = `
      <div class="review-row"><span>Name:</span><span>${firstName} ${lastName}</span></div>
      <div class="review-row"><span>Contact:</span><span>${phone}</span></div>
      <div class="review-row"><span>Email:</span><span>${email || '-'}</span></div>
    `;
  }
  
  // Review documents
  const reviewDocs = document.getElementById('review-documents');
  if (reviewDocs) {
    let html = '';
    selectedServices.forEach(type => {
      const service = SERVICE_TYPES[type];
      if (service) {
        html += `<div class="review-row"><span>${service.name}</span><span>${service.fee === 0 ? 'FREE' : '₱' + service.fee}</span></div>`;
      }
    });
    reviewDocs.innerHTML = html;
  }
  
  // Review payment
  const reviewPayment = document.getElementById('review-payment');
  if (reviewPayment) {
    const total = calculateTotalFee();
    const method = document.getElementById('payment-method')?.value;
    
    if (total === 0) {
      reviewPayment.innerHTML = '<div class="review-row"><span>No Payment Required</span></div>';
    } else if (method === 'cash') {
      reviewPayment.innerHTML = `<div class="review-row"><span>Method:</span><span>Cash (Pay at Barangay Hall)</span></div>
        <div class="review-row"><span>Total:</span><span>₱${total.toFixed(2)}</span></div>`;
    } else if (method === 'online') {
      const transId = document.getElementById('transaction-id')?.value || 'Pending';
      reviewPayment.innerHTML = `<div class="review-row"><span>Method:</span><span>Online Payment</span></div>
        <div class="review-row"><span>Reference:</span><span>${transId}</span></div>
        <div class="review-row"><span>Total:</span><span>₱${total.toFixed(2)}</span></div>`;
    } else {
      reviewPayment.innerHTML = '<div class="review-row"><span>Please select payment method</span></div>';
    }
  }
}

function calculateTotalFee() {
  let total = 0;
  selectedServices.forEach(type => {
    const service = SERVICE_TYPES[type];
    if (service && service.fee > 0) {
      total += service.fee;
    }
  });
  return total;
}

// ============================================
// PAYMENT FUNCTIONS
// ============================================

function updatePaymentSummary() {
  const paymentItems = document.getElementById('payment-items');
  const paymentTotal = document.getElementById('payment-total-display');
  const paymentSection = document.getElementById('payment-method-section');
  
  if (!paymentItems) return;
  
  let html = '';
  let hasFee = false;
  let total = 0;
  
  selectedServices.forEach(type => {
    const service = SERVICE_TYPES[type];
    if (service) {
      const fee = service.fee || 0;
      hasFee = hasFee || fee > 0;
      total += fee;
      html += `<div class="payment-item-row">
        <span>${service.name}</span>
        <span>${fee === 0 ? 'FREE' : '₱' + fee.toFixed(2)}</span>
      </div>`;
    }
  });
  
  paymentItems.innerHTML = html;
  
  if (paymentTotal) {
    paymentTotal.textContent = hasFee ? '₱' + total.toFixed(2) : 'FREE';
  }
  
  if (paymentSection) {
    paymentSection.style.display = hasFee ? 'block' : 'none';
  }
  
  // Disable submit if payment required but not selected
  const submitBtn = document.getElementById('btn-submit-requests');
  if (submitBtn) {
    if (hasFee) {
      submitBtn.disabled = true;
    } else {
      submitBtn.disabled = false;
    }
  }
}

function handlePaymentMethodChange() {
  const method = document.getElementById('payment-method')?.value;
  const onlineFields = document.getElementById('online-fields');
  const continueBtn = document.querySelector('#step-3 .btn-primary');
  
  if (onlineFields) {
    onlineFields.style.display = method === 'online' ? 'block' : 'none';
  }
  
  // Update step 3 Continue button
  if (continueBtn) {
    const total = calculateTotalFee();
    const certCheckbox = document.getElementById('certification-checkbox');
    const certChecked = certCheckbox ? certCheckbox.checked : false;
    
    if (total === 0) {
      continueBtn.disabled = !certChecked;
    } else if (method === 'cash') {
      continueBtn.disabled = false;
    } else if (method === 'online') {
      const transId = document.getElementById('transaction-id')?.value;
      const screenshot = document.getElementById('payment-screenshot')?.files.length;
      continueBtn.disabled = !(transId && screenshot);
    } else {
      continueBtn.disabled = true;
    }
  }
  
  // Update step 4 Submit button
  const submitBtn = document.getElementById('btn-submit-final');
  if (submitBtn) {
    const total = calculateTotalFee();
    if (total === 0 || method === 'cash') {
      submitBtn.disabled = false;
    } else if (method === 'online') {
      const transId = document.getElementById('transaction-id')?.value;
      const screenshot = document.getElementById('payment-screenshot')?.files.length;
      submitBtn.disabled = !(transId && screenshot);
    } else {
      submitBtn.disabled = true;
    }
  }
}

// Listen for payment field changes
document.addEventListener('input', function(e) {
  if (e.target.id === 'transaction-id' || e.target.id === 'payment-screenshot') {
    handlePaymentMethodChange();
  }
});

document.addEventListener('change', function(e) {
  if (e.target.id === 'payment-method') {
    handlePaymentMethodChange();
  }
  if (e.target.id === 'certification-checkbox') {
    handlePaymentMethodChange();
  }
});

function togglePaymentFields() {
  const method = document.getElementById('payment-method')?.value;
  const onlineFields = document.getElementById('online-fields');
  
  if (onlineFields) {
    onlineFields.style.display = method === 'online' ? 'block' : 'none';
  }
}


document.addEventListener('input', function(e) {
  if (e.target.id === 'transaction-id') {
    togglePaymentFields();
  }
});

document.addEventListener('change', function(e) {
  if (e.target.id === 'payment-screenshot') {
    togglePaymentFields();
  }
});

function generatePaymentSummary() {
  const summaryContainer = document.getElementById('payment-summary');
  const totalContainer = document.getElementById('payment-total');
  const paymentSection = document.getElementById('payment-section');
  const paymentMethod = document.getElementById('payment-method');
  
  if (!summaryContainer) return;
  
  let hasFee = false;
  let html = '';
  
  selectedServices.forEach(type => {
    const service = SERVICE_TYPES[type];
    if (service) {
      const fee = service.fee || 0;
      hasFee = hasFee || fee > 0;
      html += `<div class="payment-item">
        <span>${service.name}</span>
        <span>${fee === 0 ? 'FREE' : '₱' + fee.toFixed(2)}</span>
      </div>`;
    }
  });
  
  summaryContainer.innerHTML = html;
  
  const total = calculateTotalFee();
  if (totalContainer) {
    totalContainer.innerHTML = total > 0 ? `₱${total.toFixed(2)}` : 'FREE';
  }
  
  if (paymentSection) {
    paymentSection.style.display = hasFee ? 'block' : 'none';
  }
  
  if (paymentMethod) {
    paymentMethod.value = '';
    paymentMethod.disabled = !hasFee;
  }
  
  const onlineFields = document.getElementById('online-payment-fields');
  if (onlineFields) {
    onlineFields.style.display = 'none';
  }
  
  const submitBtn = document.getElementById('btn-submit-requests');
  if (submitBtn) {
    submitBtn.disabled = !hasFee;
  }
}

function getRequestInfo() {
  const address = {
    country: 'Philippines',
    region: 'Region IX - Zamboanga Region',
    province: 'Zamboanga del Sur',
    city: 'Zamboanga City',
    barangay: 'Lunzuran',
    purok: document.getElementById('req-purok')?.value.trim() || '',
    street: document.getElementById('req-street')?.value.trim() || '',
    houseNumber: document.getElementById('req-house-number')?.value.trim() || ''
  };
  
  return {
    lastName: document.getElementById('req-last-name')?.value.trim() || '',
    firstName: document.getElementById('req-first-name')?.value.trim() || '',
    middleName: document.getElementById('req-middle-name')?.value.trim() || '',
    suffix: document.getElementById('req-suffix')?.value || '',
    address: address,
    phone: document.getElementById('req-phone')?.value.trim() || '',
    email: document.getElementById('req-email')?.value.trim() || ''
  };
}

function formatAddressObj(addr) {
  if (!addr) return '';
  const parts = [];
  if (addr.houseNumber) parts.push(addr.houseNumber);
  if (addr.street) parts.push(addr.street);
  if (addr.purok) parts.push('Purok ' + addr.purok);
  if (addr.barangay) parts.push(addr.barangay);
  if (addr.city) parts.push(addr.city);
  return parts.join(', ');
}

function initCertificationCheckbox() {
  const checkbox = document.getElementById('certification-checkbox');
  const submitBtn = document.getElementById('btn-submit-requests');
  
  if (!checkbox || !submitBtn) return;
  
  checkbox.addEventListener('change', function() {
    submitBtn.disabled = !this.checked;
  });
}

function generateRequestCards() {
  const container = document.getElementById('request-cards');
  if (!container) return;
  
  container.innerHTML = '';
  
  selectedServices.forEach(type => {
    const service = SERVICE_TYPES[type];
    if (!service) return;
    
    const card = document.createElement('div');
    card.className = 'request-card';
    card.dataset.type = type;
    
    let fieldsHtml = '';
    
    // Purpose dropdown (skip for ID - purpose is in step 2)
    if (service.requiresPurpose && type !== 'id') {
      fieldsHtml += `
        <div class="form-field">
          <label>Purpose <span class="required">*</span></label>
          <select name="purpose-${type}" required>
            <option value="">Select purpose</option>
            ${service.purposeOptions.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    // Income range for indigency
    if (service.requiresIncomeRange) {
      fieldsHtml += `
        <div class="form-field">
          <label>Monthly Household Income <span class="required">*</span></label>
          <select name="income-range" required>
            <option value="">Select income range</option>
            ${INCOME_RANGES.map(i => `<option value="${i.value}">${i.label}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    // Household members for indigency
    if (service.requiresHouseholdMembers) {
      fieldsHtml += `
        <div class="form-field">
          <label>Number of Household Members <span class="required">*</span></label>
          <select name="household-members" required>
            <option value="">Select count</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8+</option>
          </select>
        </div>
      `;
    }
    
    // Occupation for indigency
    if (service.requiresOccupation) {
      fieldsHtml += `
        <div class="form-field">
          <label>Occupation <span class="required">*</span></label>
          <input type="text" name="occupation" placeholder="Your occupation" required />
        </div>
      `;
    }
    
    // Proof upload for indigency
    if (service.requiresProof) {
      fieldsHtml += `
        <div class="form-field">
          <label>Proof of Low Income <span class="required">*</span></label>
          <select name="proof-type" required onchange="toggleProofUpload(this)">
            <option value="">Select proof type</option>
            ${(service.proofOptions || ['Utility Bill', 'ID', 'Other']).map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-field proof-upload-field">
          <label>Upload Proof <span class="required">*</span></label>
          <input type="file" name="proof-upload" accept="image/*,.pdf" required />
        </div>
      `;
    }
    
    // Employment status
    if (service.requiresEmploymentStatus) {
      fieldsHtml += `
        <div class="form-field">
          <label>Employment Status <span class="required">*</span></label>
          <select name="employment-status" required>
            <option value="">Select status</option>
            ${EMPLOYMENT_STATUS.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    // Length of stay for residency
    if (service.requiresLengthOfStay) {
      fieldsHtml += `
        <div class="form-field">
          <label>Length of Stay in Barangay <span class="required">*</span></label>
          <select name="length-of-stay" required>
            <option value="">Select duration</option>
            ${LENGTH_OF_STAY.map(l => `<option value="${l.value}">${l.label}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    // Business info (new/renewal)
    if (service.requiresBusinessInfo) {
      fieldsHtml += `
        <div class="form-field">
          <label>Application Type <span class="required">*</span></label>
          <select name="business-type" required onchange="toggleRenewalFields(this)">
            <option value="new">New Application</option>
            <option value="renewal">Renewal</option>
          </select>
        </div>
        <div class="form-field">
          <label>Business Name <span class="required">*</span></label>
          <input type="text" name="business-name" placeholder="Enter business name" required />
        </div>
        <div class="form-field">
          <label>Business Address</label>
          <input type="text" name="business-address" placeholder="Business location (if different from home)" />
        </div>
        <div class="form-field renewal-fields" style="display:none">
          <label>Previous Permit Number</label>
          <input type="text" name="previous-permit" placeholder="Enter previous permit number" />
        </div>
      `;
    }
    
    // Dependents list for solo parent
    if (service.requiresDependents) {
      fieldsHtml += `
        <div class="form-field">
          <label>Number of Dependents <span class="required">*</span></label>
          <select name="num-dependents" required onchange="toggleDependentFields(this)">
            <option value="">Select</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div class="dependent-fields" style="display:none">
          <div class="form-field dependent-field">
            <label>Dependent 1</label>
            <div class="field-row cols-3">
              <input type="text" name="dependent1_name" placeholder="Full name" />
              <select name="dependent1_relation">
                <option value="">Relation</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
              </select>
              <input type="date" name="dependent1_birthdate" />
            </div>
          </div>
          <div class="form-field dependent-field" style="display:none">
            <label>Dependent 2</label>
            <div class="field-row cols-3">
              <input type="text" name="dependent2_name" placeholder="Full name" />
              <select name="dependent2_relation">
                <option value="">Relation</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
              </select>
              <input type="date" name="dependent2_birthdate" />
            </div>
          </div>
          <div class="form-field dependent-field" style="display:none">
            <label>Dependent 3</label>
            <div class="field-row cols-3">
              <input type="text" name="dependent3_name" placeholder="Full name" />
              <select name="dependent3_relation">
                <option value="">Relation</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
              </select>
              <input type="date" name="dependent3_birthdate" />
            </div>
          </div>
          <div class="form-field dependent-field" style="display:none">
            <label>Dependent 4</label>
            <div class="field-row cols-3">
              <input type="text" name="dependent4_name" placeholder="Full name" />
              <select name="dependent4_relation">
                <option value="">Relation</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
              </select>
              <input type="date" name="dependent4_birthdate" />
            </div>
          </div>
          <div class="form-field dependent-field" style="display:none">
            <label>Dependent 5</label>
            <div class="field-row cols-3">
              <input type="text" name="dependent5_name" placeholder="Full name" />
              <select name="dependent5_relation">
                <option value="">Relation</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
              </select>
              <input type="date" name="dependent5_birthdate" />
            </div>
          </div>
        </div>
        <div class="form-field">
          <label>Reason for Application <span class="required">*</span></label>
          <textarea name="reason-solo" rows="3" placeholder="Explain your situation as a solo parent"></textarea>
        </div>
        <div class="info-notice">
          <strong>Note:</strong> An interview will be scheduled after your application is submitted.
        </div>
      `;
    }
    
    // Character reference for good moral
    if (service.requiresReference) {
      fieldsHtml += `
        <div class="form-field">
          <label>Character Reference Name</label>
          <input type="text" name="reference-name" placeholder="Reference person name (optional)" />
        </div>
        <div class="form-field">
          <label>Reference Contact</label>
          <input type="text" name="reference-contact" placeholder="Reference contact number (optional)" />
        </div>
      `;
    }
    
    // ID upload - only if not already in profile
    if (service.requiresIdUploadIfMissing) {
      const user = getCurrentUser();
      const hasIdInProfile = user?.idNumber; // Check if already submitted
      if (!hasIdInProfile) {
        fieldsHtml += `
          <div class="form-field">
            <label>Upload Valid ID (not yet in profile)</label>
            <input type="file" name="id-upload" accept="image/*,.pdf" />
            <small class="field-hint">Accepts: JPG, PNG, PDF</small>
          </div>
        `;
      } else {
        fieldsHtml += `
          <div class="form-field">
            <label>Valid ID</label>
            <input type="text" value="${user.idType || 'On file'}" disabled />
            <small class="field-hint">Already in profile</small>
          </div>
        `;
      }
    }
    
    // Photo upload for ID - always required
    if (service.requiresPhoto) {
      fieldsHtml += `
        <div class="form-field">
          <label>2x2 Profile Photo <span class="required">*</span></label>
          <input type="file" name="photo-upload" accept="image/*" required capture="user" />
          <small class="field-hint">Take a clear photo or upload</small>
        </div>
      `;
    }
    
    // Signature for ID
    if (service.requiresSignature) {
      fieldsHtml += `
        <div class="form-field">
          <label>Signature <span class="required">*</span></label>
          <input type="file" name="signature-upload" accept="image/*,.pdf" required />
          <small class="field-hint">Upload your signature</small>
        </div>
      `;
    }
    
    // Years of residency for ID
    if (service.requiresYearsOfResidency) {
      fieldsHtml += `
        <div class="form-field">
          <label>Years of Residency in Barangay <span class="required">*</span></label>
          <select name="years-residency" required>
            <option value="">Select duration</option>
            ${(service.yearsOfResidencyOptions || ['1-3 years', '3-5 years', '5+ years']).map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    // Blood type for ID
    if (service.requiresBloodType) {
      fieldsHtml += `
        <div class="form-field">
          <label>Blood Type (optional)</label>
          <select name="blood-type">
            <option value="">Select blood type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      `;
    }
    
    // Emergency contact for ID
    if (service.requiresEmergencyContact) {
      fieldsHtml += `
        <div class="form-field">
          <label>Emergency Contact Person <span class="required">*</span></label>
          <input type="text" name="emergency-contact-name" placeholder="Last Name, First Name, Middle Name" required />
        </div>
        <div class="form-field">
          <label>Relationship <span class="required">*</span></label>
          <input type="text" name="emergency-contact-relation" placeholder="e.g., Spouse, Parent, Sibling" required />
        </div>
        <div class="form-field">
          <label>Emergency Contact Number <span class="required">*</span></label>
          <input type="tel" name="emergency-contact-phone" placeholder="09XXXXXXXXX" required />
        </div>
      `;
    }
    
    // Proof upload for residency (or ID) - with dropdown for ID
    if (service.requiresProof) {
      if (service.proofOptions) {
        fieldsHtml += `
          <div class="form-field">
            <label>Proof of Residency <span class="required">*</span></label>
            <select name="proof-type" required onchange="toggleProofUpload(this)">
              <option value="">Select proof type</option>
              ${service.proofOptions.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-field proof-upload-field">
            <label>Upload Proof <span class="required">*</span></label>
            <input type="file" name="proof-upload" accept="image/*,.pdf" required />
          </div>
        `;
      } else {
        fieldsHtml += `
          <div class="form-field">
            <label>Proof of Residence <span class="required">*</span></label>
            <input type="file" name="proof-upload" accept="image/*,.pdf" required />
            <small class="field-hint">Utility bill, ID, or proof of stay</small>
          </div>
        `;
      }
    }
    
    // Additional notes
    fieldsHtml += `
      <div class="form-field">
        <label>Additional Notes</label>
        <textarea name="notes-${type}" rows="2" placeholder="Any additional information (optional)"></textarea>
      </div>
    `;
    
    card.innerHTML = `
      <div class="request-card-header">
        <h3>${service.name}</h3>
        ${service.requiresInterview ? '<span class="info-badge">Requires Interview</span>' : ''}
        ${service.autoCheckAge ? '<span class="info-badge">Age ' + service.autoCheckAge + '+</span>' : ''}
        ${!service.multi ? '<span class="single-badge">Single Request</span>' : ''}
      </div>
      <div class="request-card-body">
        ${fieldsHtml}
      </div>
    `;
    
    container.appendChild(card);
  });
}

function toggleRenewalFields(select) {
  const renewalFields = select.closest('.request-card-body').querySelector('.renewal-fields');
  if (renewalFields) {
    renewalFields.style.display = select.value === 'renewal' ? 'block' : 'none';
  }
}
 
function toggleDependentFields(select) {
  const cardBody = select.closest('.request-card-body');
  const count = parseInt(select.value) || 0;
  
  cardBody.querySelectorAll('.dependent-field').forEach((field, i) => {
    field.style.display = i < count ? 'block' : 'none';
  });
  
  const dependentFields = cardBody.querySelector('.dependent-fields');
  if (dependentFields) {
    dependentFields.style.display = count > 0 ? 'block' : 'none';
  }
}

function toggleProofUpload(select) {
  const proofField = select.closest('.form-field')?.nextElementSibling;
  if (proofField) {
    proofField.style.display = select.value ? 'block' : 'none';
  }
}

function submitRequests() {
  const cards = document.querySelectorAll('.request-card');
  let valid = true;
  
  cards.forEach(card => {
    const type = card.dataset.type;
    const service = SERVICE_TYPES[type];
    if (!service) return;
    
    // Validate required dropdowns
    if (service.requiresPurpose) {
      const purpose = card.querySelector(`select[name="purpose-${type}"]`);
      if (!purpose || !purpose.value) {
        purpose.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresIncomeRange) {
      const income = card.querySelector('select[name="income-range"]');
      if (!income || !income.value) {
        income.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresEmploymentStatus) {
      const employment = card.querySelector('select[name="employment-status"]');
      if (!employment || !employment.value) {
        employment.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresBusinessInfo) {
      const bizName = card.querySelector('input[name="business-name"]');
      if (!bizName || !bizName.value.trim()) {
        bizName.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresEmploymentStatus) {
      const empStatus = card.querySelector('select[name="employment-status"]');
      if (!empStatus || !empStatus.value) {
        empStatus.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresHouseholdMembers) {
      const members = card.querySelector('select[name="household-members"]');
      if (!members || !members.value) {
        members.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresOccupation) {
      const occupation = card.querySelector('input[name="occupation"]');
      if (!occupation || !occupation.value.trim()) {
        occupation.classList.add('error');
        valid = false;
      }
    }
    
    if (service.requiresDependents) {
      const dependents = card.querySelector('select[name="num-dependents"]');
      if (!dependents || !dependents.value) {
        dependents.classList.add('error');
        valid = false;
      }
    }
  });
  
  if (!valid) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  const requestInfo = getRequestInfo();
  const user = getCurrentUser();
  const residents = getData(STORAGE_KEYS.RESIDENTS);
  const resident = residents.find(r => r.userId === user?.id);
  const createdRequests = [];
  
  cards.forEach(card => {
    const type = card.dataset.type;
    const service = SERVICE_TYPES[type];
    if (!service) return;
    
    // System checks
    let blotterCheck = null;
    let ageCheck = null;
    let interviewStatus = null;
    
    if (service.validatesBlotter && user?.id) {
      blotterCheck = evaluateGoodMoral(user.id);
    }
    
    if (service.autoCheckAge && user?.birthdate) {
      const age = calculateAge(user.birthdate);
      ageCheck = { eligible: age >= service.autoCheckAge, age: age };
      if (!ageCheck.eligible) {
        showToast(`Must be ${service.autoCheckAge}+ years old for ${service.name}`, 'error');
        return;
      }
    }
    
    // Verified profile check for ID
    if (service.requiresVerifiedProfile) {
      if (!user?.verified) {
        showToast('Please verify your profile first before requesting ID', 'error');
        return;
      }
    }
    
    if (service.requiresInterview) {
      interviewStatus = 'pending';
    }
    
    const request = {
      id: generateId(),
      userId: user?.id,
      residentId: resident?.id,
      type: service.name,
      typeKey: type,
      status: blotterCheck && !blotterCheck.recommended ? 'pending-review' : 'pending',
      purpose: (service.requiresPurpose && type !== 'id') ? card.querySelector(`select[name="purpose-${type}"]`)?.value : null,
      notes: card.querySelector(`textarea[name="notes-${type}"]`)?.value || null,
      requesterName: `${requestInfo.firstName} ${requestInfo.lastName}`.trim(),
      requesterAddress: formatAddressObj(requestInfo.address),
      requesterPhone: requestInfo.phone,
      requesterEmail: requestInfo.email,
      // Business
      businessName: service.requiresBusinessInfo ? card.querySelector('input[name="business-name"]')?.value : null,
      businessAddress: service.requiresBusinessInfo ? card.querySelector('input[name="business-address"]')?.value : null,
      businessType: service.requiresBusinessInfo ? card.querySelector('select[name="business-type"]')?.value : null,
      previousPermit: service.requiresBusinessInfo ? card.querySelector('input[name="previous-permit"]')?.value : null,
      // Indigency
      incomeRange: service.requiresIncomeRange ? card.querySelector('select[name="income-range"]')?.value : null,
      employmentStatus: service.requiresEmploymentStatus ? card.querySelector('select[name="employment-status"]')?.value : null,
      householdMembers: service.requiresHouseholdMembers ? card.querySelector('select[name="household-members"]')?.value : null,
      occupation: service.requiresOccupation ? card.querySelector('input[name="occupation"]')?.value : null,
      proofType: service.proofOptions ? card.querySelector('select[name="proof-type"]')?.value : null,
      // ID specific
      yearsOfResidency: service.requiresYearsOfResidency ? card.querySelector('select[name="years-residency"]')?.value : null,
      bloodType: service.requiresBloodType ? card.querySelector('select[name="blood-type"]')?.value : null,
      emergencyContactName: service.requiresEmergencyContact ? card.querySelector('input[name="emergency-contact-name"]')?.value : null,
      emergencyContactRelation: service.requiresEmergencyContact ? card.querySelector('input[name="emergency-contact-relation"]')?.value : null,
      emergencyContactPhone: service.requiresEmergencyContact ? card.querySelector('input[name="emergency-contact-phone"]')?.value : null,
      // Residency
      lengthOfStay: service.requiresLengthOfStay ? card.querySelector('select[name="length-of-stay"]')?.value : null,
      // Solo Parent
      numDependents: service.requiresDependents ? card.querySelector('select[name="num-dependents"]')?.value : null,
      dependent1: card.querySelector('input[name="dependent1"]')?.value || null,
      dependent2: card.querySelector('input[name="dependent2"]')?.value || null,
      dependent3: card.querySelector('input[name="dependent3"]')?.value || null,
      // Good Moral
      referenceName: service.requiresReference ? card.querySelector('input[name="reference-name"]')?.value : null,
      referenceContact: service.requiresReference ? card.querySelector('input[name="reference-contact"]')?.value : null,
      // Interview
      requiresInterview: service.requiresInterview || false,
      interviewStatus: interviewStatus,
      // Payment
      fee: service.fee || 0,
      paymentMethod: document.getElementById('payment-method')?.value || null,
      transactionId: document.getElementById('transaction-id')?.value || null,
      paymentScreenshot: document.getElementById('payment-screenshot')?.files[0] ? 'uploaded' : null,
      // System checks
      blotterCheck: blotterCheck,
      ageCheck: ageCheck,
      createdAt: getCurrentTimestamp()
    };
    
    // Set status based on payment
    const paymentMethod = document.getElementById('payment-method')?.value;
    const totalFee = calculateTotalFee();
    
    if (totalFee === 0) {
      request.status = blotterCheck && !blotterCheck.recommended ? 'pending-review' : 'pending';
    } else if (totalFee > 0) {
      if (paymentMethod === 'cash') {
        request.status = 'pending';
      } else if (paymentMethod === 'online') {
        request.status = 'pending-approval';
      }
    } else {
      request.status = blotterCheck && !blotterCheck.recommended ? 'pending-review' : 'pending';
    }
    
    saveItem(STORAGE_KEYS.REQUESTS, request);
    logAction(user?.id, 'user', 'create_request', request.id);
    createdRequests.push(request);
  });
  
  // Check if solo parent was included
  const hasSoloParent = selectedServices.includes('solo-parent');
  showSuccess();
  if (hasSoloParent) {
    showToast(`${createdRequests.length} request(s) submitted! Note: Interview will be scheduled for Solo Parent.`, 'success');
  } else {
    showToast(`${createdRequests.length} request(s) submitted successfully!`, 'success');
  }
  resetRequestFlow();
}

function showSuccess() {
  document.querySelectorAll('.request-step').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const successStep = document.getElementById('step-success');
  if (successStep) {
    successStep.classList.remove('hidden');
    successStep.classList.add('active');
  }
}

function resetRequestFlow() {
  selectedServices = [];
  document.querySelectorAll('.service-card.selected').forEach(card => {
    card.classList.remove('selected');
    card.querySelector('.request-btn').textContent = 'Select';
  });
  updateSelectionCount();
}

function evaluateGoodMoral(userId) {
  const allRequests = getData(STORAGE_KEYS.REQUESTS);
  const blotterRecords = getData(STORAGE_KEYS.BLOTTER);
  
  const userRecords = allRequests.filter(r => r.userId === userId && r.typeKey === 'blotter');
  const unresolved = userRecords.filter(r => r.status !== 'resolved');
  
  if (unresolved.length > 0) {
    return { recommended: false, reason: `${unresolved.length} unresolved incident(s)` };
  }
  
  return { recommended: true, reason: 'No blotter issues found' };
}

function calculateAge(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
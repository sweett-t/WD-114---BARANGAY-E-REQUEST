var BC = {};

(function() {
  var selectedService = null;
  var selectedFee = 0;
  
  // Service fees - FREE for blotter/complaint
  var SERVICE_FEES = {
    'blotter': { name: 'Blotter', fee: 0 },
    'complaint': { name: 'Complaint', fee: 0 }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadUserInfo() {
    var user = getCurrentUser();
    if (user) {
      var navName = document.getElementById('user-nav-name');
      var avatar = document.getElementById('user-avatar');
      if (navName) navName.textContent = user.fullName || 'User';
      if (avatar) {
        if (user.photo || user.profilePic) {
          avatar.style.backgroundImage = 'url(' + (user.photo || user.profilePic) + ')';
          avatar.style.backgroundSize = 'cover';
          avatar.style.backgroundPosition = 'center';
          avatar.textContent = '';
        } else {
          var initials = (user.fullName || 'U').split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();
          avatar.textContent = initials;
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
  });

  BC.selectCard = function(type) {
    var cards = document.querySelectorAll('.service-card');
    cards.forEach(function(c) {
      c.classList.remove('selected');
      c.querySelector('.request-btn').textContent = 'Select';
    });
    
    var selectedCard = document.getElementById('card-' + type);
    if (selectedCard) {
      selectedCard.classList.add('selected');
      selectedCard.querySelector('.request-btn').textContent = 'Selected';
      selectedService = type;
    }
  };

  BC.doContinue = function() {
    if (!selectedService) {
      alert('Please select a form');
      return;
    }
    
    // Get user and resident data for auto-fill
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
    
    var residents = getData(STORAGE_KEYS.RESIDENTS) || [];
    var resident = null;
    
    if (user && residents.length > 0) {
      resident = residents.find(function(r) { return r.userId === user.id; });
    }
    
    // Parse name into parts
    var fullName = (resident && resident.name) || (user && user.fullName) || '';
    var nameParts = fullName.split(' ');
    var lastName = nameParts.pop() || '';
    var firstName = nameParts.join(' ') || '';
    var middleName = (resident && resident.middleName) || (user && user.middleName) || '';
    var suffix = (resident && resident.suffix) || (user && user.suffix) || '';
    
    // Build address
    var addressParts = [];
    var houseNum = (resident && resident.houseNumber) || (user && user.houseNumber) || (resident && resident.address && resident.address.houseNumber) || '';
    var purok = (resident && resident.purok) || (user && user.purok) || (resident && resident.address && resident.address.purok) || '';
    var street = (resident && resident.street) || (user && user.street) || (resident && resident.address && resident.address.street) || '';
    var landmark = (resident && resident.landmark) || (user && user.landmark) || (resident && resident.address && resident.address.landmark) || '';
    
    if (houseNum) addressParts.push('Blk ' + houseNum);
    if (purok) addressParts.push('Purok ' + purok);
    if (street) addressParts.push(street);
    if (landmark) addressParts.push('Near: ' + landmark);
    addressParts.push('Lunzuran, Zamboanga City');
    var fullAddress = addressParts.join(', ');
    
    var contact = (user && user.phone) || (resident && resident.contactNumber) || '';
    var civilStatus = (resident && resident.civilStatus) || (user && user.civilStatus) || '';
    var sex = (resident && resident.sex) || (user && user.sex) || '';
    
    var container = document.getElementById('form-container');
    var fieldsHtml = '';
    
    if (selectedService === 'blotter') {
      fieldsHtml = '<div class="form-section">' +
        '<h3>Complainant Information</h3>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Last Name <span class="required">*</span></label><input type="text" name="complainant-lastname" value="' + escapeHtml(lastName) + '" required /></div>' +
        '<div class="form-field"><label>First Name <span class="required">*</span></label><input type="text" name="complainant-firstname" value="' + escapeHtml(firstName) + '" required /></div>' +
        '</div>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Middle Name</label><input type="text" name="complainant-middlename" value="' + escapeHtml(middleName) + '" /></div>' +
        '<div class="form-field"><label>Suffix</label><input type="text" name="complainant-suffix" value="' + escapeHtml(suffix) + '" placeholder="e.g. Jr., Sr." /></div>' +
        '</div>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Civil Status</label><input type="text" name="complainant-civil-status" value="' + escapeHtml(civilStatus) + '" readonly /></div>' +
        '<div class="form-field"><label>Sex / Gender</label><input type="text" name="complainant-sex" value="' + escapeHtml(sex) + '" readonly /></div>' +
        '</div>' +
        '<div class="form-field"><label>Complete Address <span class="required">*</span></label><input type="text" name="complainant-address" value="' + escapeHtml(fullAddress) + '" required /></div>' +
        '<div class="form-field"><label>Contact Number <span class="required">*</span></label><input type="text" name="contact-number" value="' + escapeHtml(contact) + '" required /></div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3>Incident Details</h3>' +
        '<div class="form-field"><label>Nature of Incident <span class="required">*</span></label>' +
        '<select name="incident-type" required><option value="">Select</option>' +
        '<option value="noise">Noise / Nuisance</option><option value="disturbance">Community Disturbance</option>' +
        '<option value="traffic">Traffic / Parking</option><option value="property">Loss of Property</option>' +
        '<option value="suspicious">Suspicious Activity</option><option value="animal">Animal Case</option><option value="docs">Documentation Only</option><option value="other">Other</option></select></div>' +
        '<div class="field-row cols-2"><div class="form-field"><label>Date of Incident <span class="required">*</span></label><input type="date" name="incident-date" required /></div>' +
        '<div class="form-field"><label>Time of Incident <span class="required">*</span></label><input type="time" name="incident-time" required /></div></div>' +
        '<div class="form-field"><label>Location of Incident <span class="required">*</span></label><input type="text" name="incident-location" placeholder="Specific place" required /></div>' +
        '<div class="form-field"><label>Description <span class="required">*</span></label>' +
        '<textarea name="incident-description" rows="4" placeholder="Describe what happened" required></textarea></div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3>Respondent Information <small>(Optional)</small></h3>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Last Name</label><input type="text" name="respondent-lastname" placeholder="If known" /></div>' +
        '<div class="form-field"><label>First Name</label><input type="text" name="respondent-firstname" placeholder="If known" /></div>' +
        '</div>' +
        '<div class="form-field"><label>Full Address</label><input type="text" name="respondent-address" placeholder="If known" /></div>' +
        '<div class="form-field"><label>Witness Name(s)</label><input type="text" name="witness-names" placeholder="Optional" /></div>' +
        '<div class="form-field"><label>Additional Notes</label><textarea name="additional-notes" rows="2" placeholder="Any other relevant information"></textarea></div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3>Evidence <small>(Optional)</small></h3>' +
        '<div class="form-field"><label>Upload Evidence (Image, Video, PDF)</label>' +
        '<input type="file" name="evidence-file" accept="image/*,.pdf,.mp4" multiple /></div>' +
        '</div>' +
        '<div class="certification">' +
        '<input type="checkbox" id="blotter-certify" required />' +
        '<label for="blotter-certify">I hereby confirm that the information provided is true and accurate.</label>' +
        '</div>' +
        '<div class="step-actions">' +
        '<button type="button" class="btn btn-secondary" onclick="BC.goBack()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Submit Blotter</button></div>';
    }
    
    if (selectedService === 'complaint') {
      fieldsHtml = '<div class="form-section">' +
        '<h3>Complainant Information</h3>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Last Name <span class="required">*</span></label><input type="text" name="complainant-lastname" value="' + escapeHtml(lastName) + '" required /></div>' +
        '<div class="form-field"><label>First Name <span class="required">*</span></label><input type="text" name="complainant-firstname" value="' + escapeHtml(firstName) + '" required /></div>' +
        '</div>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Middle Name</label><input type="text" name="complainant-middlename" value="' + escapeHtml(middleName) + '" /></div>' +
        '<div class="form-field"><label>Suffix</label><input type="text" name="complainant-suffix" value="' + escapeHtml(suffix) + '" placeholder="e.g. Jr., Sr." /></div>' +
        '</div>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Civil Status</label><input type="text" name="complainant-civil-status" value="' + escapeHtml(civilStatus) + '" readonly /></div>' +
        '<div class="form-field"><label>Sex / Gender</label><input type="text" name="complainant-sex" value="' + escapeHtml(sex) + '" readonly /></div>' +
        '</div>' +
        '<div class="form-field"><label>Complete Address <span class="required">*</span></label><input type="text" name="complainant-address" value="' + escapeHtml(fullAddress) + '" required /></div>' +
        '<div class="form-field"><label>Contact Number <span class="required">*</span></label><input type="text" name="contact-number" value="' + escapeHtml(contact) + '" required /></div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3>Complaint Details</h3>' +
        '<div class="form-field"><label>Nature of Dispute <span class="required">*</span></label>' +
        '<select name="dispute-type" required><option value="">Select</option>' +
        '<option value="debt">Collection of Debt</option><option value="contract">Breach of Contract</option>' +
        '<option value="property">Property / Boundary Dispute</option><option value="ejectment">Ejectment</option>' +
        '<option value="injury">Physical Injury</option><option value="slander">Slander / Oral Defamation</option>' +
        '<option value="threats">Threats / Coercion</option><option value="family">Family / Domestic Dispute</option><option value="other">Other</option></select></div>' +
        '<div class="field-row cols-2">' +
        '<div class="form-field"><label>Respondent Last Name <span class="required">*</span></label><input type="text" name="respondent-lastname" required /></div>' +
        '<div class="form-field"><label>Respondent First Name <span class="required">*</span></label><input type="text" name="respondent-firstname" required /></div>' +
        '</div>' +
        '<div class="form-field"><label>Respondent Full Address <span class="required">*</span></label><input type="text" name="respondent-address" required /></div>' +
        '<div class="field-row cols-2"><div class="form-field"><label>Date of Incident</label><input type="date" name="incident-date" /></div>' +
        '<div class="form-field"><label>Location of Incident</label><input type="text" name="incident-location" /></div></div>' +
        '<div class="form-field"><label>Complaint Description <span class="required">*</span></label>' +
        '<textarea name="complaint-description" rows="4" placeholder="Describe the incident" required></textarea></div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3>Witnesses <small>(Optional)</small></h3>' +
        '<div class="form-field"><label>Witness Name(s)</label><input type="text" name="witness-names" /></div>' +
        '<div class="form-field"><label>Additional Remarks</label><textarea name="additional-remarks" rows="2"></textarea></div>' +
        '</div>' +
        '<div class="form-section">' +
        '<h3>Supporting Evidence <small>(Optional but Recommended)</small></h3>' +
        '<div class="form-field"><label>Upload Evidence</label>' +
        '<input type="file" name="evidence-file" accept="image/*,.pdf,.doc" multiple /></div>' +
        '</div>' +
        
        // Payment Section (only show if fee > 0)
        '<div class="form-section payment-section" id="payment-section" style="display:none">' +
        '<h3>Payment</h3>' +
        '<div class="payment-summary" id="payment-summary"></div>' +
        '<div class="form-field"><label>Payment Method <span class="required">*</span></label>' +
        '<select name="payment-method" id="payment-method-select" onchange="BC.handlePaymentMethod()">' +
        '<option value="">Select</option>' +
        '<option value="cash">Cash (Pay at Barangay Hall)</option>' +
        '<option value="online">Online Payment (QR Ph, GCash, Maya, Mobile Banking)</option>' +
        '</select></div>' +
        '<div class="online-fields" id="online-fields" style="display:none">' +
        '<div class="form-field"><label>Transaction Reference ID <span class="required">*</span></label>' +
        '<input type="text" name="transaction-id" id="transaction-id" placeholder="Enter reference number" /></div>' +
        '<div class="form-field"><label>Payment Screenshot <span class="required">*</span></label>' +
        '<input type="file" name="payment-screenshot" id="payment-screenshot" accept="image/*,.pdf" /></div>' +
        '</div>' +
        '</div>' +
        
        '<div class="certification">' +
        '<input type="checkbox" id="complaint-certify" required />' +
        '<label for="complaint-certify">I hereby confirm that the information provided above is true and accurate to the best of my knowledge, and I understand that any false statement may be subject to legal consequences.</label>' +
        '</div>' +
        '<div class="step-actions">' +
        '<button type="button" class="btn btn-secondary" onclick="BC.goBack()">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Submit Complaint</button></div>';
    }
    
    container.innerHTML = '<form id="' + (selectedService === 'blotter' ? 'blotter-form' : 'complaint-form') + '" onsubmit="BC.submitForm(event, \'' + selectedService + '\')">' + fieldsHtml + '</form>';
    
    // Hide main, show step-2
    document.querySelector('main').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
  };

  BC.goBack = function() {
    selectedService = null;
    var cards = document.querySelectorAll('.service-card');
    cards.forEach(function(c) {
      c.classList.remove('selected');
      c.querySelector('.request-btn').textContent = 'Select';
    });
    
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-success').style.display = 'none';
    document.querySelector('main').style.display = 'block';
    
    document.getElementById('form-container').innerHTML = '';
  };

BC.submitForm = function(e, type) {
    e.preventDefault();
    
    var formId = type === 'blotter' ? 'blotter-form' : 'complaint-form';
    var form = document.getElementById(formId);
    var certifyCb = document.getElementById(type === 'blotter' ? 'blotter-certify' : 'complaint-certify');
    
    if (certifyCb && !certifyCb.checked) {
      alert('Please confirm the declaration.');
      return;
    }
    
    var user = getCurrentUser();
    
    var fee = SERVICE_FEES[type].fee || 0;
    var paymentMethod = document.querySelector('select[name="payment-method"]')?.value || '';
    var transactionId = document.querySelector('input[name="transaction-id"]')?.value || '';
    
    var status = 'pending';
    if (fee > 0) {
      if (paymentMethod === 'cash') {
        status = 'pending-cash';
      } else if (paymentMethod === 'online') {
        if (!transactionId) {
          alert('Please enter transaction reference number');
          return;
        }
        status = 'pending-approval';
      }
    }
    
    var formData = {
      id: 'REQ_' + Date.now(),
      userId: user ? user.id : null,
      type: type === 'blotter' ? 'Blotter' : 'Complaint',
      typeKey: type,
      fee: fee,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      status: status,
      createdAt: new Date().toISOString()
    };
    
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function(input) {
      if (input.name && input.type !== 'file') {
        formData[input.name] = input.value;
      }
    });
    
    saveItem(STORAGE_KEYS.REQUESTS, formData);
    
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-success').style.display = 'block';
  };

  BC.handlePaymentMethod = function() {
    var select = document.getElementById('payment-method-select');
    var onlineFields = document.getElementById('online-fields');
    
    if (onlineFields) {
      onlineFields.style.display = select.value === 'online' ? 'block' : 'none';
    }
  };

  BC.updatePaymentSummary = function() {
    var section = document.getElementById('payment-section');
    var summary = document.getElementById('payment-summary');
    var type = selectedService;
    
    if (!section || !summary) return;
    
    var fee = SERVICE_FEES[type]?.fee || 0;
    
    if (fee === 0) {
      section.style.display = 'none';
    } else {
      section.style.display = 'block';
      summary.innerHTML = '<div class="payment-row"><span>Service:</span><span>' + SERVICE_FEES[type].name + '</span></div><div class="payment-row total"><span>Total:</span><span>₱' + fee.toFixed(2) + '</span></div>';
    }
  };
  
  // Initialize payment summary when showing form
  BC.showPaymentSection = function() {
    BC.updatePaymentSummary();
  };

  // Expose Functions
  BC.handlePaymentMethod = BC.handlePaymentMethod;
  BC.updatePaymentSummary = BC.updatePaymentSummary;
})();

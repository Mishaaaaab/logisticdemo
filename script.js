// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  users: 'logisticdemo_users',
  currentUser: 'logisticdemo_current_user',
  orders: 'logisticdemo_orders'
};

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders)) || [];
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

// ─── Password hashing ─────────────────────────────────────────────────────────

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateTrackingNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `LT-${year}-${random}`;
}

function showMessage(elementId, text, type = 'success') {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
}

function redirectByRole(user) {
  window.location.href = user.role === 'driver' ? 'driver.html' : 'client.html';
}

// Auth guard: redirects to login if the logged-in user doesn't match expected role.
function requireRole(role) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== role) {
    window.location.href = 'login.html';
    return null;
  }
  return currentUser;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ─── Nav: update based on login state ────────────────────────────────────────

function updateNav() {
  const user = getCurrentUser();
  const nav = document.querySelector('nav');
  if (!nav) return;

  if (user) {
    // Remove register/login links
    nav.querySelectorAll('a[href="register.html"], a[href="login.html"]').forEach(el => el.remove());

    // Add dashboard link if not already there
    if (!nav.querySelector('.nav-dashboard')) {
      const dashLink = document.createElement('a');
      dashLink.href = user.role === 'driver' ? 'driver.html' : 'client.html';
      dashLink.textContent = user.role === 'driver' ? 'Driver dashboard' : 'Client dashboard';
      dashLink.className = 'nav-dashboard';
      nav.prepend(dashLink);
    }
  }
}

// ─── Order card ───────────────────────────────────────────────────────────────

function orderCard(order, options = {}) {
  const driverLine = order.driverEmail
    ? `<p><strong>Driver:</strong> ${escapeHtml(order.driverEmail)}</p>`
    : '<p><strong>Driver:</strong> not assigned yet</p>';
  const description = order.description
    ? `<p><strong>Description:</strong> ${escapeHtml(order.description)}</p>`
    : '';
  const action = options.actionButton ? options.actionButton(order) : '';
  const statusButtons = options.statusButtons ? options.statusButtons(order) : '';

  return `
    <article class="order-card">
      <div class="order-top">
        <h3>${escapeHtml(order.from)} → ${escapeHtml(order.to)}</h3>
        <span class="status">${escapeHtml(order.status)}</span>
      </div>
      <p><strong>Tracking number:</strong> <code>${escapeHtml(order.trackingNumber)}</code></p>
      <p><strong>Weight:</strong> ${escapeHtml(order.weight)} kg</p>
      <p><strong>Volume:</strong> ${escapeHtml(order.volume)} m³</p>
      ${description}
      ${driverLine}
      <p><strong>Created at:</strong> ${escapeHtml(order.createdAt)}</p>
      ${action}
      ${statusButtons}
    </article>
  `;
}

// ─── Register page ────────────────────────────────────────────────────────────

function initRegisterPage() {
  const form = document.getElementById('registerForm');
  const roleSelect = document.getElementById('regRole');
  const driverFields = document.getElementById('driverFields');
  if (!form || !roleSelect) return;

  roleSelect.addEventListener('change', () => {
    driverFields.classList.toggle('hidden', roleSelect.value !== 'driver');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    const users = getUsers();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;
    const maxWeight = Number(document.getElementById('regMaxWeight').value) || 0;
    const maxVolume = Number(document.getElementById('regMaxVolume').value) || 0;

    if (password !== confirmPassword) {
      showMessage('registerMessage', 'Passwords do not match.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
      return;
    }

    if (password.length < 8) {
      showMessage('registerMessage', 'Password must be at least 8 characters.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
      return;
    }

    if (users.some(user => user.email === email)) {
      showMessage('registerMessage', 'A user with this email already exists.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
      return;
    }

    if (role === 'driver' && (maxWeight <= 0 || maxVolume <= 0)) {
      showMessage('registerMessage', 'For a driver account, maximum weight and volume are required.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create account';
      return;
    }

    const hashedPassword = await hashPassword(password);
    const newUser = { name, email, password: hashedPassword, role, maxWeight, maxVolume };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    redirectByRole(newUser);
  });
}

// ─── Login page ───────────────────────────────────────────────────────────────

function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const hashedPassword = await hashPassword(password);

    const user = getUsers().find(item => item.email === email && item.password === hashedPassword);

    if (!user) {
      showMessage('loginMessage', 'Incorrect email or password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
      return;
    }

    setCurrentUser(user);
    redirectByRole(user);
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────

function initLogout() {
  const button = document.getElementById('logoutBtn');
  if (!button) return;
  button.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    window.location.href = 'index.html';
  });
}

// ─── Client page ──────────────────────────────────────────────────────────────

function initClientPage() {
  if (document.body.dataset.rolePage !== 'client') return;
  const currentUser = requireRole('client');
  if (!currentUser) return;

  document.getElementById('clientWelcome').textContent =
    `You are logged in as ${currentUser.name} (${currentUser.email})`;
  renderClientOrders(currentUser.email);

  const form = document.getElementById('orderForm');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const orders = getOrders();
    let trackingNumber = generateTrackingNumber();
    while (orders.some(order => order.trackingNumber === trackingNumber)) {
      trackingNumber = generateTrackingNumber();
    }

    const order = {
      trackingNumber,
      clientEmail: currentUser.email,
      from: document.getElementById('orderFrom').value.trim(),
      to: document.getElementById('orderTo').value.trim(),
      weight: Number(document.getElementById('orderWeight').value),
      volume: Number(document.getElementById('orderVolume').value),
      description: document.getElementById('orderDescription').value.trim(),
      status: 'Created',
      driverEmail: null,
      createdAt: new Date().toLocaleString('en-GB')
    };

    orders.push(order);
    saveOrders(orders);
    form.reset();
    showMessage('orderMessage', `Request created. Your tracking number: ${trackingNumber}`, 'success');
    renderClientOrders(currentUser.email);
  });
}

function renderClientOrders(clientEmail) {
  const container = document.getElementById('clientOrders');
  if (!container) return;
  const orders = getOrders().filter(order => order.clientEmail === clientEmail);
  container.innerHTML = orders.length
    ? orders.map(order => orderCard(order)).join('')
    : '<p class="empty">You do not have any requests yet. Create one above!</p>';
}

// ─── Driver page ──────────────────────────────────────────────────────────────

function initDriverPage() {
  if (document.body.dataset.rolePage !== 'driver') return;
  const currentUser = requireRole('driver');
  if (!currentUser) return;

  document.getElementById('driverWelcome').textContent =
    `You are logged in as ${currentUser.name} (${currentUser.email})`;
  document.getElementById('driverMaxWeight').value = currentUser.maxWeight || '';
  document.getElementById('driverMaxVolume').value = currentUser.maxVolume || '';

  renderDriverOrders(currentUser);

  document.getElementById('capacityForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const maxWeight = Number(document.getElementById('driverMaxWeight').value);
    const maxVolume = Number(document.getElementById('driverMaxVolume').value);
    const users = getUsers().map(user =>
      user.email === currentUser.email ? { ...user, maxWeight, maxVolume } : user
    );
    const updatedUser = { ...currentUser, maxWeight, maxVolume };
    saveUsers(users);
    setCurrentUser(updatedUser);
    showMessage('capacityMessage', 'Capacity saved.', 'success');
    renderDriverOrders(updatedUser);
  });
}

function renderDriverOrders(driver) {
  const availableContainer = document.getElementById('availableOrders');
  const driverContainer = document.getElementById('driverOrders');
  const orders = getOrders();
  const taken = orders.filter(order => order.driverEmail === driver.email);

  availableContainer.innerHTML = orders.length
    ? orders.map(order => orderCard(order, {
        actionButton: (item) => {
          const fitsCapacity =
            Number(item.weight) <= Number(driver.maxWeight) &&
            Number(item.volume) <= Number(driver.maxVolume);

          if (item.driverEmail === driver.email)
            return '<button class="btn secondary small" disabled>Accepted by you</button>';
          if (item.driverEmail)
            return '<button class="btn secondary small" disabled>Already assigned</button>';
          if (!fitsCapacity)
            return '<button class="btn secondary small" disabled>Over your capacity</button>';

          return `<button class="btn primary small" onclick="takeOrder('${escapeHtml(item.trackingNumber)}')">Accept shipment</button>`;
        }
      })).join('')
    : '<p class="empty">No customer requests yet.</p>';

  driverContainer.innerHTML = taken.length
    ? taken.map(order => orderCard(order, {
        statusButtons: (item) => `
          <div class="status-actions">
            <button class="btn secondary small" onclick="changeOrderStatus('${escapeHtml(item.trackingNumber)}', 'In transit')">In transit</button>
            <button class="btn secondary small" onclick="changeOrderStatus('${escapeHtml(item.trackingNumber)}', 'Delivered')">Delivered</button>
          </div>
        `
      })).join('')
    : '<p class="empty">You have not accepted any shipments yet.</p>';
}

function takeOrder(trackingNumber) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'driver') return;
  const orders = getOrders().map(order => {
    if (order.trackingNumber === trackingNumber && !order.driverEmail) {
      return { ...order, driverEmail: currentUser.email, status: 'Driver assigned' };
    }
    return order;
  });
  saveOrders(orders);
  renderDriverOrders(currentUser);
}

function changeOrderStatus(trackingNumber, status) {
  const currentUser = getCurrentUser();
  const orders = getOrders().map(order => {
    if (order.trackingNumber === trackingNumber && order.driverEmail === currentUser.email) {
      return { ...order, status };
    }
    return order;
  });
  saveOrders(orders);
  renderDriverOrders(currentUser);
}

// ─── Tracking page ────────────────────────────────────────────────────────────

function initTrackingPage() {
  const form = document.getElementById('trackingForm');
  if (!form) return;

  // Validate tracking number format: LT-YYYY-NNNNN
  const trackingPattern = /^LT-\d{4}-\d{5}$/i;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = document.getElementById('trackingInput').value.trim().toUpperCase();
    const result = document.getElementById('trackingResult');

    if (!trackingPattern.test(value)) {
      result.innerHTML = '<p class="message error">Invalid format. Example: LT-2026-12345</p>';
      return;
    }

    const order = getOrders().find(item => item.trackingNumber.toUpperCase() === value);

    if (!order) {
      result.innerHTML = '<p class="message error">No request found with this tracking number.</p>';
      return;
    }

    result.innerHTML = `
      <div class="tracking-box">
        ${orderCard(order)}
        <div class="timeline">
          ${timelineStep('Created', order.status)}
          ${timelineStep('Driver assigned', order.status)}
          ${timelineStep('In transit', order.status)}
          ${timelineStep('Delivered', order.status)}
        </div>
      </div>
    `;
  });
}

function timelineStep(step, currentStatus) {
  const order = ['Created', 'Driver assigned', 'In transit', 'Delivered'];
  const active = order.indexOf(step) <= order.indexOf(currentStatus);
  return `<div class="timeline-step ${active ? 'active' : ''}"><span></span>${step}</div>`;
}

// ─── Volume calculator ────────────────────────────────────────────────────────

function initVolumeCalculator() {
  const form = document.getElementById('volumeForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const length = Number(document.getElementById('length').value);
    const width = Number(document.getElementById('width').value);
    const height = Number(document.getElementById('height').value);
    const volume = length * width * height;
    const weightedVolume = volume * 200; // volumetric weight: 1 m³ = 200 kg equivalent
    showMessage(
      'volumeResult',
      `Cargo volume: ${volume.toFixed(3)} m³  ·  Volumetric weight: ${weightedVolume.toFixed(0)} kg`,
      'success'
    );
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

updateNav();
initRegisterPage();
initLoginPage();
initLogout();
initClientPage();
initDriverPage();
initTrackingPage();
initVolumeCalculator();

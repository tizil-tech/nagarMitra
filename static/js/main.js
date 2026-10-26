/**
 * NagarMitra — Shared Utilities
 * Loaded on every page
 */

// ─── API Helper ─────────────────────────────────────────────────────────────
const API = {
  async request(method, url, data = null, isForm = false) {
    const opts = {
      method,
      credentials: 'same-origin',
      headers: {},
    };
    if (data) {
      if (isForm) {
        opts.body = data; // FormData
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(data);
      }
    }
    const res = await fetch(url, opts);
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  },
  get:   (url)          => API.request('GET',   url),
  post:  (url, data)    => API.request('POST',  url, data),
  postForm: (url, form) => API.request('POST',  url, form, true),
  patch: (url, data)    => API.request('PATCH', url, data),
};

// ─── Toast Notifications ─────────────────────────────────────────────────────
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = { success: '✅', error: '❌', info: 'ℹ️' }[type] || 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideInRight .25s ease reverse forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ─── Auth State ──────────────────────────────────────────────────────────────
const Auth = {
  user: null,

  async loadUser() {
    const res = await API.get('/api/auth/me');
    this.user = res.ok ? res.data.user : null;
    return this.user;
  },

  async logout() {
    await API.post('/api/auth/logout');
    this.user = null;
    window.location.href = '/';
  },

  isLoggedIn:  () => !!Auth.user,
  isCitizen:   () => Auth.user?.role === 'citizen',
  isOfficial:  () => Auth.user?.role === 'official',
  isAdmin:     () => Auth.user?.role === 'admin',
};

// ─── Navigation ──────────────────────────────────────────────────────────────
const Nav = {
  async init() {
    await Auth.loadUser();
    this.render();
    this.highlightActive();
    this.setupHamburger();
  },

  render() {
    const loginBtn  = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const userInfo  = document.getElementById('nav-user-info');
    const reportBtn = document.getElementById('nav-report-btn');

    // Role-based styling & layout control
    if (Auth.user && Auth.user.role !== 'citizen') {
      document.body.classList.remove('role-citizen-mobile');
      document.body.classList.add('role-desktop-only');
    } else {
      document.body.classList.remove('role-desktop-only');
      document.body.classList.add('role-citizen-mobile');
    }

    if (Auth.user) {
      loginBtn  && (loginBtn.style.display  = 'none');
      logoutBtn && (logoutBtn.style.display = 'inline-flex');
      if (userInfo) {
        const initial = Auth.user.name?.charAt(0)?.toUpperCase() || 'U';
        userInfo.innerHTML = `
          <a href="/profile" class="nav-user-info" title="My Profile">
            <div class="nav-avatar">${initial}</div>
            <span class="text-sm">${Auth.user.name}</span>
          </a>`;
        userInfo.style.display = 'flex';
      }
      reportBtn && (reportBtn.style.display = Auth.user.role === 'citizen' ? 'inline-flex' : 'none');

      // Initialize notifications for citizens
      if (Auth.user.role === 'citizen') {
        Notifications.init();
      }
    } else {
      loginBtn  && (loginBtn.style.display  = 'inline-flex');
      logoutBtn && (logoutBtn.style.display = 'none');
      userInfo  && (userInfo.style.display  = 'none');
      reportBtn && (reportBtn.style.display = 'none');
      const bell = document.getElementById('notif-bell-btn');
      if (bell) bell.remove();
      const panel = document.getElementById('notif-panel');
      if (panel) panel.remove();
    }

    // Update BottomNav based on user role
    BottomNav.render();

    if (logoutBtn) {
      logoutBtn.onclick = () => Auth.logout();
    }
  },

  highlightActive() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (href !== '/' && path.startsWith(href))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  setupHamburger() {
    const btn   = document.getElementById('hamburger-btn');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;

    // Prevent duplicate event listener registration if called multiple times across scripts
    if (btn._hamburgerBound) return;
    btn._hamburgerBound = true;

    const toggle = (force) => {
      const willOpen = typeof force === 'boolean' ? force : !links.classList.contains('open');
      links.classList.toggle('open', willOpen);
      btn.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-menu-open', willOpen);
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Close on any navigation link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle(false);
      });
    });

    // Close when clicking outside the menu
    document.addEventListener('click', (e) => {
      if (links.classList.contains('open') && !links.contains(e.target) && !btn.contains(e.target)) {
        toggle(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        toggle(false);
      }
    });

    // Close if window resizes to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && links.classList.contains('open')) {
        toggle(false);
      }
    });
  },
};

// ─── Badge Helpers ───────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'Submitted':    'badge-submitted',
    'Under Review': 'badge-under-review',
    'Assigned':     'badge-assigned',
    'In Progress':  'badge-in-progress',
    'Resolved':     'badge-resolved',
    'Rejected':     'badge-rejected',
  };
  const cls = map[status] || 'badge-submitted';
  return `<span class="badge ${cls}">${status}</span>`;
}

function priorityBadge(priority) {
  const map = {
    'Low':    'badge-low',
    'Medium': 'badge-medium',
    'High':   'badge-high',
    'Urgent': 'badge-urgent',
  };
  const cls = map[priority] || 'badge-medium';
  return `<span class="badge ${cls}">${priority}</span>`;
}

// ─── Date Formatting ─────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// ─── Form Helpers ────────────────────────────────────────────────────────────
function showFormError(formId, message) {
  const el = document.querySelector(`#${formId} .form-error-global`);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function clearFormError(formId) {
  const el = document.querySelector(`#${formId} .form-error-global`);
  if (el) { el.style.display = 'none'; }
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Please wait…';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────
function showConfirm(message, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <span class="modal-title">Confirm Action</span>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger btn-sm" id="confirm-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#confirm-cancel').onclick = () => backdrop.remove();
  backdrop.querySelector('#confirm-ok').onclick = () => { backdrop.remove(); onConfirm(); };
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

// ─── Leaflet Map Helpers ─────────────────────────────────────────────────────
const MapHelper = {
  categoryColors: {
    'Roads':         '#ef4444',
    'Water':         '#3b82f6',
    'Electricity':   '#f59e0b',
    'Sanitation':    '#10b981',
    'Parks':         '#22c55e',
    'Health':        '#ec4899',
    'Traffic':       '#f97316',
    'Garbage':       '#84cc16',
    'Street Lights': '#a855f7',
    'Drainage':      '#06b6d4',
    'Infrastructure':'#6b7280',
    'Other':         '#9ca3af',
  },

  markerIcon(category, status) {
    const color = this.categoryColors[category] || '#6b7280';
    const opacity = status === 'Resolved' ? '0.6' : '1';
    return L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        background:${color};opacity:${opacity};
        transform:rotate(-45deg);border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      iconSize:   [28, 28],
      iconAnchor: [14, 28],
      popupAnchor:[0, -30],
    });
  },

  popupContent(g) {
    return `
      <div style="font-family:Inter,sans-serif;min-width:200px;max-width:260px">
        <div style="font-weight:700;margin-bottom:.4rem;font-size:.9rem">${g.title}</div>
        <div style="margin-bottom:.3rem">${statusBadge(g.status)}</div>
        <div style="font-size:.78rem;color:#666;margin-bottom:.5rem">
          📁 ${g.category} &nbsp;|&nbsp; 📅 ${formatDate(g.created_at)}
        </div>
        <a href="/grievance-details?id=${g.grievance_id}" 
           style="font-size:.8rem;color:#1a6fdb;font-weight:600">View Details →</a>
      </div>`;
  },
};

// ─── Tabs ────────────────────────────────────────────────────────────────────
function initTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
  // Activate first tab
  const firstBtn = container.querySelector('.tab-btn');
  if (firstBtn) firstBtn.click();
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
function initStarRating(containerSelector, hiddenInputId) {
  const container = document.querySelector(containerSelector);
  const hidden    = document.getElementById(hiddenInputId);
  if (!container || !hidden) return;

  let selected = 0;
  const stars = container.querySelectorAll('.star');

  stars.forEach((star, i) => {
    star.addEventListener('mouseover', () => {
      stars.forEach((s, j) => s.classList.toggle('active', j <= i));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s, j) => s.classList.toggle('active', j < selected));
    });
    star.addEventListener('click', () => {
      selected = i + 1;
      hidden.value = selected;
      stars.forEach((s, j) => s.classList.toggle('active', j < selected));
    });
  });
}

// ─── Category Icon ───────────────────────────────────────────────────────────
function categoryIcon(category) {
  const map = {
    'Roads': '🛣️', 'Water': '💧', 'Electricity': '⚡', 'Sanitation': '🧹',
    'Parks': '🌳', 'Health': '🏥', 'Traffic': '🚦', 'Garbage': '🗑️',
    'Street Lights': '💡', 'Drainage': '🌊', 'Infrastructure': '🏗️', 'Other': '📋',
  };
  return map[category] || '📋';
}

// ─── In-App Notifications (Citizen) ──────────────────────────────────────────
const Notifications = {
  data: [],
  unreadCount: 0,
  isOpen: false,
  pollTimer: null,

  async init() {
    if (!Auth.user || Auth.user.role !== 'citizen') return;
    this.renderBell();
    await this.fetch();
    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        if (Auth.user && Auth.user.role === 'citizen') {
          this.fetch(true);
        }
      }, 20000);
    }
  },

  renderBell() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions || document.getElementById('notif-bell-btn')) return;

    const bellBtn = document.createElement('button');
    bellBtn.id = 'notif-bell-btn';
    bellBtn.className = 'notif-bell-btn';
    bellBtn.setAttribute('aria-label', 'View Grievance Notifications');
    bellBtn.setAttribute('title', 'Grievance Notifications');
    bellBtn.innerHTML = `
      <span>🔔</span>
      <span class="notif-badge" id="notif-badge" style="display:none">0</span>
    `;

    navActions.insertBefore(bellBtn, navActions.firstChild);

    // Dropdown panel
    if (!document.getElementById('notif-panel')) {
      const panel = document.createElement('div');
      panel.id = 'notif-panel';
      panel.className = 'notif-panel';
      panel.innerHTML = `
        <div class="notif-panel-header">
          <div style="font-weight:700;font-size:0.92rem;display:flex;align-items:center;gap:0.4rem">
            <span>🔔</span> Grievance Updates
          </div>
          <button id="notif-mark-all" class="btn btn-ghost btn-sm" style="font-size:0.75rem;padding:2px 8px">
            Mark all read
          </button>
        </div>
        <div class="notif-panel-body" id="notif-list">
          <div class="notif-empty">Loading notifications…</div>
        </div>
      `;
      document.body.appendChild(panel);

      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      document.getElementById('notif-mark-all').addEventListener('click', () => {
        this.markAllRead();
      });

      document.addEventListener('click', (e) => {
        if (this.isOpen && !panel.contains(e.target) && !bellBtn.contains(e.target)) {
          this.close();
        }
      });
    }
  },

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.add('open');
    this.isOpen = true;
    this.renderList();
  },

  close() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.classList.remove('open');
    this.isOpen = false;
  },

  async fetch(silent = false) {
    try {
      const res = await API.get('/api/notifications');
      if (res.ok && res.data) {
        this.data = res.data.data || [];
        this.unreadCount = res.data.unread_count || 0;
        this.updateBadge();
        if (this.isOpen) this.renderList();
      }
    } catch (e) {}
  },

  updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  renderList() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (this.data.length === 0) {
      list.innerHTML = `
        <div class="notif-empty">
          <div style="font-size:1.8rem;margin-bottom:0.3rem">📭</div>
          <div style="font-weight:600">No notifications yet</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem">
            You will receive alerts here whenever municipal authorities update your complaints.
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = this.data.map(n => `
      <div class="notif-item ${n.is_read === 'false' ? 'unread' : ''}" onclick="Notifications.handleClick('${n.notification_id}', '${n.link}')">
        <div class="notif-item-top">
          <span class="notif-item-gid">${n.grievance_id || 'Complaint'}</span>
          <span class="notif-item-time">${timeAgo(n.created_at)}</span>
        </div>
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-msg">${n.message}</div>
      </div>
    `).join('');
  },

  async handleClick(id, link) {
    try {
      await API.patch(`/api/notifications/${id}/read`);
      const item = this.data.find(x => x.notification_id === id);
      if (item && item.is_read === 'false') {
        item.is_read = 'true';
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateBadge();
      }
    } catch (e) {}
    this.close();
    if (link) {
      window.location.href = link;
    }
  },

  async markAllRead() {
    try {
      await API.post('/api/notifications/mark-all-read');
      this.data.forEach(n => (n.is_read = 'true'));
      this.unreadCount = 0;
      this.updateBadge();
      this.renderList();
    } catch (e) {}
  }
};

// ─── Mobile Bottom Navigation ────────────────────────────────────────────────
const BottomNav = {
  render() {
    // Restrict mobile-optimized bottom nav ONLY to citizens (and unauthenticated public citizens)
    if (Auth.user && Auth.user.role !== 'citizen') {
      const existing = document.getElementById('mobile-bottom-nav');
      if (existing) existing.remove();
      return;
    }

    if (document.getElementById('mobile-bottom-nav')) return;
    const currentPath = window.location.pathname;

    const nav = document.createElement('nav');
    nav.id = 'mobile-bottom-nav';
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');

    const items = [
      { path: '/', label: 'Home', icon: '🏠' },
      { path: '/track', label: 'Track', icon: '🔍' },
      { path: '/report-grievance', label: 'Report', icon: '➕', highlight: true },
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      { action: 'openChat', label: 'Assistant', icon: '🤖' },
    ];

    nav.innerHTML = items.map(item => {
      if (item.action === 'openChat') {
        return `
          <button class="mobile-nav-item" id="mobile-nav-assistant" aria-label="Open AI Assistant">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>`;
      }
      const isActive = item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path);
      const cls = ['mobile-nav-item', isActive ? 'active' : '', item.highlight ? 'report-highlight' : ''].filter(Boolean).join(' ');
      return `
        <a href="${item.path}" class="${cls}" aria-label="${item.label}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>`;
    }).join('');

    document.body.appendChild(nav);

    const botBtn = document.getElementById('mobile-nav-assistant');
    if (botBtn) {
      botBtn.addEventListener('click', () => {
        Chatbot.toggle();
      });
    }
  }
};

// ─── AI Chatbot Assistant ────────────────────────────────────────────────────
const Chatbot = {
  history: [],
  isOpen: false,
  isSending: false,

  init() {
    if (document.getElementById('chatbot-launcher')) return;
    this.renderUI();
    this.loadHistory();
    this.setupListeners();
  },

  renderUI() {
    const launcher = document.createElement('button');
    launcher.id = 'chatbot-launcher';
    launcher.setAttribute('aria-label', 'Open NagarMitra AI Assistant');
    launcher.setAttribute('title', 'NagarMitra AI Assistant');
    launcher.innerHTML = `
      <span class="launcher-ping"></span>
      🤖
    `;
    document.body.appendChild(launcher);

    const win = document.createElement('div');
    win.id = 'chatbot-window';
    win.className = 'chatbot-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'NagarMitra AI Chatbot');
    win.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-header-avatar">NM</div>
          <div>
            <div class="chat-header-name">NagarMitra Assistant</div>
            <div class="chat-header-status"><span class="chat-status-dot"></span> Powered by Groq AI</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <button id="chat-clear-btn" title="Clear conversation" aria-label="Clear chat">🗑️</button>
          <button id="chat-close-btn" title="Close" aria-label="Close chat">✕</button>
        </div>
      </div>

      <div class="chat-body" id="chat-messages"></div>

      <div class="chat-suggestions" id="chat-suggestions">
        <button class="chat-suggestion-chip" data-prompt="How do I report a pothole on my street?">🛣️ Report Pothole</button>
        <button class="chat-suggestion-chip" data-prompt="Garbage has not been collected for 3 days">🗑️ Garbage Issue</button>
        <button class="chat-suggestion-chip" data-prompt="Streetlights are not working">💡 Dark Streetlight</button>
        <button class="chat-suggestion-chip" data-prompt="How do I track my grievance status?">🔍 Track Grievance</button>
      </div>

      <form class="chat-footer" id="chat-form">
        <input type="text" id="chat-input" class="chat-input" placeholder="Ask civic question or enter Grievance ID..." autocomplete="off"/>
        <button type="submit" class="chat-send-btn" id="chat-send-btn" title="Send message" aria-label="Send">➤</button>
      </form>
    `;
    document.body.appendChild(win);
  },

  loadHistory() {
    try {
      const saved = sessionStorage.getItem('nm_chat_history');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      this.history = [];
    }

    if (this.history.length === 0) {
      this.addMessage('bot',
        '👋 **Namaste! I am NagarMitra AI Assistant.**\n\n' +
        'I can help you:\n' +
        '- Categorize civic problems (potholes, garbage, sewage, lights)\n' +
        '- Provide tips on photos and map pins\n' +
        '- Track complaints by entering your **Grievance ID** (e.g. `GRV-...`)\n\n' +
        'How can I help you today?'
      , false);
    } else {
      const container = document.getElementById('chat-messages');
      container.innerHTML = '';
      this.history.forEach(item => this.renderBubble(item.role, item.content));
    }
  },

  saveHistory() {
    try {
      sessionStorage.setItem('nm_chat_history', JSON.stringify(this.history));
    } catch (e) {}
  },

  setupListeners() {
    const launcher = document.getElementById('chatbot-launcher');
    const closeBtn = document.getElementById('chat-close-btn');
    const clearBtn = document.getElementById('chat-clear-btn');
    const form     = document.getElementById('chat-form');
    const input    = document.getElementById('chat-input');
    const chips    = document.getElementById('chat-suggestions');

    launcher.addEventListener('click', () => this.toggle());
    closeBtn.addEventListener('click', () => this.close());
    clearBtn.addEventListener('click', () => {
      this.history = [];
      sessionStorage.removeItem('nm_chat_history');
      const container = document.getElementById('chat-messages');
      container.innerHTML = '';
      this.addMessage('bot', '👋 Conversation cleared. What civic issue can I help you with?');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || this.isSending) return;
      input.value = '';
      this.sendMessage(text);
    });

    if (chips) {
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chat-suggestion-chip');
        if (btn) {
          const prompt = btn.dataset.prompt;
          if (prompt && !this.isSending) {
            this.sendMessage(prompt);
          }
        }
      });
    }
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    const win = document.getElementById('chatbot-window');
    if (!win) return;
    win.classList.add('open');
    this.isOpen = true;
    const input = document.getElementById('chat-input');
    if (input && window.innerWidth > 768) input.focus();
    this.scrollToBottom();
  },

  close() {
    const win = document.getElementById('chatbot-window');
    if (!win) return;
    win.classList.remove('open');
    this.isOpen = false;
  },

  async sendMessage(text) {
    this.addMessage('user', text);
    this.showTyping();
    this.isSending = true;

    try {
      const res = await API.post('/api/chat', {
        message: text,
        history: this.history.slice(-6)
      });

      this.hideTyping();

      if (res.ok && res.data && res.data.reply) {
        this.addMessage('bot', res.data.reply);
      } else {
        const errText = res.data?.error || 'Unable to connect to AI service at the moment.';
        this.addMessage('bot', `⚠️ ${errText}\n\n[🔄 Click to Retry](javascript:Chatbot.retryLast())`);
      }
    } catch (err) {
      this.hideTyping();
      this.addMessage('bot', '⚠️ Connection error. Please check your network.\n\n[🔄 Click to Retry](javascript:Chatbot.retryLast())');
    } finally {
      this.isSending = false;
    }
  },

  retryLast() {
    const lastUser = [...this.history].reverse().find(m => m.role === 'user');
    if (lastUser && !this.isSending) {
      this.sendMessage(lastUser.content);
    }
  },

  addMessage(role, content, save = true) {
    if (save) {
      this.history.push({ role, content });
      this.saveHistory();
    }
    this.renderBubble(role, content);
  },

  renderBubble(role, content) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-message ${role}`;

    const formattedContent = this.formatMarkdown(content);

    if (role === 'bot') {
      div.innerHTML = `
        <div class="chat-avatar-mini">NM</div>
        <div class="chat-bubble">${formattedContent}</div>
      `;
    } else {
      div.innerHTML = `
        <div class="chat-bubble">${this.escapeHTML(content)}</div>
      `;
    }

    container.appendChild(div);
    this.scrollToBottom();
  },

  showTyping() {
    const container = document.getElementById('chat-messages');
    if (!container || document.getElementById('chat-typing')) return;

    const div = document.createElement('div');
    div.id = 'chat-typing';
    div.className = 'chat-message bot';
    div.innerHTML = `
      <div class="chat-avatar-mini">NM</div>
      <div class="chat-bubble chat-typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    container.appendChild(div);
    this.scrollToBottom();
  },

  hideTyping() {
    const typing = document.getElementById('chat-typing');
    if (typing) typing.remove();
  },

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  },

  escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  formatMarkdown(text) {
    let out = this.escapeHTML(text);

    // Bold **text**
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Code `code`
    out = out.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>');
    // Links [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_self">$1</a>');
    // Bullet points
    out = out.replace(/^[•\-*]\s+(.*)$/gm, '<li style="margin-left:1.2rem">$1</li>');
    // Wrap lists if any
    out = out.replace(/(<li.*<\/li>)/s, '<ul style="margin:0.4rem 0">$1</ul>');
    // Paragraphs / line breaks
    out = out.replace(/\n\n/g, '<br/><br/>');
    out = out.replace(/\n/g, '<br/>');

    return out;
  }
};

// ─── Init on load ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  BottomNav.render();
  Chatbot.init();
});

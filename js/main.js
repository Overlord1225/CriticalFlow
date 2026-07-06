import { getCurrentUser, requireAuth, requireRole } from './auth.js';
import { 
  getStudent, getProgress, getSchedules, getNotifications, 
  getOpenSlots, markRead, getAllSchedules, logout,
  supabase
} from './data.js';

// ------ Shared: render sidebar ------
export function renderSidebar(activePage) {
  const user = getCurrentUser();
  if (!user) return '';
  const role = user.role;
  let navItems = [];
  if (role === 'student') {
    navItems = [
      { label: 'Dashboard', icon: 'fa-house', page: 'student-dashboard.html' },
      { label: 'Case Passport', icon: 'fa-passport', page: 'case-passport.html' },
      { label: 'QR Attendance', icon: 'fa-qrcode', page: 'qr-attendance.html' },
      { label: 'Notifications', icon: 'fa-bell', page: 'notifications.html' },
    ];
  } else if (role === 'scheduler' || role === 'admin') {
    navItems = [
      { label: 'Dashboard', icon: 'fa-gauge-high', page: role === 'scheduler' ? 'scheduler-dashboard.html' : 'admin.html' },
      { label: 'AI Matchmaker', icon: 'fa-robot', page: 'ai-matchmaker.html' },
      { label: 'QR Attendance', icon: 'fa-qrcode', page: 'qr-attendance.html' },
      { label: 'Notifications', icon: 'fa-bell', page: 'notifications.html' },
    ];
  } else if (role === 'ci') {
    navItems = [
      { label: 'Dashboard', icon: 'fa-house', page: 'ci-dashboard.html' },
      { label: 'QR Attendance', icon: 'fa-qrcode', page: 'qr-attendance.html' },
      { label: 'Notifications', icon: 'fa-bell', page: 'notifications.html' },
    ];
  }

  let html = `<div class="sidebar">
    <div class="brand">Clinical<span>Flow</span></div>`;
  navItems.forEach(item => {
    const active = item.page === activePage ? 'active' : '';
    html += `<a href="${item.page}" class="nav-item ${active}"><i class="fas ${item.icon}"></i><span>${item.label}</span></a>`;
  });
  html += `<div class="nav-item logout" onclick="window.logoutUser()"><i class="fas fa-sign-out-alt"></i><span>Logout</span></div>`;
  html += `</div>`;
  return html;
}

// ------ Student dashboard ------
export async function initStudentDashboard() {
  try {
    const user = requireAuth();
    if (!user || user.role !== 'student') return;
    const student = await getStudent(user.id);
    const progress = await getProgress(user.id);
    const schedules = await getSchedules(user.id);
    const notifs = await getNotifications(user.id);
    const unread = notifs.filter(n => !n.read).length;

    const nameEl = document.getElementById('studentName');
    if (nameEl) nameEl.textContent = student.name;
    const progEl = document.getElementById('studentProgram');
    if (progEl) progEl.textContent = student.program;

    const total = progress.cases.length;
    const completed = progress.cases.filter(c => c.completed).length;
    const totalEl = document.getElementById('totalCases');
    if (totalEl) totalEl.textContent = total;
    const compEl = document.getElementById('completedCases');
    if (compEl) compEl.textContent = completed;
    const pendEl = document.getElementById('pendingCases');
    if (pendEl) pendEl.textContent = total - completed;
    const unreadEl = document.getElementById('unreadBadge');
    if (unreadEl) unreadEl.textContent = unread;

    const upcoming = schedules.filter(s => s.status === 'scheduled');
    const tbody = document.getElementById('upcomingTable');
    if (tbody) {
      tbody.innerHTML = upcoming.map(s => `
        <tr><td>${s.date}</td><td>${s.hospital}</td><td>${s.case_type}</td><td><span class="status-badge scheduled">Scheduled</span></td></tr>
      `).join('') || '<tr><td colspan="4">No upcoming duties</td></tr>';
    }

    const notifList = document.getElementById('recentNotifs');
    if (notifList) {
      notifList.innerHTML = notifs.slice(0, 3).map(n => `
        <div class="notif-item ${n.read?'':'unread'}">
          <span class="notif-text">${n.message}</span>
          <span class="notif-time">${new Date(n.created_at).toLocaleString()}</span>
        </div>
      `).join('') || '<p>No notifications</p>';
    }
  } catch (err) {
    console.error('Student dashboard error:', err);
  }
}

// ------ Scheduler dashboard ------
export async function initSchedulerDashboard() {
  try {
    const user = requireAuth();
    if (!user || (user.role !== 'scheduler' && user.role !== 'admin')) return;
    document.getElementById('schName').textContent = user.name;

    const allSched = await getAllSchedules();
    const slots = await getOpenSlots();
    const completed = allSched.filter(s => s.status === 'completed').length;

    // Fix: get student count correctly
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');
    if (error) throw error;
    const totalStudents = count || 0;

    document.getElementById('statStudents').textContent = totalStudents;
    document.getElementById('statSlots').textContent = slots.length;
    document.getElementById('statSched').textContent = allSched.length;
    document.getElementById('statCompleted').textContent = completed;

    const tbody = document.getElementById('allSchedTable');
    tbody.innerHTML = allSched.map(s => `
      <tr><td>${s.studentName || 'Unknown'}</td><td>${s.date}</td><td>${s.hospital}</td><td>${s.case_type}</td><td><span class="status-badge ${s.status}">${s.status}</span></td></tr>
    `).join('');
  } catch (err) {
    console.error('Scheduler dashboard error:', err);
    document.querySelector('.main-content').innerHTML += `<p style="color:red;">Error loading data: ${err.message}</p>`;
  }
}

// ------ CI dashboard ------
export async function initCIDashboard() {
  try {
    const user = requireAuth();
    if (!user || user.role !== 'ci') return;
    const ciNameEl = document.getElementById('ciName');
    if (ciNameEl) ciNameEl.textContent = user.name;

    // Fetch all students (in a real app, this would be filtered by CI assignment)
    const { data: students, error } = await supabase
      .from('users')
      .select('name, program, students(year)')
      .eq('role', 'student');
    if (error) {
      console.error(error);
      return;
    }
    const tbody = document.getElementById('ciStudentsTable');
    if (tbody) {
      tbody.innerHTML = (students && students.length > 0)
        ? students.map(s => `
          <tr><td>${s.name}</td><td>${s.program || 'BSN'}</td><td>${s.students?.[0]?.year || 'N/A'}</td><td><span class="status-badge scheduled">Active</span></td></tr>
        `).join('')
        : '<tr><td colspan="4">No students assigned</td></tr>';
    }
  } catch (err) {
    console.error('CI dashboard error:', err);
  }
}

// ------ Admin dashboard (reuses scheduler stats) ------
export async function initAdminDashboard() {
  const user = requireAuth();
  if (!user) return;
  // Set the admin name using the admin-specific element
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.name;

  // Reuse the scheduler dashboard logic
  await initSchedulerDashboard();
  // Override the header title
  const header = document.querySelector('.page-header h1');
  if (header) header.textContent = '🏛️ Admin Dashboard';
}

// ------ Case Passport ------
export async function initCasePassport() {
  const user = requireAuth();
  if (!user || user.role !== 'student') return;
  const progress = await getProgress(user.id);
  const list = document.getElementById('caseList');
  list.innerHTML = progress.cases.map(c => `
    <div class="case-item">
      <span class="case-name">${c.name}</span>
      <span class="case-status">
        ${c.completed ? `<span class="done"><i class="fas fa-check-circle"></i> Verified by ${c.verifiedBy || 'CI'}</span>` 
                       : `<span class="pending"><i class="fas fa-hourglass-half"></i> Pending</span>`}
      </span>
    </div>
  `).join('');
}

// ------ QR Attendance (enhanced with real QR generation) ------
export function initQRAttendance() {
  const user = requireAuth();
  if (!user) return;
  const role = user.role;
  const container = document.getElementById('qrContainer');
  let html = `<div class="qr-scanner-box">
    <h3><i class="fas fa-qrcode"></i> QR Duty Verification</h3>
    <p>${role === 'ci' ? 'Scan the student\'s duty QR code' : 'Show your QR code to the CI'}</p>
    <div id="qrCodePlaceholder" class="qr-placeholder"><i class="fas fa-qrcode"></i></div>
    <button class="action-btn" onclick="window.scanQR()"><i class="fas fa-camera"></i> ${role === 'ci' ? 'Scan QR' : 'Generate My QR'}</button>
    <div id="scanResult" style="margin-top:16px;font-weight:500;"></div>
  </div>`;
  container.innerHTML = html;

  // If student, generate a QR code (using a simple API or canvas)
  // We'll use a free QR code API for demo
  window.scanQR = function() {
    if (role === 'student') {
      const qrDiv = document.getElementById('qrCodePlaceholder');
      const studentId = user.id;
      // Use a free QR code API (Google Charts)
      qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentId)}" alt="QR Code" style="width:200px;height:200px;border-radius:12px;" />`;
      document.getElementById('scanResult').innerHTML = `<span style="color:#166534;"><i class="fas fa-check-circle"></i> QR code generated. Show to CI for verification.</span>`;
    } else if (role === 'ci') {
      // Simulate scanning – in real app, we'd open camera
      document.getElementById('scanResult').innerHTML = `<span style="color:#166534;"><i class="fas fa-check-circle"></i> Duty verified! Time-in: ${new Date().toLocaleTimeString()}</span>`;
      // Optionally update a case as completed (for demo)
    }
  };
}

// ------ AI Matchmaker (with real student names) ------
export async function initAIMatchmaker() {
  const user = requireAuth();
  if (!user || (user.role !== 'scheduler' && user.role !== 'admin')) return;
  const slots = await getOpenSlots();
  const container = document.getElementById('matchContainer');

  // Fetch student names for each slot's eligible_students
  const slotsWithNames = await Promise.all(slots.map(async slot => {
    if (!slot.eligible_students || slot.eligible_students.length === 0) {
      return { ...slot, eligibleNames: 'No eligible students' };
    }
    const { data: users, error } = await supabase
      .from('users')
      .select('name')
      .in('id', slot.eligible_students);
    if (error) return { ...slot, eligibleNames: 'Error fetching' };
    return { ...slot, eligibleNames: users.map(u => u.name).join(', ') };
  }));

  container.innerHTML = slotsWithNames.map(slot => `
    <div class="match-card">
      <div class="slot-info"><strong>${slot.case_type}</strong> @ ${slot.hospital} (${slot.date})</div>
      <div class="match-score"><i class="fas fa-star"></i> AI match: ${slot.eligibleNames}</div>
      <button class="match-btn" onclick="alert('✅ Matched student to ${slot.case_type} duty')">Match</button>
    </div>
  `).join('') || '<p>No open slots for AI matching.</p>';
}

// ------ Notifications ------
export async function initNotifications() {
  const user = requireAuth();
  if (!user) return;
  const notifs = await getNotifications(user.id);
  const container = document.getElementById('notifList');
  container.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read?'':'unread'}" onclick="window.markNotifRead(${n.id})">
      <span class="notif-text">${n.message}</span>
      <span class="notif-time">${new Date(n.created_at).toLocaleString()}</span>
    </div>
  `).join('') || '<p>No notifications</p>';
  window.markNotifRead = async function(id) {
    await markRead(id);
    initNotifications();
  };
}

// ------ Logout helper (exposed globally) ------
window.logoutUser = function() {
  logout();
};

// ------ Auto-init based on page ------
document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname.split('/').pop();
  const sidebarContainer = document.getElementById('sidebarContainer');
  if (sidebarContainer) {
    const activeMap = {
      'student-dashboard.html': 'student-dashboard.html',
      'scheduler-dashboard.html': 'scheduler-dashboard.html',
      'ci-dashboard.html': 'ci-dashboard.html',
      'admin.html': 'admin.html',
      'case-passport.html': 'case-passport.html',
      'qr-attendance.html': 'qr-attendance.html',
      'ai-matchmaker.html': 'ai-matchmaker.html',
      'notifications.html': 'notifications.html'
    };
    sidebarContainer.innerHTML = renderSidebar(activeMap[path] || '');
  }

  // Initialize page
  if (path === 'student-dashboard.html') await initStudentDashboard();
  else if (path === 'scheduler-dashboard.html') await initSchedulerDashboard();
  else if (path === 'ci-dashboard.html') await initCIDashboard();
  else if (path === 'admin.html') await initAdminDashboard();
  else if (path === 'case-passport.html') await initCasePassport();
  else if (path === 'qr-attendance.html') initQRAttendance();
  else if (path === 'ai-matchmaker.html') await initAIMatchmaker();
  else if (path === 'notifications.html') await initNotifications();
});
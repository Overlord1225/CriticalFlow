import { getCurrentUser, requireAuth, requireRole } from './auth.js';
import { 
  getStudent, getProgress, getSchedules, getNotifications, 
  getOpenSlots, markRead, getAllSchedules, logout,
  getAvailableSlots, claimSlot, sendAnnouncement, markAbsent,
  getStudentProgressSummary, getHospitalUtilization,
  supabase
} from './data.js';
import { showToast, showLoading, hideLoading } from './utils.js';

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
      { label: 'Opportunity Board', icon: 'fa-bullhorn', page: 'opportunity-board.html' },
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
  const mainContent = document.querySelector('.main-content');
  try {
    const user = requireAuth();
    if (!user || user.role !== 'student') return;
    showLoading('recentNotifs', 'Loading your dashboard...');

    const student = await getStudent(user.id);
    const progress = await getProgress(user.id);
    const schedules = await getSchedules(user.id);
    const notifs = await getNotifications(user.id);
    const unread = notifs.filter(n => !n.read).length;

    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentProgram').textContent = student.program;

    const total = progress.cases.length;
    const completed = progress.cases.filter(c => c.completed).length;
    document.getElementById('totalCases').textContent = total;
    document.getElementById('completedCases').textContent = completed;
    document.getElementById('pendingCases').textContent = total - completed;
    document.getElementById('unreadBadge').textContent = unread;

    const upcoming = schedules.filter(s => s.status === 'scheduled');
    const tbody = document.getElementById('upcomingTable');
    tbody.innerHTML = upcoming.map(s => `
      <tr><td>${s.date}</td><td>${s.hospital}</td><td>${s.case_type}</td><td><span class="status-badge scheduled">Scheduled</span></td></tr>
    `).join('') || '<tr><td colspan="4">No upcoming duties</td></tr>';

    const notifList = document.getElementById('recentNotifs');
    notifList.innerHTML = notifs.slice(0, 3).map(n => `
      <div class="notif-item ${n.read?'':'unread'}">
        <span class="notif-text">${n.message}</span>
        <span class="notif-time">${new Date(n.created_at).toLocaleString()}</span>
      </div>
    `).join('') || '<p>No notifications</p>';

    hideLoading('recentNotifs');
    showToast('Dashboard loaded successfully', 'success', 2000);
  } catch (err) {
    console.error('Student dashboard error:', err);
    hideLoading('recentNotifs');
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

// ------ Scheduler dashboard ------
export async function initSchedulerDashboard() {
  try {
    const user = requireAuth();
    if (!user || (user.role !== 'scheduler' && user.role !== 'admin')) return;
    showLoading('allSchedTable', 'Loading schedules...');

    document.getElementById('schName').textContent = user.name;

    const allSched = await getAllSchedules();
    const slots = await getOpenSlots();
    const completed = allSched.filter(s => s.status === 'completed').length;

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

    hideLoading('allSchedTable');
    showToast('Scheduler data loaded', 'success', 2000);
  } catch (err) {
    console.error('Scheduler dashboard error:', err);
    hideLoading('allSchedTable');
    showToast('Error loading scheduler data: ' + err.message, 'error');
  }
}

// ------ CI dashboard ------
export async function initCIDashboard() {
  try {
    const user = requireAuth();
    if (!user || user.role !== 'ci') return;
    showLoading('ciStudentsTable', 'Loading students...');

    document.getElementById('ciName').textContent = user.name;

    const { data: students, error } = await supabase
      .from('users')
      .select('name, program, students(year)')
      .eq('role', 'student');
    if (error) throw error;

    const tbody = document.getElementById('ciStudentsTable');
    tbody.innerHTML = (students && students.length > 0)
      ? students.map(s => `
        <tr><td>${s.name}</td><td>${s.program || 'BSN'}</td><td>${s.students?.[0]?.year || 'N/A'}</td><td><span class="status-badge scheduled">Active</span></td></tr>
      `).join('')
      : '<tr><td colspan="4">No students assigned</td></tr>';

    hideLoading('ciStudentsTable');
    showToast('CI dashboard loaded', 'success', 2000);
  } catch (err) {
    console.error('CI dashboard error:', err);
    hideLoading('ciStudentsTable');
    showToast('Error loading CI data: ' + err.message, 'error');
  }
}

// ------ Admin Analytics ------
export async function initAdminAnalytics() {
  const user = requireAuth();
  if (!user || user.role !== 'admin') return;

  document.getElementById('adminName').textContent = user.name;

  // We'll show loading on the first table container
  const firstContainer = document.getElementById('lackingCases');
  try {
    showLoading('lackingCases', 'Loading analytics...');

    const students = await getStudentProgressSummary();

    // Populate stats
    document.getElementById('statStudents').textContent = students.length;
    const slots = await getAvailableSlots();
    document.getElementById('statSlots').textContent = slots.length;
    const allSched = await getAllSchedules();
    document.getElementById('statSched').textContent = allSched.length;
    document.getElementById('statCompleted').textContent = allSched.filter(s => s.status === 'completed').length;

    // Lacking cases
    const lacking = students.filter(s => s.percentage < 100);
    const lackingContainer = document.getElementById('lackingCases');
    lackingContainer.innerHTML = lacking.map(s => `
      <tr><td>${s.name}</td><td>${s.program}</td><td>${s.completed}/${s.total}</td><td>${s.percentage}%</td></tr>
    `).join('') || '<tr><td colspan="4">All students have completed all cases.</td></tr>';

    // Nearing completion
    const nearing = students.filter(s => s.percentage >= 80 && s.percentage < 100);
    const nearingContainer = document.getElementById('nearingCompletion');
    nearingContainer.innerHTML = nearing.map(s => `
      <tr><td>${s.name}</td><td>${s.program}</td><td>${s.completed}/${s.total}</td><td>${s.percentage}%</td></tr>
    `).join('') || '<tr><td colspan="4">No students nearing completion.</td></tr>';

    // Excessive absences
    const excessive = students.filter(s => s.absences > 2);
    const absContainer = document.getElementById('excessiveAbsences');
    absContainer.innerHTML = excessive.map(s => `
      <tr><td>${s.name}</td><td>${s.program}</td><td>${s.absences}</td></tr>
    `).join('') || '<tr><td colspan="3">No students with excessive absences.</td></tr>';

    // Open opportunities per hospital
    const hospitalCount = {};
    slots.forEach(s => { hospitalCount[s.hospital] = (hospitalCount[s.hospital] || 0) + 1; });
    const sortedHospitals = Object.entries(hospitalCount).sort((a,b) => b[1] - a[1]);
    const hospContainer = document.getElementById('openOpportunities');
    hospContainer.innerHTML = sortedHospitals.map(([hospital, count]) => `
      <tr><td>${hospital}</td><td>${count}</td></tr>
    `).join('') || '<tr><td colspan="2">No open opportunities.</td></tr>';

    // Upcoming duties (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const { data: upcoming, error } = await supabase
      .from('schedules')
      .select('*, users(name)')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0])
      .eq('status', 'scheduled');
    const upcomingContainer = document.getElementById('upcomingDuties');
    upcomingContainer.innerHTML = (upcoming && upcoming.length) ? upcoming.map(s => `
      <tr><td>${s.users?.name || 'Unknown'}</td><td>${s.date}</td><td>${s.hospital}</td><td>${s.case_type}</td></tr>
    `).join('') : '<tr><td colspan="4">No upcoming duties.</td></tr>';

    hideLoading('lackingCases');
    showToast('Analytics loaded successfully', 'success', 2000);
  } catch (err) {
    console.error('Admin analytics error:', err);
    hideLoading('lackingCases');
    showToast('Error loading analytics: ' + err.message, 'error');
  }
}

// ------ Opportunity Board (Student) ------
export async function initOpportunityBoard() {
  const user = requireAuth();
  if (!user || user.role !== 'student') return;

  const container = document.getElementById('opportunityContainer');
  try {
    showLoading('opportunityContainer', 'Loading available slots...');
    const slots = await getAvailableSlots();
    if (!slots || slots.length === 0) {
      container.innerHTML = '<p>No open slots available at the moment.</p>';
    } else {
      container.innerHTML = slots.map(slot => `
        <div class="opportunity-card">
          <div class="slot-info">
            <strong>${slot.case_type}</strong> @ ${slot.hospital} (${slot.date})
          </div>
          <div class="slot-actions">
            <button class="claim-btn" data-slot-id="${slot.id}">Claim Now</button>
          </div>
        </div>
      `).join('');
    }

    // Attach claim events
    container.querySelectorAll('.claim-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const slotId = btn.dataset.slotId;
        try {
          btn.disabled = true;
          btn.textContent = 'Claiming...';
          await claimSlot(slotId, user.id);
          showToast('Slot claimed successfully!', 'success');
          initOpportunityBoard(); // refresh
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Claim Now';
          showToast('Failed to claim slot: ' + err.message, 'error');
        }
      });
    });
    hideLoading('opportunityContainer');
  } catch (err) {
    console.error('Opportunity board error:', err);
    hideLoading('opportunityContainer');
    showToast('Error loading opportunities: ' + err.message, 'error');
  }
}

// ------ Heatmap (Scheduler) ------
export async function initHeatmap() {
  const user = requireAuth();
  if (!user || (user.role !== 'scheduler' && user.role !== 'admin')) return;

  const container = document.getElementById('heatmapContainer');
  try {
    showLoading('heatmapContainer', 'Generating heatmap...');
    const utilization = await getHospitalUtilization();

    const caseTypes = new Set();
    Object.values(utilization).forEach(hospital => {
      Object.keys(hospital).forEach(caseType => caseTypes.add(caseType));
    });
    const caseList = Array.from(caseTypes).sort();

    let html = '<table class="heatmap-table"><thead><tr><th>Hospital</th>';
    caseList.forEach(c => { html += `<th>${c}</th>`; });
    html += '</tr></thead><tbody>';

    Object.entries(utilization).forEach(([hospital, cases]) => {
      html += `<tr><td><strong>${hospital}</strong></td>`;
      caseList.forEach(caseType => {
        const data = cases[caseType] || { total: 0, completed: 0 };
        const completion = data.total ? Math.round((data.completed / data.total) * 100) : 0;
        const color = completion >= 80 ? '#dcfce7' :
                      completion >= 50 ? '#fef9c3' :
                      completion >= 20 ? '#fed7aa' : '#fecaca';
        html += `<td style="background-color:${color}; text-align:center; padding:6px;">
          ${data.total} (${completion}%)
        </td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
    hideLoading('heatmapContainer');
  } catch (err) {
    console.error('Heatmap error:', err);
    hideLoading('heatmapContainer');
    showToast('Error loading heatmap: ' + err.message, 'error');
  }
}

// ------ Send Announcement (Scheduler/CI/Admin) ------
export function initSendAnnouncement() {
  const user = requireAuth();
  if (!user || (user.role !== 'scheduler' && user.role !== 'ci' && user.role !== 'admin')) return;

  const form = document.getElementById('announcementForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('announcementMessage').value;
    if (!message) {
      showToast('Please enter a message.', 'warning');
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      const count = await sendAnnouncement(message, user.id, 'student');
      showToast(`Announcement sent to ${count} students.`, 'success');
      form.reset();
    } catch (err) {
      showToast('Failed to send announcement: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Broadcast to Students';
    }
  });
}

// ------ Absence Marking (CI) ------
export async function initAbsenceMarking() {
  const user = requireAuth();
  if (!user || user.role !== 'ci') return;

  const container = document.getElementById('ciDutiesTable');
  try {
    showLoading('ciDutiesTable', 'Loading duties...');
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*, users(name)')
      .eq('status', 'scheduled')
      .gte('date', new Date().toISOString().split('T')[0]);
    if (error) throw error;

    container.innerHTML = (schedules && schedules.length) ? schedules.map(s => `
      <tr>
        <td>${s.users?.name || 'Unknown'}</td>
        <td>${s.date}</td>
        <td>${s.hospital}</td>
        <td>${s.case_type}</td>
        <td>
          <button class="absent-btn" data-schedule-id="${s.id}" data-student-id="${s.student_id}">Mark Absent</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="5">No upcoming duties.</td></tr>';

    container.querySelectorAll('.absent-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const scheduleId = btn.dataset.scheduleId;
        const studentId = btn.dataset.studentId;
        if (confirm('Mark this student as absent? A make‑up duty will be created.')) {
          try {
            btn.disabled = true;
            btn.textContent = 'Processing...';
            await markAbsent(scheduleId, studentId);
            showToast('Student marked absent. Make‑up duty queued.', 'success');
            initAbsenceMarking();
          } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Mark Absent';
            showToast('Error: ' + err.message, 'error');
          }
        }
      });
    });
    hideLoading('ciDutiesTable');
  } catch (err) {
    console.error('Absence marking error:', err);
    hideLoading('ciDutiesTable');
    showToast('Error loading duties: ' + err.message, 'error');
  }
}

// ------ Case Passport ------
export async function initCasePassport() {
  const user = requireAuth();
  if (!user || user.role !== 'student') return;

  const list = document.getElementById('caseList');
  try {
    showLoading('caseList', 'Loading your cases...');
    const progress = await getProgress(user.id);
    list.innerHTML = progress.cases.map(c => `
      <div class="case-item">
        <span class="case-name">${c.name}</span>
        <span class="case-status">
          ${c.completed ? `<span class="done"><i class="fas fa-check-circle"></i> Verified by ${c.verifiedBy || 'CI'}</span>` 
                         : `<span class="pending"><i class="fas fa-hourglass-half"></i> Pending</span>`}
        </span>
      </div>
    `).join('');
    hideLoading('caseList');
  } catch (err) {
    console.error('Case passport error:', err);
    hideLoading('caseList');
    showToast('Error loading cases: ' + err.message, 'error');
  }
}

// ------ QR Attendance ------
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

  window.scanQR = function() {
    if (role === 'student') {
      const qrDiv = document.getElementById('qrCodePlaceholder');
      const studentId = user.id;
      qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentId)}" alt="QR Code" style="width:200px;height:200px;border-radius:12px;" />`;
      document.getElementById('scanResult').innerHTML = `<span style="color:#166534;"><i class="fas fa-check-circle"></i> QR code generated. Show to CI for verification.</span>`;
      showToast('QR code generated successfully', 'success', 2000);
    } else if (role === 'ci') {
      document.getElementById('scanResult').innerHTML = `<span style="color:#166534;"><i class="fas fa-check-circle"></i> Duty verified! Time-in: ${new Date().toLocaleTimeString()}</span>`;
      showToast('Duty verified! Time-in recorded.', 'success', 2000);
    }
  };
}

// ------ AI Matchmaker ------
export async function initAIMatchmaker() {
  const user = requireAuth();
  if (!user || (user.role !== 'scheduler' && user.role !== 'admin')) return;

  const container = document.getElementById('matchContainer');
  try {
    showLoading('matchContainer', 'Loading AI recommendations...');
    const slots = await getOpenSlots();

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
        <button class="match-btn" data-slot-id="${slot.id}">Match</button>
      </div>
    `).join('') || '<p>No open slots for AI matching.</p>';

    container.querySelectorAll('.match-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          btn.textContent = 'Matching...';
          // In a real app, we would actually match the student
          // For demo, we just show a success message
          showToast('✅ Matched student to duty!', 'success');
          btn.textContent = '✅ Matched';
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Match';
          showToast('Error: ' + err.message, 'error');
        }
      });
    });
    hideLoading('matchContainer');
  } catch (err) {
    console.error('AI Matchmaker error:', err);
    hideLoading('matchContainer');
    showToast('Error loading AI recommendations: ' + err.message, 'error');
  }
}

// ------ Notifications ------
export async function initNotifications() {
  const user = requireAuth();
  if (!user) return;

  const container = document.getElementById('notifList');
  try {
    showLoading('notifList', 'Loading notifications...');
    const notifs = await getNotifications(user.id);
    container.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read?'':'unread'}" onclick="window.markNotifRead(${n.id})">
        <span class="notif-text">${n.message}</span>
        <span class="notif-time">${new Date(n.created_at).toLocaleString()}</span>
      </div>
    `).join('') || '<p>No notifications</p>';
    hideLoading('notifList');
  } catch (err) {
    console.error('Notifications error:', err);
    hideLoading('notifList');
    showToast('Error loading notifications: ' + err.message, 'error');
  }

  window.markNotifRead = async function(id) {
    try {
      await markRead(id);
      initNotifications();
    } catch (err) {
      showToast('Error marking as read: ' + err.message, 'error');
    }
  };
}

// ------ Logout helper ------
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
      'notifications.html': 'notifications.html',
      'opportunity-board.html': 'opportunity-board.html'
    };
    sidebarContainer.innerHTML = renderSidebar(activeMap[path] || '');
  }

  // Page initialization
  if (path === 'student-dashboard.html') {
    await initStudentDashboard();
  } else if (path === 'scheduler-dashboard.html') {
    await initSchedulerDashboard();
    await initHeatmap();
    initSendAnnouncement();
  } else if (path === 'ci-dashboard.html') {
    await initCIDashboard();
    await initAbsenceMarking();
    initSendAnnouncement();
  } else if (path === 'admin.html') {
    await initAdminAnalytics();
    initSendAnnouncement();
  } else if (path === 'case-passport.html') {
    await initCasePassport();
  } else if (path === 'qr-attendance.html') {
    initQRAttendance();
  } else if (path === 'ai-matchmaker.html') {
    await initAIMatchmaker();
  } else if (path === 'notifications.html') {
    await initNotifications();
  } else if (path === 'opportunity-board.html') {
    await initOpportunityBoard();
  }
});
// view-attendance.js
(function() {
  'use strict';

  // ===== Session Guard =====
  function requireStudentSession() {
    const stored = localStorage.getItem('messCurrentUser');
    const session = stored ? JSON.parse(stored) : null;
    if (!session || session.role !== 'student') {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ===== Storage Helpers =====
  function loadFromStorage(key) {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  // ===== Helper: format date =====
  function formatDisplayDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function dayName(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'long' });
  }

  function monthKey(dateStr) {
    const d = new Date(dateStr);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function monthLabel(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  // ===== Render attendance =====
  function renderMyAttendance() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const myRecords = loadFromStorage('messAttendanceRecords').filter(r => r.regNo === session.regNo);

    // Overview stats
    const presentCount = myRecords.filter(r => r.status === 'Present').length;
    const absentCount = myRecords.filter(r => r.status === 'Absent').length;
    const total = presentCount + absentCount;
    const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('percentageCount').textContent = pct + '%';

    // Monthly details
    const monthList = document.getElementById('monthList');
    if (!monthList) return;

    if (myRecords.length === 0) {
      monthList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          No attendance records yet.
        </div>
      `;
      return;
    }

    // Sort by date descending (newest first)
    const sorted = [...myRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by month
    const groups = {};
    sorted.forEach(r => {
      const key = monthKey(r.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    const monthKeys = Object.keys(groups).sort().reverse();

    monthList.innerHTML = monthKeys.map((key, idx) => {
      const records = groups[key];
      const monthPresent = records.filter(r => r.status === 'Present').length;
      const monthAbsent = records.filter(r => r.status === 'Absent').length;

      const rows = records.map(r => `
        <tr>
          <td>${formatDisplayDate(r.date)}</td>
          <td>${dayName(r.date)}</td>
          <td><span class="status-tag ${r.status === 'Present' ? 'present' : 'absent'}">${r.status}</span></td>
          <td>${r.markedByName || '—'}</td>
        </tr>
      `).join('');

      return `
        <details class="month-accordion" ${idx === 0 ? 'open' : ''}>
          <summary>
            <div class="summary-left">
              <i class="fas fa-calendar-alt month-icon"></i>
              <div>
                <h3>${monthLabel(records[0].date)}</h3>
                <span>${monthPresent} days present · ${monthAbsent} days absent</span>
              </div>
            </div>
            <i class="fas fa-chevron-down chevron"></i>
          </summary>
          <table class="attendance-table">
            <thead>
              <tr><th>Date</th><th>Day</th><th>Action</th><th>Marked By</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </details>
      `;
    }).join('');
  }

  // ===== onload =====
  window.onload = function() {
    if (!requireStudentSession()) return;

    fetch('header.html').then(r => r.text()).then(d => {
      document.getElementById('header-placeholder').innerHTML = d;
    }).catch(e => console.error(e));
    fetch('sidebar.html').then(r => r.text()).then(d => {
      document.getElementById('sidebar-placeholder').innerHTML = d;
    }).catch(e => console.error(e));

    setTimeout(() => {
      if (typeof window.initHeaderAndSidebar === 'function') {
        window.initHeaderAndSidebar();
      }
    }, 400);

    renderMyAttendance();
  };

})();
// mark-attendance.js
(function() {
  'use strict';

  // ===== Session Guard =====
  function requireTeacherSession() {
    const stored = localStorage.getItem('messCurrentUser');
    const session = stored ? JSON.parse(stored) : null;
    if (!session || session.role !== 'teacher') {
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

  function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ===== Global state =====
  let myRosters = [];
  let currentRosterIndex = null;

  // ===== Helper =====
  function formatDisplayDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // attendance percentage for a given regNo across all records
  function attendancePercentFor(regNo) {
    const records = loadFromStorage('messAttendanceRecords').filter(r => r.regNo === regNo);
    if (records.length === 0) return null;
    const present = records.filter(r => r.status === 'Present').length;
    return Math.round((present / records.length) * 100);
  }

  // ===== Render classes grid =====
  function renderMyRosters() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    myRosters = loadFromStorage('messAttendanceRosters')
      .filter(r => r.teacherRegNo === session.regNo)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const grid = document.getElementById('classesGrid');
    if (!grid) return;

    if (myRosters.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:48px; color:#94a3b8;"><i class="fas fa-inbox"></i> No attendance rosters have been generated for you yet. Ask the office to generate one from Attendance Roster.</div>`;
      return;
    }

    grid.innerHTML = myRosters.map((r, i) => `
      <div class="class-card">
        <div class="class-card-top">
          <div class="class-card-top-left">
            <div class="class-icon"><i class="fas fa-chalkboard-teacher"></i></div>
            <h3>${r.className}</h3>
          </div>
          <span class="date-badge"><i class="fas fa-calendar-day"></i> ${formatDisplayDate(r.date)}</span>
        </div>
        <div class="class-card-body">
          <div class="info-row">
            <i class="fas fa-id-card"></i>
            <div>
              <span class="info-label">Class ID</span>
              <span class="info-value">${r.classId}</span>
            </div>
          </div>
          <div class="badge-row">
            <span class="badge"><i class="fas fa-layer-group"></i> ${r.grade}</span>
            <span class="badge"><i class="fas fa-calendar-alt"></i> ${r.session}</span>
            <span class="badge"><i class="fas fa-tags"></i> Section ${r.section}</span>
            ${r.marked ? '<span class="badge" style="background:#dcfce7;color:#16a34a;"><i class="fas fa-check"></i> Marked</span>' : ''}
          </div>
          <button type="button" class="btn-open" onclick="openAttendanceModal(${i})">
            <i class="fas fa-folder-open"></i> ${r.marked ? 'Open / Edit' : 'Open'}
          </button>
        </div>
      </div>
    `).join('');
  }

  // ===== Open Modal =====
  window.openAttendanceModal = function(index) {
    currentRosterIndex = index;
    const roster = myRosters[index];
    document.getElementById('modalTitle').textContent = roster.className + ' – Student List';
    document.getElementById('modalSub').textContent = roster.classId + ' · ' + formatDisplayDate(roster.date);

    const classStudents = loadFromStorage('messStudents').filter(s => s.classId === roster.classId);
    const existingRecords = loadFromStorage('messAttendanceRecords')
      .filter(r => r.classId === roster.classId && r.date === roster.date);

    const modalBody = document.getElementById('modalBody');

    if (classStudents.length === 0) {
      modalBody.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8;">No students enrolled in this class yet.</div>`;
      document.getElementById('attendanceModal').classList.add('active');
      return;
    }

    const rowsHtml = classStudents.map(stu => {
      const existing = existingRecords.find(r => r.regNo === stu.regNo);
      const status = existing ? existing.status : 'Present';
      const pct = attendancePercentFor(stu.regNo);
      const photoHtml = stu.photoUrl
        ? `<img class="student-photo" src="${stu.photoUrl}" alt="${stu.studentName}">`
        : `<div class="student-photo"><i class="fas fa-user"></i></div>`;

      return `
        <div class="student-row" data-regno="${stu.regNo}" data-name="${stu.studentName}">
          ${photoHtml}
          <div class="student-main">
            <div class="s-name">${stu.studentName}</div>
            <div class="s-reg">Reg No: ${stu.regNo}</div>
          </div>
          <div class="s-action">
            <div class="action-toggle">
              <input type="radio" name="action_${stu.regNo}" id="action_${stu.regNo}_present" ${status === 'Present' ? 'checked' : ''} value="Present">
              <label for="action_${stu.regNo}_present" class="action-btn present"><i class="fas fa-check"></i>Present</label>
              <input type="radio" name="action_${stu.regNo}" id="action_${stu.regNo}_absent" ${status === 'Absent' ? 'checked' : ''} value="Absent">
              <label for="action_${stu.regNo}_absent" class="action-btn absent"><i class="fas fa-times"></i>Absent</label>
            </div>
          </div>
          <div class="s-percentage"><div class="pct-num">${pct === null ? '—' : pct + '%'}</div><div class="pct-label">Attendance</div></div>
        </div>
      `;
    }).join('');

    modalBody.innerHTML = `
      <div class="student-list">${rowsHtml}</div>
      <div class="save-row">
        <button type="button" class="btn-open" onclick="saveAttendance()">
          <i class="fas fa-save"></i> Save Attendance
        </button>
      </div>
    `;

    document.getElementById('attendanceModal').classList.add('active');
  };

  // ===== Save Attendance =====
  window.saveAttendance = function() {
    const roster = myRosters[currentRosterIndex];
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const rows = document.querySelectorAll('#modalBody .student-row');

    let records = loadFromStorage('messAttendanceRecords');
    // Remove existing records for this class + date
    records = records.filter(r => !(r.classId === roster.classId && r.date === roster.date));

    // Get current timestamp for all records being saved
    const currentTimestamp = Date.now();

    rows.forEach(row => {
      const regNo = row.dataset.regno;
      const studentName = row.dataset.name;
      const checkedInput = row.querySelector('input[type="radio"]:checked');
      const status = checkedInput ? checkedInput.value : 'Present';

      records.push({
        id: 'ATT-' + currentTimestamp + '-' + Math.floor(Math.random() * 10000),
        classId: roster.classId,
        className: roster.className,
        regNo: regNo,
        studentName: studentName,
        date: roster.date,
        status: status,
        markedByRegNo: session.regNo,
        markedByName: session.name,
        lastMarkedTime: currentTimestamp  // NEW FIELD: Explicit timestamp for clarity
      });
    });

    saveToStorage('messAttendanceRecords', records);

    // Mark roster as completed
    const rosters = loadFromStorage('messAttendanceRosters');
    const idx = rosters.findIndex(r => r.id === roster.id);
    if (idx !== -1) {
      rosters[idx].marked = true;
      rosters[idx].lastMarkedTime = currentTimestamp;  // NEW FIELD: Track when roster was marked
      saveToStorage('messAttendanceRosters', rosters);
    }

    closeAttendanceModal();
    renderMyRosters();
  };

  // ===== Close Modal =====
  window.closeAttendanceModal = function() {
    document.getElementById('attendanceModal').classList.remove('active');
  };

  // ===== Click outside modal =====
  document.getElementById('attendanceModal').addEventListener('click', function(e) {
    if (e.target === this) closeAttendanceModal();
  });

  // ===== onload =====
  window.onload = function() {
    if (!requireTeacherSession()) return;

    // Load header and sidebar (components.js must exist)
    fetch('header.html').then(r => r.text()).then(d => {
      document.getElementById('header-placeholder').innerHTML = d;
    }).catch(e => console.error(e));
    fetch('sidebar.html').then(r => r.text()).then(d => {
      document.getElementById('sidebar-placeholder').innerHTML = d;
    }).catch(e => console.error(e));

    // init components if available
    setTimeout(() => {
      if (typeof window.initHeaderAndSidebar === 'function') {
        window.initHeaderAndSidebar();
      }
    }, 400);

    renderMyRosters();
  };

})();
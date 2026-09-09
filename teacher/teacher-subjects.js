// teacher-subjects.js
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

  // ===== Icon mapping =====
  const subjectIcons = {
    mathematics: 'fa-square-root-variable',
    physics: 'fa-atom',
    chemistry: 'fa-flask',
    biology: 'fa-dna',
    english: 'fa-book',
    urdu: 'fa-language',
    quran: 'fa-book-quran',
    science: 'fa-microscope',
    'computer science': 'fa-laptop-code',
    'islamic studies': 'fa-mosque'
  };

  function iconForSubject(name) {
    const key = (name || '').trim().toLowerCase();
    return subjectIcons[key] || 'fa-book-open';
  }

  // ===== Render =====
  function renderMySubjects() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const teachers = loadFromStorage('messTeachers');
    const teacher = teachers.find(t => t.regNo === session.regNo);
    const allSubjects = loadFromStorage('messSubjects');
    const mySubjects = allSubjects.filter(s => s.teacherRegNo === session.regNo);
    const distinctClasses = new Set(mySubjects.map(s => s.classId));

    // Update teacher info
    document.getElementById('teacherName').textContent = teacher ? teacher.teacherName : session.name;
    document.getElementById('totalSubjects').textContent = mySubjects.length;
    document.getElementById('totalClasses').textContent = distinctClasses.size;

    const grid = document.getElementById('subjectsGrid');
    if (!grid) return;

    if (mySubjects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          No subjects assigned to you yet.
        </div>
      `;
      return;
    }

    grid.innerHTML = mySubjects.map(s => `
      <div class="subject-card">
        <div class="subject-card-top">
          <div class="subject-icon"><i class="fas ${iconForSubject(s.subjectName)}"></i></div>
          <h3>${s.subjectName}</h3>
        </div>
        <div class="subject-card-body">
          <div class="info-row">
            <i class="fas fa-chalkboard-teacher"></i>
            <div>
              <span class="info-label">Class</span>
              <span class="info-value">${s.className}</span>
            </div>
          </div>
          <div class="info-row">
            <i class="fas fa-id-card"></i>
            <div>
              <span class="info-label">Class ID</span>
              <span class="info-value">${s.classId}</span>
            </div>
          </div>
          <div class="badge-row">
            <span class="badge"><i class="fas fa-layer-group"></i> ${s.grade}</span>
            <span class="badge"><i class="fas fa-calendar-alt"></i> ${s.session}</span>
            <span class="badge"><i class="fas fa-tags"></i> Section ${s.section}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ===== onload =====
  window.onload = function() {
    if (!requireTeacherSession()) return;

    // Load header & sidebar (components.js must exist)
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

    renderMySubjects();
  };

})();
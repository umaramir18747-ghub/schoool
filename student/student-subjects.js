// student-subjects.js
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

  // ===== Helper: set text content =====
  function setText(id, value, fallback = '—') {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
  }

  // ===== Render subjects =====
  function renderMySubjects() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === session.regNo);
    if (!student) return;

    // Update class info
    setText('className', student.className);
    setText('classId', student.classId);
    setText('grade', student.grade);
    setText('session', student.session);
    setText('section', student.section);

    const mySubjects = loadFromStorage('messSubjects').filter(s => s.classId === student.classId);
    const grid = document.getElementById('subjectsGrid');
    if (!grid) return;

    if (mySubjects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          No subjects assigned to your class yet.
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
            <i class="fas fa-user-tie"></i>
            <div>
              <span class="info-label">Assigned Teacher</span>
              <span class="info-value">${s.teacherName || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
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

    renderMySubjects();
  };

})();
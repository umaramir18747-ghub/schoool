// student-results.js
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

  // ===== Global state =====
  let mySubjects = [];
  let myRegNo = '';
  let currentSubjectIndex = null;
  let currentMode = 'test';

  // ===== Render subjects =====
  function renderMyResultSubjects() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === session.regNo);
    if (!student) return;

    myRegNo = student.regNo;

    // Update class info
    document.getElementById('className').textContent = student.className || '—';
    document.getElementById('classId').textContent = student.classId || '—';
    document.getElementById('grade').textContent = student.grade || '—';
    document.getElementById('session').textContent = student.session || '—';
    document.getElementById('section').textContent = student.section || '—';

    mySubjects = loadFromStorage('messSubjects').filter(s => s.classId === student.classId);
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

    grid.innerHTML = mySubjects.map((s, i) => `
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
          <button class="open-btn" onclick="openResultModal(${i})"><i class="fas fa-folder-open"></i> Open</button>
        </div>
      </div>
    `).join('');
  }

  // ===== Render results =====
  function renderResult() {
    const subject = mySubjects[currentSubjectIndex];
    if (!subject) return;

    document.getElementById('nameColHead').textContent = currentMode === 'test' ? 'Test Name' : 'Paper Name';

    const allResults = loadFromStorage('messResults');
    const entries = allResults.filter(r =>
      r.classId === subject.classId &&
      r.subjectName === subject.subjectName &&
      r.regNo === myRegNo &&
      r.type === currentMode
    );

    const tbody = document.getElementById('resultTableBody');
    tbody.innerHTML = '';

    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#94a3b8;">No ${currentMode} results uploaded yet.</td></tr>`;
      return;
    }

    entries.forEach(data => {
      const pct = data.total ? ((data.obtained / data.total) * 100).toFixed(1) : '0.0';
      const pctClass = parseFloat(pct) >= 40 ? 'pct-pass' : 'pct-fail';
      const icon = currentMode === 'test' ? 'fa-pen' : 'fa-file-lines';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="name-cell"><i class="fas ${icon}"></i> ${data.name}</div></td>
        <td>${data.date}</td>
        <td>${data.total}</td>
        <td>${data.obtained}</td>
        <td class="${pctClass}">${pct}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ===== Set mode =====
  window.setMode = function(mode) {
    currentMode = mode;
    document.getElementById('testModeBtn').classList.toggle('active', mode === 'test');
    document.getElementById('paperModeBtn').classList.toggle('active', mode === 'paper');
    renderResult();
  };

  // ===== Open modal =====
  window.openResultModal = function(index) {
    currentSubjectIndex = index;
    const subject = mySubjects[index];
    document.getElementById('modalTitle').textContent = subject.subjectName + ' – My Result';
    document.getElementById('modalSub').textContent = subject.subjectName;
    setMode('test');
    document.getElementById('resultModal').classList.add('active');
  };

  // ===== Close modal =====
  window.closeResultModal = function() {
    document.getElementById('resultModal').classList.remove('active');
  };

  // ===== Click outside modal =====
  document.getElementById('resultModal').addEventListener('click', function(e) {
    if (e.target === this) closeResultModal();
  });

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

    renderMyResultSubjects();
  };

})();
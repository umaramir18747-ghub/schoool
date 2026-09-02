// student-assignments.js
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

  // ===== Render subjects =====
  function renderMyAssignmentSubjects() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === session.regNo);
    if (!student) return;

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
          <button class="open-btn" onclick="openAssignmentModal(${i})"><i class="fas fa-folder-open"></i> Open</button>
        </div>
      </div>
    `).join('');
  }

  // ===== Open modal =====
  window.openAssignmentModal = function(index) {
    const subject = mySubjects[index];
    if (!subject) return;

    document.getElementById('modalTitle').textContent = subject.subjectName + ' – My Hometasks';
    document.getElementById('modalSub').textContent = subject.subjectName;

    const allAssignments = loadFromStorage('messAssignments');
    const tasks = allAssignments.filter(a => a.classId === subject.classId && a.subjectName === subject.subjectName);

    const tbody = document.getElementById('assignmentTableBody');
    tbody.innerHTML = '';

    if (tasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:#94a3b8;">No hometasks posted for this subject yet.</td></tr>`;
    } else {
      tasks.forEach(task => {
        const hasFile = !!task.fileName;
        const isPdf = hasFile && /\.pdf$/i.test(task.fileName);
        const icon = isPdf ? 'fa-file-pdf' : 'fa-file-image';
        const label = isPdf ? 'PDF' : 'Image';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="name-cell"><i class="fas fa-file-pen"></i> ${task.name}</div></td>
          <td class="desc-cell">${task.description || '—'}</td>
          <td>${hasFile ? `<a href="#" class="attachment-link" onclick="return false;"><i class="fas ${icon}"></i> ${label}</a>` : '<span style="color:#94a3b8">—</span>'}</td>
          <td class="date-cell">${task.date}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.getElementById('assignmentModal').classList.add('active');
  };

  // ===== Close modal =====
  window.closeAssignmentModal = function() {
    document.getElementById('assignmentModal').classList.remove('active');
  };

  // ===== Click outside modal =====
  document.getElementById('assignmentModal').addEventListener('click', function(e) {
    if (e.target === this) closeAssignmentModal();
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

    renderMyAssignmentSubjects();
  };

})();
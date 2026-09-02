// teacher-assignments.js
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
  let currentSubjectIndex = null;

  // ===== Render subject cards =====
  function renderMySubjectCards() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const teachers = loadFromStorage('messTeachers');
    const teacher = teachers.find(t => t.regNo === session.regNo);
    mySubjects = loadFromStorage('messSubjects').filter(s => s.teacherRegNo === session.regNo);
    const distinctClasses = new Set(mySubjects.map(s => s.classId));

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

    grid.innerHTML = mySubjects.map((s, i) => `
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
          <button class="open-btn" onclick="openAssignmentModal(${i})"><i class="fas fa-folder-open"></i> Open</button>
        </div>
      </div>
    `).join('');
  }

  // ===== Helper: formatted today =====
  function formattedToday() {
    const d = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return d.toLocaleDateString('en-GB', options);
  }

  // ===== Open modal =====
  window.openAssignmentModal = function(index) {
    currentSubjectIndex = index;
    const data = mySubjects[index];
    document.getElementById('modalTitle').textContent = data.subjectName + ' – Post Hometask';
    document.getElementById('modalSub').textContent = data.className + ' · ' + data.classId;

    document.getElementById('hometaskName').value = '';
    document.getElementById('hometaskDescription').value = '';
    clearFile();
    document.getElementById('currentDateText').textContent = formattedToday();

    document.getElementById('assignmentModal').classList.add('active');
  };

  // ===== Close modal =====
  window.closeAssignmentModal = function() {
    document.getElementById('assignmentModal').classList.remove('active');
  };

  // ===== File handling =====
  window.handleFileSelect = function(input) {
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      document.getElementById('uploadFilenameText').textContent = file.name;
      document.getElementById('uploadFilename').classList.add('show');
    }
  };

  window.clearFile = function() {
    document.getElementById('hometaskFile').value = '';
    document.getElementById('uploadFilename').classList.remove('show');
    document.getElementById('uploadFilenameText').textContent = '';
  };

  // ===== Save assignment =====
  window.saveAssignment = function() {
    const name = document.getElementById('hometaskName').value.trim();
    if (!name) {
      alert('Please enter a hometask name.');
      return;
    }

    const subject = mySubjects[currentSubjectIndex];
    const description = document.getElementById('hometaskDescription').value.trim();
    const fileNameText = document.getElementById('uploadFilenameText').textContent.trim();

    const assignments = loadFromStorage('messAssignments');
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));

    assignments.push({
      id: 'HW-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      classId: subject.classId,
      className: subject.className,
      subjectName: subject.subjectName,
      teacherRegNo: session.regNo,
      teacherName: session.name,
      name: name,
      description: description,
      fileName: fileNameText || null,
      date: formattedToday()
    });

    saveToStorage('messAssignments', assignments);

    closeAssignmentModal();
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  };

  // ===== Click outside modal =====
  document.getElementById('assignmentModal').addEventListener('click', function(e) {
    if (e.target === this) closeAssignmentModal();
  });

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

    renderMySubjectCards();
  };

})();
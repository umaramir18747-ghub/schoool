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

  // ===== Helper: set text content =====
  function setText(id, value, fallback = '—') {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
  }

  // ===== Get all subjects for a student (regular + makeup) =====
  function getStudentSubjects(studentRegNo) {
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === studentRegNo);
    if (!student) return [];

    // Get regular class subjects
    const allSubjects = loadFromStorage('messSubjects');
    const regularSubjects = allSubjects.filter(s => 
      s.classType === 'regular' && s.classId === student.classId
    );

    // Get makeup class subjects
    const mergedStudents = loadFromStorage('messMakeupStudents');
    const studentMerges = mergedStudents.filter(m => m.studentRegNo === studentRegNo);
    const makeupClassIds = studentMerges.map(m => m.makeupClassId);
    
    const makeupSubjects = allSubjects.filter(s => 
      s.classType === 'makeup' && makeupClassIds.includes(s.classId)
    );

    // Combine and deduplicate
    const combined = [...regularSubjects, ...makeupSubjects];
    const seen = new Set();
    return combined.filter(s => {
      const key = s.classId + '-' + s.subjectName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ===== Get student's class info =====
  function getStudentClassInfo(studentRegNo) {
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === studentRegNo);
    if (!student) return null;
    return student;
  }

  // ===== Check if student is merged into a makeup class =====
  function studentMergesForClass(studentRegNo, classId) {
    const mergedStudents = loadFromStorage('messMakeupStudents');
    return mergedStudents.some(m => m.studentRegNo === studentRegNo && m.makeupClassId === classId);
  }

  // ===== Global state =====
  let mySubjects = [];
  let myRegNo = '';

  // ===== Render subjects =====
  function renderSubjectCards() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    myRegNo = session.regNo;

    // Get student info
    const student = getStudentClassInfo(myRegNo);
    if (!student) return;

    // Update class info
    setText('className', student.className);
    setText('classId', student.classId);
    setText('grade', student.grade);
    setText('session', student.session);
    setText('section', student.section);

    // Get all subjects (regular + makeup)
    mySubjects = getStudentSubjects(myRegNo);

    // Get all assignments for this student
    const allAssignments = loadFromStorage('messAssignments');
    const studentAssignments = allAssignments.filter(a => {
      // Check if assignment is for a class the student is in
      const isRegularClass = a.classType === 'regular' && a.classId === student.classId;
      const isMakeupClass = a.classType === 'makeup' && studentMergesForClass(myRegNo, a.classId);
      return isRegularClass || isMakeupClass;
    });

    const grid = document.getElementById('subjectsGrid');
    if (!grid) return;

    if (mySubjects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No subjects assigned to your class yet.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = mySubjects.map((s, i) => {
      const isMakeup = s.classType === 'makeup';
      const iconClass = isMakeup ? 'makeup-icon' : '';
      const btnClass = isMakeup ? 'makeup-btn' : '';
      
      // Get assignment count for this subject
      const subjectAssignments = studentAssignments.filter(a => 
        a.classId === s.classId && 
        a.subjectName === s.subjectName
      );
      const assignmentCount = subjectAssignments.length;
      const hasAssignments = assignmentCount > 0;
      
      // Get teacher name
      const teacherName = s.teacherName || '—';

      // Get last assignment date
      let lastAssignment = '';
      if (hasAssignments) {
        const sorted = subjectAssignments.sort((a, b) => new Date(b.date) - new Date(a.date));
        lastAssignment = `Last: ${sorted[0].date}`;
      }

      return `
        <div class="subject-card">
          <div class="card-header">
            <div class="subject-title">
              <div class="subject-icon ${iconClass}">
                <i class="fas ${iconForSubject(s.subjectName)}"></i>
              </div>
              <h3>${s.subjectName}</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="info-row">
              <i class="fas fa-user-tie"></i>
              <span class="info-label">Teacher:</span>
              <span class="info-value">${teacherName}</span>
            </div>
            ${hasAssignments ? `<div style="font-size:12px;color:#64748b;margin-top:4px;"><i class="fas fa-clock"></i> ${lastAssignment}</div>` : ''}
          </div>
          <div class="card-footer">
            <span class="assignment-summary">
              ${hasAssignments ? `<strong>${assignmentCount}</strong> assignment${assignmentCount !== 1 ? 's' : ''} posted` : 'No assignments yet'}
            </span>
            <button class="open-btn ${btnClass}" onclick="openAssignmentModal(${i})">
              <i class="fas fa-folder-open"></i> View Assignments
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ===== Open modal =====
  window.openAssignmentModal = function(index) {
    const subject = mySubjects[index];
    if (!subject) return;

    document.getElementById('modalTitle').textContent = subject.subjectName + ' – My Hometasks';
    document.getElementById('modalSub').innerHTML = `
      ${subject.subjectName} · ${subject.className}
    `;

    const allAssignments = loadFromStorage('messAssignments');
    const tasks = allAssignments.filter(a => 
      a.classId === subject.classId && 
      a.subjectName === subject.subjectName
    );

    // Sort by date (newest first)
    tasks.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('assignmentTableBody');
    tbody.innerHTML = '';

    const summaryFooter = document.getElementById('assignmentSummaryFooter');

    if (tasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:#94a3b8;">No hometasks posted for this subject yet.</td></tr>`;
      summaryFooter.style.display = 'none';
      return;
    }

    tasks.forEach(task => {
      const hasFile = !!task.fileName;
      const isPdf = hasFile && /\.pdf$/i.test(task.fileName);
      const isImage = hasFile && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(task.fileName);
      let icon = 'fa-file';
      let label = 'File';
      if (isPdf) { icon = 'fa-file-pdf'; label = 'PDF'; }
      else if (isImage) { icon = 'fa-file-image'; label = 'Image'; }
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="name-cell"><i class="fas fa-file-pen"></i> ${task.name}</div></td>
        <td class="desc-cell">${task.description || '—'}</td>
        <td>${hasFile ? `<a href="#" class="attachment-link" onclick="return false;"><i class="fas ${icon}"></i> ${label}</a>` : '<span style="color:#94a3b8">—</span>'}</td>
        <td class="date-cell">${task.date}</td>
      `;
      tbody.appendChild(tr);
    });

    // Show summary
    const latestDate = tasks.length > 0 ? tasks[0].date : '—';
    const teacherName = tasks.length > 0 ? tasks[0].teacherName || '—' : '—';
    
    document.getElementById('totalAssignmentsCount').textContent = tasks.length;
    document.getElementById('latestAssignmentDate').textContent = latestDate;
    document.getElementById('assignmentTeacher').textContent = teacherName;
    summaryFooter.style.display = 'block';

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

  // ===== Keyboard shortcut: Escape to close modal =====
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('assignmentModal').classList.contains('active')) {
      closeAssignmentModal();
    }
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

    renderSubjectCards();
  };

})();
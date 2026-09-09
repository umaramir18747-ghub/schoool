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

  // ===== Get all subjects for a student (regular + makeup) =====
  function getStudentSubjects(studentRegNo) {
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === studentRegNo);
    if (!student) return { regular: [], makeup: [], combined: [] };

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

    // Combine and deduplicate (in case of duplicates)
    const combined = [...regularSubjects, ...makeupSubjects];
    const seen = new Set();
    const uniqueCombined = combined.filter(s => {
      const key = s.classId + '-' + s.subjectName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      regular: regularSubjects,
      makeup: makeupSubjects,
      combined: uniqueCombined
    };
  }

  // ===== Get student's class info =====
  function getStudentClassInfo(studentRegNo) {
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === studentRegNo);
    if (!student) return null;
    return student;
  }

  // ===== Global state =====
  let mySubjects = [];
  let myRegNo = '';

  // ===== Render subjects =====
  function renderSubjects() {
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
    const subjectData = getStudentSubjects(myRegNo);
    mySubjects = subjectData.combined;

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

    grid.innerHTML = mySubjects.map((s) => {
      const isMakeup = s.classType === 'makeup';
      const iconClass = isMakeup ? 'makeup-icon' : '';
      
      // Get teacher name
      const teacherName = s.teacherName || '—';

      return `
        <div class="subject-card">
          <div class="card-header">
            <div class="subject-title">
              <div class="subject-icon ${iconClass}">
                <i class="fas ${iconForSubject(s.subjectName)}"></i>
              </div>
              <div>
                <h3>${s.subjectName}</h3>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="info-row">
              <i class="fas fa-user-tie"></i>
              <span class="info-label">Teacher:</span>
              <span class="info-value">${teacherName}</span>
            </div>
          </div>
        </div>
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

    renderSubjects();
  };

})();
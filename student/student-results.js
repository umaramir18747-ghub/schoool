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

    // Combine and deduplicate (in case of duplicates)
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

  // ===== Helper: set text content =====
  function setText(id, value, fallback = '—') {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
  }

  // ===== Global state =====
  let mySubjects = [];
  let myRegNo = '';
  let currentSubjectIndex = null;
  let currentMode = 'test';

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

    // Get all results for this student
    const allResults = loadFromStorage('messResults');
    const studentResults = allResults.filter(r => r.regNo === myRegNo);

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
      
      // Get result count for this subject
      const subjectResults = studentResults.filter(r => 
        r.subjectName === s.subjectName && 
        r.classId === s.classId
      );
      const resultCount = subjectResults.length;
      const hasResults = resultCount > 0;

      // Calculate average for this subject
      let avgPct = 0;
      if (hasResults) {
        const totalPct = subjectResults.reduce((sum, r) => {
          return sum + (r.total ? ((r.obtained / r.total) * 100) : 0);
        }, 0);
        avgPct = (totalPct / subjectResults.length);
      }

      // Get teacher name
      const teacherName = s.teacherName || '—';

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
          </div>
          <div class="card-footer">
            <span class="result-summary">
              ${hasResults ? `<strong>${avgPct.toFixed(1)}%</strong> average (${resultCount} result${resultCount !== 1 ? 's' : ''})` : 'No results yet'}
            </span>
            <button class="open-btn ${btnClass}" onclick="openResultModal(${i})">
              <i class="fas fa-folder-open"></i> View Results
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ===== Render results in modal =====
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

    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('resultTableBody');
    tbody.innerHTML = '';

    // Show summary footer
    const summaryFooter = document.getElementById('resultSummaryFooter');

    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#94a3b8;">No ${currentMode} results uploaded yet.</td></tr>`;
      summaryFooter.style.display = 'none';
      return;
    }

    let totalPctSum = 0;
    let highest = -1;
    let lowest = Infinity;

    entries.forEach((data) => {
      const pct = data.total ? ((data.obtained / data.total) * 100) : 0;
      const pctDisplay = pct.toFixed(1);
      let pctClass = 'pct-fail';
      if (pct >= 80) pctClass = 'pct-excellent';
      else if (pct >= 40) pctClass = 'pct-pass';
      
      totalPctSum += pct;
      if (pct > highest) highest = pct;
      if (pct < lowest) lowest = pct;

      const icon = currentMode === 'test' ? 'fa-pen' : 'fa-file-lines';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="name-cell"><i class="fas ${icon}"></i> ${data.name}</div></td>
        <td>${data.date}</td>
        <td>${data.total}</td>
        <td>${data.obtained}</td>
        <td class="${pctClass}">${pctDisplay}%</td>
      `;
      tbody.appendChild(tr);
    });

    // Show summary
    const avgPct = entries.length > 0 ? (totalPctSum / entries.length) : 0;
    document.getElementById('avgPercentage').textContent = avgPct.toFixed(1) + '%';
    document.getElementById('highestScore').textContent = highest.toFixed(1) + '%';
    document.getElementById('lowestScore').textContent = lowest === Infinity ? '—' : lowest.toFixed(1) + '%';
    document.getElementById('totalTests').textContent = entries.length;
    summaryFooter.style.display = 'block';
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
    if (!subject) return;

    document.getElementById('modalTitle').textContent = subject.subjectName + ' – My Results';
    document.getElementById('modalSub').innerHTML = `
      ${subject.subjectName} · ${subject.className}
    `;
    
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

  // ===== Keyboard shortcut: Escape to close modal =====
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('resultModal').classList.contains('active')) {
      closeResultModal();
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
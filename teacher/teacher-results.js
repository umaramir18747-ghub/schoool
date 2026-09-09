// teacher-results.js
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

  // ===== Get students for a class (regular or makeup) =====
  function getStudentsForClass(classId, classType) {
    const allStudents = loadFromStorage('messStudents');
    
    if (classType === 'regular') {
      return allStudents.filter(s => s.classId === classId);
    } else {
      // For makeup class: get students from merges
      const mergedStudents = loadFromStorage('messMakeupStudents');
      const studentRegNos = mergedStudents
        .filter(m => m.makeupClassId === classId)
        .map(m => m.studentRegNo);
      
      return allStudents.filter(s => studentRegNos.includes(s.regNo));
    }
  }

  // ===== Get unique assessments (tests/papers) for a subject =====
  function getUniqueAssessmentsForSubject(results, classId, subjectName) {
    const subjectResults = results.filter(r => 
      r.classId === classId && 
      r.subjectName === subjectName
    );
    
    // Create a Set of unique assessment identifiers (type + name + date)
    const uniqueAssessments = new Set();
    subjectResults.forEach(r => {
      const key = `${r.type}|${r.name}|${r.date}`;
      uniqueAssessments.add(key);
    });
    
    // Return the count and the latest date
    const assessmentList = Array.from(uniqueAssessments).map(key => {
      const [type, name, date] = key.split('|');
      return { type, name, date };
    });
    
    // Sort by date (newest first)
    assessmentList.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return {
      count: assessmentList.length,
      latestDate: assessmentList.length > 0 ? assessmentList[0].date : null
    };
  }

  // ===== Global state =====
  let mySubjects = [];
  let currentSubjectIndex = null;
  let currentType = 'test';

  // ===== Render subject cards =====
  function renderSubjectCards() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const teachers = loadFromStorage('messTeachers');
    const teacher = teachers.find(t => t.regNo === session.regNo);

    // Get all subjects assigned to this teacher
    const allSubjects = loadFromStorage('messSubjects');
    mySubjects = allSubjects.filter(s => s.teacherRegNo === session.regNo);

    // Get all results entered by this teacher
    const allResults = loadFromStorage('messResults');
    const teacherResults = allResults.filter(r => r.teacherRegNo === session.regNo);

    // Update teacher info
    const distinctClasses = new Set(mySubjects.map(s => s.classId));
    document.getElementById('teacherName').textContent = teacher ? teacher.teacherName : session.name;
    document.getElementById('totalSubjectsDisplay').textContent = mySubjects.length;
    document.getElementById('totalClassesDisplay').textContent = distinctClasses.size;

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

    grid.innerHTML = mySubjects.map((s, i) => {
      const isMakeup = s.classType === 'makeup';
      const iconClass = isMakeup ? 'makeup-icon' : '';
      const btnClass = isMakeup ? 'makeup-btn' : '';
      
      // Get unique assessment count for this subject (tests/papers, not student entries)
      const assessmentInfo = getUniqueAssessmentsForSubject(teacherResults, s.classId, s.subjectName);
      const resultCount = assessmentInfo.count;
      const hasResults = resultCount > 0;
      
      // Get student count
      const students = getStudentsForClass(s.classId, s.classType);
      const studentCount = students.length;

      // Get last result date
      let lastResult = '';
      if (hasResults && assessmentInfo.latestDate) {
        // Format the date nicely
        const dateObj = new Date(assessmentInfo.latestDate);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        lastResult = `Last: ${dateObj.toLocaleDateString('en-GB', options)}`;
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
              <i class="fas fa-chalkboard-teacher"></i>
              <span>${s.className}</span>
              <span style="margin-left:auto;font-size:12px;color:#94a3b8;">
                <i class="fas fa-users"></i> ${studentCount} students
              </span>
            </div>
            <div class="info-row">
              <i class="fas fa-id-card"></i>
              <span>${s.classId}</span>
            </div>
            <div class="badge-row">
              <span class="badge"><i class="fas fa-layer-group"></i> ${s.grade}</span>
              <span class="badge"><i class="fas fa-calendar-alt"></i> ${s.session}</span>
              <span class="badge"><i class="fas fa-tags"></i> Section ${s.section}</span>
            </div>
            ${hasResults ? `<div style="font-size:12px;color:#64748b;margin-top:4px;"><i class="fas fa-clock"></i> ${lastResult}</div>` : ''}
          </div>
          <div class="card-footer">
            <span class="assignment-summary">
              ${hasResults ? `<strong>${resultCount}</strong> result${resultCount !== 1 ? 's' : ''} posted` : 'No results yet'}
            </span>
            <button class="open-btn ${btnClass}" onclick="openResultModal(${i})">
              <i class="fas fa-folder-open"></i> Enter Results
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ===== Set result type (test/paper) =====
  window.setResultType = function(type) {
    currentType = type;
    document.getElementById('testTypeBtn').classList.toggle('active', type === 'test');
    document.getElementById('paperTypeBtn').classList.toggle('active', type === 'paper');
    document.getElementById('nameLabel').textContent = type === 'test' ? 'Test Name' : 'Paper Name';
    document.getElementById('assessmentName').placeholder = type === 'test' ? 'e.g. Mid Term Test' : 'e.g. Mid Term Paper';
  };

  // ===== Open modal =====
  window.openResultModal = function(index) {
    // Get the actual index from mySubjects list
    const subject = mySubjects[index];
    if (!subject) return;

    currentSubjectIndex = index;
    const isMakeup = subject.classType === 'makeup';
    
    document.getElementById('modalTitle').textContent = subject.subjectName + ' – Results';
    document.getElementById('modalSub').innerHTML = `
      ${subject.className} · ${subject.classId}
    `;

    // Reset form
    setResultType('test');
    document.getElementById('assessmentName').value = '';
    document.getElementById('totalMarks').value = '';
    document.getElementById('assessmentDate').value = '';

    // Get students for this class (handles both regular and makeup)
    const students = getStudentsForClass(subject.classId, subject.classType);
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    // Update student count
    document.getElementById('studentCountBadge').textContent = `(${students.length} students)`;

    if (students.length === 0) {
      const message = isMakeup ? 
        'No students have been merged into this make-up class yet.' :
        'No students enrolled in this class yet.';
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">${message}</td></tr>`;
    } else {
      students.forEach(stu => {
        const tr = document.createElement('tr');
        const photoHtml = stu.photoUrl ? 
          `<img src="${stu.photoUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="student">` :
          `<div class="stu-avatar"><i class="fas fa-user"></i></div>`;
        tr.innerHTML = `
          <td>${photoHtml}</td>
          <td class="stu-reg" data-regno="${stu.regNo}">${stu.regNo}</td>
          <td class="stu-name">${stu.studentName}</td>
          <td><input type="number" class="marks-input" placeholder="0" min="0"></td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.getElementById('resultModal').classList.add('active');
  };

  // ===== Close modal =====
  window.closeResultModal = function() {
    document.getElementById('resultModal').classList.remove('active');
  };

  // ===== Save results =====
  window.saveResults = function() {
    const name = document.getElementById('assessmentName').value.trim();
    const totalMarks = parseFloat(document.getElementById('totalMarks').value) || 0;
    const date = document.getElementById('assessmentDate').value;

    if (!name) {
      alert('Please enter a ' + (currentType === 'test' ? 'test' : 'paper') + ' name.');
      return;
    }
    if (!totalMarks || !date) {
      alert('Please enter total marks and a date.');
      return;
    }

    const subject = mySubjects[currentSubjectIndex];
    if (!subject) {
      alert('Subject not found. Please try again.');
      return;
    }

    const rows = document.querySelectorAll('#studentTableBody tr');
    const results = loadFromStorage('messResults');
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));

    let savedCount = 0;

    rows.forEach(row => {
      const regCell = row.querySelector('.stu-reg');
      if (!regCell) return;
      const regNo = regCell.dataset.regno;
      const studentName = row.querySelector('.stu-name').textContent;
      const marksInput = row.querySelector('.marks-input');
      const obtained = parseFloat(marksInput.value) || 0;

      // Only save if marks were entered (or if 0 is entered)
      if (marksInput.value !== '') {
        results.push({
          id: 'RES-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          classId: subject.classId,
          classType: subject.classType || 'regular',
          className: subject.className,
          subjectName: subject.subjectName,
          teacherRegNo: session.regNo,
          type: currentType,
          name: name,
          date: date,
          total: totalMarks,
          obtained: obtained,
          regNo: regNo,
          studentName: studentName
        });
        savedCount++;
      }
    });

    if (savedCount === 0) {
      alert('Please enter marks for at least one student.');
      return;
    }

    saveToStorage('messResults', results);

    closeResultModal();
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = 
      `${savedCount} student result${savedCount !== 1 ? 's' : ''} saved for ${currentType} "${name}"`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);

    // Refresh the subject cards to update stats
    renderSubjectCards();
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
    if (!requireTeacherSession()) return;

    // Load header & sidebar
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
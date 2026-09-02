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

  // ===== Global state =====
  let mySubjects = [];
  let currentSubjectIndex = null;
  let currentType = 'test';

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
          <button class="open-btn" onclick="openResultModal(${i})"><i class="fas fa-folder-open"></i> Open</button>
        </div>
      </div>
    `).join('');
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
    currentSubjectIndex = index;
    const data = mySubjects[index];
    document.getElementById('modalTitle').textContent = data.subjectName + ' – Results';
    document.getElementById('modalSub').textContent = data.className + ' · ' + data.classId;

    // Reset form
    setResultType('test');
    document.getElementById('assessmentName').value = '';
    document.getElementById('totalMarks').value = '';
    document.getElementById('assessmentDate').value = '';

    const classStudents = loadFromStorage('messStudents').filter(s => s.classId === data.classId);
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    if (classStudents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">No students enrolled in this class yet.</td></tr>`;
    } else {
      classStudents.forEach(stu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="stu-avatar"><i class="fas fa-user"></i></div></td>
          <td class="stu-reg" data-regno="${stu.regNo}">${stu.regNo}</td>
          <td class="stu-name">${stu.studentName}</td>
          <td><input type="number" class="marks-input" placeholder="0"></td>
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
    const rows = document.querySelectorAll('#studentTableBody tr');
    const results = loadFromStorage('messResults');
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));

    rows.forEach(row => {
      const regCell = row.querySelector('.stu-reg');
      if (!regCell) return;
      const regNo = regCell.dataset.regno;
      const studentName = row.querySelector('.stu-name').textContent;
      const obtained = parseFloat(row.querySelector('.marks-input').value) || 0;

      results.push({
        id: 'RES-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        classId: subject.classId,
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
    });

    saveToStorage('messResults', results);

    closeResultModal();
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = (currentType === 'test' ? 'Test' : 'Paper') + ' results saved successfully!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  };

  // ===== Click outside modal =====
  document.getElementById('resultModal').addEventListener('click', function(e) {
    if (e.target === this) closeResultModal();
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
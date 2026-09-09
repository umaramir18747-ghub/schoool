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

  // ===== Global state =====
  let mySubjects = [];
  let currentSubjectIndex = null;

  // ===== Render subject cards =====
  function renderSubjectCards() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const teachers = loadFromStorage('messTeachers');
    const teacher = teachers.find(t => t.regNo === session.regNo);

    // Get all subjects assigned to this teacher
    const allSubjects = loadFromStorage('messSubjects');
    mySubjects = allSubjects.filter(s => s.teacherRegNo === session.regNo);

    // Get all assignments posted by this teacher
    const allAssignments = loadFromStorage('messAssignments');
    const teacherAssignments = allAssignments.filter(a => a.teacherRegNo === session.regNo);

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
      
      // Get assignment count for this subject
      const subjectAssignments = teacherAssignments.filter(a => 
        a.classId === s.classId && 
        a.subjectName === s.subjectName
      );
      const assignmentCount = subjectAssignments.length;
      const hasAssignments = assignmentCount > 0;
      
      // Get student count for this class
      const students = getStudentsForClass(s.classId, s.classType);
      const studentCount = students.length;

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
            ${hasAssignments ? `<div style="font-size:12px;color:#64748b;margin-top:4px;"><i class="fas fa-clock"></i> ${lastAssignment}</div>` : ''}
          </div>
          <div class="card-footer">
            <span class="assignment-summary">
              ${hasAssignments ? `<strong>${assignmentCount}</strong> assignment${assignmentCount !== 1 ? 's' : ''} posted` : 'No assignments yet'}
            </span>
            <button class="open-btn ${btnClass}" onclick="openAssignmentModal(${i})">
              <i class="fas fa-plus"></i> Post Assignment
            </button>
          </div>
        </div>
      `;
    }).join('');
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
    if (!data) return;

    const isMakeup = data.classType === 'makeup';
    
    document.getElementById('modalTitle').textContent = data.subjectName + ' – Post Hometask';
    document.getElementById('modalSub').innerHTML = `
      ${data.className} · ${data.classId}
    `;

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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller file.');
        input.value = '';
        return;
      }
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
      document.getElementById('hometaskName').focus();
      return;
    }

    const subject = mySubjects[currentSubjectIndex];
    if (!subject) {
      alert('Subject not found. Please try again.');
      return;
    }

    const description = document.getElementById('hometaskDescription').value.trim();
    const fileNameText = document.getElementById('uploadFilenameText').textContent.trim();

    const assignments = loadFromStorage('messAssignments');
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));

    // Create assignment object
    const newAssignment = {
      id: 'HW-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      classId: subject.classId,
      classType: subject.classType || 'regular',
      className: subject.className,
      subjectName: subject.subjectName,
      teacherRegNo: session.regNo,
      teacherName: session.name,
      name: name,
      description: description,
      fileName: fileNameText || null,
      date: formattedToday(),
      timestamp: new Date().toISOString()
    };

    assignments.push(newAssignment);
    saveToStorage('messAssignments', assignments);

    closeAssignmentModal();
    
    // Show success toast
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = `✅ "${name}" posted to ${subject.className}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);

    // Refresh the subject cards to update stats
    renderSubjectCards();
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
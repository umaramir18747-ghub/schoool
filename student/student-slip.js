// ===== student-slip.js =====
(function() {
  'use strict';

  // ===== Storage Helpers =====
  function loadFromStorage(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (!isNaN(day) && monthIndex >= 0 && monthIndex < 12 && !isNaN(year)) {
        return `${String(day).padStart(2, '0')} ${monthNames[monthIndex]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDisplayTime(timeStr) {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  function setText(id, value, fallback = '—') {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
  }

  let currentStudent = null;
  let currentExamSlip = null;

  function renderMyExamSlip() {
    const storedUser = localStorage.getItem('messCurrentUser');
    const session = storedUser ? JSON.parse(storedUser) : null;
    const students = loadFromStorage('messStudents');
    
    let student = null;
    if (session && session.regNo) {
      student = students.find(s => s.regNo === session.regNo);
    }
    if (!student && students.length > 0) {
      student = students[0];
    }
    if (!student) {
      student = {
        studentName: 'Muhammad Hamza',
        fatherName: 'Muhammad Amir',
        regNo: 'MEI-2026-108',
        className: 'Class 10-A',
        classId: 'CLS-10A',
        grade: '10th',
        session: '2025-2026',
        section: 'A'
      };
    }
    currentStudent = student;

    const config = loadFromStorage('messSchoolConfig');
    if (config && config.schoolName) {
      setText('schoolName', config.schoolName);
      setText('schoolTagline', config.schoolTagline || 'Learn With Practical');
    }

    setText('studentName', student.studentName);
    setText('regNumber', student.regNo);
    setText('fatherName', student.fatherName);

    const photoImg = document.getElementById('studentPhoto');
    const placeholder = document.querySelector('.photo-placeholder');
    if (photoImg && student.photoUrl) {
      photoImg.src = student.photoUrl;
      photoImg.alt = student.studentName || 'Student Photo';
      photoImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }

    setText('className', student.className);
    setText('classId', student.classId);
    setText('grade', student.grade);
    setText('session', student.session);
    setText('section', student.section);

    const examSlips = loadFromStorage('messExamSlips');
    const mySlip = examSlips.find(s => s.classId === student.classId) || (examSlips.length > 0 ? examSlips[0] : null);
    currentExamSlip = mySlip;

    const tbody = document.getElementById('examTableBody');

    if (mySlip && mySlip.examType) {
      setText('examType', mySlip.examType);
    } else {
      setText('examType', 'Annual Exam');
    }

    if (!mySlip || !mySlip.exams || mySlip.exams.length === 0) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#94a3b8;">No exam schedule has been assigned to your class yet.</td></tr>`;
      }
    } else {
      if (tbody) {
        tbody.innerHTML = mySlip.exams.map(ex => `
          <tr>
            <td>${ex.subject}</td>
            <td>${formatDisplayDate(ex.date)}</td>
            <td>${ex.day || '—'}</td>
            <td>${formatDisplayTime(ex.time)}</td>
            <td>${ex.teacher || '—'}</td>
          </tr>
        `).join('');
      }
    }

    // ========================================================
    // REQUIREMENT 1:
    // "which date admin set exam slip in exam-slip.html this date show on student slip on issue date field"
    // ========================================================
    const issuedOn = document.getElementById('issuedOn');
    if (issuedOn) {
      let slipDate = '';
      if (mySlip && mySlip.issueDate) {
        // Date explicitly selected by admin in exam-slip.html
        slipDate = mySlip.issueDate;
      } else if (mySlip && mySlip.generatedDate) {
        slipDate = mySlip.generatedDate;
      } else {
        slipDate = new Date().toISOString().split('T')[0];
      }
      const formatted = formatDisplayDate(slipDate);
      issuedOn.textContent = `Issued on: ${formatted}`;
    }
  }

  // ========================================================
  // REQUIREMENT 3:
  // "make sure when student press download button then it fully formatted layout prints as a clean PDF document.
  // And ensure all styles are preserved so nothing gets cut off.
  // And A4 paper size should be set automatically for downloading.
  // equal align mnet of divs section on downloading exam sheets and ensure all font sizes remain consistent across all devices."
  // ========================================================
  window.downloadSlip = function() {
    const element = document.getElementById('examSlipDoc');
    const btn = document.querySelector('.download-btn');
    const originalLabel = btn ? btn.innerHTML : '';

    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing PDF...';
      btn.disabled = true;
    }

    // Capture width: 760px for clean single page A4 scaling
    const CAPTURE_WIDTH = 760;
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;

    element.classList.add('pdf-capture-mode');
    element.style.width = CAPTURE_WIDTH + 'px';
    element.style.maxWidth = CAPTURE_WIDTH + 'px';

    if (typeof window.html2canvas !== 'function') {
      window.print();
      if (btn) { btn.innerHTML = originalLabel; btn.disabled = false; }
      return;
    }

    setTimeout(() => {
      window.html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: CAPTURE_WIDTH,
        windowWidth: CAPTURE_WIDTH,
        onclone: function(clonedDoc) {
          const clonedEl = clonedDoc.getElementById('examSlipDoc');
          if (clonedEl) {
            clonedEl.style.width = CAPTURE_WIDTH + 'px';
            clonedEl.style.maxWidth = CAPTURE_WIDTH + 'px';
          }
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            if (img.complete && img.naturalHeight === 0) {
              img.style.display = 'none';
            }
          });
        }
      }).then(canvas => {
        element.classList.remove('pdf-capture-mode');
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;

        const imgData = canvas.toDataURL('image/jpeg', 0.96);

        const jspdfObj = window.jspdf ? window.jspdf.jsPDF : (typeof jsPDF !== 'undefined' ? jsPDF : null);
        if (!jspdfObj) {
          window.print();
          if (btn) { btn.innerHTML = originalLabel; btn.disabled = false; }
          return;
        }

        // Standard A4 portrait
        const pdf = new jspdfObj({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const marginX = 8;
        const marginY = 8;
        const maxWidth = pageWidth - (marginX * 2);   // 194 mm
        const maxHeight = pageHeight - (marginY * 2); // 281 mm

        let imgWidth = maxWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = marginY;

        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');

        const regNo = currentStudent ? currentStudent.regNo.replace(/[^a-zA-Z0-9_-]/g, '_') : 'student';
        const dateStr = new Date().toISOString().split('T')[0];
        pdf.save(`Exam-Slip-${regNo}-${dateStr}.pdf`);

        if (btn) {
          btn.innerHTML = originalLabel;
          btn.disabled = false;
        }
      }).catch(err => {
        console.error('PDF generation failed:', err);
        element.classList.remove('pdf-capture-mode');
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;
        if (btn) {
          btn.innerHTML = originalLabel;
          btn.disabled = false;
        }
        window.print();
      });
    }, 100);
  };

  window.addEventListener('storage', renderMyExamSlip);

  window.onload = function() {
    fetch('header.html').then(r => r.text()).then(d => {
      const el = document.getElementById('header-placeholder');
      if (el) el.innerHTML = d;
    }).catch(e => {});

    fetch('sidebar.html').then(r => r.text()).then(d => {
      const el = document.getElementById('sidebar-placeholder');
      if (el) el.innerHTML = d;
    }).catch(e => {});

    setTimeout(() => {
      if (typeof window.initHeaderAndSidebar === 'function') {
        window.initHeaderAndSidebar();
      }
    }, 400);

    renderMyExamSlip();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    renderMyExamSlip();
  }
})();
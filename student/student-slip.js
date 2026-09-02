// ===== student-slip.js =====
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

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDisplayTime(timeStr) {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
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

  function renderMyExamSlip() {
    const session = JSON.parse(localStorage.getItem('messCurrentUser'));
    const students = loadFromStorage('messStudents');
    const student = students.find(s => s.regNo === session.regNo);
    if (!student) return;
    currentStudent = student;

    const config = loadFromStorage('messSchoolConfig');
    if (config && config.schoolName) {
      document.getElementById('schoolName').textContent = config.schoolName;
      document.getElementById('schoolTagline').textContent = config.schoolTagline || 'Learn With Practical';
    }

    setText('studentName', student.studentName);
    setText('regNumber', student.regNo);
    setText('fatherName', student.fatherName);

    const photoImg = document.getElementById('studentPhoto');
    if (photoImg && student.photoUrl) {
      photoImg.src = student.photoUrl;
      photoImg.alt = student.studentName || 'Student Photo';
      photoImg.style.display = 'block';
      const placeholder = document.querySelector('.photo-placeholder');
      if (placeholder) placeholder.style.display = 'none';
    }

    setText('className', student.className);
    setText('classId', student.classId);
    setText('grade', student.grade);
    setText('session', student.session);
    setText('section', student.section);

    const examSlips = loadFromStorage('messExamSlips');
    const mySlip = examSlips.find(s => s.classId === student.classId);
    const tbody = document.getElementById('examTableBody');

    if (mySlip && mySlip.examType) {
      setText('examType', mySlip.examType);
    } else {
      setText('examType', '—');
    }

    if (!mySlip || !mySlip.exams || mySlip.exams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#94a3b8;">No exam schedule has been assigned to your class yet.</td></tr>`;
    } else {
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

    const issuedOn = document.getElementById('issuedOn');
    if (issuedOn) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      issuedOn.textContent = `Issued on: ${dateStr}`;
    }
  }

  // ===== Enhanced PDF Download - Real A4 + Full-width fit =====
  window.downloadSlip = function() {
    const element = document.getElementById('examSlipDoc');
    const btn = document.querySelector('.download-btn');
    const originalLabel = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing PDF...';
    btn.disabled = true;

    // Capture at full width to match Image 1 layout
    // A4 width (210mm) at 96 DPI is ~794px, use 775px for maximum width fill
    const CAPTURE_WIDTH = 775;
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;

    element.classList.add('pdf-capture-mode');
    element.style.width = CAPTURE_WIDTH + 'px';
    element.style.maxWidth = CAPTURE_WIDTH + 'px';

    // Small delay so browser applies the forced width + CSS
    setTimeout(() => {
      html2canvas(element, {
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
        // Restore original styles
        element.classList.remove('pdf-capture-mode');
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // ===== Real A4 page with minimal margins =====
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        });

        const pageWidth = 210;
        const pageHeight = 297;

        // Ultra-minimal margins for absolute maximum full-width appearance
        const marginX = 2;
        const marginY = 4;
        const maxWidth = pageWidth - (marginX * 2);   // 206 mm (almost full width)
        const maxHeight = pageHeight - (marginY * 2); // 289 mm

        // Stretch to full available WIDTH
        let imgWidth = maxWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Only shrink if it overflows the page height
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        // Center horizontally, top-aligned
        const x = (pageWidth - imgWidth) / 2;
        const y = marginY;

        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');

        const regNo = currentStudent ? currentStudent.regNo : 'student';
        const dateStr = new Date().toISOString().split('T')[0];
        pdf.save(`Exam-Slip-${regNo}-${dateStr}.pdf`);

        btn.innerHTML = originalLabel;
        btn.disabled = false;

      }).catch(err => {
        console.error('PDF generation failed:', err);
        element.classList.remove('pdf-capture-mode');
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;
        btn.innerHTML = originalLabel;
        btn.disabled = false;
        alert('Something went wrong while generating the PDF. Please try again.');
      });
    }, 80);
  };

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

    renderMyExamSlip();
  };

})();
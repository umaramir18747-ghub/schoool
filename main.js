/**
 * Muhammad Education Institute — Interactive Vanilla JavaScript (script.js)
 */

document.addEventListener('DOMContentLoaded', () => {

  // ================= 1. NAVBAR SCROLL EFFECT =================
  const mainHeader = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }
  });

  // ================= 2. MOBILE MENU DRAWER =================
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuToggleBtn && mobileMenu) {
    menuToggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });

    // Close when clicking links
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ================= 3. 3-PANEL INTERACTIVE NEWS & GALLERY SLIDER =================
  const gallerySlides = [
    {
      img: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop',
      tag: 'Campus Facilities',
      title: 'Modern Science & Innovation Labs',
      desc: 'State-of-the-art physics, chemistry, and digital computing laboratories providing practical experimental training.'
    },
    {
      img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop',
      tag: 'Digital Learning',
      title: 'Smart Classrooms & Collaborative Arenas',
      desc: 'Interactive smart boards and high-speed multimedia setups fostering student participation and critical thinking.'
    },
    {
      img: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=1200&auto=format&fit=crop',
      tag: 'Arts & Expression',
      title: 'Creative Arts & Design Studio',
      desc: 'Nurturing aesthetic appreciation, fine arts, calligraphic traditions, and music performance.'
    },
    {
      img: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200&auto=format&fit=crop',
      tag: 'Physical Wellness',
      title: 'Sports Grounds & Athletics Arena',
      desc: 'Dedicated football pitch, cricket nets, track-and-field circuits, and indoor gymnasium facilities.'
    }
  ];

  let currentSlideIndex = 0;

  const mainImg = document.getElementById('main-gallery-img');
  const mainTag = document.getElementById('main-gallery-tag');
  const mainTitle = document.getElementById('main-gallery-title');
  const mainDesc = document.getElementById('main-gallery-desc');

  const prevPreviewImg = document.getElementById('prev-preview-img');
  const prevPreviewTitle = document.getElementById('prev-preview-title');
  const nextPreviewImg = document.getElementById('next-preview-img');
  const nextPreviewTitle = document.getElementById('next-preview-title');

  const prevBtn = document.getElementById('gallery-prev-btn');
  const nextBtn = document.getElementById('gallery-next-btn');
  const dotsContainer = document.getElementById('gallery-dots');

  const prevSideBox = document.getElementById('gallery-prev-box');
  const nextSideBox = document.getElementById('gallery-next-box');

  // Render dots
  if (dotsContainer) {
    gallerySlides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `dot ${idx === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => updateGallery(idx));
      dotsContainer.appendChild(dot);
    });
  }

  function updateGallery(index) {
    currentSlideIndex = (index + gallerySlides.length) % gallerySlides.length;
    const prevIndex = (currentSlideIndex - 1 + gallerySlides.length) % gallerySlides.length;
    const nextIndex = (currentSlideIndex + 1) % gallerySlides.length;

    // Update Main Slide
    if (mainImg) mainImg.src = gallerySlides[currentSlideIndex].img;
    if (mainTag) mainTag.textContent = gallerySlides[currentSlideIndex].tag;
    if (mainTitle) mainTitle.textContent = gallerySlides[currentSlideIndex].title;
    if (mainDesc) mainDesc.textContent = gallerySlides[currentSlideIndex].desc;

    // Update Previews
    if (prevPreviewImg) prevPreviewImg.src = gallerySlides[prevIndex].img;
    if (prevPreviewTitle) prevPreviewTitle.textContent = gallerySlides[prevIndex].title;

    if (nextPreviewImg) nextPreviewImg.src = gallerySlides[nextIndex].img;
    if (nextPreviewTitle) nextPreviewTitle.textContent = gallerySlides[nextIndex].title;

    // Update dots
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === currentSlideIndex);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => updateGallery(currentSlideIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => updateGallery(currentSlideIndex + 1));

  if (prevSideBox) prevSideBox.addEventListener('click', () => updateGallery(currentSlideIndex - 1));
  if (nextSideBox) nextSideBox.addEventListener('click', () => updateGallery(currentSlideIndex + 1));

  // Initialize initial previews
  updateGallery(0);

  // Auto slide every 6 seconds
  let autoSlideTimer = setInterval(() => {
    updateGallery(currentSlideIndex + 1);
  }, 6000);

  // Pause on hover
  const mainGalleryCard = document.querySelector('.main-image-card');
  if (mainGalleryCard) {
    mainGalleryCard.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
    mainGalleryCard.addEventListener('mouseleave', () => {
      autoSlideTimer = setInterval(() => updateGallery(currentSlideIndex + 1), 6000);
    });
  }

  // ================= 4. CONTACT FORM SUBMISSION =================
  const contactForm = document.getElementById('institute-contact-form');
  const contactSuccessMsg = document.getElementById('contact-success-msg');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Simulate form submission
      contactForm.style.opacity = '0.5';
      const submitBtn = contactForm.querySelector('.btn-submit');
      if (submitBtn) submitBtn.textContent = 'Submitting...';

      setTimeout(() => {
        contactForm.reset();
        contactForm.style.opacity = '1';
        if (submitBtn) submitBtn.textContent = 'Send Message';
        if (contactSuccessMsg) {
          contactSuccessMsg.style.display = 'block';
          setTimeout(() => {
            contactSuccessMsg.style.display = 'none';
          }, 5000);
        }
      }, 700);
    });
  }

  // ================= 5. PORTAL LOGIN MODAL & TABS =================
  const portalModal = document.getElementById('portal-modal');
  const openPortalBtn = document.getElementById('open-portal-btn');
  const closePortalBtn = document.getElementById('close-portal-btn');
  const portalLoginForm = document.getElementById('portal-login-form');
  const portalDashboardView = document.getElementById('portal-dashboard-view');
  const portalLogoutBtn = document.getElementById('portal-logout-btn');
  const portalIdLabel = document.getElementById('portal-id-label');

  if (openPortalBtn && portalModal) {
    openPortalBtn.addEventListener('click', () => portalModal.classList.add('open'));
  }

  if (closePortalBtn && portalModal) {
    closePortalBtn.addEventListener('click', () => portalModal.classList.remove('open'));
  }

  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target === portalModal) portalModal.classList.remove('open');
    if (e.target === admissionModal) admissionModal.classList.remove('open');
  });

  // Portal tabs
  const pTabs = document.querySelectorAll('.p-tab');
  pTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      pTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const role = tab.getAttribute('data-role');
      if (portalIdLabel) {
        if (role === 'student') portalIdLabel.textContent = 'Student Roll No / Registration ID';
        else if (role === 'parent') portalIdLabel.textContent = 'Parent Registered Mobile / CNIC';
        else portalIdLabel.textContent = 'Faculty Employee ID';
      }
    });
  });

  if (portalLoginForm && portalDashboardView) {
    portalLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      portalLoginForm.style.display = 'none';
      portalDashboardView.style.display = 'block';
    });
  }

  if (portalLogoutBtn && portalLoginForm && portalDashboardView) {
    portalLogoutBtn.addEventListener('click', () => {
      portalDashboardView.style.display = 'none';
      portalLoginForm.style.display = 'block';
    });
  }

  // ================= 6. ADMISSION APPLICATION MODAL =================
  const admissionModal = document.getElementById('admission-modal');
  const heroEnrollBtn = document.getElementById('hero-enroll-btn');
  const mobileEnrollBtn = document.getElementById('mobile-enroll-btn');
  const admissionsApplyBtn = document.getElementById('admissions-apply-btn');
  const closeAdmissionBtn = document.getElementById('close-admission-btn');
  const admissionAppForm = document.getElementById('admission-app-form');
  const admissionSuccessBox = document.getElementById('admission-success-box');
  const admRefText = document.getElementById('adm-ref-text');

  function openAdmissionModal() {
    if (admissionModal) {
      admissionModal.classList.add('open');
      if (admissionAppForm) admissionAppForm.style.display = 'block';
      if (admissionSuccessBox) admissionSuccessBox.style.display = 'none';
    }
  }

  if (heroEnrollBtn) heroEnrollBtn.addEventListener('click', openAdmissionModal);
  if (mobileEnrollBtn) mobileEnrollBtn.addEventListener('click', openAdmissionModal);
  if (admissionsApplyBtn) admissionsApplyBtn.addEventListener('click', openAdmissionModal);

  if (closeAdmissionBtn && admissionModal) {
    closeAdmissionBtn.addEventListener('click', () => admissionModal.classList.remove('open'));
  }

  if (admissionAppForm) {
    admissionAppForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const randRef = 'MEI-ADM-' + Math.floor(10000 + Math.random() * 90000);
      if (admRefText) admRefText.textContent = `Ref ID: ${randRef}`;
      admissionAppForm.style.display = 'none';
      if (admissionSuccessBox) admissionSuccessBox.style.display = 'block';
    });
  }

});
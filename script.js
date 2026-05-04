'use strict';

// ===========================
// Header scroll behavior
// ===========================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ===========================
// Hamburger menu
// ===========================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const isOpen = navLinks.classList.contains('open');
  hamburger.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ===========================
// Scroll animations (Intersection Observer)
// ===========================
const animatedElements = document.querySelectorAll('[data-aos]');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

animatedElements.forEach(el => observer.observe(el));

// ===========================
// Seasons tab switcher
// ===========================
const seasonTabs = document.querySelectorAll('.season-tab');
const seasonPanels = document.querySelectorAll('.season-panel');

seasonTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const season = tab.dataset.season;

    seasonTabs.forEach(t => t.classList.remove('active'));
    seasonPanels.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(season).classList.add('active');
  });
});

// ===========================
// Back to top button
// ===========================
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===========================
// Contact form
// ===========================
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const btn = contactForm.querySelector('button[type="submit"]');
  btn.textContent = '送信中...';
  btn.disabled = true;

  setTimeout(() => {
    showToast('お問い合わせを受け付けました。24時間以内にご返信します。');
    contactForm.reset();
    btn.textContent = '送信する';
    btn.disabled = false;
  }, 1200);
});

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast toast--success';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// ===========================
// Smooth scroll for anchor links
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

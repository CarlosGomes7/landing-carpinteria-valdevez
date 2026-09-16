
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function closeMenu() { mobileMenu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Abrir menú'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; mobileMenu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); });
mobileMenu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); menuButton.focus(); } });
window.matchMedia('(min-width:761px)').addEventListener('change', closeMenu);
document.querySelector('#current-year').textContent = String(new Date().getFullYear());

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches) {
  document.documentElement.classList.add('animate-entrance');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 3, 2) * 65}ms`;
    element.classList.add('reveal-prepared');
    revealObserver.observe(element);
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      revealObserver.disconnect();
      document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
    }
  });
}

const galleryDialog = document.querySelector('.gallery-dialog');
const galleryDialogImage = document.querySelector('#gallery-dialog-image');
const galleryDialogTitle = document.querySelector('#gallery-dialog-title');
const galleryDialogClose = document.querySelector('.gallery-dialog-close');

function openGallery(image) {
  if (!galleryDialog?.showModal) return;
  const card = image.closest('.work-card');
  galleryDialogImage.src = image.currentSrc || image.src;
  galleryDialogImage.alt = image.alt;
  galleryDialogTitle.textContent = card?.querySelector('h3')?.textContent || 'Detalle del proyecto';
  galleryDialog.showModal();
}

document.querySelectorAll('.work-main-image').forEach(image => {
  image.loading = 'lazy';
  image.decoding = 'async';
});

document.querySelectorAll('.work-card img').forEach(image => {
  image.setAttribute('role', 'button');
  image.setAttribute('tabindex', '0');
  image.setAttribute('aria-label', `Ver foto ampliada: ${image.alt}`);
  image.addEventListener('click', event => {
    event.preventDefault();
    openGallery(image);
  });
  image.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openGallery(image);
  });
});

galleryDialogClose?.addEventListener('click', () => galleryDialog.close());
galleryDialog?.addEventListener('click', event => {
  if (event.target === galleryDialog) galleryDialog.close();
});

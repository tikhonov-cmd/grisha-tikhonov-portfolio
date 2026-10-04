document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxTitle = lightbox.querySelector('.lightbox-title');
const lightboxCounter = lightbox.querySelector('.lightbox-counter');
const lightboxPrevious = lightbox.querySelector('[data-lightbox-prev]');
const lightboxNext = lightbox.querySelector('[data-lightbox-next]');
let activeGallery = null;

function updateLightbox() {
  if (!activeGallery) return;
  const source = activeGallery.images[activeGallery.index];
  lightboxImage.src = source.src;
  lightboxImage.alt = source.alt;
  lightboxTitle.textContent = activeGallery.title;
  lightboxCounter.textContent = `${activeGallery.index + 1} / ${activeGallery.images.length}`;
  lightboxPrevious.disabled = activeGallery.index === 0;
  lightboxNext.disabled = activeGallery.index === activeGallery.images.length - 1;
}

document.querySelectorAll('.gallery').forEach((gallery) => {
  const track = gallery.querySelector('.gallery-track');
  const images = Array.from(track.querySelectorAll('img'));
  const dots = Array.from(gallery.querySelectorAll('.gallery-dot'));
  const previous = gallery.querySelector('[data-prev]');
  const next = gallery.querySelector('[data-next]');
  const sidePrevious = gallery.querySelector('[data-side-prev]');
  const sideNext = gallery.querySelector('[data-side-next]');
  const current = gallery.querySelector('.current');
  const frames = Array.from(track.querySelectorAll('.frame'));
  const state = { index: 0, images, frames, title: gallery.dataset.title, goTo };
  let scrollFrame = null;

  function update(index) {
    state.index = Math.max(0, Math.min(index, images.length - 1));
    current.textContent = String(state.index + 1).padStart(2, '0');
    previous.disabled = state.index === 0;
    next.disabled = state.index === images.length - 1;
    sidePrevious.disabled = previous.disabled;
    sideNext.disabled = next.disabled;
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === state.index)));
    if (activeGallery === state && lightbox.open) updateLightbox();
  }

  function goTo(index, immediate = false) {
    update(index);
    track.scrollTo({ left: track.clientWidth * state.index, behavior: immediate || reducedMotion.matches ? 'instant' : 'smooth' });
  }

  previous.addEventListener('click', () => goTo(state.index - 1));
  next.addEventListener('click', () => goTo(state.index + 1));
  sidePrevious.addEventListener('click', () => goTo(state.index - 1, true));
  sideNext.addEventListener('click', () => goTo(state.index + 1, true));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  track.addEventListener('scroll', () => {
    if (scrollFrame !== null) return;
    scrollFrame = requestAnimationFrame(() => {
      update(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
      scrollFrame = null;
    });
  }, { passive: true });
  track.addEventListener('keydown', (event) => {
    const directions = { ArrowLeft: state.index - 1, ArrowRight: state.index + 1, Home: 0, End: images.length - 1 };
    if (!(event.key in directions)) return;
    event.preventDefault();
    goTo(directions[event.key]);
  });
  frames.forEach((frame, i) => {
    frame.addEventListener('click', () => {
      if (typeof lightbox.showModal !== 'function') return;
      goTo(i, true);
      activeGallery = state;
      updateLightbox();
      lightbox.showModal();
    });
  });
  new ResizeObserver(() => goTo(state.index, true)).observe(track);
  update(0);
});

lightbox.querySelector('[data-close]').addEventListener('click', () => lightbox.close());
lightboxPrevious.addEventListener('click', () => activeGallery?.goTo(activeGallery.index - 1, true));
lightboxNext.addEventListener('click', () => activeGallery?.goTo(activeGallery.index + 1, true));
lightbox.addEventListener('keydown', (event) => {
  if (!activeGallery || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const destinations = { ArrowLeft: activeGallery.index - 1, ArrowRight: activeGallery.index + 1, Home: 0, End: activeGallery.images.length - 1 };
  activeGallery.goTo(destinations[event.key], true);
});
lightbox.addEventListener('close', () => {
  const frame = activeGallery?.frames[activeGallery.index];
  activeGallery = null;
  frame?.focus({ preventScroll: true });
});

const workLinks = Array.from(document.querySelectorAll('.work-index a'));
const films = Array.from(document.querySelectorAll('.film'));
let navigationFrame = null;
function updateWorkIndex() {
  const readingLine = Math.min(window.innerHeight * 0.35, 280);
  let activeFilm = films[0];
  for (const film of films) {
    if (film.getBoundingClientRect().top <= readingLine) activeFilm = film;
  }
  workLinks.forEach((link) => {
    if (link.hash === `#${activeFilm.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  navigationFrame = null;
}
window.addEventListener('scroll', () => {
  if (navigationFrame === null) navigationFrame = requestAnimationFrame(updateWorkIndex);
}, { passive: true });
window.addEventListener('resize', updateWorkIndex);
updateWorkIndex();

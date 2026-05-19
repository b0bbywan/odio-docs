(function () {
  'use strict';

  let overlay = null;
  let items = [];
  let index = 0;

  function build() {
    const el = document.createElement('div');
    el.className = 'screenshot-lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<button class="sl-close" type="button" aria-label="Close">&times;</button>' +
      '<button class="sl-nav sl-prev" type="button" aria-label="Previous">&#8249;</button>' +
      '<button class="sl-nav sl-next" type="button" aria-label="Next">&#8250;</button>' +
      '<figure class="sl-figure">' +
        '<img class="sl-img" alt="">' +
        '<figcaption class="sl-caption"></figcaption>' +
      '</figure>';
    el.addEventListener('click', (e) => {
      if (e.target === el) close();
    });
    el.querySelector('.sl-close').addEventListener('click', close);
    el.querySelector('.sl-prev').addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); });
    el.querySelector('.sl-next').addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); });
    document.body.appendChild(el);
    return el;
  }

  function show(i) {
    if (!items.length) return;
    index = ((i % items.length) + items.length) % items.length;
    const it = items[index];
    const img = overlay.querySelector('.sl-img');
    const cap = overlay.querySelector('.sl-caption');
    img.src = it.src;
    img.alt = it.alt;
    if (it.width) img.setAttribute('width', it.width); else img.removeAttribute('width');
    if (it.height) img.setAttribute('height', it.height); else img.removeAttribute('height');
    cap.textContent = it.caption;
    cap.style.display = it.caption ? '' : 'none';
    const multi = items.length > 1;
    overlay.querySelector('.sl-prev').style.display = multi ? '' : 'none';
    overlay.querySelector('.sl-next').style.display = multi ? '' : 'none';
  }

  function open(carousel, clickedImg) {
    items = Array.from(carousel.querySelectorAll('figure')).map((fig) => {
      const im = fig.querySelector('img');
      const fc = fig.querySelector('figcaption');
      return {
        src: (im && (im.currentSrc || im.src)) || '',
        alt: (im && im.alt) || '',
        caption: (fc && fc.textContent.trim()) || '',
        width: (im && (im.getAttribute('width') || im.naturalWidth)) || '',
        height: (im && (im.getAttribute('height') || im.naturalHeight)) || '',
      };
    }).filter((it) => it.src);
    if (!items.length) return;
    if (!overlay) overlay = build();
    const clickedSrc = clickedImg.currentSrc || clickedImg.src;
    const start = items.findIndex((it) => it.src === clickedSrc);
    show(start >= 0 ? start : 0);
    overlay.classList.add('open');
    document.documentElement.classList.add('sl-locked');
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.documentElement.classList.remove('sl-locked');
  }

  document.addEventListener('click', (e) => {
    const img = e.target.closest && e.target.closest('.screenshot-carousel img');
    if (!img) return;
    const carousel = img.closest('.screenshot-carousel');
    if (!carousel) return;
    e.preventDefault();
    open(carousel, img);
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });
})();

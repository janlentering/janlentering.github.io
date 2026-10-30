(() => {
  /* Der Markenlink führt wirklich an den Dokumentanfang zurück. Ein normaler
     Sprung zu #top würde den Zielabschnitt unter den Sticky-Header schieben und
     dadurch einen anderen Abstand als beim ersten Laden erzeugen. */
  const brand = document.querySelector('.brand[href="#top"]');
  if (brand) {
    brand.addEventListener('click', (event) => {
      event.preventDefault();
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    });
  }

  const dialog = document.getElementById('imageLightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const largeImage = dialog.querySelector('img');
  const closeButton = dialog.querySelector('.image-lightbox-close');
  const images = document.querySelectorAll('.shot img, .app-shot img, .phone-shot img');
  const mobileViewer = window.matchMedia('(max-width: 640px), (orientation: landscape) and (max-height: 520px) and (max-width: 950px)');

  const MOBILE_EDGE = 6;
  const MOBILE_CLOSE_SIZE = 18;
  const MOBILE_CLOSE_GAP = 6;

  const centeredRect = (width, height, viewportWidth, viewportHeight) => ({
    left: (viewportWidth - width) / 2,
    right: (viewportWidth + width) / 2,
    top: (viewportHeight - height) / 2,
    bottom: (viewportHeight + height) / 2,
  });

  const overlaps = (a, b) => !(
    a.right <= b.left || a.left >= b.right ||
    a.bottom <= b.top || a.top >= b.bottom
  );

  const layoutMobileImage = () => {
    if (!dialog.open || !largeImage.naturalWidth || !largeImage.naturalHeight) return;

    if (!mobileViewer.matches) {
      largeImage.style.width = '';
      largeImage.style.height = '';
      largeImage.style.maxWidth = '';
      largeImage.style.maxHeight = '';
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nw = largeImage.naturalWidth;
    const nh = largeImage.naturalHeight;

    const availableWidth = Math.max(1, vw - 2 * MOBILE_EDGE);
    const availableHeight = Math.max(1, vh - 2 * MOBILE_EDGE);
    let scale = Math.min(availableWidth / nw, availableHeight / nh);

    const closeRectWithGap = {
      left: vw - MOBILE_EDGE - MOBILE_CLOSE_SIZE - MOBILE_CLOSE_GAP,
      right: vw - MOBILE_EDGE + MOBILE_CLOSE_GAP,
      top: MOBILE_EDGE - MOBILE_CLOSE_GAP,
      bottom: MOBILE_EDGE + MOBILE_CLOSE_SIZE + MOBILE_CLOSE_GAP,
    };

    let width = nw * scale;
    let height = nh * scale;
    let imageRect = centeredRect(width, height, vw, vh);

    if (overlaps(imageRect, closeRectWithGap)) {
      /* Zwei mögliche Ausweichrichtungen werden berechnet. Wir nehmen die
         größere Darstellung: entweder rechts genug Platz lassen oder unterhalb
         des Buttons beginnen. Das Bild bleibt in beiden Fällen zentriert. */
      const maxWidthForRightClearance = Math.max(
        1,
        2 * (closeRectWithGap.left - vw / 2)
      );
      const scaleRight = Math.min(
        maxWidthForRightClearance / nw,
        availableHeight / nh
      );

      const maxHeightForTopClearance = Math.max(
        1,
        vh - 2 * closeRectWithGap.bottom
      );
      const scaleBelow = Math.min(
        availableWidth / nw,
        maxHeightForTopClearance / nh
      );

      const candidates = [scaleRight, scaleBelow].filter((value) => value > 0);
      if (candidates.length) scale = Math.max(...candidates);

      width = nw * scale;
      height = nh * scale;
    }

    largeImage.style.width = `${Math.floor(width)}px`;
    largeImage.style.height = `${Math.floor(height)}px`;
    largeImage.style.maxWidth = 'none';
    largeImage.style.maxHeight = 'none';
  };

  const open = (img) => {
    largeImage.src = img.currentSrc || img.src;
    largeImage.alt = img.alt || 'Vergrößerter Screenshot';
    const isPhone = Boolean(img.closest('.phone-shot'));
    dialog.classList.toggle('is-phone', isPhone);
    dialog.classList.toggle('is-portrait', !isPhone && img.naturalHeight > img.naturalWidth);
    dialog.showModal();
    requestAnimationFrame(layoutMobileImage);
    closeButton.focus();
  };

  images.forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `${img.alt || 'Screenshot'} vergrößern`);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(img);
      }
    });
  });

  largeImage.addEventListener('load', layoutMobileImage);
  window.addEventListener('resize', layoutMobileImage);
  if (typeof mobileViewer.addEventListener === 'function') {
    mobileViewer.addEventListener('change', layoutMobileImage);
  }

  const close = () => dialog.close();
  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
})();

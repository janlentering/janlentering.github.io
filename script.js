(() => {
  // Der Markenlink scrollt zum tatsächlichen Seitenanfang statt zum Anker
  // unterhalb des fixierten Headers. Reduzierte Bewegung wird respektiert.
  const brandLink = document.querySelector('.brand[href="#top"]');

  if (brandLink) {
    brandLink.addEventListener('click', (event) => {
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
  if (!largeImage || !closeButton) return;

  const thumbnails = document.querySelectorAll('.shot img, .app-shot img, .phone-shot img');
  const mobileViewer = window.matchMedia(
    '(max-width: 640px), (orientation: landscape) and (max-height: 520px) and (max-width: 950px)'
  );

  // Diese Maße sind mit den mobilen Lightbox-Regeln in styles.css abgestimmt.
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

  const resetImageSize = () => {
    largeImage.style.width = '';
    largeImage.style.height = '';
    largeImage.style.maxWidth = '';
    largeImage.style.maxHeight = '';
  };

  const layoutMobileImage = () => {
    if (!dialog.open || !largeImage.naturalWidth || !largeImage.naturalHeight) return;

    if (!mobileViewer.matches) {
      resetImageSize();
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const imageWidth = largeImage.naturalWidth;
    const imageHeight = largeImage.naturalHeight;

    const availableWidth = Math.max(1, viewportWidth - 2 * MOBILE_EDGE);
    const availableHeight = Math.max(1, viewportHeight - 2 * MOBILE_EDGE);
    let scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);

    const closeRectWithGap = {
      left: viewportWidth - MOBILE_EDGE - MOBILE_CLOSE_SIZE - MOBILE_CLOSE_GAP,
      right: viewportWidth - MOBILE_EDGE + MOBILE_CLOSE_GAP,
      top: MOBILE_EDGE - MOBILE_CLOSE_GAP,
      bottom: MOBILE_EDGE + MOBILE_CLOSE_SIZE + MOBILE_CLOSE_GAP,
    };

    let width = imageWidth * scale;
    let height = imageHeight * scale;
    const imageRect = centeredRect(width, height, viewportWidth, viewportHeight);

    if (overlaps(imageRect, closeRectWithGap)) {
      // Von zwei zentrierten Varianten wird die größere gewählt: Das Bild
      // lässt entweder rechts Platz oder bleibt unter dem Schließen-Button.
      const maxWidthForRightClearance = Math.max(
        1,
        2 * (closeRectWithGap.left - viewportWidth / 2)
      );
      const scaleRight = Math.min(
        maxWidthForRightClearance / imageWidth,
        availableHeight / imageHeight
      );

      const maxHeightForTopClearance = Math.max(
        1,
        viewportHeight - 2 * closeRectWithGap.bottom
      );
      const scaleBelow = Math.min(
        availableWidth / imageWidth,
        maxHeightForTopClearance / imageHeight
      );

      const candidates = [scaleRight, scaleBelow].filter((value) => value > 0);
      if (candidates.length) scale = Math.max(...candidates);

      width = imageWidth * scale;
      height = imageHeight * scale;
    }

    largeImage.style.width = `${Math.floor(width)}px`;
    largeImage.style.height = `${Math.floor(height)}px`;
    largeImage.style.maxWidth = 'none';
    largeImage.style.maxHeight = 'none';
  };

  const openImage = (thumbnail) => {
    largeImage.src = thumbnail.currentSrc || thumbnail.src;
    largeImage.alt = thumbnail.alt || 'Vergrößerter Screenshot';

    const isPhone = Boolean(thumbnail.closest('.phone-shot'));
    dialog.classList.toggle('is-phone', isPhone);
    dialog.classList.toggle(
      'is-portrait',
      !isPhone && thumbnail.naturalHeight > thumbnail.naturalWidth
    );

    dialog.showModal();
    requestAnimationFrame(layoutMobileImage);
    closeButton.focus();
  };

  const onThumbnailKeydown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openImage(event.currentTarget);
  };

  thumbnails.forEach((thumbnail) => {
    thumbnail.tabIndex = 0;
    thumbnail.title = 'Zum Vergrößern anklicken';
    thumbnail.setAttribute('role', 'button');
    thumbnail.setAttribute('aria-label', `${thumbnail.alt || 'Screenshot'} vergrößern`);
    thumbnail.addEventListener('click', () => openImage(thumbnail));
    thumbnail.addEventListener('keydown', onThumbnailKeydown);
  });

  largeImage.addEventListener('load', layoutMobileImage);
  window.addEventListener('resize', layoutMobileImage);
  if (typeof mobileViewer.addEventListener === 'function') {
    mobileViewer.addEventListener('change', layoutMobileImage);
  }

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  // Escape und die Wiederherstellung des Fokus übernimmt das native <dialog>.
})();

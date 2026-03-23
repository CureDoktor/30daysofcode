(function () {
  'use strict';

  var page = document.querySelector('.page');
  if (!page) return;

  // Trigger entrance animations after first paint
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      page.classList.add('ready');
    });
  });

  // Nav: set active link on click
  var navLinks = document.querySelectorAll('.nav__link');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      navLinks.forEach(function (l) { l.classList.remove('is-active'); });
      link.classList.add('is-active');
    });
  });

  // Get access CTA
  var navCta = document.querySelector('.nav__cta');
  if (navCta) {
    navCta.addEventListener('click', function () {
      navCta.textContent = 'Opening…';
      navCta.disabled = true;
      setTimeout(function () {
        navCta.textContent = 'Get access';
        navCta.disabled = false;
      }, 1200);
    });
  }

  // Hero CTA: spiral letters into black hole, then show "Follow @curedoktore on X"
  var hero = document.getElementById('hero');
  var heroCta = document.getElementById('heroCta');
  var heroCollapseWrap = document.getElementById('heroCollapseWrap');
  var heroBlackhole = document.getElementById('heroBlackhole');
  var heroSuccess = document.getElementById('heroSuccess');
  var spiralDone = false;

  function splitTextIntoLetters(el) {
    if (!el || el.classList.contains('letters-split')) return;
    el.classList.add('letters-split');
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walk.nextNode()) textNodes.push(walk.currentNode);
    textNodes.forEach(function (node) {
      var text = node.textContent;
      if (!text || !text.trim()) return;
      var parent = node.parentNode;
      if (!parent || parent.closest('input') || parent.closest('script') || parent.closest('style')) return;
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.className = 'letter';
        span.textContent = text[i];
        span.style.setProperty('--dx', '0px');
        span.style.setProperty('--dy', '0px');
        span.style.setProperty('--delay', '0ms');
        span.style.setProperty('--rotate', '0deg');
        fragment.appendChild(span);
      }
      parent.replaceChild(fragment, node);
    });
  }

  function runSpiralThenSuccess() {
    if (!heroCollapseWrap || !hero || spiralDone) return;
    spiralDone = true;

    // Lock container size so it doesn’t jump when we split into letters
    var heroRect = hero.getBoundingClientRect();
    var wrapRect = heroCollapseWrap.getBoundingClientRect();
    hero.style.minHeight = heroRect.height + 'px';
    heroCollapseWrap.style.height = wrapRect.height + 'px';
    heroCollapseWrap.style.overflow = 'hidden';
    var contentCol = heroCollapseWrap.querySelector('.hero__content');
    var previewCol = heroCollapseWrap.querySelector('.hero__preview');
    if (contentCol) {
      contentCol.style.height = contentCol.offsetHeight + 'px';
      contentCol.style.overflow = 'hidden';
    }
    if (previewCol) {
      previewCol.style.height = previewCol.offsetHeight + 'px';
      previewCol.style.overflow = 'hidden';
    }

    splitTextIntoLetters(heroCollapseWrap);

    var letters = heroCollapseWrap.querySelectorAll('.letter');
    if (letters.length === 0) {
      showSuccess();
      return;
    }

    var centerX = heroRect.left + heroRect.width / 2;
    var centerY = heroRect.top + heroRect.height / 2;

    letters.forEach(function (letter, i) {
      var r = letter.getBoundingClientRect();
      var lx = r.left + r.width / 2;
      var ly = r.top + r.height / 2;
      var dx = centerX - lx;
      var dy = centerY - ly;
      // All letters start together (single smooth spiral)
      var delay = 0;
      // Make spiral feel coherent by tying rotation to angle + index
      var angle = Math.atan2(dy, dx); // radians
      var rotate = angle * (180 / Math.PI) + i * 6 + 720; // degrees
      letter.style.setProperty('--dx', dx + 'px');
      letter.style.setProperty('--dy', dy + 'px');
      letter.style.setProperty('--delay', delay + 'ms');
      letter.style.setProperty('--rotate', rotate + 'deg');
    });

    hero.classList.add('spiral-active');
    if (heroBlackhole) heroBlackhole.setAttribute('aria-hidden', 'false');

    var duration = 3000;
    hero.style.setProperty('--spiral-duration', duration + 'ms');
    var total = duration + 220;
    setTimeout(function () {
      hero.classList.remove('spiral-active');
      if (heroBlackhole) heroBlackhole.setAttribute('aria-hidden', 'true');
      showSuccess();
    }, total);
  }

  function showSuccess() {
    hero.classList.add('has-success');
    heroSuccess.setAttribute('aria-hidden', 'false');
  }

  if (heroCta) {
    heroCta.addEventListener('click', function (e) {
      e.preventDefault();
      heroCta.classList.add('is-pressed');
      runSpiralThenSuccess();
      setTimeout(function () {
        heroCta.classList.remove('is-pressed');
      }, 300);
    });
  }

  // Follow button toggle
  var followBtn = document.querySelector('.preview-card__follow');
  if (followBtn) {
    followBtn.addEventListener('click', function () {
      var following = followBtn.classList.toggle('is-following');
      followBtn.setAttribute('aria-pressed', following);
      followBtn.textContent = following ? 'Following' : 'Follow';
    });
  }

  // Chips: subtle feedback (could link to #sections later)
  var chips = document.querySelectorAll('.chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var handle = chip.getAttribute('data-handle');
      if (handle) {
        // Copy handle to input if present
        var input = document.querySelector('input[name="handle"]');
        if (input) {
          input.value = handle.slice(1);
          input.focus();
        }
      }
    });
  });
})();

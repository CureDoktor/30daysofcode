(function () {
  'use strict';

  var page = document.querySelector('.page');
  var swatchesEl = document.getElementById('swatches');
  var btnGenerate = document.getElementById('btnGenerate');

  if (!page || !swatchesEl) return;

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      page.classList.add('ready');
    });
  });

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    var a = s * Math.min(l, 1 - l);
    var f = function (n) {
      var k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    var r = Math.round(f(0) * 255);
    var g = Math.round(f(8) * 255);
    var b = Math.round(f(4) * 255);
    return '#' + [r, g, b].map(function (x) {
      var hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function generatePalette() {
    var baseHue = Math.floor(Math.random() * 360);
    var colors = [];
    for (var i = 0; i < 5; i++) {
      var h = (baseHue + i * 55 + Math.floor(Math.random() * 20)) % 360;
      var s = 65 + Math.floor(Math.random() * 25);
      var l = 45 + Math.floor(Math.random() * 25);
      colors.push(hslToHex(h, s, l));
    }
    return colors;
  }

  function setPalette(hexes) {
    var children = swatchesEl.querySelectorAll('.swatch');
    children.forEach(function (el, i) {
      var hex = hexes[i] || '#1d9bf0';
      el.setAttribute('data-hex', hex);
      el.style.setProperty('--swatch-color', hex);
      var hexEl = el.querySelector('.swatch__hex');
      if (hexEl) hexEl.textContent = hex;
    });
  }

  function renderSwatches(hexes) {
    swatchesEl.classList.add('palette-updating');
    setPalette(hexes);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        swatchesEl.classList.remove('palette-updating');
      });
    });
  }

  btnGenerate.addEventListener('click', function () {
    renderSwatches(generatePalette());
  });

  swatchesEl.addEventListener('click', function (e) {
    var swatch = e.target.closest('.swatch');
    if (!swatch) return;
    var hex = swatch.getAttribute('data-hex');
    if (!hex) return;
    navigator.clipboard.writeText(hex).then(function () {
      swatch.classList.add('copied');
      setTimeout(function () {
        swatch.classList.remove('copied');
      }, 400);
    });
  });

  swatchesEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var swatch = e.target.closest('.swatch');
    if (!swatch) return;
    e.preventDefault();
    swatch.click();
  });
})();

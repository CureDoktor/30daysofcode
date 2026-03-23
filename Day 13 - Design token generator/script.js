(function () {
  'use strict';

  var hueEl = document.getElementById('hue');
  var spaceBaseEl = document.getElementById('space-base');
  var radiusScaleEl = document.getElementById('radius-scale');
  var typeBaseEl = document.getElementById('type-base');
  var shadowStrengthEl = document.getElementById('shadow-strength');

  var hueVal = document.getElementById('hue-value');
  var spaceBaseVal = document.getElementById('space-base-value');
  var radiusScaleVal = document.getElementById('radius-scale-value');
  var typeBaseVal = document.getElementById('type-base-value');
  var shadowStrengthVal = document.getElementById('shadow-strength-value');

  var tokenSurface = document.getElementById('tokenSurface');
  var codeOutput = document.getElementById('code-output');
  var copyBtn = document.getElementById('copy-btn');
  var tabs = document.querySelectorAll('.tab');

  var activeTab = 'css';
  var rafId = null;

  var presets = {
    'x-default': { hue: 203, spaceBase: 4, radiusScale: 1, typeBase: 16, shadowStrength: 0.65 },
    compact: { hue: 203, spaceBase: 4, radiusScale: 0.85, typeBase: 14, shadowStrength: 0.5 },
    comfortable: { hue: 203, spaceBase: 8, radiusScale: 1.15, typeBase: 17, shadowStrength: 0.75 },
  };

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function roundPx(n) {
    return Math.round(n * 100) / 100;
  }

  function buildTokens() {
    var h = Number(hueEl.value);
    var spaceBase = Number(spaceBaseEl.value);
    var radiusScale = Number(radiusScaleEl.value);
    var typeBase = Number(typeBaseEl.value);
    var s = Number(shadowStrengthEl.value);

    var space = {};
    for (var i = 1; i <= 6; i++) {
      space[i] = roundPx(spaceBase * i) + 'px';
    }

    var rSm = Math.round(6 * radiusScale);
    var rMd = Math.round(10 * radiusScale);
    var rLg = Math.round(16 * radiusScale);
    var rXl = Math.round(24 * radiusScale);

    var font = {
      xs: roundPx(typeBase * 0.75) + 'px',
      sm: roundPx(typeBase * 0.875) + 'px',
      md: roundPx(typeBase) + 'px',
      lg: roundPx(typeBase * 1.125) + 'px',
      xl: roundPx(typeBase * 1.35) + 'px',
    };

    var accent = 'hsl(' + h + ' 92% 61%)';
    var accentSoft = 'hsl(' + h + ' 92% 61% / 0.22)';
    var surface = 'hsl(' + h + ' 28% 12%)';
    var surface2 = 'hsl(' + h + ' 25% 16%)';
    var text = '#f4f9ff';
    var muted = 'hsl(215 16% 65%)';
    var border = 'hsl(' + h + ' 40% 50% / 0.28)';

    var shadowSm = '0 1px 2px rgba(0, 0, 0, ' + roundPx(0.12 + s * 0.18) + ')';
    var shadowMd =
      '0 8px 24px rgba(0, 0, 0, ' + roundPx(0.22 + s * 0.35) + '), 0 0 0 1px hsl(' + h + ' 40% 50% / 0.08)';
    var shadowLg = '0 24px 60px rgba(0, 0, 0, ' + roundPx(0.35 + s * 0.45) + ')';

    return {
      color: {
        accent: accent,
        accentSoft: accentSoft,
        surface: surface,
        surface2: surface2,
        text: text,
        muted: muted,
        border: border,
      },
      space: space,
      radius: {
        sm: rSm + 'px',
        md: rMd + 'px',
        lg: rLg + 'px',
        xl: rXl + 'px',
      },
      fontSize: font,
      shadow: {
        sm: shadowSm,
        md: shadowMd,
        lg: shadowLg,
      },
      meta: { hue: h, spaceBase: spaceBase, radiusScale: radiusScale, typeBase: typeBase, shadowStrength: s },
    };
  }

  function applyPreview(tokens) {
    var el = tokenSurface;
    if (!el) return;

    document.querySelectorAll('.space-pill').forEach(function (pill) {
      var step = Number(pill.getAttribute('data-step') || '1');
      var w = 'calc(28px + ' + tokens.space[step] + ')';
      pill.style.width = w;
      pill.style.minWidth = w;
    });

    var c = tokens.color;
    var sp = tokens.space;
    var r = tokens.radius;
    var f = tokens.fontSize;
    var sh = tokens.shadow;

    el.style.setProperty('--token-color-accent', c.accent);
    el.style.setProperty('--token-color-surface', c.surface);
    el.style.setProperty('--token-color-surface-2', c.surface2);
    el.style.setProperty('--token-color-text', c.text);
    el.style.setProperty('--token-color-muted', c.muted);
    el.style.setProperty('--token-color-border', c.border);
    el.style.setProperty('--token-color-text-muted', c.muted);

    el.style.setProperty('--token-space-base', tokens.meta.spaceBase + 'px');
    for (var i = 1; i <= 6; i++) {
      el.style.setProperty('--token-space-' + i, sp[i]);
    }

    el.style.setProperty('--token-radius-sm', r.sm);
    el.style.setProperty('--token-radius-md', r.md);
    el.style.setProperty('--token-radius-lg', r.lg);
    el.style.setProperty('--token-radius-xl', r.xl);

    el.style.setProperty('--token-font-xs', f.xs);
    el.style.setProperty('--token-font-sm', f.sm);
    el.style.setProperty('--token-font-md', f.md);
    el.style.setProperty('--token-font-lg', f.lg);
    el.style.setProperty('--token-font-xl', f.xl);

    el.style.setProperty('--token-shadow-sm', sh.sm);
    el.style.setProperty('--token-shadow-md', sh.md);
    el.style.setProperty('--token-shadow-lg', sh.lg);
  }

  function tokensToCss(tokens) {
    var c = tokens.color;
    var sp = tokens.space;
    var r = tokens.radius;
    var f = tokens.fontSize;
    var sh = tokens.shadow;

    var lines = [];
    lines.push(':root {');
    lines.push('  /* Day 13 — design tokens · @curedoktore */');
    lines.push('  --color-accent: ' + c.accent + ';');
    lines.push('  --color-accent-soft: ' + c.accentSoft + ';');
    lines.push('  --color-surface: ' + c.surface + ';');
    lines.push('  --color-surface-2: ' + c.surface2 + ';');
    lines.push('  --color-text: ' + c.text + ';');
    lines.push('  --color-muted: ' + c.muted + ';');
    lines.push('  --color-border: ' + c.border + ';');
    lines.push('');
    for (var i = 1; i <= 6; i++) {
      lines.push('  --space-' + i + ': ' + sp[i] + ';');
    }
    lines.push('');
    lines.push('  --radius-sm: ' + r.sm + ';');
    lines.push('  --radius-md: ' + r.md + ';');
    lines.push('  --radius-lg: ' + r.lg + ';');
    lines.push('  --radius-xl: ' + r.xl + ';');
    lines.push('');
    lines.push('  --font-xs: ' + f.xs + ';');
    lines.push('  --font-sm: ' + f.sm + ';');
    lines.push('  --font-md: ' + f.md + ';');
    lines.push('  --font-lg: ' + f.lg + ';');
    lines.push('  --font-xl: ' + f.xl + ';');
    lines.push('');
    lines.push('  --shadow-sm: ' + sh.sm + ';');
    lines.push('  --shadow-md: ' + sh.md + ';');
    lines.push('  --shadow-lg: ' + sh.lg + ';');
    lines.push('}');
    return lines.join('\n');
  }

  function tokensToJson(tokens) {
    return JSON.stringify(
      {
        $schema: 'https://example.com/design-tokens.schema.json',
        name: 'x-design-tokens',
        author: '@curedoktore',
        color: tokens.color,
        space: tokens.space,
        radius: tokens.radius,
        fontSize: tokens.fontSize,
        shadow: tokens.shadow,
      },
      null,
      2
    );
  }

  function updateValueLabels() {
    if (hueVal) hueVal.textContent = hueEl.value;
    if (spaceBaseVal) spaceBaseVal.textContent = spaceBaseEl.value + 'px';
    if (radiusScaleVal) radiusScaleVal.textContent = radiusScaleEl.value;
    if (typeBaseVal) typeBaseVal.textContent = typeBaseEl.value + 'px';
    if (shadowStrengthVal) shadowStrengthVal.textContent = shadowStrengthEl.value;
  }

  function render() {
    updateValueLabels();
    var tokens = buildTokens();
    applyPreview(tokens);
    if (codeOutput) {
      codeOutput.textContent = activeTab === 'css' ? tokensToCss(tokens) : tokensToJson(tokens);
    }
  }

  function scheduleRender() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      rafId = null;
      render();
    });
  }

  function applyPreset(name) {
    var p = presets[name];
    if (!p) return;
    hueEl.value = String(p.hue);
    spaceBaseEl.value = String(p.spaceBase);
    radiusScaleEl.value = String(p.radiusScale);
    typeBaseEl.value = String(p.typeBase);
    shadowStrengthEl.value = String(p.shadowStrength);
    render();
  }

  function randomize() {
    hueEl.value = String(185 + Math.floor(Math.random() * 46));
    spaceBaseEl.value = String(4 + Math.floor(Math.random() * 5));
    radiusScaleEl.value = String(roundPx(0.75 + Math.random() * 0.5));
    typeBaseEl.value = String(14 + Math.floor(Math.random() * 5));
    shadowStrengthEl.value = String(roundPx(0.35 + Math.random() * 0.65));
    render();
  }

  function copy() {
    var text = codeOutput ? codeOutput.textContent : '';
    copyBtn.textContent = 'Copying…';

    var done = function () {
      copyBtn.textContent = 'Copied!';
      setTimeout(function () {
        copyBtn.textContent = 'Copy';
      }, 900);
    };

    var fail = function () {
      copyBtn.textContent = 'Failed';
      setTimeout(function () {
        copyBtn.textContent = 'Copy';
      }, 900);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fail);
    } else {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) {
        fail();
      }
    }
  }

  [hueEl, spaceBaseEl, radiusScaleEl, typeBaseEl, shadowStrengthEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', scheduleRender);
  });

  document.querySelectorAll('[data-preset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyPreset(btn.getAttribute('data-preset'));
    });
  });

  var randomBtn = document.getElementById('randomize');
  var resetBtn = document.getElementById('reset');
  if (randomBtn) randomBtn.addEventListener('click', randomize);
  if (resetBtn) resetBtn.addEventListener('click', function () {
    applyPreset('x-default');
  });

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-tab');
      if (!name) return;
      activeTab = name;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      render();
    });
  });

  if (copyBtn) copyBtn.addEventListener('click', copy);

  render();
})();

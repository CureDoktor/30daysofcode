(function () {
  'use strict';

  var pageReady = function () {
    var preview = document.getElementById('preview');
    var glassCard = document.getElementById('glassCard');
    var cssOutput = document.getElementById('css-output');
    var copyBtn = document.getElementById('copy-btn');

    if (!preview || !glassCard || !cssOutput || !copyBtn) return;

    var controls = {
      blur: document.getElementById('blur'),
      glassAlpha: document.getElementById('glass-alpha'),
      borderWidth: document.getElementById('border-width'),
      borderAlpha: document.getElementById('border-alpha'),
      radius: document.getElementById('radius'),
      accentHue: document.getElementById('accent-hue'),
      highlightAlpha: document.getElementById('highlight-alpha'),
      shadowStrength: document.getElementById('shadow-strength'),
    };

    var values = {
      blur: document.getElementById('blur-value'),
      glassAlpha: document.getElementById('glass-alpha-value'),
      borderWidth: document.getElementById('border-width-value'),
      borderAlpha: document.getElementById('border-alpha-value'),
      radius: document.getElementById('radius-value'),
      accentHue: document.getElementById('accent-hue-value'),
      highlightAlpha: document.getElementById('highlight-alpha-value'),
      shadowStrength: document.getElementById('shadow-strength-value'),
      summaryGlass: document.getElementById('summary-glass'),
      summaryBorder: document.getElementById('summary-border'),
    };

    var rafId = null;

    function toFixed(n, digits) {
      return Number(n).toFixed(digits);
    }

    function setVars() {
      var blur = Number(controls.blur.value);
      var glassAlpha = Number(controls.glassAlpha.value);
      var borderWidth = Number(controls.borderWidth.value);
      var borderAlpha = Number(controls.borderAlpha.value);
      var radius = Number(controls.radius.value);
      var accentHue = Number(controls.accentHue.value);
      var highlightAlpha = Number(controls.highlightAlpha.value);
      var shadowStrength = Number(controls.shadowStrength.value);

      glassCard.style.setProperty('--glass-blur', blur + 'px');
      glassCard.style.setProperty('--glass-alpha', glassAlpha);
      glassCard.style.setProperty('--border-width', borderWidth + 'px');
      glassCard.style.setProperty('--border-alpha', borderAlpha);
      glassCard.style.setProperty('--glass-radius', radius + 'px');
      glassCard.style.setProperty('--accent-h', accentHue);
      glassCard.style.setProperty('--highlight-alpha', highlightAlpha);
      glassCard.style.setProperty('--shadow-strength', shadowStrength);

      if (values.blur) values.blur.textContent = blur + 'px';
      if (values.glassAlpha) values.glassAlpha.textContent = toFixed(glassAlpha, 2);
      if (values.borderWidth) values.borderWidth.textContent = borderWidth + 'px';
      if (values.borderAlpha) values.borderAlpha.textContent = toFixed(borderAlpha, 2);
      if (values.radius) values.radius.textContent = radius + 'px';
      if (values.accentHue) values.accentHue.textContent = accentHue;
      if (values.highlightAlpha) values.highlightAlpha.textContent = toFixed(highlightAlpha, 2);
      if (values.shadowStrength) values.shadowStrength.textContent = toFixed(shadowStrength, 2);

      if (values.summaryGlass) values.summaryGlass.textContent = toFixed(glassAlpha, 2);
      if (values.summaryBorder) values.summaryBorder.textContent = toFixed(borderAlpha, 2);

      var css = '';
      css += '.glass-gen {\n';
      css += '  backdrop-filter: blur(' + blur + 'px);\n';
      css += '  -webkit-backdrop-filter: blur(' + blur + 'px);\n';
      css += '  background: rgba(255, 255, 255, ' + glassAlpha + ');\n';
      css +=
        '  border: ' + borderWidth + 'px solid hsla(' + accentHue + ', 92%, 61%, ' + borderAlpha + ');\n';
      css += '  border-radius: ' + radius + 'px;\n';
      css +=
        '  box-shadow: 0 0 0 1px hsla(' +
        accentHue +
        ', 92%, 61%, ' +
        toFixed(Math.min(borderAlpha * 0.55, 1), 2) +
        '), 0 30px 70px rgba(0, 0, 0, ' +
        toFixed(shadowStrength * 0.55, 2) +
        ');\n';
      css += '  position: relative;\n';
      css += '  overflow: hidden;\n';
      css += '}\n\n';
      css += '.glass-gen::before {\n';
      css += '  content: \"\";\n';
      css += '  position: absolute;\n';
      css += '  inset: -1px;\n';
      css +=
        '  background: radial-gradient(circle at 0% 0%, hsla(' +
        accentHue +
        ', 92%, 61%, ' +
        highlightAlpha +
        '), transparent 62%),\n';
      css +=
        '    radial-gradient(circle at 100% 0%, hsla(' +
        (accentHue + 25) +
        ', 92%, 61%, ' +
        toFixed(highlightAlpha * 0.65, 2) +
        '), transparent 58%);\n';
      css += '  pointer-events: none;\n';
      css += '}\n';

      cssOutput.textContent = css;
    }

    function scheduleSetVars() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () {
        rafId = null;
        setVars();
      });
    }

    function bindRanges() {
      Object.keys(controls).forEach(function (key) {
        var input = controls[key];
        if (!input) return;
        input.addEventListener('input', scheduleSetVars);
      });
    }

    var presets = {
      'x-neon': {
        blur: 18,
        glassAlpha: 0.11,
        borderWidth: 1,
        borderAlpha: 0.25,
        radius: 18,
        accentHue: 203,
        highlightAlpha: 0.22,
        shadowStrength: 0.62,
      },
      'soft-ice': {
        blur: 22,
        glassAlpha: 0.14,
        borderWidth: 1,
        borderAlpha: 0.18,
        radius: 20,
        accentHue: 198,
        highlightAlpha: 0.18,
        shadowStrength: 0.48,
      },
      aurora: {
        blur: 26,
        glassAlpha: 0.12,
        borderWidth: 2,
        borderAlpha: 0.32,
        radius: 22,
        accentHue: 217,
        highlightAlpha: 0.28,
        shadowStrength: 0.7,
      },
    };

    function applyPreset(name) {
      var preset = presets[name];
      if (!preset) return;

      controls.blur.value = String(preset.blur);
      controls.glassAlpha.value = String(preset.glassAlpha);
      controls.borderWidth.value = String(preset.borderWidth);
      controls.borderAlpha.value = String(preset.borderAlpha);
      controls.radius.value = String(preset.radius);
      controls.accentHue.value = String(preset.accentHue);
      controls.highlightAlpha.value = String(preset.highlightAlpha);
      controls.shadowStrength.value = String(preset.shadowStrength);

      setVars();
    }

    var randomize = function () {
      // Keep it biased towards X neon (blue-ish) for better “reach” visuals.
      var accentHue = Math.floor(195 + Math.random() * 30); // 195..225
      var blur = Math.floor(10 + Math.random() * 22); // 10..32
      var glassAlpha = Number((0.06 + Math.random() * 0.16).toFixed(2));
      var borderWidth = Math.floor(1 + Math.random() * 3); // 1..3
      var borderAlpha = Number((0.12 + Math.random() * 0.4).toFixed(2));
      var radius = Math.floor(12 + Math.random() * 16); // 12..28
      var highlightAlpha = Number((0.05 + Math.random() * 0.45).toFixed(2));
      var shadowStrength = Number((0.3 + Math.random() * 0.6).toFixed(2));

      controls.accentHue.value = String(accentHue);
      controls.blur.value = String(blur);
      controls.glassAlpha.value = String(glassAlpha);
      controls.borderWidth.value = String(borderWidth);
      controls.borderAlpha.value = String(borderAlpha);
      controls.radius.value = String(radius);
      controls.highlightAlpha.value = String(highlightAlpha);
      controls.shadowStrength.value = String(shadowStrength);

      setVars();
    };

    var reset = function () {
      applyPreset('x-neon');
    };

    var presetButtons = document.querySelectorAll('[data-preset]');
    presetButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyPreset(btn.dataset.preset);
      });
    });

    var randomBtn = document.getElementById('randomize');
    var resetBtn = document.getElementById('reset');
    if (randomBtn) randomBtn.addEventListener('click', randomize);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    copyBtn.addEventListener('click', function () {
      var text = cssOutput.textContent || '';
      copyBtn.textContent = 'Copying…';

      var done = function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () {
          copyBtn.textContent = 'Copy CSS';
        }, 900);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(done)
          .catch(function () {
            // Fallback
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
              copyBtn.textContent = 'Copy failed';
              setTimeout(function () {
                copyBtn.textContent = 'Copy CSS';
              }, 1200);
            }
          });
      } else {
        try {
          var ta2 = document.createElement('textarea');
          ta2.value = text;
          ta2.style.position = 'fixed';
          ta2.style.left = '-9999px';
          document.body.appendChild(ta2);
          ta2.select();
          document.execCommand('copy');
          document.body.removeChild(ta2);
          done();
        } catch (e2) {
          copyBtn.textContent = 'Copy failed';
          setTimeout(function () {
            copyBtn.textContent = 'Copy CSS';
          }, 1200);
        }
      }
    });

    bindRanges();
    setVars();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pageReady);
  } else {
    pageReady();
  }
})();


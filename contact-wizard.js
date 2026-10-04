/* Configurateur « Lancer ma création » — 6 étapes
   1. Occasion · 2. Contenant (carrousel) · 3. Dragées (par catégorie) · 4. Étiquette
   5. Contenants & date · 6. Coordonnées (+ envoi Formspree) */
(function() {
  var TOTAL = 6;
  var FORMSPREE_ID = 'mlgqrzed';
  var PHONE_LABEL = '06 08 67 14 43';
  var PHONE_HREF = 'tel:+33608671443';
  var MAX_COLORS = 3;
  var DEFAULT_DG = ['#F4F2EE', '#E9E6E1', '#FAF9F7']; // blanc nacré par défaut
  var current = 1;

  var bar     = document.getElementById('wizard-bar-fill');
  var barEl   = document.getElementById('wizard-bar');
  var body    = document.getElementById('wizard-body');
  var nav     = document.getElementById('wizard-nav');
  var backBtn = document.getElementById('wizard-back');
  var nextBtn = document.getElementById('wizard-next');
  var success = document.getElementById('wizard-success');
  var stage   = document.getElementById('cfg-stage');
  if (!body || !nextBtn || !stage) return;

  /* ---------- Utilitaires ---------- */
  function $(id) { return document.getElementById(id); }
  function checkedValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function val(id) { var el = $(id); return el ? el.value.trim() : ''; }
  function isSafeImageUrl(url) {
    if (!url) return false;
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.indexOf('/images/') !== -1;
    } catch (e) { return false; }
  }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var params = new URLSearchParams(window.location.search);
  var produitParam = (params.get('produit') || '').slice(0, 200);
  var imageParam = isSafeImageUrl(params.get('image')) ? params.get('image') : '';

  /* ---------- Contenants (carrousel) ---------- */
  var containers = stage.getAttribute('data-containers').split('|').map(function(row) {
    var p = row.split('::');
    return { key: p[0], name: p[1], desc: p[2] };
  });
  var svgs = Array.prototype.slice.call(stage.querySelectorAll('.cfg-svg'));
  var dots = Array.prototype.slice.call(stage.querySelectorAll('.cfg-dot'));
  var idx = 0;            // contenant affiché
  var conseil = false;    // « Laissez-nous vous conseiller »

  function show(newIdx, dir) {
    var n = containers.length;
    newIdx = (newIdx + n) % n;
    if (newIdx === idx && svgs[idx].getAttribute('data-pos') === 'active') return;
    var incoming = svgs[newIdx], outgoing = svgs[idx];
    if (!reduceMotion && dir) {
      incoming.style.transition = 'none';
      incoming.setAttribute('data-pos', dir > 0 ? 'next' : 'prev');
      void incoming.getBoundingClientRect();
      incoming.style.transition = '';
    }
    if (outgoing !== incoming) outgoing.setAttribute('data-pos', dir > 0 ? 'prev' : 'next');
    incoming.setAttribute('data-pos', 'active');
    idx = newIdx;
    updateCaption();
    fitAllTags();
  }
  function updateCaption() {
    $('cfg-name').textContent = containers[idx].name;
    $('cfg-desc').textContent = containers[idx].desc;
    dots.forEach(function(d, i) { d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
  }
  svgs.forEach(function(s, i) { s.setAttribute('data-pos', i === 0 ? 'active' : 'next'); });
  dots.forEach(function(d, i) { d.addEventListener('click', function() { show(i, i > idx ? 1 : -1); }); });
  $('cfg-prev').addEventListener('click', function() { show(idx - 1, -1); });
  $('cfg-next').addEventListener('click', function() { show(idx + 1, 1); });
  document.addEventListener('keydown', function(e) {
    if (current !== 2) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, 1); }
  });
  // Balayage sur mobile
  (function() {
    var vp = $('cfg-viewport'), x0 = null, y0 = null;
    vp.addEventListener('touchstart', function(e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    vp.addEventListener('touchend', function(e) {
      if (x0 === null || current !== 2) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      x0 = null;
    });
  })();

  $('cfg-advice').addEventListener('click', function() {
    conseil = true;
    showStep(3, 'next');
  });

  /* ---------- Dragées et couleurs ---------- */
  var colorInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="couleurs"]'));
  var chosenColors = []; // dans l'ordre de sélection

  function paint() {
    var sans = checkedValue('dragees') === 'Sans dragées';
    var palette = chosenColors.map(function(v) {
      var el = colorInputs.filter(function(c) { return c.value === v; })[0];
      return el ? el.getAttribute('data-hex') : '';
    }).filter(Boolean);
    if (!palette.length) palette = DEFAULT_DG;
    setBoxOpen();
    svgs.forEach(function(svg) {
      var list = svg.querySelectorAll('.dg');
      for (var i = 0; i < list.length; i++) {
        list[i].classList.toggle('is-hidden', sans);
        list[i].style.color = palette[(i * 2 + Math.floor(i / 3)) % palette.length];
      }
    });
  }

  /* ---------- Boîte en papier : 4 rabats ----------
     La boîte s'ouvre dès l'étape 3 quand le client choisit « Avec dragées ».
     Les rabats sont calculés en 3D puis projetés dans la perspective du dessin. */
  var box = stage.querySelector('.cfg-svg[data-key="boite"]');
  var boxFlapsG = box && box.querySelector('.cfg-flaps');
  var boxFlaps = {};
  if (boxFlapsG) ['left', 'right', 'back', 'front'].forEach(function(k) { boxFlaps[k] = boxFlapsG.querySelector('[data-flap="' + k + '"]'); });
  var BOX_W = 144, BOX_H = 142, BOX_D = 100;
  var boxP = 0, boxTarget = 0, boxFrom = 0, boxT0 = 0, boxRaf = 0, boxOrder = '';
  function boxProj(p) { return (120 + p[0] + p[2] * 0.44).toFixed(1) + ',' + (356 - p[1] - p[2] * 0.22).toFixed(1); }
  function boxEase(t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // a, b : charnière (3D) ; d : direction du rabat ; n : normale extérieure ; inset : biseau des coins
  function boxFlap(el, a, b, d, n, L, inset) {
    var hx = b[0] - a[0], hy = b[1] - a[1], hz = b[2] - a[2], hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
    var u = [hx / hl * inset, hy / hl * inset, hz / hl * inset];
    var c = [b[0] + d[0] * L - u[0], b[1] + d[1] * L - u[1], b[2] + d[2] * L - u[2]];
    var e = [a[0] + d[0] * L + u[0], a[1] + d[1] * L + u[1], a[2] + d[2] * L + u[2]];
    el.setAttribute('points', [a, b, c, e].map(boxProj).join(' '));
    var outside = n[0] * 0.35 + n[1] * 0.6 - n[2] > 0; // face extérieure tournée vers nous ?
    el.setAttribute('fill', outside ? '#F6F0E8' : '#E6DACA');
  }
  function drawBox(p) {
    if (!boxFlapsG) return;
    var W = BOX_W, H = BOX_H, D = BOX_D, R = Math.PI / 180;
    var k1 = boxEase(p / 0.6);                    // rabats avant / arrière d'abord
    var a1 = k1 * 125 * R, a0 = k1 * 160 * R;     // l'avant se rabat presque à plat vers nous
    var a2 = boxEase((p - 0.35) / 0.65) * 115 * R; // puis les rabats latéraux
    var s1 = Math.sin(a1), c1 = Math.cos(a1), s2 = Math.sin(a2), c2 = Math.cos(a2), s0 = Math.sin(a0), c0 = Math.cos(a0);
    boxFlap(boxFlaps.front, [0, H, 0], [W, H, 0], [0, s0, c0], [0, c0, -s0], D / 2, 0);
    boxFlap(boxFlaps.back, [W, H, D], [0, H, D], [0, s1, -c1], [0, c1, s1], D / 2, 0);
    boxFlap(boxFlaps.left, [0, H, D], [0, H, 0], [c2, s2, 0], [-s2, c2, 0], W * 0.42, 9);
    boxFlap(boxFlaps.right, [W, H, 0], [W, H, D], [-c2, s2, 0], [s2, c2, 0], W * 0.42, 9);
    // ordre d'affichage : rabat arrière derrière les côtés une fois relevé
    var order = a1 > Math.PI / 2 ? 'back,left,right,front' : 'left,right,back,front';
    if (order !== boxOrder) {
      order.split(',').forEach(function(k) { boxFlapsG.appendChild(boxFlaps[k]); });
      boxOrder = order;
    }
  }
  function boxStep(now) {
    var dur = 1100 * Math.abs(boxTarget - boxFrom);
    var t = dur ? Math.min(1, (now - boxT0) / dur) : 1;
    boxP = boxFrom + (boxTarget - boxFrom) * t;
    drawBox(boxP);
    boxRaf = t < 1 ? requestAnimationFrame(boxStep) : 0;
  }
  function setBoxOpen() {
    var open = current >= 3 && checkedValue('dragees') === 'Avec dragées';
    if (!box) return;
    box.classList.toggle('is-open', open);
    var target = open ? 1 : 0;
    if (target === boxTarget && (boxRaf || boxP === target)) return;
    boxTarget = target;
    if (boxRaf) cancelAnimationFrame(boxRaf);
    // pas d'animation si mouvement réduit ou boîte hors champ (autre contenant affiché)
    if (reduceMotion || box.getAttribute('data-pos') !== 'active') { boxP = target; boxRaf = 0; drawBox(boxP); return; }
    boxFrom = boxP; boxT0 = performance.now();
    boxRaf = requestAnimationFrame(boxStep);
  }
  drawBox(0);

  /* Catégories de dragées (onglets) : les choix sont conservés d'un onglet à l'autre */
  var dgTabs = Array.prototype.slice.call(document.querySelectorAll('.cfg-dg-tab'));
  var dgPanels = Array.prototype.slice.call(document.querySelectorAll('.cfg-dg-panel'));
  function selectTab(cat, focus) {
    dgTabs.forEach(function(t) {
      var on = t.getAttribute('data-cat') === cat;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    dgPanels.forEach(function(p) { p.hidden = p.getAttribute('data-cat') !== cat; });
  }
  function updateTabCounts() {
    dgTabs.forEach(function(t) {
      var panel = $('cfg-panel-' + t.getAttribute('data-cat'));
      var n = panel ? panel.querySelectorAll('input[name="couleurs"]:checked').length : 0;
      t.querySelector('.cfg-dg-tab__n').textContent = n ? String(n) : '';
    });
  }
  dgTabs.forEach(function(t, i) {
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', function() { selectTab(t.getAttribute('data-cat')); });
    t.addEventListener('keydown', function(e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var j = (i + (e.key === 'ArrowRight' ? 1 : -1) + dgTabs.length) % dgTabs.length;
      selectTab(dgTabs[j].getAttribute('data-cat'), true);
    });
  });

  colorInputs.forEach(function(c) {
    c.addEventListener('change', function() {
      if (c.checked) chosenColors.push(c.value);
      else chosenColors = chosenColors.filter(function(v) { return v !== c.value; });
      var full = chosenColors.length >= MAX_COLORS;
      colorInputs.forEach(function(o) { if (!o.checked) o.disabled = full; });
      $('cfg-colors-limit').hidden = !full;
      var cnt = $('cfg-colors-count');
      if (cnt) { cnt.textContent = chosenColors.length + ' / ' + MAX_COLORS; cnt.classList.toggle('is-full', full); }
      updateTabCounts();
      paint();
    });
  });
  document.querySelectorAll('input[name="dragees"]').forEach(function(r) {
    r.addEventListener('change', function() {
      $('cfg-colors').hidden = checkedValue('dragees') !== 'Avec dragées';
      paint();
    });
  });

  /* ---------- Étiquette ---------- */
  var tags = Array.prototype.slice.call(stage.querySelectorAll('.cfg-tag'));
  function setTagText(g, l1, l2) {
    var r = parseFloat(g.getAttribute('data-r'));
    var t1 = g.querySelector('.cfg-tag__l1'), t2 = g.querySelector('.cfg-tag__l2');
    t1.textContent = l1 || 'Vos prénoms';
    t2.textContent = l2 || 'jj.mm.aaaa';
    t1.classList.toggle('is-placeholder', !l1);
    t2.classList.toggle('is-placeholder', !l2);
    fitText(t1, r * 0.36, r * 1.62);
    fitText(t2, r * 0.2, r * 1.42);
  }
  function fitText(t, base, maxW) {
    t.setAttribute('font-size', base.toFixed(1));
    var w = 0;
    try { w = t.getComputedTextLength(); } catch (e) { w = 0; }
    if (w > maxW) t.setAttribute('font-size', Math.max(base * 0.5, base * maxW / w).toFixed(1));
  }
  function fitAllTags() {
    var l1 = val('cfg-l1'), l2 = val('cfg-l2');
    tags.forEach(function(g) { setTagText(g, l1, l2); });
  }
  ['cfg-l1', 'cfg-l2'].forEach(function(id) { $(id).addEventListener('input', fitAllTags); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAllTags);
  window.addEventListener('load', fitAllTags);

  /* ---------- Date ---------- */
  var dateEl = $('wizard-date');
  var dateAlert = $('wizard-date-alert');
  if (dateEl && window.innerWidth <= 768) {
    dateEl.type = 'text';
    dateEl.setAttribute('inputmode', 'numeric');
    dateEl.setAttribute('maxlength', '10');
    dateEl.setAttribute('placeholder', 'jj/mm/aaaa');
    dateEl.addEventListener('input', function() {
      var d = this.value.replace(/\D/g, '').slice(0, 8);
      if (d.length > 4) d = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
      else if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2);
      this.value = d;
    });
  }
  function readDate() {
    if (!dateEl) return null;
    var raw = dateEl.value.trim(), y, m, d, mt;
    if ((mt = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
    else if ((mt = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) { y = +mt[3]; m = +mt[2]; d = +mt[1]; }
    else return null;
    var date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatDate(date) { return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear(); }
  function daysUntil(date) { var t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((date - t) / 86400000); }
  function relativeDelay(days) {
    if (days < 0) return 'date passée, à vérifier';
    if (days === 0) return "aujourd'hui";
    if (days < 28) return 'DÉLAI COURT : dans ' + days + ' jour' + (days > 1 ? 's' : '');
    if (days < 70) return 'dans ' + Math.round(days / 7) + ' semaines';
    return 'dans environ ' + Math.round(days / 30.4) + ' mois';
  }
  function updateDateAlert() {
    var date = readDate();
    if (!date) { dateAlert.hidden = true; return; }
    var days = daysUntil(date);
    if (days < 0) {
      dateAlert.textContent = 'Cette date est déjà passée : pouvez-vous la vérifier ?';
      dateAlert.hidden = false;
    } else if (days < 28) {
      dateAlert.textContent = 'Votre événement approche : nous ferons tout notre possible. Pour un délai court, appelez-nous au ';
      var a = document.createElement('a'); a.href = PHONE_HREF; a.textContent = PHONE_LABEL;
      dateAlert.appendChild(a); dateAlert.appendChild(document.createTextNode('.'));
      dateAlert.hidden = false;
    } else dateAlert.hidden = true;
  }
  if (dateEl) { dateEl.addEventListener('input', updateDateAlert); dateEl.addEventListener('change', updateDateAlert); }

  /* ---------- Textes récapitulatifs ---------- */
  function contenantText() { return conseil ? 'À définir ensemble (conseil demandé)' : containers[idx].name; }
  function drageesText() {
    var d = checkedValue('dragees');
    if (d !== 'Avec dragées') return d;
    return chosenColors.length ? d + ' · ' + chosenColors.join(', ') : d + ' · couleurs à définir';
  }
  function etiquetteText() {
    return [val('cfg-l1'), val('cfg-l2')].filter(Boolean).join(' — ');
  }

  /* ---------- Navigation ---------- */
  function setProgress(step) {
    var pct = Math.round((step / TOTAL) * 100);
    bar.style.width = pct + '%';
    barEl.setAttribute('aria-valuenow', pct);
  }
  function getPanel(n) { return $('wizard-step-' + n); }
  function setNextLabel(label) {
    nextBtn.innerHTML = '';
    nextBtn.appendChild(document.createTextNode(label + ' '));
    var arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    nextBtn.appendChild(arrow);
    nextBtn.setAttribute('aria-label', label);
  }
  function labelFor(n) {
    if (n === 2) return 'Choisir ce contenant';
    if (n === TOTAL) return 'Recevoir ma proposition';
    return 'Continuer';
  }
  function validateStep(n) {
    if (n === 1) return !!checkedValue('evenement');
    if (n === 3) return !!checkedValue('dragees');
    if (n === 5) return !!checkedValue('quantite');
    return true;
  }
  function updateNextState() { nextBtn.disabled = current < TOTAL && !validateStep(current); }

  function placeStage(n) {
    var slot = getPanel(n) && getPanel(n).querySelector('.cfg-slot');
    if (!slot) return;
    slot.appendChild(stage);
    stage.classList.toggle('cfg-stage--choose', n === 2);
    stage.classList.toggle('cfg-stage--preview', n !== 2);
    stage.classList.toggle('cfg-stage--label', n === 4);
    setBoxOpen();
    $('cfg-name').textContent = (n !== 2 && conseil) ? 'Contenant à définir ensemble' : containers[idx].name;
  }

  function showStep(n, direction) {
    if (n === 2) conseil = false; // retour au choix du contenant
    var prev = getPanel(current);
    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('leaving');
      setTimeout(function() { prev.classList.remove('leaving'); }, 300);
    }
    current = n;
    setProgress(n);
    placeStage(n);
    var next = getPanel(n);
    if (next) {
      next.style.animationName = direction === 'back' ? 'wizardInBack' : 'wizardIn';
      next.classList.add('active');
    }
    backBtn.hidden = (n === 1);
    setNextLabel(labelFor(n));
    if (n === TOTAL) updateSummary();
    updateNextState();
    fitAllTags();
    var wrap = document.querySelector('.wizard-wrap');
    if (wrap && wrap.getBoundingClientRect().top < 0) wrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  body.addEventListener('change', updateNextState);
  document.querySelectorAll('.wizard__card input, .wizard__chip input').forEach(function(input) {
    input.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      input.checked = input.type === 'checkbox' ? !input.checked : true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  /* ---------- Récapitulatif ---------- */
  function setRow(id, text, hideWhenEmpty, fallback) {
    var el = $(id); if (!el) return;
    el.textContent = text || fallback || '-';
    var row = $(id + '-row');
    if (row && hideWhenEmpty) row.style.display = text ? '' : 'none';
  }
  function updateSummary() {
    var date = readDate();
    setRow('sum-event', checkedValue('evenement'));
    setRow('sum-contenant', contenantText());
    setRow('sum-dragees', drageesText());
    setRow('sum-etiquette', etiquetteText(), true);
    setRow('sum-qty', checkedValue('quantite'));
    setRow('sum-date', date ? formatDate(date) : '', false, 'Non précisée');
    setRow('sum-message', val('wizard-message'), true);
    setRow('sum-visuel', val('wizard-visuel-lien'), true);
    // Miniature de la création
    var art = $('cfg-summary-art');
    art.innerHTML = '';
    if (!conseil) {
      var clone = svgs[idx].cloneNode(true);
      clone.removeAttribute('data-pos');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[id]').forEach(function(el) {
        var old = el.id; el.id = old + '-mini';
        clone.querySelectorAll('[clip-path="url(#' + old + ')"]').forEach(function(u) { u.setAttribute('clip-path', 'url(#' + old + '-mini)'); });
      });
      clone.classList.remove('cfg-svg');
      art.appendChild(clone);
    }
  }

  /* ---------- Coordonnées et envoi ---------- */
  function markField(fieldId, ok) {
    var f = $(fieldId); if (!f) return ok;
    f.classList.toggle('has-error', !ok);
    return ok;
  }
  function validateContact() {
    var ok = true;
    ok = markField('field-prenom', !!val('w-prenom')) && ok;
    ok = markField('field-nom', !!val('w-nom')) && ok;
    ok = markField('field-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('w-email'))) && ok;
    ok = markField('field-tel', val('w-tel').replace(/\D/g, '').length >= 9) && ok;
    ok = markField('field-ville', !!val('w-ville')) && ok;
    ok = markField('field-reception', !!checkedValue('reception')) && ok;
    return ok;
  }
  ['w-prenom', 'w-nom', 'w-email', 'w-tel', 'w-ville'].forEach(function(id) {
    var el = $(id); if (!el) return;
    el.addEventListener('input', function() { var f = el.closest('.wizard__field'); if (f) f.classList.remove('has-error'); });
  });
  document.querySelectorAll('input[name="reception"]').forEach(function(r) {
    r.addEventListener('change', function() { markField('field-reception', true); });
  });

  function buildPayload() {
    var prenom = val('w-prenom'), nom = val('w-nom'), email = val('w-email');
    var occasion = checkedValue('evenement'), quantite = checkedValue('quantite');
    var date = readDate(), days = date ? daysUntil(date) : null;
    var urgent = days !== null && days >= 0 && days < 28;
    var p = {
      'subject': 'Création sur mesure · ' + occasion + ' · ' + (conseil ? 'contenant à définir' : containers[idx].name) + ' · ' +
        quantite + ' contenants · ' + (date ? formatDate(date) : 'date non fixée') + ' · ' + prenom + ' ' + nom + (urgent ? ' · DÉLAI COURT' : ''),
      'email': email,
      '_replyto': email,
      'Type de demande': 'Création sur mesure (configurateur « Lancer ma création »)',
      'Nom': prenom + ' ' + nom,
      'Téléphone': val('w-tel'),
      'Ville / code postal': val('w-ville'),
      'Réception': checkedValue('reception'),
      'Occasion': occasion,
      'Contenant': contenantText(),
      'Dragées': drageesText(),
      'Texte de l\'étiquette': etiquetteText() || 'À définir',
      'Nombre de contenants': quantite,
      "Date de l'événement": date ? formatDate(date) + ' (' + relativeDelay(days) + ')' : 'Non précisée'
    };
    [['Précisions', val('wizard-message')], ['Visuel (lien)', val('wizard-visuel-lien')],
     ['Nous a connus via', checkedValue('source')],
     ['Produit consulté', produitParam], ['Photo du produit', imageParam]].forEach(function(o) { if (o[1]) p[o[0]] = o[1]; });
    p['_gotcha'] = val('w-company');
    return p;
  }

  function showSuccess() {
    body.style.display = 'none';
    nav.style.display = 'none';
    success.classList.add('visible');
    setProgress(TOTAL);
  }
  function showSendError() {
    nextBtn.disabled = false;
    setNextLabel(labelFor(TOTAL));
    var errEl = $('wizard-send-error'); if (errEl) errEl.hidden = false;
  }
  function send() {
    if (!validateContact()) {
      var firstError = document.querySelector('#wizard-step-6 .has-error');
      if (firstError) firstError.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    if (val('w-company')) { showSuccess(); return; } // champ piège rempli : robot
    var errEl = $('wizard-send-error'); if (errEl) errEl.hidden = true;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Envoi en cours…';
    fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
    .then(function(r) { if (r.ok) showSuccess(); else showSendError(); })
    .catch(showSendError);
  }

  backBtn.addEventListener('click', function() { if (current > 1) showStep(current - 1, 'back'); });
  nextBtn.addEventListener('click', function() {
    if (current === TOTAL) { send(); return; }
    if (!validateStep(current)) {
      var p = getPanel(current);
      if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      return;
    }
    if (current === 2) conseil = false;
    showStep(current + 1, 'next');
  });

  /* Hauteur de l'en-tête fixe, pour l'aperçu collant sur mobile */
  function setStickyTop() {
    var hdr = document.querySelector('.header');
    if (hdr) document.documentElement.style.setProperty('--cfg-top', hdr.getBoundingClientRect().height + 'px');
  }
  window.addEventListener('resize', setStickyTop);
  setStickyTop();

  /* ---------- Initialisation ---------- */
  updateCaption();
  paint();
  setProgress(1);
  setNextLabel(labelFor(1));
  updateNextState();
})();

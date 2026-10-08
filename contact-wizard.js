/* Configurateur « Lancer ma création » — 7 étapes
   1. Occasion · 2. Contenant (carrousel) · 3. Dragées (par catégorie) · 4. Étiquette
   5. Décoration (boîte) · 6. Nombre de boîtes & date · 7. Coordonnées (+ envoi Formspree)
   Sauvegarde automatique des choix dans le navigateur, avec « Reprendre ma création ». */
(function() {
  var TOTAL = 7;
  var FORMSPREE_ID = 'mlgqrzed';
  var EN = document.documentElement.lang === 'en'; // version anglaise (/en/)
  function T(fr, en) { return EN ? en : fr; }
  var PHONE_LABEL = EN ? '+33 6 08 67 14 43' : '06 08 67 14 43';
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
  // Libellé affiché d'un choix : la valeur (française) sur le site FR, le libellé traduit sur le site EN
  function dispName(el) {
    if (!el) return '';
    if (!EN) return el.value;
    var lab = el.closest('label');
    if (!lab) return el.value;
    if (lab.getAttribute('title')) return lab.getAttribute('title');
    var sels = ['.wizard__card-name', '.wizard__color-swatch-name', '.cfg-font__name', 'span'];
    for (var i = 0; i < sels.length; i++) {
      var n = lab.querySelector(sels[i]);
      if (n && n.textContent.trim()) return n.textContent.trim();
    }
    return el.value;
  }
  function checkedName(name) { return dispName(document.querySelector('input[name="' + name + '"]:checked')); }
  function nameOfValue(name, v) {
    return dispName(Array.prototype.filter.call(document.querySelectorAll('input[name="' + name + '"]'), function(e) { return e.value === v; })[0]) || v;
  }
  // Noms français des contenants (pour la demande envoyée à l'atelier)
  var CONTAINER_FR = { boite: 'Boîte en carton', pot: 'Pot en verre', tube: 'Tube', pochon: 'Pochon en tissu', bouquet: 'Bouquet de dragées' };
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
    updateSizes();
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
  /* ---------- Bouquet : petit (5 pétales), moyen (7), grand (10) ---------- */
  var BOUQUET_SIZES = [
    { id: 'petit', name: 'Petit', en: 'Small', n: 5, span: 58, scale: 0.86 },
    { id: 'moyen', name: 'Moyen', en: 'Medium', n: 7, span: 78, scale: 1 },
    { id: 'grand', name: 'Grand', en: 'Large', n: 10, span: 86, scale: 1.1 }
  ];
  var bouquetSize = 'moyen';
  var petalsG = stage.querySelector('.cfg-svg[data-key="bouquet"] .cfg-petals');
  var DG_PETAL = ['#FAF9F7', '#F4F2EE', '#E9E6E1'];
  function sizeOf(id) { return BOUQUET_SIZES.filter(function(b) { return b.id === id; })[0] || BOUQUET_SIZES[1]; }
  function petalAngles(b) {
    var a = [];
    for (var k = 0; k < b.n; k++) a.push(-b.span + k * (2 * b.span) / (b.n - 1));
    return a.sort(function(x, y) { return Math.abs(y) - Math.abs(x); }); // pétales du bord d'abord, le centre devant
  }
  function buildPetals() {
    if (!petalsG) return;
    var b = sizeOf(bouquetSize);
    petalsG.innerHTML = petalAngles(b).map(function(ang, k) {
      return '<g transform="translate(200 226) rotate(' + ang.toFixed(1) + ') scale(' + b.scale + ')">' +
        '<use href="#cfg-dg" class="dg dg--in" style="color:' + DG_PETAL[k % 3] + '" transform="translate(0 -60) rotate(90) scale(1.3 1.5)"/>' +
        '<path d="M0,-4 C-26,-26 -28,-78 0,-104 C28,-78 26,-26 0,-4 Z" fill="rgba(255,255,255,0.50)" stroke="rgba(82,54,42,0.35)" stroke-width=".9"/>' +
        '<path d="M0,-14 C-10,-42 -10,-74 0,-96" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.3"/></g>';
    }).join('');
  }
  function miniFan(b) {
    var paths = petalAngles(b).map(function(ang) {
      return '<path d="M0,0 C-3.2,-3.6 -3.4,-10 0,-13 C3.4,-10 3.2,-3.6 0,0 Z" transform="rotate(' + ang.toFixed(1) + ')"/>';
    }).join('');
    return '<svg class="cfg-size-opt__fan" viewBox="-17 -16 34 22" aria-hidden="true"><g transform="translate(0 4)" fill="var(--paper)" stroke="currentColor" stroke-width=".8">' + paths + '</g></svg>';
  }
  var sizesBox = $('cfg-sizes');
  function renderSizes() {
    if (!sizesBox) return;
    sizesBox.innerHTML = '';
    BOUQUET_SIZES.forEach(function(b) {
      var on = b.id === bouquetSize;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cfg-size-opt';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
      btn.setAttribute('data-size', b.id);
      btn.innerHTML = miniFan(b) + '<span class="cfg-size-opt__name">' + T(b.name, b.en) + '</span><span class="cfg-size-opt__sub">' + b.n + T(' pétales', ' petals') + '</span>';
      btn.addEventListener('click', function() { setBouquetSize(b.id, true); });
      btn.addEventListener('keydown', function(e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var i = BOUQUET_SIZES.indexOf(sizeOf(bouquetSize));
        setBouquetSize(BOUQUET_SIZES[(i + d + BOUQUET_SIZES.length) % BOUQUET_SIZES.length].id, true);
      });
      sizesBox.appendChild(btn);
    });
  }
  function setBouquetSize(id, focus) {
    bouquetSize = id;
    buildPetals();
    renderSizes();
    paint();
    if (focus) { var f = sizesBox.querySelector('[data-size="' + id + '"]'); if (f) f.focus(); }
    if (typeof updatePrix === 'function') updatePrix();
  }
  function updateSizes() {
    if (sizesBox) sizesBox.hidden = conseil || containers[idx].key !== 'bouquet';
    // boîte en carton : taille d'étiquette fixe, le curseur est masqué
    var ff = $('cfg-tag-fond-field');
    if (ff) ff.hidden = !conseil && containers[idx].key === 'boite';
    var sf = $('cfg-tag-size-field');
    if (sf) {
      var fixed = !conseil && containers[idx].key === 'boite';
      if (sf.hidden !== fixed) { sf.hidden = fixed; if (typeof renderTagShapes === 'function' && tags) renderTagShapes(); }
    }
  }
  function bouquetText() { var b = sizeOf(bouquetSize); return EN ? b.en + ' bouquet (' + b.n + ' petals)' : b.name + ' bouquet (' + b.n + ' pétales)'; }
  function containerName() { return EN ? containers[idx].name : (CONTAINER_FR[containers[idx].key] || containers[idx].name); }
  function containerLabel() {
    return containers[idx].key === 'bouquet' ? containerName() + ' · ' + bouquetText() : containerName();
  }
  buildPetals();
  renderSizes();
  updateSizes();

  /* ---------- Préselection depuis une fiche produit (?contenant=bouquet&taille=moyen) ---------- */
  (function() {
    var cParam = (params.get('contenant') || '').toLowerCase();
    var tParam = (params.get('taille') || '').toLowerCase();
    var start = containers.map(function(c) { return c.key; }).indexOf(cParam);
    if (start > 0) {
      svgs.forEach(function(s, i) { s.setAttribute('data-pos', i === start ? 'active' : (i < start ? 'prev' : 'next')); });
      idx = start;
      updateCaption();
    }
    if (cParam === 'bouquet' && BOUQUET_SIZES.some(function(b) { return b.id === tParam; })) { bouquetSize = tParam; buildPetals(); renderSizes(); }
  })();



  /* ---------- Boîte en carton : 4 rabats ----------
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
  var boxLid = box && box.querySelector('.cfg-box-lid');
  function drawBox(p) {
    if (!boxFlapsG) return;
    // fermée : un dessus plein, sans fente ; dès que ça s'ouvre, les rabats prennent le relais
    var closed = p <= 0;
    boxFlapsG.style.display = closed ? 'none' : '';
    if (boxLid) boxLid.style.display = closed ? '' : 'none';
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
    var open = current === 3 && checkedValue('dragees') === 'Avec dragées'; // ouverte seulement à l'étape Dragées
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
    activeCat = cat;
    refreshDragees();
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

  /* Quantités : une seule catégorie par contenant, un maximum de dragées propre à chaque catégorie */
  var qty = {}; // valeur -> nombre de dragées
  var activeCat = 'chocolats';
  dgTabs.forEach(function(t) { if (t.getAttribute('aria-selected') === 'true') activeCat = t.getAttribute('data-cat'); });
  function inputOf(v) { return colorInputs.filter(function(c) { return c.value === v; })[0]; }
  function catOf(el) { var p = el && el.closest('.cfg-dg-panel'); return p ? p.getAttribute('data-cat') : ''; }
  function catName(cat) { var t = $('cfg-tab-' + cat); return t ? t.firstChild.textContent.trim() : ''; }
  var DG_START = 5; // jamais moins de 5 dragées dans un contenant
  function floorOf(cat) { return Math.min(DG_START, capOf(cat)); }
  function capOf(cat) { var p = $('cfg-panel-' + cat); return (p && parseInt(p.getAttribute('data-max'), 10)) || 10; }
  // minimum par contenant : data-min (chocolats : 5), sinon le contenant doit être complet
  function minOf(cat) { var p = $('cfg-panel-' + cat); return (p && parseInt(p.getAttribute('data-min'), 10)) || capOf(cat); }
  function rangeText(cat) { var mn = minOf(cat), mx = capOf(cat); return mn < mx ? T('De ' + mn + ' à ' + mx + ' dragées par contenant.', mn + ' to ' + mx + ' dragées per container.') : T('Jusqu’à ' + mx + ' dragées par contenant.', 'Up to ' + mx + ' dragées per container.'); }
  function chosenCat() { return chosenColors.length ? catOf(inputOf(chosenColors[0])) : ''; }
  function totalQty() { return chosenColors.reduce(function(n, v) { return n + (qty[v] || 0); }, 0); }
  function shortName(el) {
    var n = el.parentNode.querySelector('.wizard__color-swatch-name'), name = n ? n.textContent : el.value;
    var sib = el.parentNode.previousElementSibling; // sous-famille (chocolat noir / au lait)
    while (sib && !sib.classList.contains('cfg-dg-sub')) sib = sib.previousElementSibling;
    return sib ? name + ' · ' + sib.textContent.toLowerCase() : name;
  }

  function refreshDragees() {
    var cat = chosenCat(), cap = capOf(cat || activeCat), tot = totalQty();
    var fullColors = chosenColors.length >= MAX_COLORS, fullQty = !!cat && tot >= cap;
    colorInputs.forEach(function(o) {
      o.disabled = !o.checked && (fullColors || fullQty || (!!cat && catOf(o) !== cat));
      // bulle d'explication au survol (ou au toucher) d'une dragée indisponible
      var tip = '';
      if (!o.checked && !!cat && catOf(o) !== cat) tip = T('Une seule catégorie par contenant : vous avez choisi des « ' + catName(cat) + ' ». Retirez-les pour choisir des « ' + catName(catOf(o)) + ' ».', 'One category per container: you have chosen “' + catName(cat) + '”. Remove them to choose “' + catName(catOf(o)) + '”.');
      else if (!o.checked && fullColors) tip = T('Trois couleurs maximum : retirez-en une pour choisir celle-ci.', 'Three colours maximum: remove one to choose this one.');
      else if (!o.checked && fullQty) tip = T('Contenant complet : diminuez une quantité pour ajouter cette couleur.', 'Container full: reduce a quantity to add this colour.');
      if (tip) o.parentNode.setAttribute('data-tip', tip); else o.parentNode.removeAttribute('data-tip');
    });
    var lim = $('cfg-colors-limit');
    lim.hidden = !(fullColors || fullQty);
    lim.textContent = fullColors ? T('Trois couleurs maximum : retirez-en une pour en choisir une autre.', 'Three colours maximum: remove one to choose another.')
      : T('Contenant complet (' + cap + ' dragées) : vous pouvez continuer. Pour ajouter une couleur, diminuez d’abord une quantité.', 'Container full (' + cap + ' dragées): you can continue. To add a colour, first reduce a quantity.');
    var one = $('cfg-dg-onecat');
    one.hidden = !cat || cat === activeCat;
    if (cat) one.textContent = T('Une seule catégorie par contenant : retirez vos « ' + catName(cat) + ' » pour choisir dans une autre.', 'One category per container: remove your “' + catName(cat) + '” to choose from another.');
    $('cfg-dg-cap').textContent = rangeText(activeCat);
    var cnt = $('cfg-colors-count');
    if (cnt) { cnt.textContent = chosenColors.length + ' / ' + MAX_COLORS; cnt.classList.toggle('is-full', fullColors); }
    // liste des quantités
    var box = $('cfg-qty'), list = $('cfg-qty-list'), total = $('cfg-qty-total');
    box.hidden = !chosenColors.length;
    total.textContent = tot + ' / ' + cap + ' dragées';
    total.classList.toggle('is-full', fullQty);
    list.innerHTML = '';
    chosenColors.forEach(function(v) {
      var el = inputOf(v), n = qty[v] || 1;
      var li = document.createElement('li');
      li.className = 'cfg-qty__row';
      li.setAttribute('data-value', v);
      var dot = document.createElement('span');
      dot.className = 'cfg-qty__dot';
      dot.setAttribute('style', el.parentNode.querySelector('.wizard__color-swatch-bg').getAttribute('style') || '');
      var name = document.createElement('span');
      name.className = 'cfg-qty__name';
      name.textContent = shortName(el);
      var step = document.createElement('div');
      step.className = 'cfg-qty__step';
      step.innerHTML = '<button type="button" class="cfg-qty__btn" data-act="minus" aria-label="' + T('Une de moins', 'One less') + '">−</button>' +
        '<output class="cfg-qty__n" aria-live="polite"></output>' +
        '<button type="button" class="cfg-qty__btn" data-act="plus" aria-label="' + T('Une de plus', 'One more') + '">+</button>';
      step.querySelector('output').textContent = n;
      step.querySelector('[data-act="minus"]').disabled = n <= 1 || tot <= floorOf(cat);
      step.querySelector('[data-act="plus"]').disabled = fullQty;
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'cfg-qty__del';
      del.setAttribute('data-act', 'del');
      del.setAttribute('aria-label', T('Retirer ', 'Remove ') + shortName(el));
      del.textContent = '×';
      li.appendChild(dot); li.appendChild(name); li.appendChild(step); li.appendChild(del);
      list.appendChild(li);
    });
    updateTabCounts();
    paint();
    updateNeed();
    if (typeof PRIX_CONTENANT !== 'undefined') updatePrix(); // (pas encore défini au tout premier rendu)
    updateNextState();
  }
  // Le contenant doit être complet (10 dragées, 8 en chocolats amandes) pour passer à l'étape suivante
  function drageesComplete() {
    if (checkedValue('dragees') !== 'Avec dragées') return true;
    var cat = chosenCat();
    var t = totalQty();
    return !!cat && t >= minOf(cat) && t <= capOf(cat);
  }
  function updateNeed() {
    var hint = $('cfg-dg-hint');
    if (hint) hint.hidden = !(checkedValue('dragees') === 'Avec dragées' && totalQty() === 5);
    var need = $('cfg-dg-need');
    if (!need) return;
    var avec = checkedValue('dragees') === 'Avec dragées';
    var c = chosenCat() || activeCat, cap = capOf(c), mn = minOf(c), left = mn - totalQty();
    need.hidden = !avec || drageesComplete();
    if (need.hidden) return;
    var regle = mn < cap ? T('entre ' + mn + ' et ' + cap + ' dragées', 'between ' + mn + ' and ' + cap + ' dragées') : cap + ' dragées';
    need.textContent = !chosenCat()
      ? T('Choisissez ' + regle + ' pour passer à l’étape suivante.', 'Choose ' + regle + ' to continue to the next step.')
      : T('Il reste ' + left + ' dragée' + (left > 1 ? 's' : '') + ' à choisir : votre contenant doit en compter ' + (mn < cap ? 'au moins ' + mn : cap) + ' pour passer à l’étape suivante.',
          left + ' more dragée' + (left > 1 ? 's' : '') + ' to choose: your container needs ' + (mn < cap ? 'at least ' + mn : cap) + ' to continue to the next step.');
  }
  $('cfg-qty-list').addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var v = btn.closest('.cfg-qty__row').getAttribute('data-value');
    var act = btn.getAttribute('data-act');
    if (act === 'del') {
      var el = inputOf(v);
      if (el) { el.checked = false; el.dispatchEvent(new Event('change')); }
      return;
    }
    if (act === 'plus' && totalQty() < capOf(chosenCat())) qty[v] = (qty[v] || 1) + 1;
    else if (act === 'minus' && qty[v] > 1 && totalQty() > floorOf(chosenCat())) qty[v] -= 1;
    refreshDragees();
    var rows = $('cfg-qty-list').querySelectorAll('.cfg-qty__row');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-value') !== v) continue;
      var again = rows[i].querySelector('[data-act="' + act + '"]');
      if (again && !again.disabled) again.focus();
    }
  });
  colorInputs.forEach(function(c) {
    c.addEventListener('change', function() {
      var cat = catOf(c);
      if (c.checked) {
        // première dragée : on part directement sur 5 (le minimum) ; les couleurs suivantes s'ajoutent une par une
        qty[c.value] = chosenColors.length ? 1 : Math.min(DG_START, capOf(cat));
        chosenColors.push(c.value);
      } else {
        chosenColors = chosenColors.filter(function(v) { return v !== c.value; });
        delete qty[c.value];
        // en retirant une couleur, le contenant ne descend pas sous 5 : la première couleur restante complète
        var manque = floorOf(cat) - totalQty();
        if (chosenColors.length && manque > 0) qty[chosenColors[0]] += manque;
      }
      refreshDragees();
    });
  });
  refreshDragees();
  document.querySelectorAll('input[name="dragees"]').forEach(function(r) {
    r.addEventListener('change', function() {
      $('cfg-colors').hidden = checkedValue('dragees') !== 'Avec dragées';
      updateNeed();
      updatePrix();
      paint();
    });
  });

  /* ---------- Étiquette ---------- */
  var tags = Array.prototype.slice.call(stage.querySelectorAll('.cfg-tag'));
  // Forme (ronde, carrée, rectangle) et taille de l'étiquette, appliquées à tous les contenants
  var TAG_FILL = '#FFFDF9', TAG_STROKE = '#965F36', TAG_STROKE_IN = 'rgba(150,95,54,0.35)';
  var SVGNS = 'http://www.w3.org/2000/svg';
  tags.forEach(function(g) {
    g.setAttribute('data-base', g.getAttribute('transform') || '');
    Array.prototype.forEach.call(g.querySelectorAll('circle'), function(c) { c.parentNode.removeChild(c); });
  });
  function tagShapeEl(shape, r, inset, fill, stroke, sw) {
    var el, R = r - inset;
    if (shape === 'Ronde') {
      el = document.createElementNS(SVGNS, 'circle');
      el.setAttribute('r', R.toFixed(2));
    } else {
      var w = shape === 'Rectangle' ? 2.3 * r : 1.8 * r, h = shape === 'Rectangle' ? 1.45 * r : 1.8 * r;
      w -= 2 * inset; h -= 2 * inset;
      el = document.createElementNS(SVGNS, 'rect');
      el.setAttribute('x', (-w / 2).toFixed(2)); el.setAttribute('y', (-h / 2).toFixed(2));
      el.setAttribute('width', w.toFixed(2)); el.setAttribute('height', h.toFixed(2));
      el.setAttribute('rx', (r * 0.06).toFixed(2));
    }
    el.setAttribute('class', 'cfg-tag__shape');
    el.setAttribute('fill', fill); el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', sw);
    return el;
  }
  function tagShape() { return checkedValue('etiquette_forme') || 'Ronde'; }
  var TAG_SIZE_DEFAUT = 120; // taille de l'étiquette (%), identique pour tous les contenants
  function tagSizeFixed() { return !conseil && containers[idx].key === 'boite'; }
  function tagScale() {
    return TAG_SIZE_DEFAUT / 100; // taille fixe pour tous les contenants (curseur retiré)
  }
  function renderTagShapes() {
    var shape = tagShape(), k = tagScale();
    tags.forEach(function(g) {
      var r = parseFloat(g.getAttribute('data-r'));
      Array.prototype.forEach.call(g.querySelectorAll('.cfg-tag__shape'), function(c) { c.parentNode.removeChild(c); });
      var first = g.firstChild;
      var bord = tagColor('etiquette_bord', TAG_STROKE); // « none » = sans bordure
      g.insertBefore(tagShapeEl(shape, r, 0, tagColor('etiquette_fond', TAG_FILL), bord, '1'), first);
      var inner = tagShapeEl(shape, r, r * 0.0875, 'none', bord, '.7');
      inner.setAttribute('stroke-opacity', '.45');
      g.insertBefore(inner, first);
      g.setAttribute('transform', (g.getAttribute('data-base') + ' scale(' + k + ')').trim());
    });
    var out = $('cfg-tag-size-val');
    if (out) out.textContent = Math.round(k * 100) + '\u00a0%';
    fitAllTags();
  }
  function tagWidthFactor() { var s = tagShape(); return s === 'Rectangle' ? 2.0 : s === 'Carrée' ? 1.55 : 1.62; }
  // Couleurs de l'étiquette et de l'écriture (pastilles + couleur libre)
  function tagColor(name, fallback) {
    if (name === 'etiquette_fond' && !conseil && containers[idx].key === 'boite') return '#FFFFFF'; // boîte en carton : étiquettes toujours blanches
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.getAttribute('data-hex') : fallback;
  }
  function tagColorName(name) { return checkedValue(name) || ''; }
  var TAG_IDS = { etiquette_fond: ['label-tag-fond-name', 'cfg-fond-custom'], etiquette_texte: ['label-tag-texte-name', 'cfg-texte-custom'], etiquette_bord: ['label-tag-bord-name', 'cfg-bord-custom'] };
  ['etiquette_fond', 'etiquette_texte', 'etiquette_bord'].forEach(function(name) {
    var label = $(TAG_IDS[name][0]);
    document.querySelectorAll('input[name="' + name + '"]').forEach(function(r) {
      r.addEventListener('change', function() { if (label) label.textContent = dispName(r); renderTagShapes(); });
    });
    var picker = $(TAG_IDS[name][1]);
    if (picker) picker.addEventListener('input', function() {
      var radio = picker.closest('.cfg-swatch').querySelector('input[type="radio"]');
      radio.setAttribute('data-hex', picker.value);
      picker.parentNode.style.background = picker.value;
      if (!radio.checked) { radio.checked = true; }
      if (label) label.textContent = T('Personnalisée (', 'Custom (') + picker.value.toUpperCase() + ')';
      renderTagShapes();
    });
  });
  // Style d'écriture du prénom : élégante, calligraphie ou classique
  function tagFont() {
    var el = document.querySelector('input[name="etiquette_police"]:checked');
    return el ? { name: el.value, family: el.getAttribute('data-font'), size: parseFloat(el.getAttribute('data-size')) || 0.36 }
              : { name: 'Élégante', family: "'Etiquette Italic', Georgia, serif", size: 0.36 };
  }
  document.querySelectorAll('input[name="etiquette_police"]').forEach(function(r) {
    r.addEventListener('change', function() {
      fitAllTags();
      // la police se charge à la demande : on réajuste le texte une fois prête
      if (document.fonts && document.fonts.load) document.fonts.load('20px ' + r.getAttribute('data-font').split(',')[0]).then(fitAllTags, function() {});
    });
  });
  function updateFontSamples() {
    var t = val('cfg-l1') || T('Vos prénoms', 'Your names');
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-font__sample'), function(s) { s.textContent = t; });
  }
  if ($('cfg-l1')) $('cfg-l1').addEventListener('input', updateFontSamples);
  function setTagText(g, l1, l2) {
    var r = parseFloat(g.getAttribute('data-r')), wf = tagWidthFactor();
    var t1 = g.querySelector('.cfg-tag__l1'), t2 = g.querySelector('.cfg-tag__l2');
    t1.textContent = l1 || T('Vos prénoms', 'Your names');
    t2.textContent = l2 || T('jj.mm.aaaa', 'dd.mm.yyyy');
    var ink = tagColor('etiquette_texte', '');
    t1.style.fill = ink; t2.style.fill = ink;
    t1.classList.toggle('is-placeholder', !l1);
    t2.classList.toggle('is-placeholder', !l2);
    t1.style.fontFamily = tagFont().family;
    fitText(t1, r * tagFont().size, r * wf);
    // la date ou le petit mot suit la même écriture que les prénoms
    var tf = tagFont();
    t2.style.fontFamily = tf.family;
    t2.style.letterSpacing = tf.name === 'Calligraphie' ? '0' : tf.name === 'Classique' ? '0.06em' : '0.02em';
    fitText(t2, r * 0.2 * (tf.size / 0.36) * (tf.name === 'Calligraphie' ? 1.45 : tf.name === 'Classique' ? 1.3 : 1.1), r * (wf - 0.2));
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
  // Prénoms et date obligatoires pour passer à l'étape suivante
  function updateTagNeed() {
    var need = $('cfg-tag-need'); if (!need) return;
    var a = !!val('cfg-l1'), b = !!val('cfg-l2');
    need.hidden = a && b;
    need.textContent = !a && !b ? T('Indiquez les prénoms (ou le nom) et la date (ou un petit mot) pour passer à l’étape suivante.', 'Enter the names (or surname) and the date (or a short message) to continue to the next step.')
      : !a ? T('Indiquez les prénoms ou le nom pour passer à l’étape suivante.', 'Enter the names or surname to continue to the next step.')
      : T('Indiquez la date ou un petit mot pour passer à l’étape suivante.', 'Enter the date or a short message to continue to the next step.');
    if (typeof updateNextState === 'function') updateNextState();
  }
  ['cfg-l1', 'cfg-l2'].forEach(function(id) { $(id).addEventListener('input', updateTagNeed); });
  updateTagNeed();
  document.querySelectorAll('input[name="etiquette_forme"]').forEach(function(r) { r.addEventListener('change', renderTagShapes); });
  renderTagShapes();
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
    if (days < 0) return T('date passée, à vérifier', 'date in the past, please check');
    if (days === 0) return T("aujourd'hui", 'today');
    if (days < 28) return T('DÉLAI COURT : dans ' + days + ' jour' + (days > 1 ? 's' : ''), 'SHORT NOTICE: in ' + days + ' day' + (days > 1 ? 's' : ''));
    if (days < 70) return T('dans ' + Math.round(days / 7) + ' semaines', 'in ' + Math.round(days / 7) + ' weeks');
    return T('dans environ ' + Math.round(days / 30.4) + ' mois', 'in about ' + Math.round(days / 30.4) + ' months');
  }
  function updateDateAlert() {
    var date = readDate();
    if (!date) { dateAlert.hidden = true; return; }
    var days = daysUntil(date);
    if (days < 0) {
      dateAlert.textContent = T('Cette date est déjà passée : pouvez-vous la vérifier ?', 'This date has already passed: could you check it?');
      dateAlert.hidden = false;
    } else if (days < 28) {
      dateAlert.textContent = T('Votre événement approche : nous ferons tout notre possible. Pour un délai court, appelez-nous au ', 'Your event is coming up soon: we will do our very best. For short notice, please call us on ');
      var a = document.createElement('a'); a.href = PHONE_HREF; a.textContent = PHONE_LABEL;
      dateAlert.appendChild(a); dateAlert.appendChild(document.createTextNode('.'));
      dateAlert.hidden = false;
    } else dateAlert.hidden = true;
  }
  if (dateEl) { dateEl.addEventListener('input', updateDateAlert); dateEl.addEventListener('change', updateDateAlert); }

  /* ---------- Textes récapitulatifs ---------- */
  /* ---------- Nombre de boîtes et prix ---------- */
  // Prix unitaires (en euros), hors dragées : à ajuster ici.
  // Seule la boîte en carton a un prix pour l'instant ; les autres contenants sont chiffrés sur devis (0).
  var PRIX_CONTENANT = { boite: 3.50, pot: 0, tube: 0, pochon: 0, bouquet: 0 }; // boîte + étiquette personnalisée
  var PRIX_NOEUD = 0;       // nœud satiné (boîte) : inclus
  var PRIX_BOUQUET = 0.50;  // bouquet champêtre, en plus du nœud (boîte)
  var DRAGEES_INCLUSES = 0;     // aucune dragée comprise : 3,50 € = boîte + étiquette + nœud
  // Remises dégressives sur la quantité (du palier le plus haut au plus bas) : à compléter ici
  var REMISES = [{ des: 100, taux: 0.10 }];
  function remiseFor(n) { for (var i = 0; i < REMISES.length; i++) if (n >= REMISES[i].des) return REMISES[i]; return null; }
  function totalBrut() { return Math.round(nbBoites() * prixUnitaire() * 100) / 100; }
  function totalNet() { var r = remiseFor(nbBoites()), t = totalBrut(); return r ? Math.round(t * (1 - r.taux) * 100) / 100 : t; }
  var PRIX_DRAGEE_SUP = 0.10;   // par dragée (minimum 5 par boîte)
  var NB_MAX = 5000;
  var NB_MIN = 20;          // minimum de commande
  function euros(n) { return n.toLocaleString(EN ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' }); }
  function nbBoites() { var n = parseInt(val('w-nb'), 10); return n > 0 ? Math.min(n, NB_MAX) : 0; }
  function avecDragees() { return checkedValue('dragees') === 'Avec dragées'; }
  function prixOptions() {
    if (!isBoite()) return { noeud: 0, bouquet: 0, sup: 0, nbSup: 0 };
    var d = decoChoice();
    var nbSup = checkedValue('dragees') === 'Avec dragées' ? Math.max(0, totalQty() - DRAGEES_INCLUSES) : 0;
    return { noeud: (d === 'Nœud satiné' || d === 'Nœud + bouquet') ? PRIX_NOEUD : 0, bouquet: d === 'Nœud + bouquet' ? PRIX_BOUQUET : 0,
      sup: Math.round(nbSup * PRIX_DRAGEE_SUP * 100) / 100, nbSup: nbSup };
  }
  function prixUnitaire() {
    if (conseil) return 0;
    var base = PRIX_CONTENANT[containers[idx].key] || 0;
    if (!base) return 0;
    var o = prixOptions();
    return Math.round((base + o.noeud + o.bouquet + o.sup) * 100) / 100;
  }
  function detailPrix() {
    var base = PRIX_CONTENANT[containers[idx].key] || 0, o = prixOptions();
    var parts = [T('boîte et étiquette ', 'box and label ') + euros(base)];
    if (o.sup) parts.push(o.nbSup + ' dragée' + (o.nbSup > 1 ? 's' : '') + ' ' + euros(o.sup));
    if (o.noeud) parts.push(T('nœud ', 'bow ') + euros(o.noeud));
    if (o.bouquet) parts.push('bouquet ' + euros(o.bouquet));
    return parts.join(' + ');
  }
  function updatePrix() {
    var n = nbBoites(), pu = prixUnitaire();
    $('w-nb-unit').textContent = pu ? euros(pu) + T(' la boîte', ' per box') + (avecDragees() ? T(', dragées comprises', ', dragées included') : '') : (conseil ? T('Prix selon le contenant choisi ensemble', 'Price depends on the container we choose together') : T('Prix communiqué avec votre proposition', 'Price given with your proposal'));
    var det = $('w-nb-detail');
    if (det) det.textContent = pu ? detailPrix() : '';
    // étape dragées : prix des dragées supplémentaires (boîte en carton)
    var dp = $('cfg-dg-price'), o = prixOptions();
    if (dp) {
      dp.hidden = !isBoite() || !avecDragees();
      dp.textContent = o.nbSup ? o.nbSup + ' dragée' + (o.nbSup > 1 ? 's' : '') + ' × ' + euros(PRIX_DRAGEE_SUP) + T(' : + ', ': + ') + euros(o.sup) + T(' par boîte', ' per box')
        : euros(PRIX_DRAGEE_SUP) + T(' par dragée, en plus du prix de la boîte', ' per dragée, on top of the box price');
    }
    var r = remiseFor(n), rem = $('w-nb-remise'), next = REMISES[REMISES.length - 1];
    $('w-nb-total').textContent = pu && n >= NB_MIN ? T('Total : ', 'Total: ') + euros(totalNet()) : '';
    var nbNeed = $('w-nb-need');
    if (nbNeed) { nbNeed.hidden = !(n > 0 && n < NB_MIN); nbNeed.textContent = T('Commande à partir de ' + NB_MIN + ' boîtes : ajoutez-en ' + (NB_MIN - n) + ' pour continuer.', 'Minimum order ' + NB_MIN + ' boxes: add ' + (NB_MIN - n) + ' more to continue.'); }
    if (rem) {
      if (pu && n && r) rem.textContent = T('Remise ' + Math.round(r.taux * 100) + ' % dès ' + r.des + ' boîtes : − ', Math.round(r.taux * 100) + '% discount from ' + r.des + ' boxes: − ') + euros(totalBrut() - totalNet());
      else rem.textContent = '';
      rem.classList.toggle('is-on', !!r);
    }
    // Incitation au palier de remise (80 à 99 boîtes)
    var pal = $('w-nb-palier');
    if (pal) {
      var showPal = !!(pu && next && n >= NB_MIN && n < next.des && n >= next.des - 20);
      pal.hidden = !showPal;
      if (showPal) {
        var manque = next.des - n, totPal = Math.round(next.des * pu * (1 - next.taux) * 100) / 100, diff = Math.round((totPal - totalNet()) * 100) / 100;
        $('w-nb-palier-txt').innerHTML = EN
          ? 'Just <strong>' + manque + ' more box' + (manque > 1 ? 'es' : '') + '</strong> to get −' + Math.round(next.taux * 100) + '%: ' +
            next.des + ' boxes for ' + euros(totPal) + (diff > 0 ? ', only ' + euros(diff) + ' more' : diff < 0 ? ', which is ' + euros(-diff) + ' less' : ', for the same price') + '.'
          : 'Plus que <strong>' + manque + ' boîte' + (manque > 1 ? 's' : '') + '</strong> pour bénéficier de −' + Math.round(next.taux * 100) + '&nbsp;%&nbsp;: ' +
            next.des + ' boîtes pour ' + euros(totPal) + (diff > 0 ? ', soit seulement ' + euros(diff) + ' de plus' : diff < 0 ? ', soit ' + euros(-diff) + ' de moins' : ', pour le même prix') + '.';
        $('w-nb-palier-btn').textContent = T('Passer à ' + next.des + ' boîtes', 'Switch to ' + next.des + ' boxes');
        $('w-nb-palier-btn').setAttribute('data-n', next.des);
      }
    }
    updatePriceTag();
    $('w-nb-minus').disabled = n <= NB_MIN;
    $('w-nb-plus').disabled = n >= NB_MAX;
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-boxes__preset'), function(b) {
      b.classList.toggle('is-active', parseInt(b.getAttribute('data-n'), 10) === n);
    });
  }
  // Encart prix sous l'aperçu (étapes 2 à 6)
  var lastTagPrice = null, deltaTimer = null;
  function updatePriceTag() {
    var box = $('cfg-pricetag');
    if (!box) return;
    var visible = current >= 2 && current < TOTAL;
    box.hidden = !visible;
    if (!visible) return;
    var amt = $('cfg-pt-amount'), unit = $('cfg-pt-unit'), det = $('cfg-pt-detail'), dl = $('cfg-pt-delta');
    var base = conseil ? 0 : (PRIX_CONTENANT[containers[idx].key] || 0);
    if (!base) {
      amt.textContent = conseil ? T('Prix selon le contenant', 'Price depends on the container') : T('Prix sur devis', 'Price on quotation');
      unit.textContent = ''; det.textContent = conseil ? '' : T('Communiqué avec votre maquette', 'Given with your mock-up');
      box.classList.add('is-quote'); lastTagPrice = null; return;
    }
    box.classList.remove('is-quote');
    var pu = prixUnitaire();
    if (current === 2) {
      amt.textContent = T('dès ', 'from ') + euros(base); unit.textContent = T(' / boîte', ' / box');
      det.textContent = T('Étiquette personnalisée et nœud satiné inclus', 'Personalised label and satin bow included');
      lastTagPrice = null; return;
    }
    amt.textContent = euros(pu); unit.textContent = T(' / boîte', ' / box');
    var o = prixOptions(), parts = [T('Boîte ', 'Box ') + euros(base)];
    if (o.sup) parts.push(o.nbSup + ' dragée' + (o.nbSup > 1 ? 's' : '') + ' +' + euros(o.sup));
    if (o.bouquet) parts.push('Bouquet +' + euros(o.bouquet));
    det.innerHTML = '';
    if (parts.length > 1) parts.forEach(function(t) { var sp = document.createElement('span'); sp.textContent = t; det.appendChild(sp); });
    else det.textContent = T('Étiquette personnalisée et nœud satiné inclus', 'Personalised label and satin bow included');
    if (lastTagPrice !== null && Math.abs(pu - lastTagPrice) > 0.001) {
      var d = Math.round((pu - lastTagPrice) * 100) / 100;
      dl.textContent = (d > 0 ? '+' : '−') + euros(Math.abs(d));
      dl.classList.toggle('is-down', d < 0);
      box.classList.remove('is-flash'); void box.offsetWidth; box.classList.add('is-flash');
      clearTimeout(deltaTimer); deltaTimer = setTimeout(function() { box.classList.remove('is-flash'); }, 1400);
    }
    lastTagPrice = pu;
  }
  function setNb(n) {
    $('w-nb').value = Math.max(NB_MIN, Math.min(NB_MAX, n));
    updatePrix();
    updateNextState();
  }
  $('w-nb').addEventListener('input', function() { updatePrix(); updateNextState(); });
  $('w-nb').addEventListener('change', function() { if (val('w-nb')) setNb(nbBoites() || NB_MIN); });
  if ($('w-nb-palier-btn')) $('w-nb-palier-btn').addEventListener('click', function() { setNb(parseInt(this.getAttribute('data-n'), 10)); });
  $('w-nb-minus').addEventListener('click', function() { setNb(nbBoites() - 1); });
  $('w-nb-plus').addEventListener('click', function() { setNb(nbBoites() + 1); });
  Array.prototype.forEach.call(document.querySelectorAll('.cfg-boxes__preset'), function(b) {
    b.addEventListener('click', function() { setNb(parseInt(b.getAttribute('data-n'), 10)); });
  });
  updatePrix();
  function nbBoitesText() { var n = nbBoites(); return n ? n + (EN ? ' box' + (n > 1 ? 'es' : '') : ' boîte' + (n > 1 ? 's' : '')) : ''; }
  function prixText() {
    var n = nbBoites(), pu = prixUnitaire(), r = remiseFor(n);
    return n && pu ? euros(totalNet()) + (r ? T(' (remise ' + Math.round(r.taux * 100) + ' % incluse)', ' (' + Math.round(r.taux * 100) + '% discount included)') : '') : '';
  }
  function prixDetailMail() {
    var n = nbBoites(), pu = prixUnitaire();
    var r = remiseFor(n);
    return n && pu ? euros(totalNet()) + ' — ' + n + ' × ' + euros(pu) + ' (' + detailPrix() + ')' + (r ? ', remise ' + Math.round(r.taux * 100) + ' % (− ' + euros(totalBrut() - totalNet()) + ')' : '') : '';
  }
  function quantiteText() {
    var n = nbBoites(), pu = prixUnitaire();
    if (!n) return '';
    return EN ? n + ' box' + (n > 1 ? 'es' : '') + (pu ? ' × ' + euros(pu) + ' = ' + euros(n * pu) + ' (indicative price)' : '')
      : n + ' boîte' + (n > 1 ? 's' : '') + (pu ? ' × ' + euros(pu) + ' = ' + euros(n * pu) + ' (prix indicatif)' : '');
  }

  function contenantText() { return conseil ? T('À définir ensemble (conseil demandé)', 'To be decided together (advice requested)') : containerLabel(); }
  function drageesText() {
    var d = checkedValue('dragees');
    var dn = checkedName('dragees');
    if (d !== 'Avec dragées') return dn;
    if (!chosenColors.length) return dn + T(' · couleurs à définir', ' · colours to be decided');
    return dn + ' · ' + (EN ? catName(chosenCat()) + ': ' : '') + chosenColors.map(function(v) { return nameOfValue('couleurs', v) + ' ×' + (qty[v] || 1); }).join(', ');
  }
  function etiquetteText() {
    return [val('cfg-l1'), val('cfg-l2')].filter(Boolean).join(' — ');
  }
  function colorLabel(name) {
    var v = tagColorName(name);
    return v === 'Personnalisée' ? T('personnalisée ', 'custom ') + tagColor(name, '').toUpperCase() : checkedName(name).toLowerCase();
  }
  function etiquetteFormat() {
    var bords = tagColorName('etiquette_bord') === 'Sans bordure' ? T('sans bordure', 'no border') : (EN ? colorLabel('etiquette_bord') + ' border' : 'bordures ' + colorLabel('etiquette_bord'));
    // la taille n'est mentionnée que si le client a pu la régler (pas pour la boîte en carton)
    if (EN) return checkedName('etiquette_forme') + ', ' + checkedName('etiquette_police').toLowerCase() + ' script, ' + (tagSizeFixed() ? 'white' : colorLabel('etiquette_fond')) + ' background, ' + colorLabel('etiquette_texte') + ' lettering, ' + bords;
    return tagShape() + ', écriture ' + tagFont().name.toLowerCase() + ', fond ' + (tagSizeFixed() ? 'blanc' : colorLabel('etiquette_fond')) + ', écriture ' + colorLabel('etiquette_texte') + ', ' + bords;
  }


  /* ---------- Étape 5 : décoration de la boîte (nœud, fleurs champêtres) ---------- */
  function isBoite() { return !conseil && containers[idx].key === 'boite'; }
  function stepUsable(n) { return n !== 5 || isBoite(); } // l'étape décoration ne concerne que la boîte en carton
  function decoChoice() { return checkedValue('decoration') || 'Sans décoration'; }
  function decoName() { return checkedName('decoration') || T('Sans décoration', 'No decoration'); }
  function rubanHex() { var el = document.querySelector('input[name="ruban"]:checked'); return el ? el.getAttribute('data-hex') : '#D9C29A'; }
  function shadeHex(h, f) {
    var n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { v = Math.round(v * f); return (v < 16 ? '0' : '') + Math.min(255, v).toString(16); }
    return '#' + c(r) + c(g) + c(b);
  }
  function applyDeco() {
    if (!box) return;
    var d = decoChoice(), on = isBoite() && current >= 5;
    var noeud = on && (d === 'Nœud satiné' || d === 'Nœud + bouquet');
    var fleurs = on && (d === 'Fleurs champêtres' || d === 'Nœud + bouquet');
    box.style.setProperty('--ruban', rubanHex());
    box.style.setProperty('--ruban-d', shadeHex(rubanHex(), 0.93));
    function show(cls, v) { var g = box.querySelector('.cfg-deco--' + cls); if (g) g.style.display = v ? 'inline' : 'none'; }
    show('ruban', noeud); show('noeud', noeud); show('fleurs', fleurs);
    show('attache-ruban', noeud && fleurs); show('attache-raphia', fleurs && !noeud);
    // avec des fleurs, la boîte se réduit un peu pour laisser la place au bouquet
    var body = box.querySelector('.cfg-box-body');
    // même taille de boîte avec ou sans fleurs : on la descend un peu et le bouquet peut dépasser du cadre
    if (body) body.setAttribute('transform', 'translate(200 ' + (fleurs ? 376 : 356) + ') scale(1.55) translate(-214 -356)');
    var ombre = box.querySelector(':scope > ellipse');
    if (ombre) ombre.setAttribute('cy', fleurs ? 380 : 360);
    box.classList.toggle('has-fleurs', fleurs);
    var bc = bouquetColor();
    box.style.setProperty('--bq', bc.base); box.style.setProperty('--bq-l', bc.light); box.style.setProperty('--bq-d', bc.dark);
    if (typeof updatePrix === 'function') updatePrix();
    var bb = $('cfg-bouquet-couleur');
    if (bb) bb.hidden = d !== 'Nœud + bouquet';
    var rb = $('cfg-ruban');
    if (rb) rb.hidden = !(d === 'Nœud satiné' || d === 'Nœud + bouquet');
  }
  // Couleurs du bouquet séché : teinte principale, claire et soutenue
  var BOUQUET_TONS = {
    'Beige': ['#F1E4C9', '#F7EEDC', '#D8C39A'], 'Blanc': ['#F6F2EA', '#FFFFFF', '#D6CDBD'],
    'Rose': ['#EBC6C6', '#F5DFDF', '#C98F94'], 'Bleu': ['#C9D8E8', '#E3ECF5', '#8FA8C4'],
    'Vert': ['#CBD6B4', '#E2E9D3', '#95A67A'], 'Orange': ['#EDC29C', '#F6DCC4', '#C98E5E'],
    'Violet': ['#CFC0E0', '#E5DCEF', '#9580B5'], 'Rouge': ['#CC7573', '#E6ABA8', '#9C4447']
  };
  function bouquetColor() {
    var t = BOUQUET_TONS[checkedValue('bouquet_couleur')] || BOUQUET_TONS.Beige;
    return { base: t[0], light: t[1], dark: t[2] };
  }
  document.querySelectorAll('input[name="bouquet_couleur"]').forEach(function(r) {
    r.addEventListener('change', function() { var l = $('label-bouquet-name'); if (l) l.textContent = dispName(r); applyDeco(); });
  });
  function decoText() {
    if (!isBoite()) return '';
    var d = decoChoice();
    if (d === 'Nœud satiné') return decoName() + T(' (ruban ', ' (ribbon ') + checkedName('ruban').toLowerCase() + ')';
    if (d === 'Nœud + bouquet') return decoName() + T(' (ruban ', ' (ribbon ') + checkedName('ruban').toLowerCase() + ', bouquet ' + (checkedName('bouquet_couleur') || 'Beige').toLowerCase() + ')';
    return d;
  }
  document.querySelectorAll('input[name="decoration"]').forEach(function(r) { r.addEventListener('change', applyDeco); });
  document.querySelectorAll('input[name="ruban"]').forEach(function(r) {
    r.addEventListener('change', function() { var l = $('label-ruban-name'); if (l) l.textContent = dispName(r); applyDeco(); });
  });

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
    if (n === 2) return T('Choisir ce contenant', 'Choose this container');
    if (n === TOTAL) return T('Recevoir ma maquette gratuite', 'Get my free mock-up');
    return T('Continuer', 'Continue');
  }
  function validateStep(n) {
    if (n === 1) return !!checkedValue('evenement');
    if (n === 3) return !!checkedValue('dragees') && drageesComplete();
    if (n === 4) return !!val('cfg-l1') && !!val('cfg-l2');
    if (n === 6) return nbBoites() >= NB_MIN;
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
    applyDeco();
    updatePrix();
    $('cfg-name').textContent = (n !== 2 && conseil) ? T('Contenant à définir ensemble', 'Container to be decided together') : containers[idx].name;
    updateSizes();
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
    var reassure = $('wizard-reassure'); if (reassure) reassure.hidden = n !== TOTAL;
    var proof = $('wizard-proof'); if (proof) proof.hidden = n !== TOTAL;
    if (typeof queueSave === 'function') queueSave();
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
    setRow('sum-event', checkedName('evenement'));
    setRow('sum-contenant', contenantText());
    setRow('sum-dragees', drageesText());
    setRow('sum-etiquette', [etiquetteText(), etiquetteFormat()].filter(Boolean).join(' · '), true);
    setRow('sum-deco', decoText(), true);
    setRow('sum-qty', nbBoitesText());
    setRow('sum-prix', prixText(), true);
    setRow('sum-date', date ? formatDate(date) : '', false, T('Non précisée', 'Not specified'));
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

  // La demande envoyée à l'atelier reste toujours en français (même depuis la version anglaise)
  function buildPayload() {
    var wasEN = EN; EN = false;
    try { var p = buildPayloadFr(); } finally { EN = wasEN; }
    if (wasEN) p['Langue du client'] = 'Anglais (demande faite sur la version anglaise du site : répondre en anglais)';
    return p;
  }
  function buildPayloadFr() {
    var prenom = val('w-prenom'), nom = val('w-nom'), email = val('w-email');
    var occasion = checkedValue('evenement'), quantite = quantiteText();
    var date = readDate(), days = date ? daysUntil(date) : null;
    var urgent = days !== null && days >= 0 && days < 28;
    var p = {
      'subject': 'Création sur mesure · ' + occasion + ' · ' + (conseil ? 'contenant à définir' : containerLabel()) + ' · ' +
        nbBoites() + ' boîtes · ' + (date ? formatDate(date) : 'date non fixée') + ' · ' + prenom + ' ' + nom + (urgent ? ' · DÉLAI COURT' : ''),
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
      'Étiquette': etiquetteFormat(),
      'Décoration': decoText() || 'Sans objet (contenant autre que la boîte)',
      'Nombre de boîtes': nbBoitesText(),
      'Prix indicatif': prixDetailMail() || 'Sur devis',
      "Date de l'événement": date ? formatDate(date) + ' (' + relativeDelay(days) + ')' : 'Non précisée'
    };
    [['Nous a connus via', checkedValue('source')],
     ['Produit consulté', produitParam], ['Photo du produit', imageParam]].forEach(function(o) { if (o[1]) p[o[0]] = o[1]; });
    p['_gotcha'] = val('w-company');
    return p;
  }

  function showSuccess() {
    if (typeof clearSave === 'function') clearSave(); // demande envoyée : on oublie la création en cours
    body.style.display = 'none';
    nav.style.display = 'none';
    var em = val('w-email'), emEl = $('wizard-success-email');
    if (emEl) emEl.textContent = em ? T(' à ', ' at ') + em : '';
    var rs = $('wizard-reassure'); if (rs) rs.hidden = true;
    var pf = $('wizard-proof'); if (pf) pf.hidden = true;
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
      var firstError = document.querySelector('#wizard-step-7 .has-error');
      if (firstError) firstError.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    if (val('w-company')) { showSuccess(); return; } // champ piège rempli : robot
    var errEl = $('wizard-send-error'); if (errEl) errEl.hidden = true;
    nextBtn.disabled = true;
    nextBtn.textContent = T('Envoi en cours…', 'Sending…');
    fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildPayload())
    })
    .then(function(r) { if (r.ok) showSuccess(); else showSendError(); })
    .catch(showSendError);
  }

  backBtn.addEventListener('click', function() {
    if (current <= 1) return;
    var n = current - 1;
    while (n > 1 && !stepUsable(n)) n--;
    showStep(n, 'back');
  });
  nextBtn.addEventListener('click', function() {
    if (current === TOTAL) { send(); return; }
    if (!validateStep(current)) {
      var p = getPanel(current);
      if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      return;
    }
    if (current === 2) conseil = false;
    var n = current + 1;
    while (n < TOTAL && !stepUsable(n)) n++;
    showStep(n, 'next');
  });

  /* Hauteur de l'en-tête fixe, pour l'aperçu collant sur mobile */
  function setStickyTop() {
    var hdr = document.querySelector('.header');
    if (hdr) document.documentElement.style.setProperty('--cfg-top', hdr.getBoundingClientRect().height + 'px');
  }
  window.addEventListener('resize', setStickyTop);
  setStickyTop();

  /* ---------- Personnalisation : après chaque choix, on remonte vers l'aperçu ---------- */
  var stageScrollTimer = 0;
  function showStageIfHidden() {
    var view = stage.querySelector('.cfg-view') || stage;
    var hdr = document.querySelector('.header');
    var top = hdr ? hdr.getBoundingClientRect().height : 0;
    var r = view.getBoundingClientRect();
    // déjà entièrement visible : on ne bouge pas
    if (r.top >= top - 4 && r.bottom <= window.innerHeight + 4) return;
    window.scrollTo({ top: window.pageYOffset + r.top - top - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function onCustomize(e) {
    if (current !== 4 && current !== 5) return;
    var t = e.target;
    var isText = t && (t.id === 'cfg-l1' || t.id === 'cfg-l2');
    clearTimeout(stageScrollTimer);
    stageScrollTimer = setTimeout(function() {
      // texte : seulement quand la saisie est terminée (pas en passant d'un champ à l'autre)
      var a = document.activeElement;
      if (isText && a && (a.id === 'cfg-l1' || a.id === 'cfg-l2')) return;
      showStageIfHidden();
    }, isText ? 120 : 60);
  }
  [getPanel(4), getPanel(5)].forEach(function(p) { if (p) p.addEventListener('change', onCustomize); });
  ['cfg-l1', 'cfg-l2'].forEach(function(id) {
    $(id).addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); $(id).blur(); } });
  });

  /* ---------- Étape 1 : après le choix de l'occasion, on descend vers « Continuer » ---------- */
  document.querySelectorAll('input[name="evenement"]').forEach(function(r) {
    r.addEventListener('change', function() {
      setTimeout(function() {
        var rb = nextBtn.getBoundingClientRect();
        if (rb.bottom > window.innerHeight - 16 || rb.top < 0) {
          window.scrollTo({ top: window.pageYOffset + rb.bottom - window.innerHeight + 40, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
        nextBtn.classList.remove('is-nudge'); void nextBtn.offsetWidth; nextBtn.classList.add('is-nudge');
      }, 150);
    });
  });

  /* Bulles d'aide sur les dragées indisponibles : placement et affichage au toucher */
  function placeTip(lab) {
    var r = lab.getBoundingClientRect(), mid = r.left + r.width / 2;
    lab.classList.toggle('tip-left', mid < 140);
    lab.classList.toggle('tip-right', mid > window.innerWidth - 140);
  }
  document.querySelectorAll('.cfg-dg-panel .wizard__color-item').forEach(function(lab) {
    lab.addEventListener('mouseenter', function() { if (lab.hasAttribute('data-tip')) placeTip(lab); });
    lab.addEventListener('click', function() {
      if (!lab.hasAttribute('data-tip')) return;
      placeTip(lab);
      lab.classList.add('is-tip');
      clearTimeout(lab._tipT);
      lab._tipT = setTimeout(function() { lab.classList.remove('is-tip'); }, 2800);
    });
  });

  /* ---------- Sauvegarde automatique et « Reprendre ma création » ----------
     Les choix sont gardés dans le navigateur du client (rien n'est envoyé) ;
     les coordonnées personnelles de l'étape 7 ne sont pas enregistrées. */
  var SAVE_KEY = 'dp-creation-v1';
  var SAVE_DAYS = 60;
  var SAVE_RADIOS = ['evenement', 'dragees', 'decoration', 'ruban', 'bouquet_couleur', 'etiquette_forme',
    'etiquette_police', 'etiquette_fond', 'etiquette_texte', 'etiquette_bord'];
  var SAVE_FIELDS = ['cfg-l1', 'cfg-l2', 'w-nb', 'wizard-date'];
  var saveOn = true, saveTimer = 0, restoring = false;
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  function readSave() {
    var ls = store(); if (!ls) return null;
    try {
      var s = JSON.parse(ls.getItem(SAVE_KEY) || 'null');
      if (!s || !s.t || Date.now() - s.t > SAVE_DAYS * 864e5) return null;
      return s;
    } catch (e) { return null; }
  }
  function clearSave() { var ls = store(); if (ls) try { ls.removeItem(SAVE_KEY); } catch (e) {} }
  function saveState() {
    if (!saveOn || restoring) return;
    var ls = store(); if (!ls) return;
    var s = { t: Date.now(), step: current, idx: idx, conseil: conseil, bouquet: bouquetSize, tab: activeCat,
      r: {}, hex: {}, f: {}, colors: chosenColors.slice(), qty: {} };
    SAVE_RADIOS.forEach(function(n) { var v = checkedValue(n); if (v) s.r[n] = v; });
    ['etiquette_fond', 'etiquette_texte', 'etiquette_bord'].forEach(function(n) {
      var el = document.querySelector('input[name="' + n + '"][value="Personnalisée"]');
      if (el && el.checked) s.hex[n] = el.getAttribute('data-hex');
    });
    SAVE_FIELDS.forEach(function(id) { var el = $(id); if (el && el.value) s.f[id] = el.value; });
    chosenColors.forEach(function(v) { s.qty[v] = qty[v] || 1; });
    if (!s.r.evenement && s.step === 1) { clearSave(); return; }
    try { ls.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 250); }
  ['change', 'input', 'click'].forEach(function(ev) { body.addEventListener(ev, queueSave); });

  function findInput(name, v) {
    return Array.prototype.filter.call(document.querySelectorAll('input[name="' + name + '"]'), function(e) { return e.value === v; })[0];
  }
  function fire(el, type) { el.dispatchEvent(new Event(type, { bubbles: true })); }
  function restoreState(s) {
    restoring = true;
    try {
      if (typeof s.idx === 'number' && s.idx >= 0 && s.idx < containers.length && s.idx !== idx) show(s.idx, 0);
      if (s.bouquet) setBouquetSize(s.bouquet);
      SAVE_RADIOS.forEach(function(n) {
        var v = s.r && s.r[n]; if (!v) return;
        var el = findInput(n, v);
        if (el && !el.checked) { el.checked = true; fire(el, 'change'); }
      });
      Object.keys(s.hex || {}).forEach(function(n) {
        var picker = $(TAG_IDS[n] && TAG_IDS[n][1]);
        if (picker && s.hex[n]) { picker.value = s.hex[n]; fire(picker, 'input'); }
      });
      Object.keys(s.f || {}).forEach(function(id) {
        var el = $(id); if (!el) return;
        el.value = s.f[id]; fire(el, 'input'); fire(el, 'change');
      });
      (s.colors || []).forEach(function(v) {
        var el = findInput('couleurs', v);
        if (el && !el.checked) { el.checked = true; fire(el, 'change'); }
      });
      Object.keys(s.qty || {}).forEach(function(v) { if (chosenColors.indexOf(v) !== -1) qty[v] = Math.max(1, s.qty[v] | 0); });
      if (s.tab) selectTab(s.tab);
      refreshDragees();
      fitAllTags();
      conseil = !!s.conseil;
      var n = Math.min(Math.max(1, s.step | 0), TOTAL);
      while (n > 1 && !stepUsable(n)) n--;
      showStep(n, 'next');
      if (conseil) $('cfg-name').textContent = T('Contenant à définir ensemble', 'Container to be decided together');
    } finally {
      restoring = false;
    }
    saveState();
  }

  // Bandeau proposé à l'arrivée quand une création est en cours
  (function() {
    var s = readSave();
    if (!s) return;
    saveOn = false; // on ne remplace pas la création en cours tant que le client n'a pas choisi
    var occ = s.r && s.r.evenement && nameOfValue('evenement', s.r.evenement);
    var cont = s.conseil ? T('contenant à définir', 'container to be decided') : (containers[s.idx] ? containers[s.idx].name : '');
    var bar = document.createElement('div');
    bar.className = 'cfg-resume';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', T('Création en cours', 'Creation in progress'));
    bar.innerHTML = '<div class="cfg-resume__txt"><p class="cfg-resume__title">' + T('Votre création vous attend', 'Your creation is waiting for you') + '</p>' +
      '<p class="cfg-resume__meta"></p></div>' +
      '<div class="cfg-resume__actions"><button type="button" class="cfg-resume__go">' + T('Reprendre ma création', 'Resume my creation') + '</button>' +
      '<button type="button" class="cfg-resume__new">' + T('Recommencer', 'Start again') + '</button></div>';
    bar.querySelector('.cfg-resume__meta').textContent = [occ, cont, T('étape ', 'step ') + Math.min(s.step || 1, TOTAL) + ' / ' + TOTAL].filter(Boolean).join(' · ');
    body.parentNode.insertBefore(bar, body);
    function close() { saveOn = true; bar.parentNode && bar.parentNode.removeChild(bar); }
    bar.querySelector('.cfg-resume__go').addEventListener('click', function() { close(); restoreState(s); });
    bar.querySelector('.cfg-resume__new').addEventListener('click', function() { clearSave(); close(); });
    // le client repart de zéro sans cliquer : dès l'étape 2, la nouvelle création est enregistrée
    nextBtn.addEventListener('click', function() { if (bar.parentNode && current > 1) close(); });
  })();

  /* ---------- Initialisation ---------- */
  updateCaption();
  paint();
  setProgress(1);
  setNextLabel(labelFor(1));
  updateNextState();
})();

/* Configurateur « Lancer ma création » — 6 étapes
   1. Occasion · 2. Contenant (carrousel) · 3. Dragées (par catégorie) · 4. Étiquette
   5. Contenants & date · 6. Coordonnées (+ envoi Formspree) */
(function() {
  var TOTAL = 7;
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
    { id: 'petit', name: 'Petit', n: 5, span: 58, scale: 0.86 },
    { id: 'moyen', name: 'Moyen', n: 7, span: 78, scale: 1 },
    { id: 'grand', name: 'Grand', n: 10, span: 86, scale: 1.1 }
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
      btn.innerHTML = miniFan(b) + '<span class="cfg-size-opt__name">' + b.name + '</span><span class="cfg-size-opt__sub">' + b.n + ' pétales</span>';
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
    // boîte en papier : taille d'étiquette fixe, le curseur est masqué
    var sf = $('cfg-tag-size-field');
    if (sf) {
      var fixed = !conseil && containers[idx].key === 'boite';
      if (sf.hidden !== fixed) { sf.hidden = fixed; if (typeof renderTagShapes === 'function' && tags) renderTagShapes(); }
    }
  }
  function bouquetText() { var b = sizeOf(bouquetSize); return b.name + ' bouquet (' + b.n + ' pétales)'; }
  function containerLabel() {
    return containers[idx].key === 'bouquet' ? containers[idx].name + ' · ' + bouquetText() : containers[idx].name;
  }
  buildPetals();
  renderSizes();
  updateSizes();



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
  function capOf(cat) { var p = $('cfg-panel-' + cat); return (p && parseInt(p.getAttribute('data-max'), 10)) || 10; }
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
    });
    var lim = $('cfg-colors-limit');
    lim.hidden = !(fullColors || fullQty);
    lim.textContent = fullColors ? 'Trois couleurs maximum : retirez-en une pour en choisir une autre.'
      : 'Contenant complet (' + cap + ' dragées) : vous pouvez continuer. Pour ajouter une couleur, diminuez d’abord une quantité.';
    var one = $('cfg-dg-onecat');
    one.hidden = !cat || cat === activeCat;
    if (cat) one.textContent = 'Une seule catégorie par contenant : retirez vos « ' + catName(cat) + ' » pour choisir dans une autre.';
    $('cfg-dg-cap').textContent = 'Jusqu’à ' + capOf(activeCat) + ' dragées par contenant.';
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
      step.innerHTML = '<button type="button" class="cfg-qty__btn" data-act="minus" aria-label="Une de moins">−</button>' +
        '<output class="cfg-qty__n" aria-live="polite"></output>' +
        '<button type="button" class="cfg-qty__btn" data-act="plus" aria-label="Une de plus">+</button>';
      step.querySelector('output').textContent = n;
      step.querySelector('[data-act="minus"]').disabled = n <= 1;
      step.querySelector('[data-act="plus"]').disabled = fullQty;
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'cfg-qty__del';
      del.setAttribute('data-act', 'del');
      del.setAttribute('aria-label', 'Retirer ' + shortName(el));
      del.textContent = '×';
      li.appendChild(dot); li.appendChild(name); li.appendChild(step); li.appendChild(del);
      list.appendChild(li);
    });
    updateTabCounts();
    paint();
    updateNeed();
    updateNextState();
  }
  // Le contenant doit être complet (10 dragées, 8 en chocolats amandes) pour passer à l'étape suivante
  function drageesComplete() {
    if (checkedValue('dragees') !== 'Avec dragées') return true;
    var cat = chosenCat();
    return !!cat && totalQty() === capOf(cat);
  }
  function updateNeed() {
    var need = $('cfg-dg-need');
    if (!need) return;
    var avec = checkedValue('dragees') === 'Avec dragées';
    var cat = chosenCat(), cap = capOf(cat || activeCat), left = cap - totalQty();
    need.hidden = !avec || drageesComplete();
    if (need.hidden) return;
    need.textContent = !cat
      ? 'Choisissez ' + cap + ' dragées pour passer à l’étape suivante.'
      : 'Il reste ' + left + ' dragée' + (left > 1 ? 's' : '') + ' à choisir : votre contenant doit en compter ' + cap + ' pour passer à l’étape suivante.';
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
    else if (act === 'minus' && qty[v] > 1) qty[v] -= 1;
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
      if (c.checked) { chosenColors.push(c.value); qty[c.value] = 1; }
      else { chosenColors = chosenColors.filter(function(v) { return v !== c.value; }); delete qty[c.value]; }
      refreshDragees();
    });
  });
  refreshDragees();
  document.querySelectorAll('input[name="dragees"]').forEach(function(r) {
    r.addEventListener('change', function() {
      $('cfg-colors').hidden = checkedValue('dragees') !== 'Avec dragées';
      updateNeed();
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
  var TAG_SIZE_DEFAUT = 120; // taille par défaut (%), fixe pour la boîte en papier
  function tagSizeFixed() { return !conseil && containers[idx].key === 'boite'; }
  function tagScale() {
    var el = $('cfg-tag-size');
    if (tagSizeFixed() || !el) return TAG_SIZE_DEFAUT / 100;
    return (parseInt(el.value, 10) || TAG_SIZE_DEFAUT) / 100;
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
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.getAttribute('data-hex') : fallback;
  }
  function tagColorName(name) { return checkedValue(name) || ''; }
  var TAG_IDS = { etiquette_fond: ['label-tag-fond-name', 'cfg-fond-custom'], etiquette_texte: ['label-tag-texte-name', 'cfg-texte-custom'], etiquette_bord: ['label-tag-bord-name', 'cfg-bord-custom'] };
  ['etiquette_fond', 'etiquette_texte', 'etiquette_bord'].forEach(function(name) {
    var label = $(TAG_IDS[name][0]);
    document.querySelectorAll('input[name="' + name + '"]').forEach(function(r) {
      r.addEventListener('change', function() { if (label) label.textContent = r.value; renderTagShapes(); });
    });
    var picker = $(TAG_IDS[name][1]);
    if (picker) picker.addEventListener('input', function() {
      var radio = picker.closest('.cfg-swatch').querySelector('input[type="radio"]');
      radio.setAttribute('data-hex', picker.value);
      picker.parentNode.style.background = picker.value;
      if (!radio.checked) { radio.checked = true; }
      if (label) label.textContent = 'Personnalisée (' + picker.value.toUpperCase() + ')';
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
    var t = val('cfg-l1') || 'Vos prénoms';
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-font__sample'), function(s) { s.textContent = t; });
  }
  if ($('cfg-l1')) $('cfg-l1').addEventListener('input', updateFontSamples);
  function setTagText(g, l1, l2) {
    var r = parseFloat(g.getAttribute('data-r')), wf = tagWidthFactor();
    var t1 = g.querySelector('.cfg-tag__l1'), t2 = g.querySelector('.cfg-tag__l2');
    t1.textContent = l1 || 'Vos prénoms';
    t2.textContent = l2 || 'jj.mm.aaaa';
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
    need.textContent = !a && !b ? 'Indiquez les prénoms (ou le nom) et la date (ou un petit mot) pour passer à l’étape suivante.'
      : !a ? 'Indiquez les prénoms ou le nom pour passer à l’étape suivante.'
      : 'Indiquez la date ou un petit mot pour passer à l’étape suivante.';
    if (typeof updateNextState === 'function') updateNextState();
  }
  ['cfg-l1', 'cfg-l2'].forEach(function(id) { $(id).addEventListener('input', updateTagNeed); });
  updateTagNeed();
  document.querySelectorAll('input[name="etiquette_forme"]').forEach(function(r) { r.addEventListener('change', renderTagShapes); });
  if ($('cfg-tag-size')) $('cfg-tag-size').addEventListener('input', renderTagShapes);
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
  /* ---------- Nombre de boîtes et prix ---------- */
  // Prix unitaire par contenant (en euros) : à ajuster ici
  var PRIX_CONTENANT = { boite: 5, pot: 5, tube: 5, pochon: 5, bouquet: 5 };
  var NB_MAX = 5000;
  function euros(n) { return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }); }
  function nbBoites() { var n = parseInt(val('w-nb'), 10); return n > 0 ? Math.min(n, NB_MAX) : 0; }
  function prixUnitaire() { return conseil ? 0 : (PRIX_CONTENANT[containers[idx].key] || 0); }
  function updatePrix() {
    var n = nbBoites(), pu = prixUnitaire();
    $('w-nb-unit').textContent = pu ? euros(pu) + ' la boîte' : 'Prix selon le contenant choisi ensemble';
    $('w-nb-total').textContent = pu && n ? 'Total : ' + euros(n * pu) : '';
    $('w-nb-minus').disabled = n <= 1;
    $('w-nb-plus').disabled = n >= NB_MAX;
    Array.prototype.forEach.call(document.querySelectorAll('.cfg-boxes__preset'), function(b) {
      b.classList.toggle('is-active', parseInt(b.getAttribute('data-n'), 10) === n);
    });
  }
  function setNb(n) {
    $('w-nb').value = Math.max(1, Math.min(NB_MAX, n));
    updatePrix();
    updateNextState();
  }
  $('w-nb').addEventListener('input', function() { updatePrix(); updateNextState(); });
  $('w-nb').addEventListener('change', function() { if (val('w-nb')) setNb(nbBoites() || 1); });
  $('w-nb-minus').addEventListener('click', function() { setNb(nbBoites() - 1); });
  $('w-nb-plus').addEventListener('click', function() { setNb(nbBoites() + 1); });
  Array.prototype.forEach.call(document.querySelectorAll('.cfg-boxes__preset'), function(b) {
    b.addEventListener('click', function() { setNb(parseInt(b.getAttribute('data-n'), 10)); });
  });
  updatePrix();
  function nbBoitesText() { var n = nbBoites(); return n ? n + ' boîte' + (n > 1 ? 's' : '') : ''; }
  function prixText() {
    var n = nbBoites(), pu = prixUnitaire();
    return n && pu ? euros(n * pu) + ' (' + euros(pu) + ' la boîte, prix indicatif)' : '';
  }
  function quantiteText() {
    var n = nbBoites(), pu = prixUnitaire();
    if (!n) return '';
    return n + ' boîte' + (n > 1 ? 's' : '') + (pu ? ' × ' + euros(pu) + ' = ' + euros(n * pu) + ' (prix indicatif)' : '');
  }

  function contenantText() { return conseil ? 'À définir ensemble (conseil demandé)' : containerLabel(); }
  function drageesText() {
    var d = checkedValue('dragees');
    if (d !== 'Avec dragées') return d;
    if (!chosenColors.length) return d + ' · couleurs à définir';
    return d + ' · ' + chosenColors.map(function(v) { return v + ' ×' + (qty[v] || 1); }).join(', ') +
      ' (' + totalQty() + ' dragées sur ' + capOf(chosenCat()) + ' max)';
  }
  function etiquetteText() {
    return [val('cfg-l1'), val('cfg-l2')].filter(Boolean).join(' — ');
  }
  function colorLabel(name) {
    var v = tagColorName(name);
    return v === 'Personnalisée' ? 'personnalisée ' + tagColor(name, '').toUpperCase() : v.toLowerCase();
  }
  function etiquetteFormat() {
    var bords = tagColorName('etiquette_bord') === 'Sans bordure' ? 'sans bordure' : 'bordures ' + colorLabel('etiquette_bord');
    return tagShape() + ', taille ' + Math.round(tagScale() * 100) + ' %, écriture ' + tagFont().name.toLowerCase() + ', fond ' + colorLabel('etiquette_fond') + ', écriture ' + colorLabel('etiquette_texte') + ', ' + bords;
  }


  /* ---------- Étape 5 : décoration de la boîte (nœud, fleurs champêtres) ---------- */
  function isBoite() { return !conseil && containers[idx].key === 'boite'; }
  function stepUsable(n) { return n !== 5 || isBoite(); } // l'étape décoration ne concerne que la boîte en papier
  function decoChoice() { return checkedValue('decoration') || 'Sans décoration'; }
  function rubanHex() { var el = document.querySelector('input[name="ruban"]:checked'); return el ? el.getAttribute('data-hex') : '#D9C29A'; }
  function shadeHex(h, f) {
    var n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { v = Math.round(v * f); return (v < 16 ? '0' : '') + Math.min(255, v).toString(16); }
    return '#' + c(r) + c(g) + c(b);
  }
  function applyDeco() {
    if (!box) return;
    var d = decoChoice(), on = isBoite() && current >= 5;
    var noeud = on && (d === 'Nœud satiné' || d === 'Nœud + fleurs');
    var fleurs = on && (d === 'Fleurs champêtres' || d === 'Nœud + fleurs');
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
    var rb = $('cfg-ruban');
    if (rb) rb.hidden = !(d === 'Nœud satiné' || d === 'Nœud + fleurs');
  }
  function decoText() {
    if (!isBoite()) return '';
    var d = decoChoice();
    return (d === 'Nœud satiné' || d === 'Nœud + fleurs') ? d + ' (ruban ' + checkedValue('ruban').toLowerCase() + ')' : d;
  }
  document.querySelectorAll('input[name="decoration"]').forEach(function(r) { r.addEventListener('change', applyDeco); });
  document.querySelectorAll('input[name="ruban"]').forEach(function(r) {
    r.addEventListener('change', function() { var l = $('label-ruban-name'); if (l) l.textContent = r.value; applyDeco(); });
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
    if (n === 2) return 'Choisir ce contenant';
    if (n === TOTAL) return 'Recevoir ma proposition';
    return 'Continuer';
  }
  function validateStep(n) {
    if (n === 1) return !!checkedValue('evenement');
    if (n === 3) return !!checkedValue('dragees') && drageesComplete();
    if (n === 4) return !!val('cfg-l1') && !!val('cfg-l2');
    if (n === 6) return nbBoites() > 0;
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
    $('cfg-name').textContent = (n !== 2 && conseil) ? 'Contenant à définir ensemble' : containers[idx].name;
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
    setRow('sum-etiquette', [etiquetteText(), etiquetteFormat()].filter(Boolean).join(' · '), true);
    setRow('sum-deco', decoText(), true);
    setRow('sum-qty', nbBoitesText());
    setRow('sum-prix', prixText(), true);
    setRow('sum-date', date ? formatDate(date) : '', false, 'Non précisée');
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
      'Prix indicatif': prixText() || 'À définir',
      "Date de l'événement": date ? formatDate(date) + ' (' + relativeDelay(days) + ')' : 'Non précisée'
    };
    [['Nous a connus via', checkedValue('source')],
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
      var firstError = document.querySelector('#wizard-step-7 .has-error');
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

  /* ---------- Initialisation ---------- */
  updateCaption();
  paint();
  setProgress(1);
  setNextLabel(labelFor(1));
  updateNextState();
})();

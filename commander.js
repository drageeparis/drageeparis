/* =========================================================================
   Page commander.html — commande depuis une fiche produit (Boutique)
   -------------------------------------------------------------------------
   - Le produit arrive par l'URL : commander.html?ref=avola-eminence&format=1kg
   - CATALOGUE ci-dessous : une entrée par fiche produit raccordée à cette page.
     Pour raccorder une nouvelle fiche : ajouter son entrée ici, puis faire
     pointer son bouton « Commander » vers commander.html?ref=<sa-ref>.
   - Envoi : Formspree (même endpoint que commande-dragees.html). Le champ
     « email » (en minuscules) est requis par Formspree pour la réponse
     automatique au client (option Autoresponse, offre Professional ou Business).
   ========================================================================= */
(function () {
  var FORMSPREE_URL = 'https://formspree.io/f/xeeyjnae';

  /* Passer à true une fois la réponse automatique activée dans Formspree :
     le message de confirmation mentionnera alors l'e-mail envoyé au client. */
  var AUTORESPONSE_ACTIVE = false;

  var LEAD_DAYS = 10;   /* délai de préparation maximal (5 à 10 jours) : première date proposée */
  var LEAD_LABEL = '5 à 10 jours';

  /* Frais point relais (Mondial Relay) : gratuits sous 1 kg,
     puis RELAIS_PRIX_KG € par kilo entamé (1 kg = 12 €, 1,5 kg = 24 €, 2 kg = 24 €, 3 kg = 36 €…). */
  var RELAIS_VALUE = 'Livraison en point relais (Mondial Relay)';
  var RELAIS_PRIX_KG = 12;
  var MAX_QTY = 50;     /* nombre maximal de sachets par ligne */

  /* Catalogue généré depuis les fiches produit : commande-catalogue.js (outils/catalogue-commande.py) */
  var CATALOGUE = window.DP_CATALOGUE || {};
  var FAMILLES = window.DP_FAMILLES || [];

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  /* ---------- utilitaires ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function euro(v) {
    var s = (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
    return s.replace(/,00$/, '') + ' €';
  }
  function weight(g) {
    return g >= 1000 ? String(g / 1000).replace('.', ',') + ' kg' : g + ' g';
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function longDate(iso) {
    var p = iso.split('-');
    return parseInt(p[2], 10) + ' ' + MOIS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function findFormat(prod, id) {
    for (var i = 0; i < prod.formats.length; i++) if (prod.formats[i].id === id) return prod.formats[i];
    return prod.formats[0];
  }

  /* ---------- état initial depuis l'URL ---------- */
  var params = new URLSearchParams(window.location.search);
  var ref = params.get('ref');
  if (!CATALOGUE[ref]) ref = Object.keys(CATALOGUE)[0];
  var firstProd = CATALOGUE[ref];
  var lines = [{ ref: ref, format: findFormat(firstProd, params.get('format')).id, qty: 1 }];
  var pickerOpen = false;

  var linesBox = document.getElementById('order-lines');
  var sumLines = document.getElementById('sum-lines');
  var sumTotal = document.getElementById('sum-total');
  var sumMode = document.getElementById('sum-mode');
  var addBtn = document.getElementById('order-add');
  var picker = document.getElementById('order-picker');
  var pickerGrid = document.getElementById('order-picker-grid');
  var form = document.getElementById('order-form');
  var dateInput = document.getElementById('o-date');

  var crumb = document.getElementById('crumb-family');
  crumb.textContent = firstProd.family;
  crumb.setAttribute('href', firstProd.familyUrl);

  /* ---------- date minimale ---------- */
  var minD = new Date();
  minD.setDate(minD.getDate() + LEAD_DAYS);
  var minIso = isoDate(minD);
  dateInput.setAttribute('min', minIso);
  document.getElementById('o-date-help').textContent = 'Délai de préparation : ' + LEAD_LABEL + '. Dates possibles à partir du ' + longDate(minIso) + '.';
  document.getElementById('err-date-min').textContent = longDate(minIso);

  /* ---------- calculs ---------- */
  function lineData(l) {
    var p = CATALOGUE[l.ref];
    var f = findFormat(p, l.format);
    return { prod: p, fmt: f, total: f.price * l.qty, grams: f.grams * l.qty };
  }
  function productsTotal() {
    return lines.reduce(function (s, l) { return s + lineData(l).total; }, 0);
  }
  function totalGrams() {
    return lines.reduce(function (s, l) { return s + lineData(l).grams; }, 0);
  }
  function relaisFee() {
    var g = totalGrams();
    return g < 1000 ? 0 : RELAIS_PRIX_KG * Math.ceil(g / 1000);
  }
  function selectedMode() {
    var m = form.querySelector('input[name="reception"]:checked');
    return m ? m.value : '';
  }
  /* Frais connus : nombre (0 = gratuit) ; null = confirmés par e-mail ou sans objet */
  function shippingFee() {
    return selectedMode() === RELAIS_VALUE ? relaisFee() : null;
  }
  function grandTotal() {
    var f = shippingFee();
    return productsTotal() + (f || 0);
  }
  function feeLabel(f) { return f === 0 ? 'Offerts' : euro(f); }
  function lineLabel(l) {
    var d = lineData(l);
    return d.fmt.label + (l.qty > 1 ? ' × ' + l.qty + ' (' + weight(d.grams) + ')' : '');
  }

  /* ---------- rendu ---------- */
  function renderLines() {
    linesBox.textContent = '';
    lines.forEach(function (l, i) {
      var d = lineData(l);
      var row = el('div', 'order-line');

      var imgLink = el('a', 'order-line__img');
      imgLink.href = d.prod.url;
      imgLink.setAttribute('aria-label', 'Voir la fiche ' + d.prod.name);
      var img = el('img');
      img.src = d.prod.image;
      img.alt = '';
      imgLink.appendChild(img);
      row.appendChild(imgLink);

      var info = el('div', 'order-line__info');
      info.appendChild(el('span', 'order-line__family', d.prod.family));
      var name = el('a', 'order-line__name', d.prod.name);
      name.href = d.prod.url;
      info.appendChild(name);
      info.appendChild(el('span', 'order-line__detail', d.prod.detail));

      var formats = el('div', 'order-line__formats');
      formats.setAttribute('role', 'group');
      formats.setAttribute('aria-label', 'Format');
      d.prod.formats.forEach(function (f) {
        var b = el('button', 'order-chip', f.label + ' · ' + euro(f.price));
        b.type = 'button';
        b.setAttribute('aria-pressed', f.id === l.format ? 'true' : 'false');
        b.addEventListener('click', function () { l.format = f.id; render(); });
        formats.appendChild(b);
      });
      info.appendChild(formats);

      if (lines.length > 1) {
        var rm = el('button', 'order-line__remove', 'Retirer');
        rm.type = 'button';
        rm.addEventListener('click', function () { lines.splice(i, 1); render(); });
        info.appendChild(rm);
      }
      row.appendChild(info);

      var qty = el('div', 'order-line__qty');
      var stepper = el('div', 'order-stepper');
      var minus = el('button', 'order-stepper__btn', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Retirer un sachet');
      minus.disabled = l.qty <= 1;
      minus.addEventListener('click', function () { if (l.qty > 1) { l.qty--; render(); } });
      var val = el('span', 'order-stepper__val', String(l.qty));
      val.setAttribute('aria-live', 'polite');
      val.setAttribute('aria-label', l.qty + ' sachet' + (l.qty > 1 ? 's' : '') + ' de ' + d.fmt.label);
      var plus = el('button', 'order-stepper__btn', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Ajouter un sachet');
      plus.disabled = l.qty >= MAX_QTY;
      plus.addEventListener('click', function () { if (l.qty < MAX_QTY) { l.qty++; render(); } });
      stepper.appendChild(minus);
      stepper.appendChild(val);
      stepper.appendChild(plus);
      qty.appendChild(stepper);
      qty.appendChild(el('span', 'order-line__price', euro(d.total)));
      qty.appendChild(el('span', 'order-line__weight', weight(d.grams) + ' au total'));
      row.appendChild(qty);

      linesBox.appendChild(row);
    });
  }

  function renderSummary() {
    sumLines.textContent = '';
    lines.forEach(function (l) {
      var d = lineData(l);
      var li = el('li', 'order__sum-line');
      var left = el('span');
      left.appendChild(el('span', 'order__sum-name', d.prod.name));
      left.appendChild(el('span', 'order__sum-meta', lineLabel(l)));
      li.appendChild(left);
      li.appendChild(el('span', 'order__sum-price', euro(d.total)));
      sumLines.appendChild(li);
    });
    var mode = form.querySelector('input[name="reception"]:checked');
    sumMode.textContent = mode ? mode.parentNode.querySelector('.order__mode-title').textContent : 'À choisir';

    var rf = relaisFee();
    document.getElementById('mode-relais-desc').textContent = 'Mondial Relay, France et Europe · ' + (rf === 0 ? 'frais offerts' : euro(rf));
    var fee = shippingFee();
    var shipRow = document.getElementById('sum-ship-row');
    var note = document.getElementById('sum-note');
    if (fee !== null) {
      shipRow.hidden = false;
      document.getElementById('sum-ship').textContent = feeLabel(fee);
      note.textContent = 'Frais de point relais inclus' + (fee === 0 ? ' (offerts sous 1 kg)' : ' : ' + RELAIS_PRIX_KG + ' € par kilo entamé') + '. Prix définitif confirmé par e-mail.';
    } else {
      shipRow.hidden = true;
      note.textContent = 'Prix définitif confirmé par e-mail.';
    }
    sumTotal.textContent = euro(grandTotal());
  }

  function availableRefs() {
    var used = lines.map(function (l) { return l.ref; });
    return Object.keys(CATALOGUE).filter(function (r) { return used.indexOf(r) === -1; });
  }

  var pickerFamily = 'all';
  function renderPicker() {
    var used = lines.map(function (l) { return l.ref; });
    addBtn.setAttribute('aria-expanded', pickerOpen ? 'true' : 'false');
    addBtn.hidden = pickerOpen;
    picker.hidden = !pickerOpen;
    if (!pickerOpen) return;

    var tabs = document.getElementById('order-picker-tabs');
    tabs.textContent = '';
    [{ id: 'all', name: 'Tout' }].concat(FAMILLES).forEach(function (f) {
      var b = el('button', 'order-chip order-chip--sm', f.name);
      b.type = 'button';
      b.setAttribute('aria-pressed', f.id === pickerFamily ? 'true' : 'false');
      b.addEventListener('click', function () { pickerFamily = f.id; renderPicker(); });
      tabs.appendChild(b);
    });

    pickerGrid.textContent = '';
    Object.keys(CATALOGUE).forEach(function (r) {
      var p = CATALOGUE[r];
      if (pickerFamily !== 'all' && p.familyId !== pickerFamily) return;
      var added = used.indexOf(r) !== -1;
      var b = el('button', 'order-pick');
      b.type = 'button';
      if (added) { b.disabled = true; b.setAttribute('aria-label', p.name + ' (déjà dans votre sélection)'); }
      var media = el('span', 'order-pick__img');
      var img = el('img');
      img.src = p.image;
      img.alt = '';
      img.loading = 'lazy';
      media.appendChild(img);
      if (added) media.appendChild(el('span', 'order-pick__badge', 'Ajouté'));
      b.appendChild(media);
      b.appendChild(el('span', 'order-pick__name', p.name));
      b.addEventListener('click', function () {
        lines.push({ ref: r, format: p.formats[0].id, qty: 1 });
        pickerOpen = false;
        render();
        var rows = linesBox.querySelectorAll('.order-line');
        var last = rows[rows.length - 1];
        if (last) { last.classList.add('is-new'); last.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
      pickerGrid.appendChild(b);
    });
  }

  function render() {
    renderLines();
    renderSummary();
    renderPicker();
  }

  addBtn.addEventListener('click', function () { pickerOpen = true; renderPicker(); picker.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  document.getElementById('order-picker-close').addEventListener('click', function () { pickerOpen = false; renderPicker(); addBtn.focus(); });
  form.querySelectorAll('input[name="reception"]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.getElementById('grp-mode').classList.remove('has-error');
      renderSummary();
    });
  });
  render();

  /* ---------- saisie d'adresse assistée (Base Adresse Nationale, IGN) ----------
     France uniquement ; pour une adresse à l'étranger, le client saisit librement. */
  (function () {
    var API = 'https://data.geopf.fr/geocodage/search';
    var rue = document.getElementById('o-rue');
    var list = document.getElementById('o-rue-list');
    var cp = document.getElementById('o-cp');
    var ville = document.getElementById('o-ville');
    var timer = null, ctrl = null, items = [], active = -1;

    function close() {
      list.hidden = true;
      list.textContent = '';
      items = [];
      active = -1;
      rue.setAttribute('aria-expanded', 'false');
      rue.removeAttribute('aria-activedescendant');
    }
    function highlight(i) {
      var opts = list.querySelectorAll('[role="option"]');
      opts.forEach(function (o, k) { o.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      active = i;
      if (i >= 0 && opts[i]) {
        rue.setAttribute('aria-activedescendant', opts[i].id);
        opts[i].scrollIntoView({ block: 'nearest' });
      } else {
        rue.removeAttribute('aria-activedescendant');
      }
    }
    function choose(p) {
      rue.value = p.name || '';
      cp.value = p.postcode || '';
      ville.value = p.city || '';
      [rue, cp, ville].forEach(function (inp) { inp.closest('.form__group').classList.remove('has-error'); });
      close();
      document.getElementById('o-tel').focus();
    }
    function show(features) {
      list.textContent = '';
      items = features.map(function (f) { return f.properties; });
      if (!items.length) { close(); return; }
      items.forEach(function (p, i) {
        var li = el('li', 'order__addr-opt');
        li.id = 'o-rue-opt-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.appendChild(el('span', 'order__addr-name', p.name));
        li.appendChild(el('span', 'order__addr-city', p.postcode + ' ' + p.city));
        li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(p); });
        list.appendChild(li);
      });
      list.hidden = false;
      rue.setAttribute('aria-expanded', 'true');
      active = -1;
    }
    function search(q) {
      if (ctrl) ctrl.abort();
      ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var url = API + '?q=' + encodeURIComponent(q) + '&autocomplete=1&limit=5&index=address';
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.ok ? r.json() : { features: [] }; })
        .then(function (d) {
          if (rue.value.trim() !== q) return;
          show((d.features || []).filter(function (f) {
            var t = f.properties && f.properties.type;
            return t === 'housenumber' || t === 'street' || t === 'locality';
          }));
        })
        .catch(function () { /* service indisponible : saisie libre */ });
    }
    rue.addEventListener('input', function () {
      clearTimeout(timer);
      var q = rue.value.trim();
      if (q.length < 4) { close(); return; }
      timer = setTimeout(function () { search(q); }, 250);
    });
    rue.addEventListener('keydown', function (e) {
      if (list.hidden || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight((active + 1) % items.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active <= 0 ? items.length - 1 : active - 1); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(items[active]); }
      else if (e.key === 'Escape') { close(); }
    });
    rue.addEventListener('blur', function () { setTimeout(close, 150); });
  })();

  /* ---------- téléphone : espaces automatiques (06 12 34 56 78 / +33 6 12 34 56 78) ---------- */
  (function () {
    var tel = document.getElementById('o-tel');
    function format(v) {
      var plus = v.trim().charAt(0) === '+';
      var d = v.replace(/\D/g, '');
      if (plus) {
        if (d.indexOf('33') === 0) {
          d = d.slice(0, 11);
          var rest = d.slice(3).replace(/(\d{2})(?=\d)/g, '$1 ');
          return ('+33' + (d.length > 2 ? ' ' + d.charAt(2) : '') + (rest ? ' ' + rest : '')).trim();
        }
        return '+' + d.slice(0, 15).replace(/(\d{2})(?=\d)/g, '$1 ');
      }
      return d.slice(0, 10).replace(/(\d{2})(?=\d)/g, '$1 ');
    }
    var prev = tel.value;
    function digits(v) { return v.replace(/[^\d+]/g, '').length; }
    tel.addEventListener('input', function (e) {
      var v = tel.value;
      var pos = tel.selectionStart == null ? v.length : tel.selectionStart;
      var before = digits(v.slice(0, pos));
      /* Retour arrière sur un espace : on efface aussi le chiffre qui le précède */
      if (e.inputType === 'deleteContentBackward' && digits(v) === digits(prev) && before > 0) {
        var count = 0;
        for (var i = 0; i < v.length; i++) {
          if (/[\d+]/.test(v.charAt(i)) && ++count === before) { v = v.slice(0, i) + v.slice(i + 1); before--; break; }
        }
      }
      var out = format(v);
      tel.value = out;
      prev = out;
      var n = 0, p = 0;
      while (p < out.length && n < before) { if (/[\d+]/.test(out.charAt(p))) n++; p++; }
      try { tel.setSelectionRange(p, p); } catch (err) { /* sélection non prise en charge */ }
    });
  })();

  /* ---------- validation ---------- */
  function setErr(group, show) {
    group.classList.toggle('has-error', show);
    return !show;
  }
  function validate() {
    var ok = true;
    var nom = document.getElementById('o-nom');
    ['o-prenom', 'o-rue', 'o-ville'].forEach(function (id) {
      var inp = document.getElementById(id);
      ok = setErr(inp.closest('.form__group'), !inp.value.trim()) && ok;
    });
    var cp = document.getElementById('o-cp');
    ok = setErr(cp.closest('.form__group'), !/^[A-Za-z0-9 -]{4,10}$/.test(cp.value.trim())) && ok;
    var tel = document.getElementById('o-tel');
    var email = document.getElementById('o-email');
    ok = setErr(document.getElementById('grp-mode'), !form.querySelector('input[name="reception"]:checked')) && ok;
    ok = setErr(dateInput.closest('.form__group'), !dateInput.value || dateInput.value < minIso) && ok;
    ok = setErr(nom.closest('.form__group'), !nom.value.trim()) && ok;
    ok = setErr(tel.closest('.form__group'), tel.value.replace(/\D/g, '').length < 9) && ok;
    ok = setErr(email.closest('.form__group'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    return ok;
  }
  form.querySelectorAll('.form__input').forEach(function (inp) {
    inp.addEventListener('input', function () { inp.closest('.form__group').classList.remove('has-error'); });
  });

  /* ---------- confirmation ---------- */
  function showDone(data) {
    var done = document.getElementById('order-done');
    var list = document.getElementById('done-lines');
    list.textContent = '';
    lines.forEach(function (l) {
      var d = lineData(l);
      var li = el('li', 'order__sum-line');
      var left = el('span');
      left.appendChild(el('span', 'order__sum-name', d.prod.name));
      left.appendChild(el('span', 'order__sum-meta', lineLabel(l)));
      li.appendChild(left);
      li.appendChild(el('span', 'order__sum-price', euro(d.total)));
      list.appendChild(li);
    });
    document.getElementById('done-mode').textContent = data.modeShort;
    document.getElementById('done-date').textContent = longDate(data.date);
    var fee = shippingFee();
    document.getElementById('done-ship-row').hidden = fee === null;
    if (fee !== null) document.getElementById('done-ship').textContent = feeLabel(fee);
    document.getElementById('done-total').textContent = euro(grandTotal());
    document.getElementById('done-text').textContent = AUTORESPONSE_ACTIVE
      ? 'Un e-mail de confirmation vient de vous être envoyé à ' + data.email + '. Nous revenons vers vous sous 48 heures pour confirmer la disponibilité, le prix et la date de réception.'
      : 'Nous revenons vers vous à ' + data.email + ' sous 48 heures pour confirmer la disponibilité, le prix et la date de réception.';
    document.getElementById('order-view').hidden = true;
    done.hidden = false;
    window.scrollTo(0, 0);
    done.focus();
  }

  /* ---------- envoi ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var formErr = document.getElementById('order-form-error');
    var sendErr = document.getElementById('order-send-error');
    sendErr.hidden = true;
    if (!validate()) {
      formErr.hidden = false;
      var first = form.querySelector('.has-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    formErr.hidden = true;

    var modeInput = form.querySelector('input[name="reception"]:checked');
    var data = {
      prenom: document.getElementById('o-prenom').value.trim(),
      nom: document.getElementById('o-nom').value.trim(),
      rue: document.getElementById('o-rue').value.trim(),
      cp: document.getElementById('o-cp').value.trim(),
      ville: document.getElementById('o-ville').value.trim(),
      tel: document.getElementById('o-tel').value.trim(),
      email: document.getElementById('o-email').value.trim(),
      date: dateInput.value,
      mode: modeInput.value,
      modeShort: modeInput.parentNode.querySelector('.order__mode-title').textContent
    };

    if (document.getElementById('o-company').value) {
      showDone(data); /* robot : faux succès, rien n'est envoyé */
      return;
    }

    var detail = lines.map(function (l) {
      var d = lineData(l);
      return '• ' + d.prod.name + ' — ' + lineLabel(l) + ' — ' + euro(d.total);
    }).join('\n');
    var first = lineData(lines[0]);

    var payload = {
      _subject: 'Nouvelle commande — ' + first.prod.name + (lines.length > 1 ? ' + ' + (lines.length - 1) + ' autre(s)' : '') + ' — ' + data.prenom + ' ' + data.nom,
      'Prénom': data.prenom,
      'Nom': data.nom,
      email: data.email,
      'Téléphone': data.tel,
      'Adresse': data.rue + ', ' + data.cp + ' ' + data.ville,
      'Commande': detail,
      'Frais de livraison': shippingFee() === null ? 'Aucun (retrait en boutique)' : feeLabel(shippingFee()) + ' (point relais, ' + weight(totalGrams()) + ')',
      'Total indicatif': euro(grandTotal()) + (shippingFee() === null ? '' : ' (frais de point relais inclus)'),
      'Mode de réception': data.mode,
      'Date souhaitée': longDate(data.date) + ' (' + data.date + ')',
      'Photo du produit': new URL(first.prod.image, window.location.href).href,
      'Fiche produit': new URL(first.prod.url, window.location.href).href,
      _gotcha: ''
    };

    var btn = form.querySelector('.order__submit');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('send');
        showDone(data);
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Commander';
        sendErr.hidden = false;
      });
  });
})();

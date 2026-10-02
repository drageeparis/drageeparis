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

  var LEAD_DAYS = 15;   /* délai de préparation */
  var MAX_QTY = 50;     /* nombre maximal de sachets par ligne */

  var CATALOGUE = {
    'avola-eminence': {
      name: 'Dragées Avola Éminence',
      family: 'Amandes Avola',
      familyUrl: 'dragees.html?filter=avola',
      detail: 'Calibre 37 · Amandes Avola de Sicile',
      url: 'produit-avola-eminence.html',
      image: 'images/amandes-avola/avola-eminence-800w.webp',
      formats: [
        { id: '500g', label: '500 g', grams: 500, price: 34 },
        { id: '1kg', label: '1 kg', grams: 1000, price: 68.5 }
      ]
    }
  };

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
  document.getElementById('o-date-help').textContent = 'Délai de préparation : ' + LEAD_DAYS + ' jours. Dates possibles à partir du ' + longDate(minIso) + '.';
  document.getElementById('err-date-min').textContent = longDate(minIso);

  /* ---------- calculs ---------- */
  function lineData(l) {
    var p = CATALOGUE[l.ref];
    var f = findFormat(p, l.format);
    return { prod: p, fmt: f, total: f.price * l.qty, grams: f.grams * l.qty };
  }
  function grandTotal() {
    return lines.reduce(function (s, l) { return s + lineData(l).total; }, 0);
  }
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
    sumTotal.textContent = euro(grandTotal());
    var mode = form.querySelector('input[name="reception"]:checked');
    sumMode.textContent = mode ? mode.parentNode.querySelector('.order__mode-title').textContent : 'À choisir';
  }

  function availableRefs() {
    var used = lines.map(function (l) { return l.ref; });
    return Object.keys(CATALOGUE).filter(function (r) { return used.indexOf(r) === -1; });
  }

  function renderPicker() {
    var refs = availableRefs();
    addBtn.hidden = refs.length === 0;
    picker.hidden = !pickerOpen || refs.length === 0;
    addBtn.setAttribute('aria-expanded', pickerOpen ? 'true' : 'false');
    pickerGrid.textContent = '';
    refs.forEach(function (r) {
      var p = CATALOGUE[r];
      var b = el('button', 'order-pick');
      b.type = 'button';
      var img = el('img');
      img.src = p.image;
      img.alt = '';
      b.appendChild(img);
      var txt = el('span', 'order-pick__txt');
      txt.appendChild(el('span', 'order-line__family', p.family));
      txt.appendChild(el('span', 'order-pick__name', p.name));
      txt.appendChild(el('span', 'order-line__detail', 'À partir de ' + euro(p.formats[0].price)));
      b.appendChild(txt);
      b.addEventListener('click', function () {
        lines.push({ ref: r, format: p.formats[0].id, qty: 1 });
        pickerOpen = false;
        render();
      });
      pickerGrid.appendChild(b);
    });
  }

  function render() {
    renderLines();
    renderSummary();
    renderPicker();
  }

  addBtn.addEventListener('click', function () { pickerOpen = !pickerOpen; renderPicker(); });
  form.querySelectorAll('input[name="reception"]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.getElementById('grp-mode').classList.remove('has-error');
      renderSummary();
    });
  });
  render();

  /* ---------- validation ---------- */
  function setErr(group, show) {
    group.classList.toggle('has-error', show);
    return !show;
  }
  function validate() {
    var ok = true;
    var nom = document.getElementById('o-nom');
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
      nom: document.getElementById('o-nom').value.trim(),
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
      _subject: 'Nouvelle commande — ' + first.prod.name + (lines.length > 1 ? ' + ' + (lines.length - 1) + ' autre(s)' : '') + ' — ' + data.nom,
      'Nom': data.nom,
      email: data.email,
      'Téléphone': data.tel,
      'Commande': detail,
      'Total indicatif': euro(grandTotal()),
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

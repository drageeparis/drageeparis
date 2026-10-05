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

  var LEAD_DAYS = 10;   /* dragées : délai maximal (5 à 10 jours) = première date proposée */
  var LEAD_LABEL = '5 à 10 jours';
  var CREA_LEAD_DAYS = 28;  /* créations : 4 à 6 semaines */
  var CREA_LEAD_LABEL = '4 à 6 semaines';
  var MAX_QTY_CREA = 2000;  /* nombre maximal de pièces par création */

  /* Frais point relais (Mondial Relay) : gratuits sous 1 kg,
     puis RELAIS_PRIX_KG € par kilo entamé (1 kg = 12 €, 1,5 kg = 24 €, 2 kg = 24 €, 3 kg = 36 €…). */
  var RELAIS_VALUE = 'Livraison en point relais (Mondial Relay)';
  var RELAIS_PRIX_KG = 12;
  var MAX_QTY = 50;     /* nombre maximal de sachets par ligne */

  /* Catalogue généré depuis les fiches produit : commande-catalogue.js (outils/catalogue-commande.py) */
  var CATALOGUE = window.DP_CATALOGUE || {};
  var FAMILLES = window.DP_FAMILLES || [];

  /* Version anglaise (/en/) : textes traduits ; la commande envoyée à l'atelier reste en français */
  var EN = document.documentElement.lang === 'en';
  var IN_EN_DIR = EN; /* les images du catalogue sont à la racine du site */
  function T(fr, en) { return EN ? en : fr; }
  function pn(p) { return EN && p.name_en ? p.name_en : p.name; }
  function pf(p) { return EN && p.family_en ? p.family_en : p.family; }
  function pd(p) { return EN && p.detail_en ? p.detail_en : p.detail; }
  function fl(f) { return EN && f.label_en ? f.label_en : f.label; }
  function famName(f) { return EN && f.name_en ? f.name_en : f.name; }
  function img(src) { return (IN_EN_DIR && !/^(\/|https?:)/.test(src) ? '../' : '') + src; }

  var MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MOIS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* ---------- utilitaires ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function euro(v) {
    var s = (Math.round(v * 100) / 100).toFixed(2);
    if (EN) return '€' + s.replace(/\.00$/, '');
    return s.replace('.', ',').replace(/,00$/, '') + ' €';
  }
  function weight(g) {
    return g >= 1000 ? (EN ? String(g / 1000) : String(g / 1000).replace('.', ',')) + ' kg' : g + ' g';
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function longDate(iso) {
    var p = iso.split('-');
    return parseInt(p[2], 10) + ' ' + (EN ? MOIS_EN : MOIS_FR)[parseInt(p[1], 10) - 1] + ' ' + p[0];
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
  crumb.textContent = pf(firstProd);
  crumb.setAttribute('href', firstProd.familyUrl);
  if (firstProd.kind === 'creation') {
    var root = document.getElementById('crumb-root');
    root.textContent = T('Les créations', 'Our creations');
    root.setAttribute('href', 'creations.html');
  }

  function isCrea(ref) { return CATALOGUE[ref] && CATALOGUE[ref].kind === 'creation'; }
  function hasCreation() { return lines.some(function (l) { return isCrea(l.ref); }); }

  /* ---------- date minimale (dépend du contenu : dragées 5 à 10 jours, créations 4 à 6 semaines) ---------- */
  var minIso = '';
  function updateLead() {
    var crea = hasCreation();
    var d = new Date();
    d.setDate(d.getDate() + (crea ? CREA_LEAD_DAYS : LEAD_DAYS));
    minIso = isoDate(d);
    dateInput.setAttribute('min', minIso);
    document.getElementById('o-date-help').textContent = EN
      ? 'Preparation time: ' + (crea ? '4 to 6 weeks' : '5 to 10 days') + '. Dates available from ' + longDate(minIso) + '.'
      : 'Délai de préparation : ' + (crea ? CREA_LEAD_LABEL : LEAD_LABEL) + '. Dates possibles à partir du ' + longDate(minIso) + '.';
    document.getElementById('err-date-min').textContent = longDate(minIso);
  }
  updateLead();

  /* ---------- Boîtes à nombre de dragées au choix ----------
     Prix de la pièce = boîte (sans dragées) + prix par dragée × nombre choisi. À compléter ici pour d'autres modèles. */
  var DG_AU_CHOIX = {
    'bapteme-eucalyptus': { min: 5, max: 15, base: 3.5, parDragee: 0.1 }
  };
  function dgChoix(l) { return DG_AU_CHOIX[l.ref] && !/^sans/i.test(l.format || '') ? DG_AU_CHOIX[l.ref] : null; }
  /* Nombre facturé = dragées choisies, au minimum c.min (incluses dans le prix de base) */
  function dgNombre(l) {
    var c = dgChoix(l); if (!c) return 0;
    var g = l.dg, n = g ? g.order.reduce(function (s, r) { return s + (g.qty[r] || 0); }, 0) : 0;
    return Math.max(c.min, Math.min(c.max, n));
  }
  /* Moins que le minimum choisi (hors « pas encore choisi ») */
  function dgSousMin(l) {
    var c = dgChoix(l); if (!c) return false;
    if (!l.dg) return true;
    var n = l.dg.order.reduce(function (s, r) { return s + (l.dg.qty[r] || 0); }, 0);
    return n < c.min;
  }

  /* ---------- calculs ---------- */
  /* Remises dégressives sur les créations (par modèle), du palier le plus haut au plus bas : à compléter ici */
  var REMISES_CREA = [{ des: 100, taux: 0.10 }];
  function remiseCrea(n) { for (var i = 0; i < REMISES_CREA.length; i++) if (n >= REMISES_CREA[i].des) return REMISES_CREA[i].taux; return 0; }
  function lineData(l) {
    var p = CATALOGUE[l.ref];
    var f = findFormat(p, l.format);
    var c = dgChoix(l);
    if (c) {
      var n = dgNombre(l);
      f = { id: f.id, label: 'Avec ' + n + ' dragées', label_en: 'With ' + n + ' dragées', price: Math.round((c.base + c.parDragee * n) * 100) / 100 };
    }
    var crea = p.kind === 'creation';
    var brut = f.price == null ? null : f.price * l.qty;
    var remise = crea && brut != null ? remiseCrea(l.qty) : 0; // remise dégressive sur les créations
    var total = brut == null ? null : Math.round(brut * (1 - remise) * 100) / 100;
    return { prod: p, fmt: f, crea: crea, brut: brut, remise: remise, total: total, grams: f.grams ? f.grams * l.qty : 0 };
  }
  function productsTotal() {
    return lines.reduce(function (s, l) { return s + (lineData(l).total || 0); }, 0);
  }
  function hasDevis() { return lines.some(function (l) { return lineData(l).total == null; }); }
  function totalGrams() {
    return lines.reduce(function (s, l) { return s + lineData(l).grams; }, 0);
  }
  function relaisFee() {
    if (hasCreation()) return 'tbd'; /* créations : frais confirmés par e-mail */
    var g = totalGrams();
    return g < 1000 ? 0 : RELAIS_PRIX_KG * Math.ceil(g / 1000);
  }
  function selectedMode() {
    var m = form.querySelector('input[name="reception"]:checked');
    return m ? m.value : '';
  }
  /* Frais : nombre (0 = offerts) ; 'tbd' = confirmés par e-mail ; null = sans objet (retrait / mode non choisi) */
  function shippingFee() {
    return selectedMode() === RELAIS_VALUE ? relaisFee() : null;
  }
  function grandTotal() {
    var f = shippingFee();
    return productsTotal() + (typeof f === 'number' ? f : 0);
  }
  function totalLabel() { return euro(grandTotal()) + (hasDevis() ? T(' + devis', ' + quotation') : ''); }
  function feeLabel(f) { return f === 'tbd' ? T('Confirmés par e-mail', 'Confirmed by email') : f === 0 ? T('Offerts', 'Free') : euro(f); }
  function pieces(n) { return n + T(' pièce', ' piece') + (n > 1 ? 's' : ''); }
  function lineLabel(l) {
    var d = lineData(l);
    if (d.crea) return (d.fmt.price == null ? '' : fl(d.fmt) + ' × ') + pieces(l.qty);
    return fl(d.fmt) + (l.qty > 1 ? ' × ' + l.qty + ' (' + weight(d.grams) + ')' : '');
  }
  function linePrice(d) { return d.total == null ? T('Sur devis', 'On quotation') : euro(d.total); }
  function chipLabel(f) { return f.price == null ? fl(f) : fl(f) + ' · ' + (f.from ? T('dès ', 'from ') : '') + euro(f.price); }

  /* ---------- personnalisation des créations : un ou deux prénoms + une date ou un nom ---------- */
  function persoOf(l) {
    if (!l.perso) l.perso = { mode: 'un', n1: '', n2: '', extra: '' };
    return l.perso;
  }
  function persoText(l) {
    var p = persoOf(l);
    var names = p.mode === 'deux' ? [p.n1, p.n2].filter(Boolean).join(' & ') : p.n1;
    return [names, p.extra].filter(Boolean).join(' — ');
  }
  function persoField(label, value, placeholder, max, onInput, id) {
    var wrap = el('div', 'order-perso__field');
    var lab = el('label', 'order-perso__label', label);
    lab.setAttribute('for', id);
    var inp = el('input', 'order-perso__input');
    inp.type = 'text';
    inp.id = id;
    inp.maxLength = max;
    inp.autocomplete = 'off';
    inp.placeholder = placeholder;
    inp.value = value;
    inp.addEventListener('input', function () { onInput(inp.value.trim()); renderSummary(); });
    wrap.appendChild(lab);
    wrap.appendChild(inp);
    return wrap;
  }
  function persoBlock(l, i) {
    var p = persoOf(l);
    var box = el('div', 'order-perso');
    box.appendChild(el('p', 'order-perso__title', T('Texte de l\u2019étiquette', 'Label text')));
    var modes = el('div', 'order-perso__modes');
    modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', T('Nombre de prénoms', 'Number of names'));
    [['un', T('Un prénom ou nom', 'One name')], ['deux', T('Deux prénoms', 'Two names')]].forEach(function (m) {
      var b = el('button', 'order-chip order-chip--sm', m[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', p.mode === m[0] ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (p.mode === m[0]) return;
        p.mode = m[0];
        render();
        var f = document.getElementById('perso-' + i + '-n' + (m[0] === 'deux' ? '2' : '1'));
        if (f) f.focus();
      });
      modes.appendChild(b);
    });
    box.appendChild(modes);
    var grid = el('div', 'order-perso__grid' + (p.mode === 'deux' ? ' is-deux' : ''));
    grid.appendChild(persoField(p.mode === 'deux' ? T('Premier prénom', 'First name') : T('Prénom ou nom', 'Name'), p.n1, p.mode === 'deux' ? T('Ex. : Camille', 'e.g. Camille') : T('Ex. : Camille ou Famille Martin', 'e.g. Camille or The Martin Family'), 24, function (v) { p.n1 = v; }, 'perso-' + i + '-n1'));
    if (p.mode === 'deux') {
      grid.appendChild(el('span', 'order-perso__amp', '&'));
      grid.appendChild(persoField(T('Second prénom', 'Second name'), p.n2, T('Ex. : Louis', 'e.g. Louis'), 24, function (v) { p.n2 = v; }, 'perso-' + i + '-n2'));
    }
    box.appendChild(grid);
    box.appendChild(persoField(T('Date ou nom (facultatif)', 'Date or name (optional)'), p.extra, T('Ex. : 14.06.2027 ou Baptême de Léa', 'e.g. 14.06.2027 or Léa’s Christening'), 32, function (v) { p.extra = v; }, 'perso-' + i + '-extra'));
    return box;
  }

  /* ---------- choix des dragées d'une création (même présentation que « Lancer ma création ») ---------- */
  var DG_MAX = 10;        /* dragées au total par pièce */
  var DG_MAX_COLORS = 3;  /* couleurs différentes au maximum */
  var DG_CATS = [
    { id: 'chocolats', name: T('Chocolats', 'Chocolate dragées') },
    { id: 'avola', name: T('Amandes Avola', 'Avola almonds') },
    { id: 'traditionnelles', name: T('Amandes traditionnelles', 'Traditional almonds') }
  ];
  var DG_PREFIX = /^(Dragées Chocolat |Prali Amande Chocolat Noir |Prali Amande Chocolat au Lait |Dragées Avola |Dragées Amande Traditionnelle )/;
  var DG_PREFIX_EN = /^Prali Amande (Milk|Dark) Chocolate | Chocolate Dragées$| Avola Dragées$| Traditional Almond Dragées$/g;
  function isMilk(p) { return /au Lait/.test(p.name); }
  function dgShort(ref) {
    var p = CATALOGUE[ref];
    if (EN && p.name_en) { var e = p.name_en.replace(DG_PREFIX_EN, '').trim(); return e.charAt(0).toUpperCase() + e.slice(1).toLowerCase(); }
    var n = p.name.replace(DG_PREFIX, '');
    if (n === 'Nature') n = 'Chocolat nature';
    return n.charAt(0) + n.slice(1).toLowerCase();
  }
  function dgSub(ref) {
    var p = CATALOGUE[ref];
    if (p.familyId !== 'gourmandes') return '';
    return isMilk(p) ? T('Chocolat au lait', 'Milk chocolate') : T('Chocolat noir 70 %', '70% dark chocolate');
  }
  function dgLabel(ref) {
    var p = CATALOGUE[ref], sub = dgSub(ref);
    if (EN) {
      var short = dgShort(ref);
      return { chocolats: short + ' chocolate', gourmandes: 'Prali Amande ' + (isMilk(p) ? 'milk' : 'dark') + ' ' + short.toLowerCase(), avola: 'Avola ' + short, traditionnelles: 'Traditional ' + short }[p.familyId] || short;
    }
    var fam = { chocolats: 'Chocolat', gourmandes: 'Prali amande ' + sub.replace(' 70 %', '').toLowerCase(), avola: 'Avola', traditionnelles: 'Amande traditionnelle' }[p.familyId] || '';
    return (fam + ' ' + dgShort(ref).toLowerCase()).trim();
  }
  function dgRefs(cat) {
    var refs = Object.keys(CATALOGUE).filter(function (r) { return CATALOGUE[r].kind === 'dragee' && CATALOGUE[r].familyId === cat; });
    if (cat === 'gourmandes') refs.sort(function (a, b) { return isMilk(CATALOGUE[a]) - isMilk(CATALOGUE[b]); });
    return refs;
  }
  function wantsDragees(l) { return !/^sans/i.test(l.format || ''); }
  function dgOf(l) {
    if (!l.dg) l.dg = { tab: 'chocolats', order: [], qty: {} };
    return l.dg;
  }
  /* Bouquets : 1 dragée par pétale (petit 5, moyen 7, grand 10) */
  var BQ_MAX = { petitbouquet: 5, moyenbouquet: 7, grandbouquet: 10 };
  function dgMax(l) { return (l && dgChoix(l) && dgChoix(l).max) || (l && BQ_MAX[l.format]) || DG_MAX; }
  function dgTotal(g) { return g.order.reduce(function (s, r) { return s + (g.qty[r] || 0); }, 0); }
  function dgCat(g) { return g.order.length ? CATALOGUE[g.order[0]].familyId : ''; }
  function dgText(l) {
    var g = dgOf(l);
    if (!g.order.length) return '';
    return g.order.map(function (r) { return dgLabel(r) + ' ×' + g.qty[r]; }).join(', ') + ' (' + dgTotal(g) + '/' + dgMax(l) + ')';
  }
  /* preventScroll : le navigateur ne fait pas défiler la page vers l'élément */
  function refocus(id) { var f = document.getElementById(id); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
  /* Bouquets : uniquement des dragées au chocolat */
  function isBouquet(ref) { var p = CATALOGUE[ref]; return !!p && p.familyId === 'bouquets' && /bouquet/.test(ref); }
  function dgBlock(l, i) {
    var g = dgOf(l), MAX = dgMax(l);
    /* Taille réduite (ex. grand -> petit) : on retire les dragées en trop */
    while (dgTotal(g) > MAX && g.order.length) {
      var last = g.order[g.order.length - 1];
      if (--g.qty[last] <= 0) { delete g.qty[last]; g.order.pop(); }
    }
    var cat = dgCat(g), tot = dgTotal(g);
    var onlyChoco = isBouquet(l.ref);
    if (onlyChoco) g.tab = 'chocolats';
    var fullColors = g.order.length >= DG_MAX_COLORS, fullQty = tot >= MAX;
    var box = el('div', 'order-perso order-dg');
    var head = el('p', 'order-perso__title cfg-colors__head');
    head.appendChild(el('span', '', onlyChoco ? T('Vos dragées au chocolat', 'Your chocolate dragées') : T('Vos dragées', 'Your dragées')));
    head.appendChild(el('span', 'cfg-colors__count' + (fullQty ? ' is-full' : ''), tot + ' / ' + MAX));
    box.appendChild(head);

    var choix = dgChoix(l);
    if (choix) {
      var reste = choix.min - tot;
      if (reste > 0) {
        box.appendChild(el('p', 'order-dg__min', T('Sélectionnez au moins ' + choix.min + ' dragées pour passer commande' + (tot ? ' : encore ' + reste + ' à choisir.' : '.'), 'Select at least ' + choix.min + ' dragées to place your order' + (tot ? ': ' + reste + ' more to choose.' : '.'))));
      } else {
        box.appendChild(el('p', 'order-dg__ok', T('Minimum atteint. Vous pouvez ajouter des dragées jusqu\'à ' + choix.max + '.', 'Minimum reached. You can add dragées up to ' + choix.max + '.')));
      }
      box.appendChild(el('p', 'wizard__hint', T(choix.min + ' dragées incluses dans le prix. Au-delà, jusqu\'à ' + choix.max + ' dragées par boîte : + ' + euro(choix.parDragee) + ' par dragée supplémentaire.', choix.min + ' dragées included in the price. Beyond that, up to ' + choix.max + ' per box: + ' + euro(choix.parDragee) + ' per extra dragée.')));
    }

    var tabs = el('div', 'cfg-dg-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', T('Catégories de dragées', 'Dragée categories'));
    DG_CATS.forEach(function (c) {
      var t = el('button', 'cfg-dg-tab', c.name);
      t.type = 'button';
      t.id = 'dgtab-' + i + '-' + c.id;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', g.tab === c.id ? 'true' : 'false');
      var n = g.order.filter(function (r) { return CATALOGUE[r].familyId === c.id; }).length;
      t.appendChild(el('span', 'cfg-dg-tab__n', n ? String(n) : ''));
      t.addEventListener('click', function () { g.tab = c.id; render(); refocus(t.id); });
      tabs.appendChild(t);
    });
    if (!onlyChoco) box.appendChild(tabs);

    var panel = el('div', 'wizard__colors wizard__colors--choco cfg-dg-panel');
    panel.setAttribute('role', 'tabpanel');
    var sub = null;
    dgRefs(g.tab).forEach(function (r) {
      var s = dgSub(r);
      if (s && s !== sub) { sub = s; panel.appendChild(el('p', 'cfg-dg-sub', s)); }
      var item = el('label', 'wizard__color-item');
      var cb = el('input');
      cb.type = 'checkbox';
      cb.id = 'dg-' + i + '-' + r;
      cb.checked = g.order.indexOf(r) !== -1;
      cb.disabled = !cb.checked && (fullColors || fullQty || (!!cat && cat !== g.tab));
      var tipTxt = '';
      if (!cb.checked && !!cat && cat !== g.tab) tipTxt = T('Une seule catégorie par création : vous avez choisi des « ' + DG_CATS.filter(function (c) { return c.id === cat; })[0].name + ' ». Retirez-les pour choisir dans cette catégorie.', 'One category per creation: you have chosen “' + DG_CATS.filter(function (c) { return c.id === cat; })[0].name + '”. Remove them to choose from this category.');
      else if (!cb.checked && fullColors) tipTxt = T('Trois couleurs maximum : retirez-en une pour choisir celle-ci.', 'Three colours maximum: remove one to choose this one.');
      else if (!cb.checked && fullQty) tipTxt = T('Maximum atteint : diminuez une quantité pour ajouter cette couleur.', 'Maximum reached: reduce a quantity to add this colour.');
      cb.addEventListener('change', function () {
        if (cb.checked) { g.order.push(r); g.qty[r] = 1; }
        else { g.order = g.order.filter(function (x) { return x !== r; }); delete g.qty[r]; }
        render(); refocus(cb.id);
      });
      var sw = el('div', 'wizard__color-swatch');
      var bg = el('span', 'wizard__color-swatch-bg');
      bg.style.background = "#F3F1EC url('" + img(CATALOGUE[r].image) + "') center/185% no-repeat";
      sw.appendChild(bg);
      sw.appendChild(el('span', 'wizard__color-swatch-name', dgShort(r)));
      item.appendChild(cb);
      item.appendChild(sw);
      if (tipTxt) {
        item.setAttribute('data-tip', tipTxt);
        item.addEventListener('mouseenter', function () { var r = item.getBoundingClientRect(), m = r.left + r.width / 2; item.classList.toggle('tip-left', m < 140); item.classList.toggle('tip-right', m > window.innerWidth - 140); });
        item.addEventListener('click', function () { item.classList.add('is-tip'); setTimeout(function () { item.classList.remove('is-tip'); }, 2800); });
      }
      panel.appendChild(item);
    });
    box.appendChild(panel);

    if (cat && cat !== g.tab) {
      var catName = DG_CATS.filter(function (c) { return c.id === cat; })[0].name;
      box.appendChild(el('p', 'wizard__hint', T('Une seule catégorie par création : retirez vos « ' + catName + ' » pour choisir dans une autre.', 'One category per creation: remove your “' + catName + '” to choose from another.')));
    }
    if (fullColors || fullQty) {
      box.appendChild(el('p', 'wizard__hint', fullQty ? T('Maximum atteint : ' + MAX + ' dragées. Diminuez une quantité pour ajouter une couleur.', 'Maximum reached: ' + MAX + ' dragées. Reduce a quantity to add a colour.') : T('Trois couleurs maximum : retirez-en une pour en choisir une autre.', 'Three colours maximum: remove one to choose another.')));
    }

    if (g.order.length) {
      var list = el('ul', 'cfg-qty__list');
      g.order.forEach(function (r) {
        var li = el('li', 'cfg-qty__row');
        var dot = el('span', 'cfg-qty__dot');
        dot.style.background = "#F3F1EC url('" + img(CATALOGUE[r].image) + "') center/185% no-repeat";
        li.appendChild(dot);
        li.appendChild(el('span', 'cfg-qty__name', dgShort(r) + (dgSub(r) ? ' · ' + dgSub(r).toLowerCase() : '')));
        var step = el('div', 'cfg-qty__step');
        var mi = el('button', 'cfg-qty__btn', '−');
        mi.type = 'button'; mi.id = 'dgm-' + i + '-' + r;
        mi.setAttribute('aria-label', T('Une de moins', 'One less'));
        var plancher = function () { return g.qty[r] <= 1; };
        mi.disabled = plancher();
        mi.addEventListener('click', function () { if (!plancher()) { g.qty[r]--; render(); refocus(mi.id); } });
        var out = el('output', 'cfg-qty__n', String(g.qty[r]));
        var pl = el('button', 'cfg-qty__btn', '+');
        pl.type = 'button'; pl.id = 'dgp-' + i + '-' + r;
        pl.setAttribute('aria-label', T('Une de plus', 'One more'));
        pl.disabled = fullQty;
        pl.addEventListener('click', function () { if (dgTotal(g) < MAX) { g.qty[r]++; render(); refocus(pl.id); } });
        step.appendChild(mi); step.appendChild(out); step.appendChild(pl);
        li.appendChild(step);
        var del = el('button', 'cfg-qty__del', '×');
        del.type = 'button';
        del.setAttribute('aria-label', T('Retirer ', 'Remove ') + dgShort(r));
        del.addEventListener('click', function () { g.order = g.order.filter(function (x) { return x !== r; }); delete g.qty[r]; render(); });
        li.appendChild(del);
        list.appendChild(li);
      });
      box.appendChild(list);
    }
    return box;
  }

  /* ---------- rendu ---------- */
  function renderLines() {
    linesBox.textContent = '';
    lines.forEach(function (l, i) {
      var d = lineData(l);
      var row = el('div', 'order-line');

      var imgLink = el('a', 'order-line__img');
      imgLink.href = d.prod.url;
      imgLink.setAttribute('aria-label', T('Voir la fiche ', 'View ') + pn(d.prod));
      var im = el('img');
      im.src = img(d.prod.image);
      im.alt = '';
      imgLink.appendChild(im);
      row.appendChild(imgLink);

      var info = el('div', 'order-line__info');
      info.appendChild(el('span', 'order-line__family', pf(d.prod)));
      var name = el('a', 'order-line__name', pn(d.prod));
      name.href = d.prod.url;
      info.appendChild(name);
      info.appendChild(el('span', 'order-line__detail', pd(d.prod)));

      var formats = el('div', 'order-line__formats');
      formats.setAttribute('role', 'group');
      formats.setAttribute('aria-label', 'Format');
      d.prod.formats.forEach(function (f) {
        var b = el('button', 'order-chip', chipLabel(f));
        b.type = 'button';
        b.setAttribute('aria-pressed', f.id === l.format ? 'true' : 'false');
        b.addEventListener('click', function () { l.format = f.id; render(); });
        formats.appendChild(b);
      });
      if (!(d.prod.formats.length === 1 && d.prod.formats[0].price == null)) info.appendChild(formats);

      if (lines.length > 1) {
        var rm = el('button', 'order-line__remove', T('Retirer', 'Remove'));
        rm.type = 'button';
        rm.addEventListener('click', function () { lines.splice(i, 1); render(); });
        info.appendChild(rm);
      }
      row.appendChild(info);

      var qty = el('div', 'order-line__qty');
      var stepper = el('div', 'order-stepper');
      var max = d.crea ? MAX_QTY_CREA : MAX_QTY;
      var minus = el('button', 'order-stepper__btn', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', d.crea ? T('Retirer une pièce', 'Remove one piece') : T('Retirer un sachet', 'Remove one bag'));
      minus.disabled = l.qty <= 1;
      minus.addEventListener('click', function () { if (l.qty > 1) { l.qty--; render(); } });
      var val;
      if (d.crea) {
        /* Créations : quantité saisissable (souvent plusieurs dizaines de pièces) */
        val = el('input', 'order-stepper__input');
        val.type = 'number';
        val.min = '1';
        val.max = String(max);
        val.inputMode = 'numeric';
        val.value = String(l.qty);
        val.setAttribute('aria-label', T('Nombre de pièces', 'Number of pieces'));
        val.addEventListener('change', function () {
          var n = parseInt(val.value, 10);
          l.qty = isNaN(n) ? 1 : Math.max(1, Math.min(max, n));
          render();
        });
      } else {
        val = el('span', 'order-stepper__val', String(l.qty));
        val.setAttribute('aria-live', 'polite');
        val.setAttribute('aria-label', l.qty + T(' sachet', ' bag') + (l.qty > 1 ? 's' : '') + T(' de ', ' of ') + fl(d.fmt));
      }
      var plus = el('button', 'order-stepper__btn', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', d.crea ? T('Ajouter une pièce', 'Add one piece') : T('Ajouter un sachet', 'Add one bag'));
      plus.disabled = l.qty >= max;
      plus.addEventListener('click', function () { if (l.qty < max) { l.qty++; render(); } });
      stepper.appendChild(minus);
      stepper.appendChild(val);
      stepper.appendChild(plus);
      qty.appendChild(stepper);
      qty.appendChild(el('span', 'order-line__price', linePrice(d)));
      qty.appendChild(el('span', 'order-line__weight', d.crea ? pieces(l.qty) + (d.fmt.price != null ? ' · ' + euro(d.fmt.price) + T(' la pièce', ' each') : '') : weight(d.grams) + T(' au total', ' in total')));
      var lastR = REMISES_CREA[REMISES_CREA.length - 1];
      if (d.remise) qty.appendChild(el('span', 'order-line__remise', T('Remise ' + Math.round(d.remise * 100) + ' % dès ' + lastR.des + ' pièces : − ', Math.round(d.remise * 100) + '% discount from ' + lastR.des + ' pieces: − ') + euro(d.brut - d.total)));
      else if (d.crea && d.fmt.price != null && l.qty >= lastR.des - 20) qty.appendChild(el('span', 'order-line__remise is-hint', T('Plus que ' + (lastR.des - l.qty) + ' pour bénéficier de − ' + Math.round(lastR.taux * 100) + ' %', 'Just ' + (lastR.des - l.qty) + ' more to get −' + Math.round(lastR.taux * 100) + '%')));
      row.appendChild(qty);

      if (d.crea) row.appendChild(persoBlock(l, i));
      if (d.crea && wantsDragees(l)) row.appendChild(dgBlock(l, i));

      linesBox.appendChild(row);
    });
  }

  function renderSummary() {
    sumLines.textContent = '';
    lines.forEach(function (l) {
      var d = lineData(l);
      var li = el('li', 'order__sum-line');
      var left = el('span');
      left.appendChild(el('span', 'order__sum-name', pn(d.prod)));
      left.appendChild(el('span', 'order__sum-meta', lineLabel(l)));
      if (d.crea && persoText(l)) left.appendChild(el('span', 'order__sum-meta order__sum-perso', T('« ', '“') + persoText(l) + T(' »', '”')));
      if (d.crea && wantsDragees(l) && dgText(l)) left.appendChild(el('span', 'order__sum-meta', dgText(l)));
      li.appendChild(left);
      li.appendChild(el('span', 'order__sum-price', linePrice(d)));
      sumLines.appendChild(li);
    });
    var mode = form.querySelector('input[name="reception"]:checked');
    sumMode.textContent = mode ? mode.parentNode.querySelector('.order__mode-title').textContent : T('À choisir', 'To be chosen');

    var rf = relaisFee();
    document.getElementById('mode-relais-desc').textContent = T('Mondial Relay, France et Europe · ', 'Mondial Relay, France and Europe · ') + (rf === 'tbd' ? T('frais confirmés par e-mail', 'fees confirmed by email') : rf === 0 ? T('frais offerts', 'free delivery') : euro(rf));
    var fee = shippingFee();
    var shipRow = document.getElementById('sum-ship-row');
    var note = document.getElementById('sum-note');
    var devis = hasDevis() ? T(' Les créations sur devis sont chiffrées dans notre réponse.', ' Creations on quotation are priced in our reply.') : '';
    if (fee === 'tbd') {
      shipRow.hidden = false;
      document.getElementById('sum-ship').textContent = feeLabel(fee);
      note.textContent = T('Prix définitif et frais de point relais confirmés par e-mail.', 'Final price and pick-up point fees confirmed by email.') + devis;
    } else if (fee !== null) {
      shipRow.hidden = false;
      document.getElementById('sum-ship').textContent = feeLabel(fee);
      note.textContent = EN
        ? 'Pick-up point fees included' + (fee === 0 ? ' (free under 1 kg)' : ': €' + RELAIS_PRIX_KG + ' per kilo or part thereof') + '. Final price confirmed by email.' + devis
        : 'Frais de point relais inclus' + (fee === 0 ? ' (offerts sous 1 kg)' : ' : ' + RELAIS_PRIX_KG + ' € par kilo entamé') + '. Prix définitif confirmé par e-mail.' + devis;
    } else {
      shipRow.hidden = true;
      note.textContent = T('Prix définitif confirmé par e-mail.', 'Final price confirmed by email.') + devis;
    }
    sumTotal.textContent = totalLabel();
    var bt = document.getElementById('bar-total');
    if (bt) bt.textContent = totalLabel();
    updateLead();
  }

  function availableRefs() {
    var used = lines.map(function (l) { return l.ref; });
    return Object.keys(CATALOGUE).filter(function (r) { return used.indexOf(r) === -1; });
  }

  var pickerFamily = 'all';
  var pickerKind = firstProd.kind || 'dragee';
  function renderPicker() {
    var used = lines.map(function (l) { return l.ref; });
    addBtn.setAttribute('aria-expanded', pickerOpen ? 'true' : 'false');
    addBtn.hidden = pickerOpen;
    picker.hidden = !pickerOpen;
    if (!pickerOpen) return;

    var kinds = document.getElementById('order-picker-kinds');
    kinds.textContent = '';
    [{ id: 'dragee', name: 'Dragées' }, { id: 'creation', name: T('Créations', 'Creations') }].forEach(function (k) {
      var b = el('button', 'order-kind', k.name);
      b.type = 'button';
      b.setAttribute('aria-pressed', k.id === pickerKind ? 'true' : 'false');
      b.addEventListener('click', function () { pickerKind = k.id; pickerFamily = 'all'; renderPicker(); });
      kinds.appendChild(b);
    });

    var tabs = document.getElementById('order-picker-tabs');
    tabs.textContent = '';
    [{ id: 'all', name: T('Tout', 'All') }].concat(FAMILLES.filter(function (f) { return (f.kind || 'dragee') === pickerKind; })).forEach(function (f) {
      var b = el('button', 'order-chip order-chip--sm', famName(f));
      b.type = 'button';
      b.setAttribute('aria-pressed', f.id === pickerFamily ? 'true' : 'false');
      b.addEventListener('click', function () { pickerFamily = f.id; renderPicker(); });
      tabs.appendChild(b);
    });

    pickerGrid.textContent = '';
    Object.keys(CATALOGUE).forEach(function (r) {
      var p = CATALOGUE[r];
      if ((p.kind || 'dragee') !== pickerKind) return;
      if (pickerFamily !== 'all' && p.familyId !== pickerFamily) return;
      var added = used.indexOf(r) !== -1;
      var b = el('button', 'order-pick');
      b.type = 'button';
      if (added) { b.disabled = true; b.setAttribute('aria-label', pn(p) + T(' (déjà dans votre sélection)', ' (already in your selection)')); }
      var media = el('span', 'order-pick__img');
      var im = el('img');
      im.src = img(p.image);
      im.alt = '';
      im.loading = 'lazy';
      media.appendChild(im);
      if (added) media.appendChild(el('span', 'order-pick__badge', T('Ajouté', 'Added')));
      b.appendChild(media);
      b.appendChild(el('span', 'order-pick__name', pn(p)));
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

  /* La liste est redessinée à chaque clic : on garde la hauteur et la position de la page
     (Safari ne conserve pas la position quand le contenu change sous l'utilisateur) */
  function render() {
    var x = window.scrollX, y = window.scrollY;
    linesBox.style.minHeight = linesBox.offsetHeight + 'px';
    renderLines();
    renderSummary();
    renderPicker();
    linesBox.style.minHeight = '';
    if (window.scrollY !== y || window.scrollX !== x) window.scrollTo(x, y);
  }

  addBtn.addEventListener('click', function () { pickerOpen = true; renderPicker(); picker.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  document.getElementById('order-picker-close').addEventListener('click', function () { pickerOpen = false; renderPicker(); addBtn.focus(); });
  form.querySelectorAll('input[name="reception"]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.getElementById('grp-mode').classList.remove('has-error');
      renderSummary();
    });
  });
  /* Mode présélectionné depuis le catalogue (?mode=relais / ?mode=retrait) */
  var modeParam = params.get('mode');
  if (modeParam === 'relais' || modeParam === 'retrait') {
    var radio = form.querySelector('input[name="reception"][value^="' + (modeParam === 'relais' ? 'Livraison en point relais' : 'Retrait') + '"]');
    if (radio) radio.checked = true;
  }
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

  /* ---------- adresse facultative pour un retrait en boutique ---------- */
  function isRetrait() { return selectedMode().indexOf('Retrait') === 0; }
  function updateAddrRequired() {
    var retrait = isRetrait();
    document.querySelectorAll('.addr-req').forEach(function (s) { s.hidden = retrait; });
    document.querySelectorAll('.addr-opt').forEach(function (s) { s.hidden = !retrait; });
    ['o-rue', 'o-cp', 'o-ville'].forEach(function (id) {
      var inp = document.getElementById(id);
      if (retrait) { inp.removeAttribute('required'); inp.closest('.form__group').classList.remove('has-error'); }
      else inp.setAttribute('required', '');
    });
  }
  form.querySelectorAll('input[name="reception"]').forEach(function (r) { r.addEventListener('change', updateAddrRequired); });
  updateAddrRequired();

  /* ---------- barre fixe mobile (total + Commander) ---------- */
  (function () {
    var bar = document.getElementById('order-bar');
    var card = document.querySelector('.order__card');
    if (!bar || !card || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(card);
  })();

  /* ---------- validation ---------- */
  function setErr(group, show) {
    group.classList.toggle('has-error', show);
    return !show;
  }
  function validate() {
    var ok = true;
    var nom = document.getElementById('o-nom');
    var prenom = document.getElementById('o-prenom');
    ok = setErr(prenom.closest('.form__group'), !prenom.value.trim()) && ok;
    /* Adresse : obligatoire sauf pour un retrait en boutique */
    var addrRequired = !isRetrait();
    ['o-rue', 'o-ville'].forEach(function (id) {
      var inp = document.getElementById(id);
      ok = setErr(inp.closest('.form__group'), addrRequired && !inp.value.trim()) && ok;
    });
    var cp = document.getElementById('o-cp');
    var cpVal = cp.value.trim();
    ok = setErr(cp.closest('.form__group'), (addrRequired || cpVal) ? !/^[A-Za-z0-9 -]{4,10}$/.test(cpVal) : false) && ok;
    var tel = document.getElementById('o-tel');
    var email = document.getElementById('o-email');
    ok = setErr(document.getElementById('grp-mode'), !form.querySelector('input[name="reception"]:checked')) && ok;
    ok = setErr(dateInput.closest('.form__group'), !dateInput.value || dateInput.value < minIso) && ok;
    ok = setErr(nom.closest('.form__group'), !nom.value.trim()) && ok;
    ok = setErr(tel.closest('.form__group'), tel.value.replace(/\D/g, '').length < 9) && ok;
    ok = setErr(email.closest('.form__group'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
    /* Boîtes à dragées au choix : pas moins que le minimum */
    var dgBlocks = linesBox.querySelectorAll('.order-dg');
    lines.forEach(function (l) {
      if (dgSousMin(l)) {
        ok = false;
        dgBlocks.forEach(function (b) { if (b.querySelector('.order-dg__min')) b.classList.add('has-error'); });
      }
    });
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
      left.appendChild(el('span', 'order__sum-name', pn(d.prod)));
      left.appendChild(el('span', 'order__sum-meta', lineLabel(l)));
      li.appendChild(left);
      li.appendChild(el('span', 'order__sum-price', linePrice(d)));
      list.appendChild(li);
    });
    document.getElementById('done-mode').textContent = data.modeShort;
    document.getElementById('done-date').textContent = longDate(data.date);
    var fee = shippingFee();
    document.getElementById('done-ship-row').hidden = fee === null;
    if (fee !== null) document.getElementById('done-ship').textContent = feeLabel(fee);
    document.getElementById('done-total').textContent = totalLabel();
    document.getElementById('done-text').textContent = EN
      ? (AUTORESPONSE_ACTIVE ? 'A confirmation email has just been sent to ' + data.email + '. We will get back to you' : 'We will get back to you at ' + data.email) + ' within 48 hours to confirm availability, price and delivery date.'
      : AUTORESPONSE_ACTIVE
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
      message: document.getElementById('o-message').value.trim(),
      date: dateInput.value,
      mode: modeInput.value,
      modeShort: modeInput.parentNode.querySelector('.order__mode-title').textContent
    };

    if (document.getElementById('o-company').value) {
      showDone(data); /* robot : faux succès, rien n'est envoyé */
      return;
    }

    /* La commande envoyée à l'atelier est toujours rédigée en français */
    var wasEN = EN; EN = false;
    var detail = lines.map(function (l) {
      var d = lineData(l);
      return '• ' + pn(d.prod) + ' — ' + lineLabel(l) + ' — ' + linePrice(d) + (d.remise ? ' (remise ' + Math.round(d.remise * 100) + ' % incluse)' : '') +
        (d.crea && wantsDragees(l) ? '\n   Dragées : ' + (dgText(l) || 'à définir') : '') +
        (d.crea ? '\n   Étiquette : ' + (persoText(l) || 'à définir') : '');
    }).join('\n');
    var first = lineData(lines[0]);

    var kindsInCart = lines.map(function (l) { return isCrea(l.ref) ? 'Atelier' : 'Boutique'; });
    var payload = {
      'Type de demande': kindsInCart.indexOf('Atelier') === -1 ? 'Commande Boutique' : kindsInCart.indexOf('Boutique') === -1 ? 'Commande Atelier (créations)' : 'Commande Boutique + Atelier',
      _subject: 'Nouvelle commande — ' + pn(first.prod) + (lines.length > 1 ? ' + ' + (lines.length - 1) + ' autre(s)' : '') + ' — ' + data.prenom + ' ' + data.nom,
      'Prénom': data.prenom,
      'Nom': data.nom,
      email: data.email,
      'Téléphone': data.tel,
      'Adresse': (data.rue || data.cp || data.ville) ? [data.rue, (data.cp + ' ' + data.ville).trim()].filter(Boolean).join(', ') : 'Non renseignée (retrait à l\'atelier)',
      'Précisions': data.message || '—',
      'Commande': detail,
      'Frais de livraison': shippingFee() === null ? 'Aucun (retrait à l\'atelier)' : shippingFee() === 'tbd' ? 'À confirmer (point relais, commande avec créations)' : feeLabel(shippingFee()) + ' (point relais, ' + weight(totalGrams()) + ')',
      'Total indicatif': totalLabel() + (typeof shippingFee() === 'number' ? ' (frais de point relais inclus)' : '') + (hasDevis() ? ' — certaines créations sont sur devis' : ''),
      'Mode de réception': data.mode,
      'Date souhaitée': longDate(data.date) + ' (' + data.date + ')',
      'Photo du produit': new URL(img(first.prod.image), window.location.href).href,
      'Fiche produit': new URL(first.prod.url, window.location.href).href,
      _gotcha: ''
    };
    EN = wasEN;
    if (EN) payload['Langue du client'] = 'Anglais (commande passée sur la version anglaise du site : répondre en anglais)';

    var btn = form.querySelector('.order__submit');
    btn.disabled = true;
    btn.textContent = T('Envoi en cours…', 'Sending…');

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
        btn.textContent = T('Commander', 'Order');
        sendErr.hidden = false;
      });
  });
})();

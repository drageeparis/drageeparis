/* Formulaire « Lancer ma création » — 5 étapes
   1. Occasion · 2. Votre création (contenant, avec/sans dragées) · 3. Contenants & date
   4. Couleurs & étiquette · 5. Coordonnées (+ envoi Formspree) */
(function() {
  var TOTAL = 5;
  var FORMSPREE_ID = 'mlgqrzed';
  var PHONE_LABEL = '06 08 67 14 43';
  var PHONE_HREF = 'tel:+33608671443';
  var current = 1;

  var bar     = document.getElementById('wizard-bar-fill');
  var barEl   = document.getElementById('wizard-bar');
  var body    = document.getElementById('wizard-body');
  var nav     = document.getElementById('wizard-nav');
  var backBtn = document.getElementById('wizard-back');
  var nextBtn = document.getElementById('wizard-next');
  var success = document.getElementById('wizard-success');
  if (!body || !nextBtn) return;

  /* ---------- Utilitaires ---------- */
  function $(id) { return document.getElementById(id); }
  function checkedValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function checkedValues(name) {
    return Array.prototype.map.call(document.querySelectorAll('input[name="' + name + '"]:checked'), function(x) { return x.value; });
  }
  function val(id) { var el = $(id); return el ? el.value.trim() : ''; }

  function isSafeImageUrl(url) {
    if (!url) return false;
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.indexOf('/images/') !== -1;
    } catch (e) { return false; }
  }

  /* Produit d'origine éventuel (?produit=&image=) */
  var params = new URLSearchParams(window.location.search);
  var produitParam = (params.get('produit') || '').slice(0, 200);
  var imageParam = isSafeImageUrl(params.get('image')) ? params.get('image') : '';

  /* ---------- Date ---------- */
  var dateEl = $('wizard-date');
  var dateAlert = $('wizard-date-alert');
  var isMobileDate = !!(dateEl && window.innerWidth <= 768);

  if (isMobileDate) {
    // Sur mobile, champ texte jj/mm/aaaa (plus simple à saisir)
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

  // Renvoie un objet Date (minuit) ou null — accepte aaaa-mm-jj et jj/mm/aaaa
  function readDate() {
    if (!dateEl) return null;
    var raw = dateEl.value.trim();
    var y, m, d, mt;
    if ((mt = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/))) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
    else if ((mt = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) { y = +mt[3]; m = +mt[2]; d = +mt[1]; }
    else return null;
    var date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatDate(date) { return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear(); }
  function daysUntil(date) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((date - t) / 86400000);
  }
  function relativeDelay(days) {
    if (days < 0) return 'date passée, à vérifier';
    if (days === 0) return "aujourd'hui";
    if (days < 28) return 'DÉLAI COURT : dans ' + days + ' jour' + (days > 1 ? 's' : '');
    if (days < 70) return 'dans ' + Math.round(days / 7) + ' semaines';
    return 'dans environ ' + Math.round(days / 30.4) + ' mois';
  }
  function updateDateAlert() {
    if (!dateAlert) return;
    var date = readDate();
    if (!date) { dateAlert.hidden = true; return; }
    var days = daysUntil(date);
    if (days < 0) {
      dateAlert.textContent = 'Cette date est déjà passée : pouvez-vous la vérifier ?';
      dateAlert.hidden = false;
    } else if (days < 28) {
      dateAlert.textContent = 'Votre événement approche : nous ferons tout notre possible. Pour un délai court, appelez-nous au ';
      var a = document.createElement('a');
      a.href = PHONE_HREF; a.textContent = PHONE_LABEL;
      dateAlert.appendChild(a);
      dateAlert.appendChild(document.createTextNode('.'));
      dateAlert.hidden = false;
    } else {
      dateAlert.hidden = true;
    }
  }
  if (dateEl) {
    dateEl.addEventListener('input', updateDateAlert);
    dateEl.addEventListener('change', updateDateAlert);
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
  function finalLabel() { return 'Recevoir ma proposition'; }

  function validateStep(n) {
    if (n === 1) return !!checkedValue('evenement');
    if (n === 2) return checkedValues('contenant').length > 0 && !!checkedValue('dragees');
    if (n === 3) return !!checkedValue('quantite'); // date facultative
    if (n === 4) return true;                       // couleurs et étiquette facultatives
    return true;
  }
  function updateNextState() {
    if (current < TOTAL) nextBtn.disabled = !validateStep(current);
    else nextBtn.disabled = false;
  }

  function showStep(n, direction) {
    var prev = getPanel(current);
    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('leaving');
      setTimeout(function() { prev.classList.remove('leaving'); }, 300);
    }
    current = n;
    setProgress(n);
    var next = getPanel(n);
    if (next) {
      next.style.animationName = direction === 'back' ? 'wizardInBack' : 'wizardIn';
      next.classList.add('active');
    }
    backBtn.hidden = (n === 1);
    setNextLabel(n === TOTAL ? finalLabel() : 'Continuer');
    if (n === TOTAL) updateSummary();
    updateNextState();
    var top = document.querySelector('.wizard-wrap');
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Interactions des choix ---------- */
  // Contenant : « Conseillez-moi » est exclusif des autres choix
  document.querySelectorAll('input[name="contenant"]').forEach(function(box) {
    box.addEventListener('change', function() {
      if (!box.checked) return;
      document.querySelectorAll('input[name="contenant"]').forEach(function(other) {
        if (other === box) return;
        if (box.value === 'Conseillez-moi' || other.value === 'Conseillez-moi') other.checked = false;
      });
    });
  });

  // Avec / sans dragées : affiche le choix du type de dragées
  var typeBlock = $('wizard-dragee-type');
  document.querySelectorAll('input[name="dragees"]').forEach(function(r) {
    r.addEventListener('change', function() {
      if (!typeBlock) return;
      var avec = checkedValue('dragees') === 'Avec dragées';
      typeBlock.hidden = !avec;
      if (!avec) document.querySelectorAll('input[name="type_dragees"]').forEach(function(t) { t.checked = false; });
    });
  });

  body.addEventListener('change', updateNextState);

  // Clavier : Entrée sur un choix le sélectionne
  document.querySelectorAll('.wizard__card input, .wizard__chip input').forEach(function(input) {
    input.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      input.checked = input.type === 'checkbox' ? !input.checked : true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  var skipColors = $('wizard-skip-colors');
  if (skipColors) {
    skipColors.addEventListener('click', function() { showStep(5, 'next'); });
    skipColors.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skipColors.click(); }
    });
  }

  /* ---------- Récapitulatif ---------- */
  function drageesText() {
    var d = checkedValue('dragees');
    if (!d) return '';
    var type = checkedValue('type_dragees');
    return d === 'Avec dragées' && type ? d + ' · ' + type : d;
  }
  function setRow(id, text, hideWhenEmpty, fallback) {
    var el = $(id); if (!el) return;
    el.textContent = text || fallback || '-';
    var row = $(id + '-row');
    if (row && hideWhenEmpty) row.style.display = text ? '' : 'none';
  }
  function updateSummary() {
    var date = readDate();
    setRow('sum-event', checkedValue('evenement'));
    setRow('sum-contenant', checkedValues('contenant').join(', '));
    setRow('sum-dragees', drageesText());
    setRow('sum-qty', checkedValue('quantite'));
    setRow('sum-date', date ? formatDate(date) : '', false, 'Non précisée');
    var couleurs = checkedValues('couleurs').map(function(c) { return c === 'Personnalisée' ? 'Autre' : c; });
    setRow('sum-colors', couleurs.join(', '), false, 'À préciser');
    setRow('sum-etiquette', val('wizard-etiquette'), true);
    setRow('sum-message', val('wizard-message'), true);
    setRow('sum-visuel', val('wizard-visuel-lien'), true);
  }

  /* ---------- Coordonnées ---------- */
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
  // Retire l'erreur dès que le champ est corrigé
  ['w-prenom', 'w-nom', 'w-email', 'w-tel', 'w-ville'].forEach(function(id) {
    var el = $(id); if (!el) return;
    el.addEventListener('input', function() { var f = el.closest('.wizard__field'); if (f) f.classList.remove('has-error'); });
  });
  document.querySelectorAll('input[name="reception"]').forEach(function(r) {
    r.addEventListener('change', function() { markField('field-reception', true); });
  });

  /* ---------- Envoi ---------- */
  function buildPayload() {
    var prenom = val('w-prenom'), nom = val('w-nom'), email = val('w-email');
    var occasion = checkedValue('evenement');
    var quantite = checkedValue('quantite');
    var date = readDate();
    var days = date ? daysUntil(date) : null;
    var urgent = days !== null && days >= 0 && days < 28;
    var couleurs = checkedValues('couleurs').map(function(c) { return c === 'Personnalisée' ? 'Autre (à préciser)' : c; });

    var subject = 'Création sur mesure · ' + occasion + ' · ' + quantite + ' contenants · ' +
      (date ? formatDate(date) : 'date non fixée') + ' · ' + prenom + ' ' + nom + (urgent ? ' · DÉLAI COURT' : '');

    var p = {
      'subject': subject,
      'email': email,
      '_replyto': email,
      'Type de demande': 'Création sur mesure (formulaire « Lancer ma création »)',
      'Nom': prenom + ' ' + nom,
      'Téléphone': val('w-tel'),
      'Ville / code postal': val('w-ville'),
      'Réception': checkedValue('reception'),
      'Occasion': occasion,
      'Contenant': checkedValues('contenant').join(', '),
      'Dragées': drageesText(),
      'Nombre de contenants': quantite,
      "Date de l'événement": date ? formatDate(date) + ' (' + relativeDelay(days) + ')' : 'Non précisée',
      'Couleurs': couleurs.length ? couleurs.join(', ') : 'À préciser'
    };
    var optional = [
      ["Texte de l'étiquette", val('wizard-etiquette')],
      ['Précisions', val('wizard-message')],
      ['Visuel (lien)', val('wizard-visuel-lien')],
      ['Budget par contenant', checkedValue('budget')],
      ['Nous a connus via', checkedValue('source')],
      ['Produit consulté', produitParam],
      ['Photo du produit', imageParam]
    ];
    optional.forEach(function(o) { if (o[1]) p[o[0]] = o[1]; });
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
    setNextLabel(finalLabel());
    var errEl = $('wizard-send-error');
    if (errEl) errEl.hidden = false;
  }

  function send() {
    if (!validateContact()) {
      var firstError = document.querySelector('#wizard-step-5 .has-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (val('w-company')) { showSuccess(); return; } // champ piège rempli : robot

    var errEl = $('wizard-send-error');
    if (errEl) errEl.hidden = true;
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
    if (current > 1) showStep(current - 1, 'back');
  });

  nextBtn.addEventListener('click', function() {
    if (current === TOTAL) { send(); return; }
    if (!validateStep(current)) {
      var p = getPanel(current);
      if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
      return;
    }
    showStep(current + 1, 'next');
  });

  setProgress(1);
  setNextLabel('Continuer');
  updateNextState();
})();

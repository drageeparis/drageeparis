(function() {
  var TOTAL = 7;
  var current = 1;
  var data = { division: '', dragees: '', evenement: '', quantite: '', date: '', couleurs: [], message: '', visuel: '', produit: '', image: '' };

  var bar     = document.getElementById('wizard-bar-fill');
  var barEl   = document.getElementById('wizard-bar');
  var body    = document.getElementById('wizard-body');
  var nav     = document.getElementById('wizard-nav');
  var backBtn = document.getElementById('wizard-back');
  var nextBtn = document.getElementById('wizard-next');
  var success = document.getElementById('wizard-success');

  function isSafeImageUrl(url) {
    if (!url) return false;
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.indexOf('/images/') !== -1;
    } catch (e) {
      return false;
    }
  }

  function setProgress(step) {
    var pct = Math.round((step / TOTAL) * 100);
    bar.style.width = pct + '%';
    barEl.setAttribute('aria-valuenow', pct);
  }

  function getPanel(n) { return document.getElementById('wizard-step-' + n); }

  function updateNextState() {
    var needsSelection = (current === 1 || current === 2 || current === 3 || current === 6);
    nextBtn.disabled = needsSelection && !validateStep(current);
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
    nextBtn.textContent = (n === TOTAL) ? 'Envoyer ma création →' : 'Continuer →';
    updateNextState();
  }

  // Radio / checkbox micro-interactions
  document.querySelectorAll('.wizard__card input[type="radio"]').forEach(function(r) {
    r.addEventListener('change', function() {
      var name = r.getAttribute('name');
      if (name === 'division') {
        data.division = r.value;
        // « Les dragées » n'utilise pas le configurateur : redirection directe.
        if (r.value === 'Les dragées') { window.location.href = 'boutique.html'; return; }
      }
      if (name === 'dragees')   data.dragees = r.value;
      if (name === 'evenement') data.evenement = r.value;
      if (name === 'quantite')  data.quantite = r.value;
      updateNextState();
    });
  });

  var dateEl = document.getElementById('wizard-date');
  // Sur mobile, convertir en champ texte jj/mm/aaaa
  if (dateEl && window.innerWidth <= 768) {
    dateEl.type = 'text';
    dateEl.setAttribute('inputmode', 'numeric');
    dateEl.setAttribute('maxlength', '10');
    dateEl.setAttribute('placeholder', 'jj/mm/aaaa');
    dateEl.addEventListener('input', function() {
      var digits = this.value.replace(/\D/g, '');
      if (digits.length > 8) digits = digits.substr(0, 8);
      var formatted = digits;
      if (digits.length > 4) formatted = digits.substr(0, 2) + '/' + digits.substr(2, 2) + '/' + digits.substr(4);
      else if (digits.length > 2) formatted = digits.substr(0, 2) + '/' + digits.substr(2);
      this.value = formatted;
    });
    dateEl.addEventListener('change', function() {
      var parts = this.value.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        data.date = parts[2] + '-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0');
      } else {
        data.date = this.value;
      }
    });
  } else if (dateEl) {
    dateEl.addEventListener('change', function() { data.date = this.value; });
  }

  document.querySelectorAll('.wizard__color-item input[type="checkbox"]').forEach(function(c) {
    c.addEventListener('change', function() {
      data.couleurs = Array.from(document.querySelectorAll('.wizard__color-item input:checked')).map(function(x) { return x.value; });
    });
  });

  var msgEl = document.getElementById('wizard-message');
  if (msgEl) {
    msgEl.addEventListener('input', function() { data.message = this.value.trim(); });
  }

  // Visuel : champ lien (Formspree ne transmet pas les fichiers uploadés sur l'offre gratuite)
  var visuelLienEl = document.getElementById('wizard-visuel-lien');
  if (visuelLienEl) {
    visuelLienEl.addEventListener('input', function() { data.visuel = this.value.trim(); });
  }

  // Skip buttons
  var skipDate = document.getElementById('wizard-skip-date');
  if (skipDate) {
    skipDate.addEventListener('click', function() { data.date = ''; showStep(5, 'next'); });
    skipDate.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') skipDate.click(); });
  }
  var skipColors = document.getElementById('wizard-skip-colors');
  if (skipColors) {
    skipColors.addEventListener('click', function() { data.couleurs = []; showStep(6, 'next'); });
    skipColors.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') skipColors.click(); });
  }

  function updateSummary() {
    document.getElementById('sum-division').textContent = data.division || '-';
    var drRow = document.getElementById('sum-dragees-row');
    var drVal = document.getElementById('sum-dragees');
    if (data.dragees) {
      drVal.textContent = data.dragees;
      drRow.style.display = '';
    } else {
      drRow.style.display = 'none';
    }
    document.getElementById('sum-event').textContent = data.evenement || '-';
    document.getElementById('sum-qty').textContent = data.quantite || '-';
    var d = data.date;
    if (d) {
      var parts = d.split('-');
      document.getElementById('sum-date').textContent = parts[2] + '/' + parts[1] + '/' + parts[0];
    } else {
      document.getElementById('sum-date').textContent = 'Non précisée';
    }
    document.getElementById('sum-colors').textContent = data.couleurs.length ? data.couleurs.join(', ') : 'À préciser';
    var msgRow = document.getElementById('sum-message-row');
    var msgVal = document.getElementById('sum-message');
    if (data.message) {
      msgVal.textContent = data.message;
      msgRow.style.display = '';
    } else {
      msgRow.style.display = 'none';
    }
    var visRow = document.getElementById('sum-visuel-row');
    var visVal = document.getElementById('sum-visuel');
    if (data.visuel) {
      visVal.textContent = data.visuel;
      visRow.style.display = '';
    } else {
      visRow.style.display = 'none';
    }
  }

  function validateStep(n) {
    if (n === 1) return !!document.querySelector('input[name="division"]:checked');
    if (n === 2) return !!document.querySelector('input[name="evenement"]:checked');
    if (n === 3) return !!document.querySelector('input[name="quantite"]:checked');
    if (n === 4) return true; // date optional
    if (n === 5) return true; // colors optional
    if (n === 6) return !!document.querySelector('input[name="dragees"]:checked');
    if (n === 7) return validateContact();
    return true;
  }

  function validateContact() {
    var ok = true;
    var prenom = document.getElementById('w-prenom');
    var email  = document.getElementById('w-email');
    var fp = document.getElementById('field-prenom');
    var fe = document.getElementById('field-email');
    if (!prenom.value.trim()) { fp.classList.add('has-error'); ok = false; } else { fp.classList.remove('has-error'); }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.value.trim())) { fe.classList.add('has-error'); ok = false; } else { fe.classList.remove('has-error'); }
    return ok;
  }

  backBtn.addEventListener('click', function() {
    if (current > 1) showStep(current - 1, 'back');
  });

  nextBtn.addEventListener('click', function() {
    // Filet de sécurité : « Les dragées » pré-sélectionné (?div=boutique) → redirection.
    if (current === 1 && data.division === 'Les dragées') { window.location.href = 'boutique.html'; return; }

    if (current === TOTAL) {
      if (!validateContact()) return;

      var prenom = document.getElementById('w-prenom').value.trim();
      var email  = document.getElementById('w-email').value.trim();
      var tel    = document.getElementById('w-tel').value.trim();
      var gotcha = document.getElementById('w-company').value;

      if (gotcha) {
        /* Champ piège rempli : soumission robot, on affiche un faux succès sans rien envoyer */
        body.style.display = 'none';
        nav.style.display = 'none';
        success.classList.add('visible');
        setProgress(TOTAL);
        return;
      }

      var FORMSPREE_ID = 'mlgqrzed';

      nextBtn.disabled = true;
      nextBtn.textContent = 'Envoi en cours…';

      fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          'Prénom': prenom,
          'Email': email,
          'Téléphone': tel || 'Non renseigné',
          'Division': data.division || 'Non précisée',
          'Dragées': data.dragees || 'Non précisé',
          'Produit consulté': data.produit || 'Non précisé',
          'Photo du produit': data.image || 'Non précisée',
          'Événement': data.evenement,
          'Quantité': data.quantite,
          'Date': data.date || 'Non précisée',
          'Couleurs': data.couleurs.length ? data.couleurs.join(', ') : 'À préciser',
          'Message': data.message || '',
          'Visuel (lien)': data.visuel || '',
          '_gotcha': gotcha
        })
      })
      .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(res) {
        if (res.ok) {
          body.style.display = 'none';
          nav.style.display = 'none';
          success.classList.add('visible');
          setProgress(TOTAL);
        } else {
          nextBtn.disabled = false;
          nextBtn.textContent = 'Envoyer ma création →';
          var errEl = document.getElementById('wizard-send-error');
          if (errEl) errEl.hidden = false;
        }
      })
      .catch(function() {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Envoyer ma création →';
        var errEl = document.getElementById('wizard-send-error');
        if (errEl) errEl.hidden = false;
      });
      return;
    }
    if (!validateStep(current)) {
      var p = getPanel(current);
      if (p) {
        p.style.animation = 'none';
        void p.offsetWidth;
        p.style.animation = '';
      }
      return;
    }
    if (current === 4) { data.date = document.getElementById('wizard-date').value; }
    showStep(current + 1, 'next');
    if (current === TOTAL) updateSummary();
  });

  // Keyboard: Enter sur une card radio avance
  document.querySelectorAll('.wizard__card input[type="radio"]').forEach(function(r) {
    r.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { r.checked = true; r.dispatchEvent(new Event('change')); }
    });
  });

  // Pré-sélectionner la division si ?div= dans l'URL, et mémoriser le produit d'origine (?produit=&image=)
  (function() {
    var params = new URLSearchParams(window.location.search);
    data.produit = (params.get('produit') || '').slice(0, 200);
    var imageParam = params.get('image');
    data.image = isSafeImageUrl(imageParam) ? imageParam : '';

    var div = params.get('div');
    if (!div) return;
    var val = div === 'boutique' ? 'Les dragées' : div === 'atelier' ? 'Les créations' : null;
    if (!val) return;
    var radio = document.querySelector('input[name="division"][value="' + val + '"]');
    if (radio) {
      radio.checked = true;
      data.division = val;
      updateNextState();
    }
  })();

  setProgress(1);
})();

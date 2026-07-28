(function () {
  var form = document.getElementById('atelier-order-form');
  var confirmation = document.getElementById('at-confirmation');
  var backBtn = document.getElementById('at-back');

  function isSafeImageUrl(url) {
    if (!url) return false;
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.indexOf('/images/') !== -1;
    } catch (e) {
      return false;
    }
  }

  /* Pré-remplit la création si on arrive depuis une fiche produit (?produit=...&image=...) */
  var params = new URLSearchParams(window.location.search);
  var produitParam = params.get('produit');
  var imageParamRaw = params.get('image');
  var imageParam = isSafeImageUrl(imageParamRaw) ? imageParamRaw : '';
  if (produitParam) {
    document.getElementById('at-produit').value = produitParam.slice(0, 200);
  }

  function setError(inputId, errorId, show) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);
    var group = input.closest('.form__group');
    if (show) {
      group.classList.add('has-error');
      error.style.display = 'block';
    } else {
      group.classList.remove('has-error');
      error.style.display = 'none';
    }
    return !show;
  }

  function validate() {
    var nom       = document.getElementById('at-nom').value.trim();
    var email     = document.getElementById('at-email').value.trim();
    var tel       = document.getElementById('at-tel').value.trim();
    var dragees   = document.getElementById('at-dragees').value;
    var categorie = document.getElementById('at-categorie').value;
    var produit   = document.getElementById('at-produit').value.trim();
    var quantite  = document.getElementById('at-quantite').value;
    var date      = document.getElementById('at-date').value;
    var emailOk   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    var ok = true;
    ok = setError('at-nom', 'err-at-nom', nom.length === 0) && ok;
    ok = setError('at-email', 'err-at-email', !emailOk) && ok;
    ok = setError('at-tel', 'err-at-tel', tel.length === 0) && ok;
    ok = setError('at-categorie', 'err-at-categorie', !categorie) && ok;
    ok = setError('at-dragees', 'err-at-dragees', !dragees) && ok;
    ok = setError('at-produit', 'err-at-produit', produit.length === 0) && ok;
    ok = setError('at-quantite', 'err-at-quantite', !quantite || Number(quantite) <= 0) && ok;
    ok = setError('at-date', 'err-at-date', !date) && ok;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var nom       = document.getElementById('at-nom').value.trim();
    var email     = document.getElementById('at-email').value.trim();
    var tel       = document.getElementById('at-tel').value.trim();
    var dragees   = document.getElementById('at-dragees').value;
    var categorie = document.getElementById('at-categorie').value;
    var produit   = document.getElementById('at-produit').value.trim();
    var quantite  = document.getElementById('at-quantite').value.trim();
    var date      = document.getElementById('at-date').value;
    var gotcha    = document.getElementById('at-company').value;

    if (gotcha) {
      /* Champ piège rempli : soumission robot, on affiche un faux succès sans rien envoyer */
      form.hidden = true;
      confirmation.hidden = false;
      return;
    }

    var submitBtn = form.querySelector('.msg-form__submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    fetch('https://formspree.io/f/xeeyjnae', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        'Type de demande': 'Commande Atelier',
        'Nom': nom,
        'Email': email,
        'Téléphone': tel,
        'Collection': categorie,
        'Avec/Sans dragées': dragees,
        'Création': produit,
        'Photo de la création': imageParam || 'Non précisée',
        'Nombre de contenants': quantite,
        'Date de l’événement': date,
        '_gotcha': gotcha
      })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok }; }); })
    .then(function(res) {
      if (res.ok) {
        form.hidden = true;
        confirmation.hidden = false;
        var errEl = document.getElementById('at-send-error');
        if (errEl) errEl.hidden = true;
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer ma demande';
        var errEl = document.getElementById('at-send-error');
        if (errEl) errEl.hidden = false;
      }
    })
    .catch(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer ma demande';
      var errEl = document.getElementById('at-send-error');
      if (errEl) errEl.hidden = false;
    });
  });

  backBtn.addEventListener('click', function () {
    confirmation.hidden = true;
    form.hidden = false;
    form.reset();
    document.querySelectorAll('.form__group.has-error').forEach(function (g) {
      g.classList.remove('has-error');
    });
    document.getElementById('at-nom').focus();
  });
})();

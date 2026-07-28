(function () {
  var form = document.getElementById('boutique-order-form');
  var confirmation = document.getElementById('bo-confirmation');
  var backBtn = document.getElementById('bo-back');

  function isSafeImageUrl(url) {
    if (!url) return false;
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin && u.pathname.indexOf('/images/') !== -1;
    } catch (e) {
      return false;
    }
  }

  /* Pré-remplit le produit si on arrive depuis une fiche produit (?produit=...&image=...) */
  var params = new URLSearchParams(window.location.search);
  var produitParam = params.get('produit');
  var imageParamRaw = params.get('image');
  var imageParam = isSafeImageUrl(imageParamRaw) ? imageParamRaw : '';
  if (produitParam) {
    document.getElementById('bo-produit').value = produitParam.slice(0, 200);
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
    var nom       = document.getElementById('bo-nom').value.trim();
    var email     = document.getElementById('bo-email').value.trim();
    var tel       = document.getElementById('bo-tel').value.trim();
    var categorie = document.getElementById('bo-categorie').value;
    var produit   = document.getElementById('bo-produit').value.trim();
    var quantite  = document.getElementById('bo-quantite').value;
    var date      = document.getElementById('bo-date').value;
    var emailOk   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    var ok = true;
    ok = setError('bo-nom', 'err-bo-nom', nom.length === 0) && ok;
    ok = setError('bo-email', 'err-bo-email', !emailOk) && ok;
    ok = setError('bo-tel', 'err-bo-tel', tel.length === 0) && ok;
    ok = setError('bo-categorie', 'err-bo-categorie', !categorie) && ok;
    ok = setError('bo-produit', 'err-bo-produit', produit.length === 0) && ok;
    ok = setError('bo-quantite', 'err-bo-quantite', !quantite || Number(quantite) <= 0) && ok;
    ok = setError('bo-date', 'err-bo-date', !date) && ok;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var nom       = document.getElementById('bo-nom').value.trim();
    var email     = document.getElementById('bo-email').value.trim();
    var tel       = document.getElementById('bo-tel').value.trim();
    var categorie = document.getElementById('bo-categorie').value;
    var produit   = document.getElementById('bo-produit').value.trim();
    var quantite  = document.getElementById('bo-quantite').value.trim();
    var date      = document.getElementById('bo-date').value;
    var gotcha    = document.getElementById('bo-company').value;

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
        'Nom': nom,
        'Email': email,
        'Téléphone': tel,
        'Catégorie': categorie,
        'Produit': produit,
        'Photo du produit': imageParam || 'Non précisée',
        'Quantité (g)': quantite,
        'Date souhaitée': date,
        '_gotcha': gotcha
      })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok }; }); })
    .then(function(res) {
      if (res.ok) {
        form.hidden = true;
        confirmation.hidden = false;
        var errEl = document.getElementById('bo-send-error');
        if (errEl) errEl.hidden = true;
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer ma demande';
        var errEl = document.getElementById('bo-send-error');
        if (errEl) errEl.hidden = false;
      }
    })
    .catch(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer ma demande';
      var errEl = document.getElementById('bo-send-error');
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
    document.getElementById('bo-nom').focus();
  });
})();

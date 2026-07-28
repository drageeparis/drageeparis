(function () {
  var form = document.getElementById('msg-form');
  var confirmation = document.getElementById('msg-confirmation');
  var backBtn = document.getElementById('msg-back');

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
    var nom = document.getElementById('msg-nom').value.trim();
    var email = document.getElementById('msg-email').value.trim();
    var message = document.getElementById('msg-message').value.trim();
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    var ok = true;
    ok = setError('msg-nom', 'err-nom', nom.length === 0) && ok;
    ok = setError('msg-email', 'err-email', !emailOk) && ok;
    ok = setError('msg-message', 'err-message', message.length === 0) && ok;
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var nom     = document.getElementById('msg-nom').value.trim();
    var email   = document.getElementById('msg-email').value.trim();
    var message = document.getElementById('msg-message').value.trim();
    var gotcha  = document.getElementById('msg-company').value;

    if (gotcha) {
      /* Champ piège rempli : soumission robot, on affiche un faux succès sans rien envoyer */
      form.hidden = true;
      confirmation.hidden = false;
      return;
    }

    var submitBtn = form.querySelector('.msg-form__submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    fetch('https://formspree.io/f/xzdnpoez', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ 'Nom': nom, 'Email': email, 'Message': message, '_gotcha': gotcha })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok }; }); })
    .then(function(res) {
      if (res.ok) {
        form.hidden = true;
        confirmation.hidden = false;
        var errEl = document.getElementById('msg-send-error');
        if (errEl) errEl.hidden = true;
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer le message';
        var errEl = document.getElementById('msg-send-error');
        if (errEl) errEl.hidden = false;
      }
    })
    .catch(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer le message';
      var errEl = document.getElementById('msg-send-error');
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
    document.getElementById('msg-nom').focus();
  });
})();

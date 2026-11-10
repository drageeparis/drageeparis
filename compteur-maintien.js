/* Compteurs + / − : en restant appuyé, la quantité continue d'augmenter (ou de diminuer)
   et accélère au bout de quelques instants. Fonctionne à la souris et au doigt.
   Les boutons étant parfois redessinés à chaque clic, on retrouve à chaque pas
   le bouton situé sous le doigt (même position) avant de le cliquer. */
(function () {
  var SEL = '.order-stepper__btn, .cfg-qty__btn[data-act="minus"], .cfg-qty__btn[data-act="plus"], #w-nb-minus, #w-nb-plus';
  var DELAI = 400;           // avant le début de la répétition
  var timer = null, x = 0, y = 0, pas = 0, repete = false;

  function stop() {
    if (timer) { clearTimeout(timer); timer = null; }
    document.removeEventListener('pointerup', stop);
    document.removeEventListener('pointercancel', stop);
    if (repete) setTimeout(function () { repete = false; }, 60);
  }
  function tick() {
    var el = document.elementFromPoint(x, y), btn = el && el.closest(SEL);
    if (!btn || btn.disabled) { stop(); return; }
    repete = true;
    btn.click();
    pas++;
    timer = setTimeout(tick, pas < 8 ? 150 : pas < 25 ? 70 : 35); // accélération progressive
  }

  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var btn = e.target.closest && e.target.closest(SEL);
    if (!btn || btn.disabled) return;
    stop();
    x = e.clientX; y = e.clientY; pas = 0; repete = false;
    timer = setTimeout(tick, DELAI);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  });
  document.addEventListener('pointermove', function (e) {
    if (timer) { x = e.clientX; y = e.clientY; }
  });
  // après un appui long, le clic du relâchement ne doit pas ajouter une unité de plus
  document.addEventListener('click', function (e) {
    if (repete && e.isTrusted) {
      repete = false;
      if (e.target.closest && e.target.closest(SEL)) { e.stopPropagation(); e.preventDefault(); }
    }
  }, true);
  // au doigt : pas de menu contextuel ni de sélection pendant l'appui long
  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest && e.target.closest(SEL)) e.preventDefault();
  });
  var st = document.createElement('style');
  st.textContent = SEL.split(', ').join(', ') + ' { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }';
  document.head.appendChild(st);
})();

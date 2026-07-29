/* ================================================
   DRAGÉE PARIS · JavaScript principal
================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- 1. Header sticky scroll + hide-on-scroll-down ---- */
  const header = document.getElementById('header');
  if (header) {
    let lastY      = window.scrollY;
    let ticking    = false;
    let hiddenAtY  = Infinity;
    const HIDE_AFTER = 64;
    const SHOW_AFTER = 8;
    const isHomePage = !header.classList.contains('header--inner');
    const isMobile   = () => window.innerWidth <= 1100;
    const isPhone    = () => window.innerWidth <= 768;
    const TOP_ZONE   = () => {
      if (isHomePage && isMobile()) {
        const hero = document.querySelector('.hero');
        return hero ? hero.offsetHeight : window.innerHeight * 0.6;
      }
      return 80;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const topZone = TOP_ZONE();
        const scrolledThreshold = (isHomePage && isMobile()) ? topZone : 40;
        const forceSolid = isHomePage && isPhone();
        header.classList.toggle('scrolled', forceSolid || y > scrolledThreshold);
        const menuOpen = drawer && drawer.getAttribute('aria-hidden') === 'false';
        if (!menuOpen) {
          if (y <= topZone) {
            header.classList.remove('header--hidden');
            hiddenAtY = Infinity;
          } else if (y > lastY) {
            hiddenAtY = y;
            if (!header.classList.contains('header--hidden') && y >= topZone + HIDE_AFTER) {
              header.classList.add('header--hidden');
            }
          } else if (y < lastY && header.classList.contains('header--hidden')) {
            if (hiddenAtY - y >= SHOW_AFTER) {
              header.classList.remove('header--hidden');
              hiddenAtY = Infinity;
            }
          }
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- 2. Drawer menu plein écran bicolonne ---- */
  const drawerToggle = document.getElementById('drawer-toggle');
  const drawer       = document.getElementById('drawer');
  const drawerClose  = document.getElementById('drawer-close');

  if (drawerToggle && drawer) {
    const mainItems     = Array.from(drawer.querySelectorAll('.drawer__main-item[data-sub]'));
    const allDrawerItems = Array.from(drawer.querySelectorAll('.drawer__main-item'));
    const allSubs       = Array.from(drawer.querySelectorAll('.drawer__sub'));

    const activateSub = (subId) => {
      allSubs.forEach(sub => {
        const visible = sub.id === subId;
        sub.setAttribute('aria-hidden', String(!visible));
        sub.inert = !visible;
        sub.classList.toggle('is-visible', false);
        if (visible) requestAnimationFrame(() => sub.classList.add('is-visible'));
      });
      allDrawerItems.forEach(item => {
        item.classList.toggle('is-active', item.dataset.sub === subId);
      });
      drawer.classList.add('sub-open');
    };

    const openDrawer = () => {
      drawer.setAttribute('aria-hidden', 'false');
      drawer.inert = false;
      drawerToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      drawerToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      allSubs.forEach(s => { s.setAttribute('aria-hidden', 'true'); s.inert = true; s.classList.remove('is-visible'); });
      allDrawerItems.forEach(i => i.classList.remove('is-active'));
      drawer.classList.remove('sub-open');
      if (header) header.classList.remove('header--hidden');
    };

    drawerToggle.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', e => {
      if (!e.target.closest('.drawer__content')) closeDrawer();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    mainItems.forEach(item => {
      item.querySelector('.drawer__main-btn')?.addEventListener('click', () => activateSub(item.dataset.sub));
    });

    allDrawerItems.filter(i => !i.dataset.sub).forEach(item => {
      item.querySelector('.drawer__main-btn')?.addEventListener('click', () => {
        allDrawerItems.forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
        drawer.classList.remove('sub-open');
      });
    });

    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

    const drawerBack = document.getElementById('drawer-back');
    const closeSub = () => {
      allSubs.forEach(s => { s.setAttribute('aria-hidden', 'true'); s.inert = true; s.classList.remove('is-visible'); });
      drawer.classList.remove('sub-open');
    };
    drawerBack?.addEventListener('click', closeSub);

    drawer.querySelectorAll('.drawer__sub-group-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const group = trigger.closest('.drawer__sub-group');
        const isOpen = group.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  /* ---- 3. Lien actif dans le drawer au chargement ---- */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = drawer ? Array.from(drawer.querySelectorAll('.drawer__main-item')) : [];
  if (page.startsWith('dragees') || page.startsWith('produit')) {
    navItems.find(li => li.dataset.sub === 'sub-boutique')?.classList.add('is-active');
  } else if (page.startsWith('creations')) {
    navItems.find(li => li.dataset.sub === 'sub-atelier')?.classList.add('is-active');
  } else if (page === 'atelier.html') {
    navItems.find(li => li.querySelector('a[href="atelier.html"]'))?.classList.add('is-active');
  } else if (page === 'message.html' || page === 'contact.html') {
    navItems.find(li => li.querySelector('a[href="message.html"]'))?.classList.add('is-active');
  }

  /* ---- 4. Intersection Observer — fade-in ---- */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => io.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ---- helpers carrousel ---- */
  const duoPerPage = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
  const duoGap    = () => window.innerWidth <= 640 ? 20 : window.innerWidth <= 1024 ? 28 : 44;

  function makeDuoCarousel(trackId, filterOptionsId, toggleId, prevId, nextId, countId) {
    const track      = document.getElementById(trackId);
    const filterOpts = document.getElementById(filterOptionsId);
    const toggleBtn  = document.getElementById(toggleId);
    const prevBtn    = document.getElementById(prevId);
    const nextBtn    = document.getElementById(nextId);
    const countEl    = document.getElementById(countId);
    const navEl      = countEl ? countEl.closest('.carousel-nav') : null;
    const wrapEl     = track ? track.parentElement : null;
    if (!track) return;

    const filters  = filterOpts ? Array.from(filterOpts.querySelectorAll('.filter-btn')) : [];
    const allItems = Array.from(track.querySelectorAll('.col-item[data-category]'));
    let activeFilter = 'all';
    let page = 0;

    if (toggleBtn && filterOpts) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = filterOpts.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        const icon = toggleBtn.querySelector('.filter-toggle__icon');
        if (icon) icon.textContent = isOpen ? '–' : '+';
      });
    }

    const getFiltered = () =>
      activeFilter === 'all' ? allItems : allItems.filter(i => i.dataset.category === activeFilter);

    const animateItems = (items) => {
      items.forEach(item => {
        item.classList.remove('col-item--entering');
        item.style.animationDelay = '';
      });
      track.offsetHeight;
      items.forEach((item, idx) => {
        item.style.animationDelay = `${idx * 0.07}s`;
        item.classList.add('col-item--entering');
      });
    };

    const render = (animate, isFilterChange = false) => {
      const filtered   = getFiltered();
      const perPage    = duoPerPage();
      const gap        = duoGap();
      const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

      allItems.forEach(i => {
        i.style.display = 'none';
        i.classList.remove('col-item--entering');
        i.style.animationDelay = '';
      });
      filtered.forEach(i => { i.style.display = ''; });

      if (isFilterChange) animateItems(filtered);

      if (!animate) track.style.transition = 'none';
      const offset = page * (track.offsetWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
      if (!animate) { track.offsetHeight; track.style.transition = ''; }

      if (prevBtn) prevBtn.disabled = page === 0;
      if (nextBtn) nextBtn.disabled = page >= totalPages - 1;
      if (navEl)   navEl.style.visibility = totalPages > 1 ? 'visible' : 'hidden';
      if (countEl) {
        countEl.innerHTML = '';
        if (totalPages > 1) {
          for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot' + (i === page ? ' active' : '');
            dot.setAttribute('aria-label', `Page ${i + 1}`);
            dot.dataset.page = i;
            countEl.appendChild(dot);
          }
          countEl.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => { page = Number(dot.dataset.page); render(true); });
          });
        }
      }
    };

    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        page = 0;
        render(false, true);
      });
    });

    prevBtn?.addEventListener('click', () => {
      if (page > 0) { page--; render(true); }
    });
    nextBtn?.addEventListener('click', () => {
      const total = Math.max(1, Math.ceil(getFiltered().length / duoPerPage()));
      if (page < total - 1) { page++; render(true); }
    });

    window.addEventListener('resize', () => { page = 0; render(false); }, { passive: true });

    if (wrapEl) {
      wrapEl.addEventListener('scroll', () => {
        if (window.innerWidth > 640) return;
        const items = Array.from(track.querySelectorAll('.col-item')).filter(i => i.style.display !== 'none');
        if (!items.length) return;
        const itemWidth = items[0].offsetWidth;
        const gap = 16;
        const newPage = Math.round(wrapEl.scrollLeft / (itemWidth + gap));
        const clamped = Math.min(Math.max(newPage, 0), items.length - 1);
        if (clamped !== page) {
          page = clamped;
          if (countEl) {
            countEl.querySelectorAll('.carousel-dot').forEach((dot, i) => {
              dot.classList.toggle('active', i === page);
            });
          }
        }
      }, { passive: true });

      let wheelCooldown = false;
      let wheelAccum = 0;
      wrapEl.addEventListener('wheel', (e) => {
        if (window.innerWidth <= 640) return;
        const absX = Math.abs(e.deltaX);
        const absY = Math.abs(e.deltaY);
        if (absY > absX * 1.5) return;
        e.preventDefault();
        if (wheelCooldown) return;
        wheelAccum += e.deltaX;
        if (Math.abs(wheelAccum) > 40) {
          if (wheelAccum > 0 && nextBtn) nextBtn.click();
          else if (wheelAccum < 0 && prevBtn) prevBtn.click();
          wheelAccum = 0;
          wheelCooldown = true;
          setTimeout(() => { wheelCooldown = false; }, 700);
        }
      }, { passive: false });
    }

    render(false);

    const perPageInit = duoPerPage();
    const visibleOnLoad = allItems.filter(i => i.style.display !== 'none').slice(0, perPageInit);
    animateItems(visibleOnLoad);
  }

  /* ---- 5. Filtres galeries produits (dragees.html / creations.html) ---- */
  function initProductFilter(filterId, gridId) {
    const filterEl  = document.getElementById(filterId);
    const grid      = document.getElementById(gridId);
    if (!filterEl || !grid) return;

    const tabs      = Array.from(filterEl.querySelectorAll('.cedric-filter__tab'));
    const cards     = Array.from(grid.querySelectorAll('[data-filter]'));
    const countEl   = filterEl.querySelector('.cedric-filter__count');
    const resetBtn  = filterEl.querySelector('[data-filter-reset]');
    const subGroups = Array.from(document.querySelectorAll(`.cedric-filter__subtabs[data-filter-for="${filterId}"]`));

    const applyFilter = (f, sub) => {
      tabs.forEach(t => t.classList.remove('active'));
      const activeTab = tabs.find(t => t.dataset.filter === f) || tabs[0];
      activeTab.classList.add('active');
      f = activeTab.dataset.filter;

      const matches = card => {
        if (f !== 'all' && card.dataset.filter !== f) return false;
        if (sub && card.dataset.occasion !== sub) return false;
        return true;
      };
      cards.forEach(card => { card.style.display = matches(card) ? '' : 'none'; });
      if (countEl) {
        const visible = cards.filter(matches).length;
        countEl.textContent = `(${visible})`;
      }

      subGroups.forEach(group => {
        const isMatch = group.dataset.parent === f;
        group.classList.toggle('is-visible', isMatch);
        if (isMatch) {
          group.querySelectorAll('.cedric-filter__subtab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sub === (sub || 'all'));
          });
        }
      });

      if (history.replaceState) {
        const qp = [];
        if (f !== 'all') qp.push(`filter=${f}`);
        if (sub) qp.push(`sub=${sub}`);
        const url = window.location.pathname + (qp.length ? `?${qp.join('&')}` : '');
        history.replaceState(null, '', url);
      }
      const main = filterEl.closest('main');
      const headerTitle = main?.querySelector('.collection-header__title');
      const headerDesc  = main?.querySelector('.collection-header__desc');
      if (headerTitle && activeTab.dataset.title) headerTitle.textContent = activeTab.dataset.title;
      if (headerDesc  && activeTab.dataset.desc)  headerDesc.textContent  = activeTab.dataset.desc;
    };

    tabs.forEach(tab => tab.addEventListener('click', () => applyFilter(tab.dataset.filter)));

    subGroups.forEach(group => {
      group.querySelectorAll('.cedric-filter__subtab').forEach(btn => {
        btn.addEventListener('click', () => {
          applyFilter(group.dataset.parent, btn.dataset.sub === 'all' ? undefined : btn.dataset.sub);
        });
      });
    });

    resetBtn?.addEventListener('click', () => applyFilter('all'));

    const urlParams = new URLSearchParams(window.location.search);
    applyFilter(urlParams.get('filter') || 'all', urlParams.get('sub') || undefined);
  }

  initProductFilter('boutique-filter', 'boutique-grid');
  initProductFilter('atelier-filter', 'atelier-grid');

  /* ---- 6. Form validation & submit ---- */
  const devisForm = document.getElementById('devis-form');
  if (devisForm) {
    const validateField = field => {
      const group = field.closest('.form__group');
      if (!group) return true;
      const valid = field.value.trim() !== '';
      group.classList.toggle('has-error', !valid);
      return valid;
    };

    devisForm.querySelectorAll('[required]').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.form__group')?.classList.contains('has-error')) {
          validateField(field);
        }
      });
    });

    devisForm.addEventListener('submit', e => {
      e.preventDefault();
      let allValid = true;
      devisForm.querySelectorAll('[required]').forEach(field => {
        if (!validateField(field)) allValid = false;
      });
      if (!allValid) {
        devisForm.querySelector('.has-error [required]')?.focus();
        return;
      }
      devisForm.style.display = 'none';
      const success = document.getElementById('form-success');
      if (success) { success.classList.add('visible'); success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
  }

  /* ---- 7. File upload label update ---- */
  const fileInput = document.getElementById('inspiration-file');
  const fileLabel = document.getElementById('file-label-text');
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      fileLabel.textContent = fileInput.files[0]?.name ?? "Cliquez pour ajouter une image d'inspiration";
    });
  }

  /* ---- 8. FAQ accordion ---- */
  document.querySelectorAll('.faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq__item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq__item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- 9. Newsletter forms ---- */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button');
      if (input?.value && btn) {
        const original = btn.textContent;
        btn.textContent = '✓';
        input.value = '';
        input.placeholder = 'Merci pour votre inscription !';
        setTimeout(() => { btn.textContent = original; input.placeholder = 'Votre adresse e-mail'; }, 4000);
      }
    });
  });

  /* ---- 10. Lightbox (pages produit) ---- */
  (function() {
    const gallery = document.querySelector('.pdp__gallery');
    if (!gallery) return;
    const img = gallery.querySelector('img');
    if (!img) return;

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Vue agrandie');
    lb.innerHTML =
      '<button class="lightbox__close" aria-label="Fermer">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      '</button>' +
      '<img class="lightbox__img" alt="">';
    document.body.appendChild(lb);

    const lbImg    = lb.querySelector('.lightbox__img');
    const closeBtn = lb.querySelector('.lightbox__close');

    const open = () => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    img.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
    });
  })();

  /* ---- 12. Carrousel garanties (mobile, page d'accueil) ---- */
  (function() {
    var grid = document.querySelector('.garanties__grid--4');
    var dots = document.querySelectorAll('.garanties__dot');
    if (!grid || !dots.length) return;

    var syncDots = function() {
      var idx = Math.round(grid.scrollLeft / grid.offsetWidth);
      dots.forEach(function(d, i) { d.classList.toggle('is-active', i === idx); });
    };

    grid.addEventListener('scroll', syncDots, { passive: true });

    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() {
        grid.scrollTo({ left: i * grid.offsetWidth, behavior: 'smooth' });
      });
    });
  })();

  /* ---- 13. Bascule grille / liste (dragées & créations, mobile) ---- */
  (function() {
    var btnGrid = document.getElementById('view-grid');
    var btnList = document.getElementById('view-list');
    var grids = document.querySelectorAll('.product-grid');
    if (!btnGrid || !btnList || !grids.length) return;

    function setGrid() {
      grids.forEach(function(g) { g.classList.remove('product-grid--list'); });
      btnGrid.classList.add('is-active'); btnGrid.setAttribute('aria-pressed', 'true');
      btnList.classList.remove('is-active'); btnList.setAttribute('aria-pressed', 'false');
    }
    function setList() {
      grids.forEach(function(g) { g.classList.add('product-grid--list'); });
      btnList.classList.add('is-active'); btnList.setAttribute('aria-pressed', 'true');
      btnGrid.classList.remove('is-active'); btnGrid.setAttribute('aria-pressed', 'false');
    }
    btnGrid.addEventListener('click', setGrid);
    btnList.addEventListener('click', setList);
  })();

  /* ---- 14. Fiche produit : dropdown quantité -> prix ---- */
  (function() {
    document.querySelectorAll('[data-price-select]').forEach(function(select) {
      var block = select.closest('[data-qty-block]');
      if (!block) return;
      var priceEl = block.querySelector('[data-price-display]');
      var unitEl = block.querySelector('[data-unit-display]');
      function update() {
        var opt = select.options[select.selectedIndex];
        if (priceEl) priceEl.textContent = opt.value;
        if (unitEl) unitEl.textContent = opt.dataset.unit || '';
      }
      select.addEventListener('change', update);
      update();
    });
  })();

  /* ---- 15. Transmet le produit + sa photo aux formulaires (commande-dragees / commande-creations / contact) ---- */
  (function() {
    function textWithSpaces(el) {
      var text = '';
      el.childNodes.forEach(function(node) {
        text += node.nodeType === 1 && node.tagName === 'BR' ? ' ' : node.textContent;
      });
      return text.replace(/\s+/g, ' ').trim();
    }

    function addProductParams(link, produit, imageSrc) {
      if (!link || !produit || !imageSrc) return;
      var href = link.getAttribute('href');
      if (!href || (href.indexOf('contact.html') === -1 && href.indexOf('commande-dragees.html') === -1 && href.indexOf('commande-creations.html') === -1)) return;
      var parts = href.split('?');
      var params = new URLSearchParams(parts[1] || '');
      params.set('produit', produit);
      params.set('image', new URL(imageSrc, window.location.href).href);
      link.setAttribute('href', parts[0] + '?' + params.toString());
    }

    var pdpCta = document.querySelector('.pdp__cta');
    var pdpImg = document.querySelector('.pdp__gallery img');
    var pdpTitle = document.querySelector('.pdp__title');
    if (pdpCta && pdpImg && pdpTitle) {
      addProductParams(pdpCta, textWithSpaces(pdpTitle), pdpImg.getAttribute('src'));
    }

    document.querySelectorAll('.product-card').forEach(function(card) {
      var img = card.querySelector('.product-card__media img');
      var titleEl = card.querySelector('.product-card__title');
      if (!img || !titleEl) return;
      var produit = textWithSpaces(titleEl);
      var imageSrc = img.getAttribute('src');
      card.querySelectorAll('.product-card__actions a').forEach(function(link) {
        addProductParams(link, produit, imageSrc);
      });
    });
  })();

  /* ---- 16. FAB — bouton flottant mobile (bas-droite) ---- */
  (function() {
    if (window.innerWidth > 768) return;
    var fab = document.createElement('a');
    fab.href = 'contact.html';
    fab.className = 'fab';
    fab.setAttribute('aria-label', 'Lancer ma création');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>';
    document.body.appendChild(fab);
  })();

});

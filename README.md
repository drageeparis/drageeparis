# Dragée Paris · Site vitrine

Site vitrine e-commerce vitrine (sans paiement en ligne) pour **Dragée Paris**, confiseur-artisan en Île-de-France spécialisé dans les dragées personnalisables — Boutique (dragées classiques, vente au poids) et Atelier (créations sur-mesure par occasion).

Aucune dépendance, aucun build : HTML/CSS/JS pur. Le site s'ouvre directement dans un navigateur, ou se sert en local avec `python3 -m http.server`.

## Structure du projet

```
drageeparis/
├── index.html                    # Accueil
├── boutique.html                 # Catalogue Boutique (filtres par famille)
├── atelier.html                  # Catalogue Atelier (filtres par occasion)
├── boutique-avola.html           # Redirections noindex (anciennes URLs de catégorie → boutique.html?filter=...)
├── boutique-chocolats.html       #   idem
├── boutique-gourmandes.html      #   idem
├── boutique-traditionnelles.html #   idem
├── produit-*.html                # 85 fiches produit individuelles (1 par couleur/occasion)
├── personnalisation.html         # Options de personnalisation
├── commande-boutique.html        # Formulaire de commande (Boutique)
├── contact.html                  # Formulaire "Lancer ma création" (wizard, Atelier)
├── message.html                  # Formulaire de contact simple
├── a-propos.html                 # Histoire, valeurs, localisation
├── mentions-legales.html         # Mentions légales & CGV
├── 404.html
├── style.css                     # Feuille de style unique (~5 900 lignes, sections commentées en majuscules)
├── main.js                       # JavaScript commun (nav, animations, filtres) — sections numérotées en commentaires
├── contact-wizard.js             # Logique du formulaire contact.html (script externe, imposé par la CSP)
├── commande-boutique-form.js     # Logique du formulaire commande-boutique.html (idem)
├── message-form.js               # Logique du formulaire message.html (idem)
├── robots.txt / sitemap.xml      # À régénérer si des pages sont ajoutées/retirées (voir SEO)
├── manifest.json                 # PWA minimal (icônes, theme-color)
├── logos-svg/                     # Exports de marque (hors usage site, voir plus bas)
└── images/
    ├── mariage/, premiers-instants/, fetes-religieuses/, anniversaire/, naissance/, bapteme/  # Photos Atelier par occasion
    ├── chocolat-amande/, amandes-avola/, amandes-traditionnelles/, dragee-chocolat/           # Photos Boutique par famille
    ├── images-library/, illustration-habillage/, hero/                                        # Visuels homepage / pages institutionnelles
    └── artisanat_1.png, illustration3.png                                                     # Photos atelier / à propos
```

**Chaque fiche produit est indépendante** (pas de templating serveur) : modifier le header, le footer ou la structure d'une page implique de répercuter le changement sur les fichiers concernés à la main. Header et footer sont volontairement tenus identiques sur presque toutes les pages — vérifier qu'un changement ne casse pas cette cohérence avant de commiter.

## Deux modèles de prix

- **Boutique** (`produit-chocolat-*`, `produit-amande-chocolat-*`, `produit-avola-*`, `produit-traditionnelle-*`) : vente au poids — sélecteur 250 g / 500 g / 1 kg (`data-price-select` + `data-qty-block` dans `main.js`, section 15).
- **Atelier** (tous les autres `produit-*`) : vente au nombre de dragées — soit un sélecteur "X dragées / Sans dragée", soit un prix fixe, soit aucun prix affiché si le produit n'en a pas encore. Pas de notion de poids côté Atelier.

## Palette (variables CSS, `style.css:73`)

| Variable            | Hex       | Usage                          |
|----------------------|-----------|---------------------------------|
| `--color-background` (`--paper`) | `#F3ECE6` | Fond principal |
| `--color-foreground` (`--ink`)   | `#52362A` | Texte principal |
| `--color-heading` (`--caramel`)  | `#965F36` | Accent, CTA, liens, boutons |
| `--paper-2`                      | `#EDE8E0` | Sections alternées |
| `--noir-hero`                    | `#120E09` | Fonds sombres (hero, footer) |

Toutes les couleurs sont dérivées de ces 3 variables racines (`--color-background`, `--color-foreground`, `--color-heading`) — les autres noms (`--paper`, `--ink`, `--caramel`…) sont des alias conservés pour compatibilité avec les composants existants.

## Typographie

Une seule famille : **Akkurat** (`akkurat_fonts/`, 3 graisses : Light/Regular/Bold), appliquée à la fois aux titres et au corps de texte via `--font-body--family` et `--font-heading--family`. `fonts/Cormorant_Garamond` est présent sur le disque mais n'est utilisé par aucun sélecteur — ne pas s'y fier pour styliser une nouvelle page.

## Convention de nommage CSS "Cédric"

Un préfixe `cedric-*` revient dans de nombreuses classes (`.cedric-split`, `.cedric-products`, `.cedric-filter`…) et dans les commentaires de section ("style Cédric"). C'est le nom de code interne de la direction artistique du site (voir le commentaire en tête de `style.css`) — pas une référence externe à retrouver. À réutiliser tel quel pour toute nouvelle section qui suit la même direction artistique.

## Formulaires (Formspree)

Le site utilise 3 formulaires Formspree indépendants, chacun avec son propre endpoint :

| Page | Usage | Endpoint |
|---|---|---|
| `contact.html` | Wizard "Lancer ma création" (Atelier) | `formspree.io/f/mlgqrzed` (via `var FORMSPREE_ID` dans `contact-wizard.js`) |
| `commande-boutique.html` | Commande Boutique | `formspree.io/f/xeeyjnae` (codé en dur dans `commande-boutique-form.js`) |
| `message.html` | Contact simple | `formspree.io/f/xzdnpoez` (codé en dur dans `message-form.js`) |

Pour régénérer un endpoint (compte Formspree, formulaire expiré, etc.), remplacer l'ID à l'emplacement correspondant ci-dessus — il n'y a pas de configuration centralisée. Chaque formulaire transmet aussi l'image du produit cliqué par le prospect (paramètres d'URL `produit`/`image`, voir `main.js` section 15) pour que le mail reçu par Dragée Paris inclue la photo de référence.

## Sécurité

- **CSP stricte** : `script-src 'self'` (sans `'unsafe-inline'`) sur les 97 pages. C'est pourquoi la logique des 3 formulaires vit dans des fichiers externes (`contact-wizard.js`, `commande-boutique-form.js`, `message-form.js`) plutôt que dans des `<script>` inline — **toute nouvelle logique JS sur une page doit suivre le même principe** (fichier externe, jamais de `<script>` inline avec du code), sous peine d'être bloquée par la CSP. `style-src` conserve `'unsafe-inline'` (usage massif de `style=""` dans les 97 pages, retirer ce point demanderait une refonte hors de proportion).
- **`frame-ancestors`** (anti-clickjacking) ne peut pas être fixé : cette directive CSP est ignorée par les navigateurs quand elle est livrée via balise `<meta>` (elle exige un en-tête HTTP), et GitHub Pages ne permet pas de configurer d'en-têtes personnalisés. Limitation de l'hébergeur, pas un oubli — à garder en tête si le site migre un jour vers un hébergeur qui autorise les en-têtes custom (Netlify, Cloudflare Pages…).
- Les paramètres d'URL `produit`/`image` transmis aux formulaires sont revalidés côté formulaire (`isSafeImageUrl()` dans `contact-wizard.js` / `commande-boutique-form.js`) : seule une image same-origin sous `/images/` est acceptée avant d'être incluse dans l'e-mail envoyé au propriétaire — évite qu'un lien forgé n'insère une URL arbitraire dans sa boîte mail.
- Les 3 formulaires ont un champ piège anti-spam (`_gotcha`, invisible et ignoré des lecteurs d'écran) : si rempli, la soumission est abandonnée côté client sans requête réseau.

## SEO

`sitemap.xml` et `robots.txt` sont maintenus à la main :
- Toute nouvelle page `produit-*.html` doit être ajoutée à `sitemap.xml`.
- Toute page de redirection (`<meta http-equiv="refresh">`, comme les `boutique-*.html` de catégorie) doit avoir `<meta name="robots" content="noindex, follow">` et une entrée `Disallow` dans `robots.txt`.
- Chaque fiche produit porte un schema JSON-LD `Product` ; `index.html` porte le schema `LocalBusiness`.

## Déploiement sur GitHub Pages

Le site est déployé automatiquement (Actions `pages-build-deployment`) à chaque push sur `main`, à l'URL `https://drageeparis.fr/` (domaine personnalisé configuré via `CNAME`, DNS chez OVH). L'ancienne URL `https://se-ho-ux.github.io/drageeparis/` reste fonctionnelle en parallèle.

## Dossier `logos-svg/`

Exports de la marque (symbole seul + lockup horizontal, en noir/blanc, avec/sans fond) destinés aux usages hors site — impression, réseaux sociaux, partenaires. Ce dossier n'est référencé par aucune page : le favicon et les icônes utilisés par le site (`favicon.svg`, `apple-touch-icon.png`…) sont des fichiers séparés à la racine.

## Fonctionnalités

- Navigation sticky avec drawer plein écran bicolonne (menu global)
- Animations fade-in au scroll (IntersectionObserver)
- Filtres Boutique / Atelier par famille ou occasion, avec sous-filtres et état dans l'URL
- Formulaires avec validation inline, upload d'image d'inspiration, message de succès
- Bascule grille / liste sur mobile (Boutique / Atelier)
- Responsive : 375 px / 768 px / 1024 px / 1440 px, `prefers-reduced-motion` respecté
- Accessibilité : skip-link, aria-labels, focus-visible, alt text sur 100 % des images

## Personnalisation

- **Coordonnées / réseaux sociaux** : présents dans le footer (dupliqué sur chaque page) et dans le schema `LocalBusiness` de `index.html`
- **SIRET / infos légales** : `mentions-legales.html`

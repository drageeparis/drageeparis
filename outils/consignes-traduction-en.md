# Consignes de traduction — version anglaise de drageeparis.fr

Les pages anglaises sont dans `en/` (copies des pages françaises, chemins des ressources déjà corrigés en `../`).
Tu traduis le contenu EN PLACE dans les fichiers `en/*.html` qui te sont attribués, et seulement ceux-là.
Lis d'abord `outils/glossaire-en.md` et applique-le strictement (noms de navigation, produits, couleurs, occasions, ton).

## À traduire
- Tout le texte visible (titres, paragraphes, boutons, listes, tableaux, légendes, mentions).
- `<title>`, `meta name="description"`, `og:title`, `og:description`, `twitter:title`, `twitter:description`.
- Attributs lisibles : `alt`, `aria-label`, `title`, `placeholder`, `aria-description`.
- Texte lisible dans le JSON-LD (`"name"`, `"description"`… mais pas les URL).
- Le header, le menu (drawer) et le footer de chaque page (selon le glossaire).
- Téléphone affiché : « +33 6 08 67 14 43 » (le lien `tel:+33608671443` ne change pas).

## À NE PAS modifier
- `href`, `src`, `srcset`, `class`, `id`, `for`, `name`, `type`, URL, chemins, balises `<script>`, CSS.
- Les attributs `value` des champs de formulaire (`<input value="…">`, `<option value="…">`) : ils sont envoyés à l'équipe française et lus par le JavaScript. Traduire seulement le libellé visible à côté.
- Les attributs `data-*` qui servent au JavaScript (`data-cat`, `data-filter`, `data-sub`, `data-n`, `data-hex`, `data-ref`, `data-format`, `data-size`, `data-font`, `data-max`, `data-min`, `data-index`…). Exception : `data-tip` (infobulle affichée) se traduit ; `data-containers` dans contact.html se traduit seulement pour les parties nom et description (`cle::Nom::Description`), jamais la clé.
- La structure HTML : ne pas ajouter ni retirer d'éléments, ne pas reformater le fichier. Fais des remplacements ciblés (Edit, ou script Python de remplacement exact) ; ne réécris jamais un fichier entier à partir de ta mémoire.
- `lang="en"`, canonical et hreflang sont déjà en place.

## Qualité
- Anglais britannique naturel, premium et sobre, comme un confiseur haut de gamme parisien écrirait pour une clientèle internationale. Pas de traduction mot à mot maladroite.
- Garder « dragée(s) ». Garder Dragée Paris, Prali Amande, les noms évocateurs de modèles (voir glossaire).
- Après traduction, vérifie qu'il ne reste pas de texte français visible : par exemple
  `python3 -c "import re,html,sys; s=open(sys.argv[1]).read(); s=re.sub(r'<script.*?</script>|<style.*?</style>|<svg.*?</svg>','',s,flags=re.S); print('\n'.join(x for x in (html.unescape(t).strip() for t in re.sub(r'<[^>]+>','\n',s).split('\n')) if x))" en/PAGE.html`
  et relis les attributs alt/aria-label/placeholder/title.
- Vérifie que le HTML reste valide (mêmes balises qu'avant) : `diff <(grep -o '<[a-zA-Z/][^ >]*' PAGE.html) <(grep -o '<[a-zA-Z/][^ >]*' en/PAGE.html)` doit être vide.

Ne fais pas de commit git. À la fin, réponds en une ou deux phrases : pages traduites, et tout point douteux (texte que tu n'as pas su traduire, ou attribut dont tu n'étais pas sûr).

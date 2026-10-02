#!/usr/bin/env python3
"""Régénère commande-catalogue.js à partir des fiches produit Boutique.

À lancer depuis la racine du site après l'ajout ou la modification d'une fiche
(prix, nom, photo) :  python3 outils/catalogue-commande.py
Lit : produit-avola-*, produit-traditionnelle-*, produit-chocolat-*, produit-amande-chocolat-*
"""
import glob, json, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAMILLES = {
    'avola': ('avola', 'Amandes Avola'),
    'traditionnelles': ('traditionnelles', 'Amandes traditionnelles'),
    'chocolats': ('chocolats', 'Chocolats'),
    'gourmandes': ('gourmandes', 'Chocolats amandes'),
}
ORDRE = ['avola', 'traditionnelles', 'chocolats', 'gourmandes']

def prix(txt):
    return float(txt.replace('€', '').replace(' ', '').strip().replace(',', '.'))

def grammes(unite):
    u = unite.replace(' ', '').lower()
    if u.endswith('kg'):
        return int(float(u[:-2].replace(',', '.')) * 1000)
    if u.endswith('g'):
        return int(u[:-1])
    return None

produits = []
motifs = ['produit-avola-*.html', 'produit-traditionnelle-*.html', 'produit-chocolat-*.html', 'produit-amande-chocolat-*.html']
for motif in motifs:
    for chemin in sorted(glob.glob(os.path.join(ROOT, motif))):
        s = open(chemin, encoding='utf-8').read()
        fichier = os.path.basename(chemin)
        ref = fichier[len('produit-'):-len('.html')]
        titre = re.search(r'class="pdp__title">(.*?)</h1>', s, re.S).group(1)
        titre = re.sub(r'\s+', ' ', re.sub(r'<br\s*/?>', ' ', titre)).strip()
        detail = re.search(r'class="pdp__weight">(.*?)</p>', s, re.S)
        detail = re.sub(r'\s+', ' ', detail.group(1)).strip() if detail else ''
        img = re.search(r'<source type="image/webp" srcset="\./([^ ]+-800w\.webp)', s)
        img = img.group(1) if img else re.search(r'class="pdp__gallery">.*?<img src="\./([^"]+)"', s, re.S).group(1)
        filtre = re.search(r'href="dragees\.html\?filter=([a-z]+)" class="pdp__back"', s).group(1)
        formats = []
        for valeur, unite in re.findall(r'<option value="([^"]+)" data-unit="([^"]+)"', s):
            g = grammes(unite)
            if g:
                formats.append({'id': unite.replace(' ', '').lower(), 'label': unite, 'grams': g, 'price': prix(valeur)})
        if not formats:
            continue
        formats.sort(key=lambda f: f['grams'])
        fam_id, fam_nom = FAMILLES[filtre]
        produits.append({'ref': ref, 'name': titre, 'familyId': fam_id, 'family': fam_nom,
                         'familyUrl': 'dragees.html?filter=' + filtre, 'detail': detail,
                         'url': fichier, 'image': img, 'formats': formats})

produits.sort(key=lambda p: (ORDRE.index(p['familyId']), p['name']))
catalogue = {p.pop('ref'): p for p in produits}
familles = [{'id': FAMILLES[k][0], 'name': FAMILLES[k][1]} for k in ORDRE]
js = ('/* Fichier généré par outils/catalogue-commande.py à partir des fiches produit. Ne pas modifier à la main. */\n'
      'window.DP_FAMILLES = ' + json.dumps(familles, ensure_ascii=False) + ';\n'
      'window.DP_CATALOGUE = ' + json.dumps(catalogue, ensure_ascii=False, indent=1) + ';\n')
open(os.path.join(ROOT, 'commande-catalogue.js'), 'w', encoding='utf-8').write(js)
print(len(catalogue), 'produits écrits dans commande-catalogue.js')

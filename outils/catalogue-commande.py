#!/usr/bin/env python3
"""Régénère commande-catalogue.js à partir des fiches produit (dragées Boutique et créations Atelier).

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


# ---------- Créations (Atelier) : prix à la pièce ----------
FAM_CREA = {
    'mariage': ('mariage', 'Mariage'),
    'premiers-instants': ('premiers-instants', 'Premiers instants'),
    'fetes-religieuses': ('fetes-religieuses', 'Fêtes religieuses'),
    'anniversaires': ('anniversaires', 'Anniversaires'),
    '': ('bouquets', 'Bouquets & écrins'),
}
ORDRE_CREA = ['mariage', 'premiers-instants', 'fetes-religieuses', 'anniversaires', 'bouquets']
BOUTIQUE = ('produit-avola-', 'produit-traditionnelle-', 'produit-chocolat-', 'produit-amande-chocolat-')

def fmt_id(label):
    return re.sub(r'\s+', '', label).lower()

def txt(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html)).strip()

creations = []
for chemin in sorted(glob.glob(os.path.join(ROOT, 'produit-*.html'))):
    fichier = os.path.basename(chemin)
    if fichier.startswith(BOUTIQUE):
        continue
    s = open(chemin, encoding='utf-8').read()
    ref = fichier[len('produit-'):-len('.html')]
    titre = re.search(r'class="pdp__title">(.*?)</h1>', s, re.S).group(1)
    titre = re.sub(r'\s+', ' ', re.sub(r'<br\s*/?>', ' ', titre)).strip()
    img = re.search(r'<source type="image/webp" srcset="\./([^ ]+-800w\.webp)', s)
    img = img.group(1) if img else re.search(r'class="pdp__gallery">.*?<img src="\./([^"]+)"', s, re.S).group(1)
    back = re.search(r'href="([^"]+)" class="pdp__back"', s).group(1).replace('&amp;', '&')
    m = re.search(r'filter=([a-z-]+)', back)
    fam_id, fam_nom = FAM_CREA[m.group(1) if m else '']
    formats = []
    opts = re.findall(r'<option value="([^"]+)" data-unit="([^"]+)"', s)
    if opts:
        for valeur, unite in opts:
            label = ('Avec ' + unite) if re.match(r'\d', unite) else unite
            formats.append({'id': fmt_id(unite), 'label': label, 'price': prix(valeur)})
    else:
        lignes = [txt(x) for x in re.findall(r'<p class="pdp__price"[^>]*>(.*?)</p>', s, re.S)]
        for l in lignes:
            mm = re.match(r'([\d,]+) € (avec|sans) dragées', l)
            if mm:
                label = 'Avec dragées' if mm.group(2) == 'avec' else 'Sans dragées'
                formats.append({'id': fmt_id(label), 'label': label, 'price': prix(mm.group(1))})
                continue
            mm = re.match(r'(\d+ dragées) — ([\d,]+) €', l)
            if mm:
                formats.append({'id': fmt_id(mm.group(1)), 'label': mm.group(1), 'price': prix(mm.group(2))}); continue
            mm = re.match(r'À partir de ([\d,]+) € les (.+)', l)
            if mm:
                formats.append({'id': fmt_id(mm.group(2)), 'label': mm.group(2), 'price': prix(mm.group(1)), 'from': True}); continue
            mm = re.match(r'(.+?) — à partir de ([\d,]+) €', l)
            if mm:
                formats.append({'id': fmt_id(mm.group(1)), 'label': mm.group(1), 'price': prix(mm.group(2)), 'from': True}); continue
            mm = re.match(r'([\d,]+) €$', l)
            if mm:
                formats.append({'id': 'piece', 'label': 'À la pièce', 'price': prix(mm.group(1))}); continue
    if not formats:
        formats = [{'id': 'devis', 'label': 'Sur devis', 'price': None}]
    creations.append({'ref': ref, 'kind': 'creation', 'name': titre, 'familyId': fam_id, 'family': fam_nom,
                      'familyUrl': back, 'detail': 'Prix à la pièce', 'url': fichier, 'image': img, 'formats': formats})

creations.sort(key=lambda p: (ORDRE_CREA.index(p['familyId']), p['name']))
for p in produits:
    p['kind'] = 'dragee'
produits.sort(key=lambda p: (ORDRE.index(p['familyId']), p['name']))

# ---------- Version anglaise : noms et détails lus dans en/produit-*.html ----------
FAM_EN = {'avola': 'Avola almonds', 'traditionnelles': 'Traditional almonds', 'chocolats': 'Chocolate dragées',
          'gourmandes': 'Chocolate almonds', 'mariage': 'Wedding', 'premiers-instants': 'First moments',
          'fetes-religieuses': 'Religious celebrations', 'anniversaires': 'Birthdays', 'bouquets': 'Bouquets & gift boxes'}

def label_en(label):
    m = re.match(r'Avec (\d+) dragées?$', label)
    if m: return 'With ' + m.group(1) + ' dragées'
    m = re.match(r'(\d+) dragées au chocolat$', label)
    if m: return m.group(1) + ' chocolate dragées'
    return {'Avec dragées': 'With dragées', 'Sans dragée': 'Without dragées', 'Sans dragées': 'Without dragées',
            'À la pièce': 'Per piece', 'Sur devis': 'On quotation'}.get(label, label)

for p in produits + creations:
    p['family_en'] = FAM_EN[p['familyId']]
    for f in p['formats']:
        f['label_en'] = label_en(f['label'])
    chemin_en = os.path.join(ROOT, 'en', p['url'])
    if os.path.exists(chemin_en):
        s_en = open(chemin_en, encoding='utf-8').read()
        t = re.search(r'class="pdp__title">(.*?)</h1>', s_en, re.S)
        if t: p['name_en'] = re.sub(r'\s+', ' ', re.sub(r'<br\s*/?>', ' ', t.group(1))).strip()
        d = re.search(r'class="pdp__weight">(.*?)</p>', s_en, re.S)
        if p['kind'] == 'creation': p['detail_en'] = 'Price per piece'
        elif d: p['detail_en'] = re.sub(r'\s+', ' ', d.group(1)).strip()

catalogue = {p.pop('ref'): p for p in produits + creations}
familles = [{'id': FAMILLES[k][0], 'name': FAMILLES[k][1], 'name_en': FAM_EN[FAMILLES[k][0]], 'kind': 'dragee'} for k in ORDRE] + \
           [{'id': v[0], 'name': v[1], 'name_en': FAM_EN[v[0]], 'kind': 'creation'} for k, v in sorted(FAM_CREA.items(), key=lambda kv: ORDRE_CREA.index(kv[1][0]))]
js = ('/* Fichier généré par outils/catalogue-commande.py à partir des fiches produit. Ne pas modifier à la main. */\n'
      'window.DP_FAMILLES = ' + json.dumps(familles, ensure_ascii=False) + ';\n'
      'window.DP_CATALOGUE = ' + json.dumps(catalogue, ensure_ascii=False, indent=1) + ';\n')
open(os.path.join(ROOT, 'commande-catalogue.js'), 'w', encoding='utf-8').write(js)
print(len(produits), 'dragées et', len(creations), 'créations écrites dans commande-catalogue.js')

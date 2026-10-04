#!/usr/bin/env python3
"""Crée (ou recrée) la copie anglaise d'une ou plusieurs pages dans en/.

Usage :  python3 outils/build-en.py page.html [page2.html ...]   (ou --all)
- chemins des ressources (images/, style.css, *.js, fonts/…) préfixés par ../
- lang="en", canonical / og:url vers /en/, og:locale en_GB
- les liens entre pages (.html) restent relatifs : ils pointent vers les pages anglaises
ATTENTION : écrase la page anglaise existante (la traduction est à refaire).
"""
import os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = {n for n in os.listdir(ROOT) if not n.endswith('.html') and n not in ('en', '.git')}

def fix_path(v):
    v0 = v.strip()
    if v0.startswith('./'):
        v0 = v0[2:]
    if not v0 or re.match(r'^(/|#|\?|[a-z]+:|\.\./)', v0):
        return v
    first = re.split(r"[/?#]", v0, maxsplit=1)[0]
    return '../' + v0 if first in ASSETS else v

def fix_srcset(v):
    return ', '.join(' '.join([fix_path(p.split()[0])] + p.split()[1:]) for p in v.split(',') if p.strip())

def convert(html):
    html = re.sub(r'(\s(?:src|href|poster|data-[\w-]+|content|action))="([^"]*)"', lambda m: m.group(1) + '="' + fix_path(m.group(2)) + '"', html)
    html = re.sub(r'(\s(?:srcset|data-srcset))="([^"]*)"', lambda m: m.group(1) + '="' + fix_srcset(m.group(2)) + '"', html)
    html = re.sub(r"url\((['\"]?)([^)'\"]+)\1\)", lambda m: 'url(' + m.group(1) + fix_path(m.group(2)) + m.group(1) + ')', html)
    html = html.replace('<html lang="fr">', '<html lang="en">', 1)
    html = re.sub(r'href="/"', 'href="index.html"', html)
    html = re.sub(r'((?:rel="canonical"|property="og:url")[^>]*?(?:href|content)=")https://drageeparis\.fr/', r'\1https://drageeparis.fr/en/', html)
    html = html.replace('content="fr_FR"', 'content="en_GB"')
    return html

def hreflang(html):
    """Ajoute les balises hreflang FR/EN juste après la balise canonical (si absentes)."""
    if 'hreflang=' in html:
        return html
    m = re.search(r'<link rel="canonical" href="https://drageeparis\.fr/(?:en/)?([^"]*)">', html)
    if not m:
        return html
    path = m.group(1)
    block = ('\n  <link rel="alternate" hreflang="fr" href="https://drageeparis.fr/' + path + '">'
             '\n  <link rel="alternate" hreflang="en" href="https://drageeparis.fr/en/' + path + '">'
             '\n  <link rel="alternate" hreflang="x-default" href="https://drageeparis.fr/' + path + '">')
    return html[:m.end()] + block + html[m.end():]

pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html')) if sys.argv[1:] == ['--all'] else sys.argv[1:]
os.makedirs(os.path.join(ROOT, 'en'), exist_ok=True)
for p in pages:
    src = hreflang(open(os.path.join(ROOT, p), encoding='utf-8').read())
    open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(src)
    open(os.path.join(ROOT, 'en', p), 'w', encoding='utf-8').write(convert(src))
print(len(pages), 'page(s) copiée(s) dans en/')

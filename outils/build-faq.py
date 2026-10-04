#!/usr/bin/env python3
"""Génère faq.html et en/faq.html (questions fréquentes + données structurées FAQPage).

Les questions sont dans la liste FAQ ci-dessous : modifier ici, puis lancer
    python3 outils/build-faq.py
La page reprend l'en-tête, le menu et le pied de page de message.html / en/message.html.
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (groupe, question, réponse) — la réponse peut contenir des liens <a href="...">
FAQ = {
'fr': [
 ('Prix & commande', 'Combien coûte une boîte de dragées personnalisée ?',
  'Notre boîte en carton personnalisée (étiquette à vos prénoms et nœud satiné inclus) est à 3,50 €, sans dragées. Les dragées sont à 0,10 € l’unité : avec 5 dragées, la boîte revient à 4 €. Le bouquet champêtre ajoute 0,50 €. Nos créations du catalogue (mariage, baptême, naissance, anniversaire) vont de 3,50 € à 5,50 € la pièce selon le modèle et le nombre de dragées. Le prix s’affiche en direct dans notre <a href="contact.html">configurateur</a>.'),
 ('Prix & commande', 'Y a-t-il une remise pour les grandes quantités ?',
  'Oui : une remise de 10 % s’applique automatiquement dès 100 boîtes ou 100 pièces d’un même modèle.'),
 ('Prix & commande', 'Quel est le minimum de commande ?',
  'Pour une création sur mesure via « Lancer ma création », la commande démarre à 20 boîtes. Les dragées au poids se commandent à partir de 250 g ou 500 g selon la variété.'),
 ('Prix & commande', 'Le paiement se fait-il en ligne ?',
  'Non, il n’y a aucun paiement en ligne. Vous envoyez une demande gratuite et sans engagement ; nous vous confirmons le prix définitif par e-mail, et rien n’est préparé sans votre accord.'),
 ('Dragées', 'Combien de dragées prévoir par invité ?',
  'La tradition veut que l’on offre 5 dragées par invité. Selon le contenant, nos créations en contiennent généralement de 5 à 10 ; notre boîte en carton peut en accueillir de 5 à 20.'),
 ('Dragées', 'Pourquoi offre-t-on 5 dragées ?',
  'Le chiffre 5 est traditionnel : chaque dragée symbolise un vœu pour les invités, la santé, le bonheur, la prospérité, la fécondité et la longévité. On offre toujours un nombre impair de dragées.'),
 ('Dragées', 'Quelle est la différence entre dragées Avola, traditionnelles et chocolat ?',
  'La dragée Avola renferme une amande d’Avola, en Sicile, réputée la plus fine (calibres 36 à 38) : c’est la dragée d’exception. La dragée traditionnelle renferme une amande classique. La dragée chocolat a un cœur de chocolat noir 70 %, sans amande. Les Prali Amande associent une amande et un enrobage de chocolat au lait ou noir. Voir <a href="dragees.html">toutes nos dragées</a>.'),
 ('Dragées', 'Les dragées contiennent-elles des allergènes ?',
  'Nos dragées sont fabriquées dans un atelier qui manipule des fruits à coque, du gluten, du lait et du soja ; elles peuvent en contenir des traces. Les dragées Avola, traditionnelles et Prali Amande contiennent des amandes. La composition détaillée figure sur chaque fiche produit.'),
 ('Personnalisation', 'Comment se passe la personnalisation ?',
  'Vous composez votre création en quelques minutes dans notre <a href="contact.html">configurateur</a> : occasion, contenant, dragées, étiquette et décoration. Nous vous envoyons une maquette gratuite sous 48 h ouvrées, que vous pouvez ajuster librement. La préparation ne commence qu’après votre validation.'),
 ('Personnalisation', 'Que peut-on écrire sur l’étiquette ?',
  'Vos prénoms ou votre nom, et une date ou un petit mot. Vous choisissez la forme de l’étiquette (ronde, carrée ou rectangle), le style d’écriture (élégant, calligraphié ou classique) et les couleurs.'),
 ('Personnalisation', 'Pour quelles occasions proposez-vous des dragées ?',
  'Mariage, fiançailles, anniversaire de mariage, baptême, communion, naissance, baby shower, gender reveal, anniversaire et événement d’entreprise. Découvrez <a href="creations.html">nos créations</a>.'),
 ('Délais & livraison', 'Quel est le délai de préparation ?',
  'Comptez 5 à 10 jours pour les dragées au poids. Pour une création personnalisée, nous vous recommandons de nous contacter 4 à 6 semaines avant votre événement. Pour un délai plus court, appelez-nous au <a href="tel:+33608671443">06 08 67 14 43</a>.'),
 ('Délais & livraison', 'Livrez-vous partout en France et à l’étranger ?',
  'Oui, nous livrons en France et en Europe en point relais Mondial Relay, avec un emballage soigné et adapté au transport. Pour les dragées au poids, la livraison est offerte jusqu’à 1 kg, puis facturée 12 € par kilo entamé. Pour les créations, les frais sont précisés avec votre proposition.'),
 ('Délais & livraison', 'Peut-on retirer sa commande ou venir à l’atelier ?',
  'Oui, le retrait est possible à notre atelier d’Athis-Mons (145 Ter, avenue Jacques Chirac, 91200), sur rendez-vous. Des rendez-vous peuvent aussi être organisés pour les commandes importantes ou pour voir nos créations.'),
 ('Contact', 'Comment vous contacter ?',
  'Par téléphone au <a href="tel:+33608671443">06 08 67 14 43</a>, du lundi au vendredi de 9 h à 18 h, par e-mail à <a href="mailto:drageeparis@gmail.com">drageeparis@gmail.com</a> ou via notre <a href="message.html">formulaire de contact</a>. Nous répondons sous 48 heures.'),
],
'en': [
 ('Prices & ordering', 'How much does a personalised box of dragées cost?',
  'Our personalised cardboard box (label with your names and satin bow included) costs €3.50 without dragées. Dragées are €0.10 each, so a box with 5 dragées comes to €4. The country-style bouquet adds €0.50. Our catalogue creations (wedding, christening, birth, birthday) range from €3.50 to €5.50 per piece depending on the model and number of dragées. The price is shown live in our <a href="contact.html">configurator</a>.'),
 ('Prices & ordering', 'Is there a discount for large quantities?',
  'Yes: a 10% discount is applied automatically from 100 boxes or 100 pieces of the same model.'),
 ('Prices & ordering', 'What is the minimum order?',
  'For a bespoke creation through “Start my creation”, orders start at 20 boxes. Dragées sold by weight can be ordered from 250 g or 500 g depending on the variety.'),
 ('Prices & ordering', 'Do I pay online?',
  'No, there is no online payment. You send a free, no-obligation request; we confirm the final price by email, and nothing is prepared without your approval.'),
 ('Dragées', 'How many dragées per guest?',
  'Tradition calls for 5 dragées per guest. Depending on the container, our creations usually hold 5 to 10; our cardboard box can hold 5 to 20.'),
 ('Dragées', 'Why are 5 dragées given?',
  'Five is the traditional number: each dragée stands for a wish for your guests, health, happiness, prosperity, fertility and longevity. Dragées are always given in odd numbers.'),
 ('Dragées', 'What is the difference between Avola, traditional and chocolate dragées?',
  'An Avola dragée holds an almond from Avola, in Sicily, renowned as the finest (calibre 36 to 38): it is the exceptional dragée. A traditional dragée holds a classic almond. A chocolate dragée has a 70% dark chocolate centre and no almond. Prali Amande combine an almond with a milk or dark chocolate coating. See <a href="dragees.html">all our dragées</a>.'),
 ('Dragées', 'Do the dragées contain allergens?',
  'Our dragées are made in a workshop that handles nuts, gluten, milk and soya, and may contain traces of them. Avola, traditional and Prali Amande dragées contain almonds. Full ingredients are listed on each product page.'),
 ('Personalisation', 'How does personalisation work?',
  'You design your creation in a few minutes in our <a href="contact.html">configurator</a>: occasion, container, dragées, label and decoration. We send you a free mock-up within 48 working hours, which you can adjust freely. Preparation only starts once you approve it.'),
 ('Personalisation', 'What can be written on the label?',
  'Your names or surname, plus a date or a short message. You choose the label shape (round, square or rectangle), the lettering style (elegant, calligraphy or classic) and the colours.'),
 ('Personalisation', 'Which occasions do you make dragées for?',
  'Weddings, engagements, wedding anniversaries, christenings, First Communions, births, baby showers, gender reveals, birthdays and corporate events. Discover <a href="creations.html">our creations</a>.'),
 ('Lead times & delivery', 'How long does preparation take?',
  'Allow 5 to 10 days for dragées sold by weight. For a personalised creation, we recommend contacting us 4 to 6 weeks before your event. For shorter notice, call us on <a href="tel:+33608671443">+33 6 08 67 14 43</a>.'),
 ('Lead times & delivery', 'Do you deliver across France and abroad?',
  'Yes, we deliver across France and Europe to Mondial Relay pick-up points, carefully packed for transport. For dragées sold by weight, delivery is free up to 1 kg, then €12 per kilo or part thereof. For creations, delivery costs are given with your proposal.'),
 ('Lead times & delivery', 'Can I collect my order or visit the workshop?',
  'Yes, you can collect your order from our workshop in Athis-Mons (145 Ter, avenue Jacques Chirac, 91200, near Paris), by appointment. Appointments can also be arranged for large orders or to see our creations.'),
 ('Contact', 'How can I contact you?',
  'By phone on <a href="tel:+33608671443">+33 6 08 67 14 43</a>, Monday to Friday, 9 am to 6 pm (Paris time), by email at <a href="mailto:drageeparis@gmail.com">drageeparis@gmail.com</a> or through our <a href="message.html">contact form</a>. We reply within 48 hours.'),
],
}

META = {
 'fr': {'title': 'Questions fréquentes · Dragée Paris',
        'desc': 'Prix des dragées personnalisées, nombre de dragées par invité, délais, livraison en France et en Europe, allergènes : toutes les réponses de Dragée Paris, confiseur à Athis-Mons (Île-de-France).',
        'h1': 'Questions fréquentes',
        'sub': 'Prix, dragées, personnalisation, délais et livraison : l’essentiel pour préparer vos dragées en toute sérénité.',
        'cta': 'Vous ne trouvez pas votre réponse ?', 'cta_btn': 'Nous écrire', 'cta2': 'Lancer ma création',
        'lang': 'fr', 'locale': 'fr_FR', 'aria': 'Questions fréquentes'},
 'en': {'title': 'Frequently asked questions · Dragée Paris',
        'desc': 'Prices of personalised dragées, how many per guest, lead times, delivery across France and Europe, allergens: all the answers from Dragée Paris, confectioner near Paris.',
        'h1': 'Frequently asked questions',
        'sub': 'Prices, dragées, personalisation, lead times and delivery: everything you need to plan your dragées with peace of mind.',
        'cta': 'Can’t find your answer?', 'cta_btn': 'Write to us', 'cta2': 'Start my creation',
        'lang': 'en', 'locale': 'en_GB', 'aria': 'Frequently asked questions'},
}

CHEVRON = '<svg class="faq__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>'

def strip_tags(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s))

def build(lang):
    m = META[lang]
    tpl_path = os.path.join(ROOT, 'message.html' if lang == 'fr' else 'en/message.html')
    tpl = open(tpl_path, encoding='utf-8').read()
    url = 'https://drageeparis.fr/' + ('en/' if lang == 'en' else '') + 'faq.html'

    # ---- contenu
    groups, order = {}, []
    for g, q, a in FAQ[lang]:
        if g not in groups: groups[g] = []; order.append(g)
        groups[g].append((q, a))
    parts, n = [], 0
    for g in order:
        parts.append('      <h2 class="faq-page__group">' + html.escape(g) + '</h2>\n      <div class="faq__list">')
        for q, a in groups[g]:
            n += 1
            parts.append(
                '        <div class="faq__item">\n'
                '          <button class="faq__question" id="faq-q%d" aria-expanded="false" aria-controls="faq-a%d">\n'
                '            <span>%s</span>\n            %s\n          </button>\n'
                '          <div class="faq__answer" id="faq-a%d" role="region" aria-labelledby="faq-q%d">\n'
                '            <div class="faq__answer-inner">%s</div>\n          </div>\n        </div>' % (n, n, html.escape(q), CHEVRON, n, n, a))
        parts.append('      </div>')
    main = ('  <main id="main">\n\n'
            '    <div class="section-intro fade-in">\n'
            '      <h1 class="section-intro__title">' + m['h1'] + '</h1>\n'
            '      <p class="section-intro__sub">' + m['sub'] + '</p>\n'
            '    </div>\n\n'
            '    <section class="faq faq-page fade-in" aria-label="' + m['aria'] + '">\n' + '\n'.join(parts) + '\n'
            '      <div class="faq-page__cta">\n'
            '        <p>' + m['cta'] + '</p>\n'
            '        <div class="faq-page__btns"><a href="message.html" class="btn btn--outline">' + m['cta_btn'] + '</a>'
            '<a href="contact.html" class="btn btn--primary">' + m['cta2'] + ' <span class="btn-arrow">→</span></a></div>\n'
            '      </div>\n'
            '    </section>\n\n'
            '  </main>')
    out = re.sub(r'  <main id="main">.*?</main>', lambda _: main, tpl, count=1, flags=re.S)

    # ---- en-tête de page
    ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': lang,
          'mainEntity': [{'@type': 'Question', 'name': q,
                          'acceptedAnswer': {'@type': 'Answer', 'text': strip_tags(a)}} for _, q, a in FAQ[lang]]}
    out = re.sub(r'<title>[^<]*</title>', '<title>' + m['title'] + '</title>', out, count=1)
    for prop in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        out = re.sub(r'(<meta ' + prop + r' content=")[^"]*"', lambda mm: mm.group(1) + html.escape(m['desc'], quote=True) + '"', out)
    for prop in ('property="og:title"', 'name="twitter:title"'):
        out = re.sub(r'(<meta ' + prop + r' content=")[^"]*"', lambda mm: mm.group(1) + m['title'] + '"', out)
    out = re.sub(r'(<meta property="og:url" content=")[^"]*"', lambda mm: mm.group(1) + url + '"', out)
    out = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="' + url + '">', out, count=1)
    out = re.sub(r'(hreflang="(?:fr|x-default)" href="https://drageeparis\.fr/)message\.html', r'\1faq.html', out)
    out = re.sub(r'(hreflang="en" href="https://drageeparis\.fr/en/)message\.html', r'\1faq.html', out)
    # données structurées : on remplace celles de la page contact (s'il y en a) par la FAQ
    out = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', out, flags=re.S)
    out = out.replace('</head>', '  <script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=2) + '\n  </script>\n</head>', 1)
    # pas de script du formulaire de contact
    out = re.sub(r'\s*<script src="(?:\.\./)?message-form\.js[^"]*"></script>', '', out)
    dest = os.path.join(ROOT, 'faq.html' if lang == 'fr' else 'en/faq.html')
    open(dest, 'w', encoding='utf-8').write(out)
    return dest, n

for lang in ('fr', 'en'):
    print(*build(lang))

"""Turn Javed's standalone essay HTML into a fragment rendered by src/pages/Patterns.tsx.
Text, headings, section order, TOC and references are kept; only hosting-specific bits change."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parents[2]
s = (root / 'tools/essay/patterns-original.html').read_text()
body = s[s.index('<body>') + 6: s.index('<script>')]
ART = '%BASE%art/'
SITE = 'https://jalam1001.github.io/psychedelic-visions/'
def rep(a, b, count=0):
    global body
    assert a in body, a[:80]
    body = body.replace(a, b) if not count else body.replace(a, b, count)

# images: verified-licence local copies
AMI = 'https://commons.wikimedia.org/wiki/Special:FilePath/Amitayus%20Mandala.jpeg?width='
rep(AMI + '800', ART + 'essay-amitayus.webp'); rep(AMI + '700', ART + 'essay-amitayus.webp')
rep('Mandala of Amitayus, 19th-century Tibetan school · Wikimedia Commons / Rubin Museum of Art',
    'Mandala of Amitayus, 19th-century Tibetan school · public domain, via <a href="https://commons.wikimedia.org/wiki/File:Amitayus_Mandala.jpeg">Wikimedia Commons</a>')
SHIP = 'https://3lizasqui88.wordpress.com/wp-content/uploads/2013/07/img_28892.jpg'
rep(f'<img alt="Shipibo-Konibo kené embroidered textile" loading="lazy" src="{SHIP}"/><figcaption>Shipibo-Konibo kené textile · image via RISD Maharam Fellows (original source linked in references)</figcaption>',
    f'<img alt="Shipibo-Konibo kené textile with dense geometric line patterns" loading="lazy" src="{ART}shipibo-art-1.webp"/><figcaption>Shipibo-Konibo embroidered textile · photo: Luke Hancock, CC0, via <a href="https://commons.wikimedia.org/wiki/File:Shipibo-art-1.jpg">Wikimedia Commons</a></figcaption>')
rep(f'<img alt="Amazonian kené pattern" loading="lazy" src="{SHIP}"/>', f'<img alt="Amazonian kené pattern" loading="lazy" src="{ART}shipibo-art-1.webp"/>')
HAF = 'https://parametrichouse.com/wp-content/uploads/2024/12/1280px-Roof_hafez_tomb.jpg'
rep(f'<img alt="Intricate Islamic geometric mosaic" loading="lazy" src="{HAF}"/><figcaption>Islamic geometric mosaic · image via Parametric House</figcaption>',
    f'<img alt="Intricate Islamic geometric tilework on the inside of the Shah Mosque dome, Isfahan" loading="lazy" src="{ART}shah-mosque-dome.webp"/><figcaption>Dome of the Shah Mosque, Isfahan · photo: Radosław Botev, <a href="https://creativecommons.org/licenses/by/3.0/pl/deed.en">CC BY 3.0 pl</a>, via <a href="https://commons.wikimedia.org/wiki/File:Dome_interior_of_Shah_Mosque_%28Isfahan%29_2014_%281%29.jpg">Wikimedia Commons</a></figcaption>')
rep(f'<img alt="Islamic geometry" loading="lazy" src="{HAF}"/>', f'<img alt="Islamic geometry" loading="lazy" src="{ART}shah-mosque-dome.webp"/>')
rug = re.search(r'<img alt="Turkish carpet[^>]*>', body).group(0)
rep(rug + '<figcaption>Turkish carpet with nested medallion and borders · image via 1stDibs</figcaption>',
    f'<img alt="Turkish carpet with nested medallion and borders" loading="lazy" src="{ART}holbein-carpet.webp"/><figcaption>‘Holbein’ carpet, Anatolia, 15th–16th century · The Metropolitan Museum of Art (Open Access, CC0), via <a href="https://commons.wikimedia.org/wiki/File:%27Holbein%27_Carpet_MET_DP329369.jpg">Wikimedia Commons</a></figcaption>')
rep('https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&amp;fit=crop&amp;w=900&amp;q=85', ART + 'essay-nature.webp')
rep('Natural forms and recurring structures · illustrative photograph', 'Natural forms and recurring structures · illustrative photograph via Unsplash (<a href="https://unsplash.com/license">Unsplash License</a>)')
rep('Illustrative images are linked to third-party hosts and remain subject to their respective rights and licenses. Check permission before publishing externally.',
    'Images are hosted on this site; each is public domain, CC0, CC BY or the Unsplash License, credited in its caption and in <a href="https://github.com/Jalam1001/psychedelic-visions/blob/main/CREDITS.md">CREDITS.md</a>.')
# links back into the site become internal routes
rep(f'<span class="external-link-wrap"><a class="cta" href="{SITE}" rel="noopener noreferrer" target="_top">Explore the animations</a><button aria-label="Copy link URL" class="copy-external" data-url="{SITE}" type="button">Copy URL</button></span>',
    '<a class="cta" href="#/">Explore the animations</a>')
rep(f'<span class="external-link-wrap"><a class="cta" href="{SITE}" rel="noopener noreferrer" target="_top">Visit Psychedelic Visions</a><button aria-label="Copy link URL" class="copy-external" data-url="{SITE}" type="button">Copy URL</button></span>',
    '<a class="cta" href="#/">Visit Psychedelic Visions</a>')
ex = body[body.index('<section id="explore-animations"'):body.index('</section>', body.index('<section id="explore-animations"')) + 10]
p1 = re.search(r'<h2[^>]*>Experience the Patterns in Motion</h2><p>.*?</p>', ex).group(0).replace(' style="margin-top:0"', '')
routes = [('/mandala', 'Living Mandalas'), ('/amazonian', 'Amazonian Visions'), ('/islamic', 'Islamic Geometry &amp; Living Carpets'),
          ('/kaleidoscope', 'Psychedelic Kaleidoscope'), ('/fractal', 'Fractal Journey'), ('/sacred', 'Sacred Geometry'),
          ('/journey', 'Infinite Psychedelic Journey'), ('/meditation', 'Meditation &amp; Relaxation'), ('/lab', 'Sound &amp; Vision Lab')]
lis = ''.join(f'<li><a href="#{r}">{t}</a></li>' for r, t in routes)
body = body.replace(ex, f'<section id="explore-animations" class="explore">{p1}<ul class="explore-links">{lis}</ul><p><a class="cta primary" href="#/">Launch Psychedelic Visions Animations</a></p></section>')
# external links open in a new tab instead of target=_top
body = body.replace('target="_top"', 'target="_blank"')
# header canvas is drawn by React; TOC gets a label
rep('<canvas aria-hidden="true" id="art"></canvas>', '<canvas aria-hidden="true" class="essay-art"></canvas>')
rep('<nav><a href="#introduction">', '<nav class="essay-toc" aria-label="Essay contents"><a href="#introduction">')
rep('<p style="margin-top:24px">', '<p class="after-table">')
rep('<table>', '<div class="table-wrap"><table>'); rep('</table>', '</table></div>')
for sec in ['common']:
    pass
(root / 'src/content/patterns.html').write_text(body)
print(len(body))

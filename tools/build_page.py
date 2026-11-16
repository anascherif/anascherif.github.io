"""Inlines the vector logo into tools/page.src.html and writes index.html.
Run from the repo root:  python tools/build_page.py"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, 'tools', 'logo.json')))
logo = '<svg viewBox="0 0 %s %s" aria-hidden="true" focusable="false">%s</svg>' % (d['w'], d['h'], ''.join('<path d="%s"/>' % p for p in d['paths']))
src = open(os.path.join(ROOT, 'tools', 'page.src.html'), encoding='utf8').read()
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf8', newline='\n').write(src.replace('<!--LOGO-->', logo))
print('index.html written,', src.count('<!--LOGO-->'), 'logos')

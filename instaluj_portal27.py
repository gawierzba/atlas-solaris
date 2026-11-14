#!/usr/bin/env python3
"""Install portal 27 into an existing ATLAS SOLARIS GitHub repository checkout.

Usage: python instaluj_portal27.py /path/to/atlas-solaris [--dry-run]
Does not delete old files. Before overwriting writes one backup index. Atomic copies.
"""
from __future__ import annotations
import argparse, pathlib, shutil, sys
ROOT=pathlib.Path(__file__).resolve().parent

def install(dest:pathlib.Path,dry=False):
    dest=dest.resolve();src=ROOT
    current=dest/'index.html';legacy=dest/'atlas.html'
    if not current.exists() and not legacy.exists():raise RuntimeError('Brak index.html (lub atlas.html) w repozytorium docelowym.')
    if src==dest:raise RuntimeError('Instalator należy uruchomić z paczki rozpakowanej poza repozytorium.')
    if not legacy.exists():
        original=current.read_text(encoding='utf-8')
        if 'id="app"' not in original:raise RuntimeError('index.html nie wygląda na oryginalne planetarium; przerwano bez zmian.')
        print('Zachowuję klasyczny Atlas jako atlas.html')
        if not dry:shutil.copy2(current,legacy)
    else:original=legacy.read_text(encoding='utf-8')
    snippet_style='<link rel="stylesheet" href="portal/embed.css">'
    snippet_script='<script src="portal/embed.js"></script>'
    if snippet_style not in original:
        if '</head>' not in original:raise RuntimeError('Brak </head> w atlas.html')
        original=original.replace('</head>',snippet_style+'\n</head>',1)
    if snippet_script not in original:
        if '</body>' not in original:raise RuntimeError('Brak </body> w atlas.html')
        original=original.replace('</body>',snippet_script+'\n</body>',1)
    if not dry:legacy.write_text(original,encoding='utf-8')
    entries=['index.html','404.html','o-projekcie','portal','etapy','dzialy','laboratoria','tests/portal27.test.cjs','README_PORTAL27.md']
    for name in entries:
        item=src/name;out=dest/name
        if not item.exists():raise RuntimeError('Brak źródła: '+name)
        print('Kopiuję '+name)
        if dry:continue
        if item.is_dir():shutil.copytree(item,out,dirs_exist_ok=True)
        else:out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(item,out)
    print('ATLAS SOLARIS 27.0: gotowe'+(' (próba bez zapisu)' if dry else ''))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('repo',type=pathlib.Path);p.add_argument('--dry-run',action='store_true');args=p.parse_args()
    try:install(args.repo,args.dry_run)
    except Exception as exc:print('BŁĄD:',exc,file=sys.stderr);sys.exit(2)

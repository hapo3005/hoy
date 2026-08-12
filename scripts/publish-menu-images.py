#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

CFG=Path('config/menu-image-publish-targets.json')
MANIFEST_DIR=Path('menu-image-publish-output')
MAX_BYTES=15*1024*1024
UA='HOY Menu Publisher/1.0 (+https://hapo3005.github.io/hoy/)'


def clean(value):
    return str(value or '').strip()


def fetch_pinned(url,allowed_host,expected_sha):
    parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.hostname!=allowed_host:
        raise RuntimeError(f'unapproved source URL: {url}')
    req=Request(url,headers={'User-Agent':UA,'Accept':'image/jpeg,image/*;q=0.8,*/*;q=0.1'})
    with urlopen(req,timeout=30) as response:
        final=response.geturl()
        final_parsed=urlparse(final)
        if final_parsed.scheme!='https' or final_parsed.hostname!=allowed_host:
            raise RuntimeError(f'unapproved redirect: {url} -> {final}')
        content_type=(response.headers.get('Content-Type') or '').split(';',1)[0].strip().lower()
        data=response.read(MAX_BYTES+1)
    if len(data)>MAX_BYTES:
        raise RuntimeError(f'image exceeds {MAX_BYTES} bytes: {url}')
    if content_type not in {'image/jpeg','image/jpg'} or not data.startswith(b'\xff\xd8\xff'):
        raise RuntimeError(f'expected verified JPEG: {url} ({content_type})')
    digest=hashlib.sha256(data).hexdigest()
    if digest!=expected_sha:
        raise RuntimeError(f'reviewed image changed; new visual review required: {url}\nexpected {expected_sha}\nactual   {digest}')
    return final,content_type,data,digest


def main():
    cfg=json.loads(CFG.read_text(encoding='utf-8'))
    MANIFEST_DIR.mkdir(parents=True,exist_ok=True)
    manifest={'generated_by':'publish-menu-images.py','targets':[]}
    for target in cfg.get('targets',[]):
        rid=int(target['restaurant_id'])
        host=clean(target['allowed_host']).lower()
        pages=target.get('pages') or []
        if not pages:
            raise RuntimeError(f'no pages configured for {rid}')
        reviewed_hashes=[clean(page.get('sha256')) for page in pages]
        if any(len(x)!=64 for x in reviewed_hashes):
            raise RuntimeError(f'invalid SHA-256 pin for {rid}')
        derived_bundle=hashlib.sha256(''.join(reviewed_hashes).encode()).hexdigest()[:12]
        bundle=clean(target.get('bundle'))
        if bundle!=derived_bundle:
            raise RuntimeError(f'bundle mismatch for {rid}: configured {bundle}, derived {derived_bundle}')
        dest_dir=Path('menu-pages')/str(rid)/bundle
        dest_dir.mkdir(parents=True,exist_ok=True)
        result={'restaurant_id':rid,'name':target.get('name'),'source_url':target.get('source_url'),'bundle':bundle,'pages':[]}
        for index,page in enumerate(pages,start=1):
            url=clean(page['url'])
            expected=clean(page['sha256'])
            final,content_type,data,digest=fetch_pinned(url,host,expected)
            dest=dest_dir/f'page-{index}.jpg'
            dest.write_bytes(data)
            result['pages'].append({'index':index,'label':page.get('label') or f'Carta {index}','source_url':url,'final_url':final,'content_type':content_type,'bytes':len(data),'sha256':digest,'publish_path':str(dest)})
            print(f'✓ pinned {rid} page {index}: {digest} -> {dest}')
        manifest['targets'].append(result)
    (MANIFEST_DIR/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('Only hash-pinned, visually reviewed operator images were prepared for first-party delivery.')

if __name__=='__main__':
    main()

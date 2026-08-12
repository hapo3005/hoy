#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

CFG=Path('config/menu-image-review-targets.json')
OUT=Path('menu-image-review-output')
MAX_BYTES=15*1024*1024
UA='HOY Menu Review/1.0 (+https://hapo3005.github.io/hoy/)'


def fetch_page(url,allowed_host):
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
    if content_type not in {'image/jpeg','image/jpg'}:
        raise RuntimeError(f'expected JPEG, got {content_type}: {url}')
    if len(data)<4 or not data.startswith(b'\xff\xd8\xff'):
        raise RuntimeError(f'invalid JPEG signature: {url}')
    return final,content_type,data


def main():
    cfg=json.loads(CFG.read_text(encoding='utf-8'))
    manifest={'generated_by':'review-menu-images.py','targets':[]}
    OUT.mkdir(parents=True,exist_ok=True)
    for target in cfg.get('targets',[]):
        rid=int(target['restaurant_id'])
        host=str(target['allowed_host']).strip().lower()
        venue_dir=OUT/str(rid)
        venue_dir.mkdir(parents=True,exist_ok=True)
        result={'restaurant_id':rid,'name':target.get('name'),'source_url':target.get('source_url'),'pages':[]}
        for index,page in enumerate(target.get('pages',[]),start=1):
            url=str(page['url']).strip()
            final,content_type,data=fetch_page(url,host)
            sha=hashlib.sha256(data).hexdigest()
            dest=venue_dir/f'page-{index}.jpg'
            dest.write_bytes(data)
            result['pages'].append({'index':index,'label':page.get('label') or f'Carta {index}','source_url':url,'final_url':final,'content_type':content_type,'bytes':len(data),'sha256':sha,'artifact':str(dest)})
            print(f'✓ {rid} page {index}: {len(data)} bytes · {sha}')
        if not result['pages']:
            raise RuntimeError(f'no pages configured for {rid}')
        manifest['targets'].append(result)
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('Review only. No menu-pages assets, Supabase data, or guest code were changed.')

if __name__=='__main__':
    main()

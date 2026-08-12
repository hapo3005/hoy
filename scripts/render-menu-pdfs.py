#!/usr/bin/env python3
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import urllib.request

CONFIG = pathlib.Path('config/menu-pdf-render-targets.json')
OUT = pathlib.Path('menu-pdf-render-output')
PUBLISH = pathlib.Path('menu-pages')
MAX_BYTES = 30 * 1024 * 1024
MAX_PAGES = 12
ALLOWED_HOST_SUFFIXES = (
    'areasunset.es',
    'latabernadelpuertocabodepalos.es',
)


def safe_slug(value: str) -> str:
    return re.sub(r'[^a-z0-9-]+', '-', value.lower()).strip('-')[:80] or 'venue'


def validate_url(url: str) -> None:
    from urllib.parse import urlparse
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        raise ValueError(f'Only https official PDFs are allowed: {url}')
    host = parsed.hostname.lower()
    if not any(host == suffix or host.endswith('.' + suffix) for suffix in ALLOWED_HOST_SUFFIXES):
        raise ValueError(f'Host is not in official PDF allowlist: {host}')
    if not parsed.path.lower().endswith('.pdf'):
        raise ValueError(f'Configured source is not a PDF: {url}')


def download_pdf(url: str, target: pathlib.Path) -> tuple[str, int]:
    request = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 HOY-Menu-PDF-Renderer/2.28.4',
        'Accept': 'application/pdf,*/*;q=0.8',
    })
    h = hashlib.sha256()
    size = 0
    with urllib.request.urlopen(request, timeout=30) as response, target.open('wb') as f:
        while True:
            chunk = response.read(1024 * 256)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_BYTES:
                raise ValueError(f'PDF exceeds {MAX_BYTES} bytes: {url}')
            h.update(chunk)
            f.write(chunk)
    if target.read_bytes()[:5] != b'%PDF-':
        raise ValueError(f'Remote file is not a PDF: {url}')
    return h.hexdigest(), size


def pdf_pages(pdf: pathlib.Path) -> int:
    proc = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True, check=True)
    match = re.search(r'^Pages:\s+(\d+)\s*$', proc.stdout, flags=re.M)
    if not match:
        raise ValueError(f'Could not determine PDF page count: {pdf}')
    count = int(match.group(1))
    if count < 1 or count > MAX_PAGES:
        raise ValueError(f'PDF page count {count} outside 1..{MAX_PAGES}: {pdf}')
    return count


def render(pdf: pathlib.Path, out_dir: pathlib.Path) -> list[pathlib.Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = out_dir / 'page'
    subprocess.run([
        'pdftoppm', '-jpeg', '-r', '180', '-jpegopt', 'quality=88,optimize=y',
        str(pdf), str(prefix)
    ], check=True)
    pages = sorted(out_dir.glob('page-*.jpg'))
    if not pages:
        raise ValueError(f'No rendered pages for {pdf}')
    return pages


def main() -> int:
    cfg = json.loads(CONFIG.read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLISH.mkdir(parents=True, exist_ok=True)
    manifest = {'renderer': 'HOY 2.28.4', 'targets': []}
    for target in cfg.get('targets', []):
        rid = int(target['restaurant_id'])
        slug = safe_slug(str(target['slug']))
        url = str(target['source_url']).strip()
        label = str(target.get('label') or slug).strip()
        expected = str(target.get('expected_source_sha256') or '').strip().lower()
        if not re.fullmatch(r'[0-9a-f]{64}', expected):
            raise ValueError(f'Missing reviewed source hash for restaurant {rid}')
        validate_url(url)
        work = OUT / f'{rid}-{slug}'
        work.mkdir(parents=True, exist_ok=True)
        pdf = work / 'source.pdf'
        digest, size = download_pdf(url, pdf)
        if digest != expected:
            raise ValueError(f'Official PDF changed for restaurant {rid}: expected {expected}, got {digest}. Review required before publication.')
        count = pdf_pages(pdf)
        publish_dir = PUBLISH / str(rid) / digest[:12]
        pages = render(pdf, publish_dir)
        if len(pages) != count:
            raise ValueError(f'Rendered {len(pages)} pages but PDF reports {count}: {url}')
        rendered = []
        for idx, page in enumerate(pages, 1):
            rendered.append({
                'page': idx,
                'file': page.as_posix(),
                'public_path': '/' + page.as_posix(),
                'bytes': page.stat().st_size,
                'sha256': hashlib.sha256(page.read_bytes()).hexdigest(),
            })
        manifest['targets'].append({
            'restaurant_id': rid,
            'slug': slug,
            'label': label,
            'source_url': url,
            'source_sha256': digest,
            'source_bytes': size,
            'page_count': count,
            'pages': rendered,
        })
        pdf.unlink(missing_ok=True)
        print(f'✓ {rid} {label}: {count} reviewed pages ready at {publish_dir}')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())

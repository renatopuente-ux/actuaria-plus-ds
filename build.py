#!/usr/bin/env python3
"""
build.py · sella los enlaces a CSS/JS con el hash del archivo.

POR QUE EXISTE
GitHub Pages sirve los estaticos con Cache-Control: max-age=600. Al publicar
un cambio, el HTML llega nuevo pero el CSS puede seguir siendo el viejo hasta
diez minutos. El sintoma es desconcertante: el marcado nuevo con los estilos
antiguos — un componente recien creado aparece SIN estilo ninguno.

Paso de verdad: se publico .a-medallon, el HTML mostraba la muestra y la
etiqueta, pero el circulo no existia porque el CSS cacheado no conocia la
clase. Pareceria un bug de diseno y era de despliegue.

SOLUCION
Cada enlace lleva ?v=<hash corto del contenido>. Si el archivo no cambia, el
hash no cambia y la cache sigue sirviendo. Si cambia, la URL cambia y el
navegador esta obligado a pedirlo. Cero configuracion de servidor.

USO:  python build.py      (antes de cada commit que toque css/ o js/)
"""
import hashlib, pathlib, re, sys

RAIZ = pathlib.Path(__file__).parent

def sello(ruta: pathlib.Path) -> str:
    return hashlib.sha1(ruta.read_bytes()).hexdigest()[:8]

def main() -> int:
    hashes = {}
    for sub in ("css", "js"):
        for f in sorted((RAIZ / sub).glob("*")):
            if f.suffix in (".css", ".js"):
                hashes[f"{sub}/{f.name}"] = sello(f)

    tocados = 0
    for html in list(RAIZ.glob("*.html")) + list(RAIZ.glob("*/*.html")):
        if "_plantilla" in html.parts:
            continue
        txt = original = html.read_text(encoding="utf-8")
        for rel, h in hashes.items():
            # href="../css/x.css"  o  href="css/x.css", con o sin ?v= previo
            txt = re.sub(
                r'((?:href|src)="(?:\.\./)?' + re.escape(rel) + r')(?:\?v=[0-9a-f]+)?(")',
                r'\1?v=' + h + r'\2', txt)
        if txt != original:
            html.write_text(txt, encoding="utf-8", newline="\n")
            tocados += 1
        print(f"  {html.relative_to(RAIZ)}")

    print(f"\n{len(hashes)} estaticos sellados, {tocados} paginas actualizadas")
    for rel, h in hashes.items():
        print(f"  {rel:28s} ?v={h}")
    return 0

if __name__ == "__main__":
    sys.exit(main())

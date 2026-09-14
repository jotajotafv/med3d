# Originales candidatos, fuera del atlas publicado

`source-candidates.zip` conserva sin modificar los seis PLY OpenEar y la escena original HRA Pelvis Male v1.3, junto con sus metadatos de procedencia. No se cargan en la aplicación. El manifiesto registra el SHA-256 de cada archivo descomprimido y del ZIP.

- HRA / HuBMAP: [Pelvis Male v1.3](https://doi.org/10.48539/HBM384.SBWX.873), Kristen Browne y Heidi Schlehlein; Visible Human Male de National Library of Medicine. CC BY 4.0. La escena original incluye el contexto de sacro y pelvis, no sólo el cóccix extraído.
- [OpenEar v2](https://zenodo.org/records/1473724): Daniel Manuel Sieber, Peter Erfurt, Samuel John, Gabriel Ribeiro dos Santos, Daniel Schurzig, Mads Sølvsten Sørensen y Thomas Lenarz. CC BY 4.0. Se conservaron las superficies PLY originales de ZETA y EPSILON; no las tomografías completas.
- [Licencia CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Los archivos no se han colocado en BodyParts3D, reflejado, centrado ni escalado. EPSILON no se presenta como oído izquierdo confirmado. El registro anatómico pendiente y las matrices comprobadas se explican en [phase2.1-registration.md](../../docs/phase2.1-registration.md).

Reproducción, con Python y NumPy disponibles:

```sh
python -m zipfile -e research/anatomy/source-candidates.zip /tmp/med3d-source-candidates
python scripts/anatomy/registration-research/verify_candidates.py /tmp/med3d-source-candidates /tmp/med3d-candidate-matrices.json
```

Compare los hashes descomprimidos con `source-candidates-manifest.json` antes de reutilizar una fuente. La reconstrucción del canal de producción BodyParts3D es independiente de estos candidatos.

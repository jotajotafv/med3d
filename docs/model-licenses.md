# MED3D anatomy models — provenance and license

The four original organ/skin assets are sourced from the official Human Reference Atlas / HuBMAP CCF 3D Reference Object Library. Repository: https://github.com/hubmapconsortium/ccf-3d-reference-object-library. License: **Creative Commons Attribution 4.0 International (CC BY 4.0)**, https://creativecommons.org/licenses/by/4.0/. Exact upstream license: https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/main/LICENSE.

Attribution: **Human Reference Atlas (HRA) / HuBMAP, CCF 3D Reference Object Library, CC BY 4.0.** The reference-organ portal and source models identify the underlying Visible Human / Allen data and contributors: https://humanatlas.io/3d-reference-library. The encéphalon model carries Allen anatomy names. Each downloaded source URL and sourceSha256 of the original file is recorded in `src/features/anatomy/model-index.ts`.

| Local file | Exact upstream relative path | Source bytes | Meshes |
| --- | --- | ---: | ---: |
| `/models/heart.glb` | `VH_Male/v1.2/VH_M_Heart.glb` | 4,071,500 | 14 |
| `/models/lungs.glb` | `VH_Male/v1.4/3d-vh-m-lung.glb` | 10,941,068 | 58 |
| `/models/brain.glb` | `VH_Male/v1.2/Allen_M_Brain.glb` | 11,977,312 | 283 |
| `/models/skin.glb` | `VH_Male/v1.1/VH_M_Skin.glb` | 1,933,420 | 1 |

Raw URL prefix: `https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/`.

## Adaptations

MED3D applies Meshopt compression and vertex quantization using glTF Transform; no mesh simplification, node flattening, joining, or instancing. Named nodes and mesh counts are checked against the source before replacement. In the renderer, models receive a muted material palette, adjustable visibility and opacity, selection highlighting, and reversible translations for exploded views. Original anatomical coordinates and relative placements remain unchanged in the assembled body. Individual organ views center the complete loaded group for navigation. Every source node name is retained; original node metadata is copied into the index. Spanish labels and a limited set of Latin synonyms are UI additions. They do not replace upstream identifiers.

The 355 organ meshes are real segmented source geometries, with 26 grouping nodes. The skin is an additional mesh for spatial context. The provided heart, lungs, brain and skin GLBs contain no extraction-site geometry. The much larger United dataset is not included. No generated 3D geometry or medical photography is presented as anatomy.

## Coverage limits

The original HRA subset provides three organ models. Phase 2 adds the separately registered skeletal dataset described below; the project remains a partial human atlas. The heart model contains chambers, valves, interventricular septum and papillary muscles. The lungs include lobes, bronchopulmonary segments, and a bronchial tree. The Allen brain model contains cortical and deeper regions, grouped primarily by hemisphere. Upstream metadata contains absent terms, duplicate ontology identifiers, and naming inconsistencies; the UI exposes source labels for traceability and does not treat these as clinically validated annotations. Latin names are provided only for selected major structures. No diagnostic descriptions are generated.

## BodyParts3D · phase 2

BodyParts3D is an option for broader male body coverage in OBJ, with PART-OF and IS-A data. The **current official archive** lists CC BY 4.0 as of 2025-02-27 (older mirrors still list CC BY-SA 2.1 JP): https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html. Downloads: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html. BodyParts3D 4.0 is now incorporated as seven modular skeletal GLBs. Its per-element source hashes, author, current license declaration, source version, conversion, exact-duplicate removal and Meshopt quantization are recorded in `public/models/anatomy/skeletal/{catalog.json,source-manifest.json,LICENSE.txt,validation.json}`. See `scripts/anatomy/README.md`. The registered model covers 199 conventional bones plus 4 accessory sesamoids; coccyx and six auditory ossicles remain absent. No Z-Anatomy data is incorporated. Z-Anatomy's global CC BY-SA 4.0 README also lists components with NC licenses, so it must not be treated as one uniformly licensed commercial asset set.

## Delivered asset sizes

Meshopt-compressed final files: heart 715,820 bytes; lungs 1,992,744 bytes; brain 3,496,140 bytes; skin 399,176 bytes. Total: 6,603,880 bytes. Current SHA-256, upstream SHA-256, source URL, and byte sizes are also shipped in `/models/manifest.json`; upstream license text is shipped in `/models/LICENSE.txt`.

## Educational annotations

The initial curated cards cover heart chambers, the four valves, interventricular septum, main lung groups and five lobes, and main airways. Concise Spanish explanations are paraphrased from NIH/NHLBI: https://www.nhlbi.nih.gov/health/heart/anatomy ; https://www.nhlbi.nih.gov/health/heart/blood-flow ; https://www.nhlbi.nih.gov/health/lungs/respiratory-system . Each card links its primary source. Other selected meshes explicitly display that their specific educational card is in preparation. Relations link available source nodes and do not add absent geometry.

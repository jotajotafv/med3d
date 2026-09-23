import {cohortCatalog} from './cohort-catalog.mjs';
import {PILOT_ASSET_IDS,PILOT_FAMILIES} from './pilot-catalog.mjs';
export const TORSO_ASSET_IDS=['muscular:thorax-anterior','muscular:abdomen','muscular:back'];
export const PHASE3B_ASSET_IDS=[...PILOT_ASSET_IDS,...TORSO_ASSET_IDS];
export const TORSO_FAMILIES=['pectoralismajor','pectoralisminor','serratusanterior','subclavius','externaloblique','trapezius','rhomboidmajor','rhomboidminor','iliocostalislumborum','iliocostalisthoracis','longissimusthoracis','spinalisthoracis','teresmajor'];
export const PHASE3B_FAMILIES=[...PILOT_FAMILIES,...TORSO_FAMILIES];
export const PHASE3B_MODULE_QUERY='modules='+PHASE3B_ASSET_IDS.join(',');
export const torsoCatalog=source=>cohortCatalog(source,PHASE3B_ASSET_IDS);

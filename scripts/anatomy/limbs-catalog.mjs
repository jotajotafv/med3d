import {cohortCatalog} from './cohort-catalog.mjs';
import {PHASE3B_ASSET_IDS,PHASE3B_FAMILIES} from './torso-catalog.mjs';
export const LIMBS_ASSET_IDS=['gluteal','thigh','leg','forearm'].flatMap(region=>['right','left'].map(side=>'muscular:'+region+'-'+side));
export const PHASE3C_ASSET_IDS=[...PHASE3B_ASSET_IDS,...LIMBS_ASSET_IDS];
export const LIMBS_FAMILIES=['gluteusmaximus','gluteusmedius','gluteusminimus','tensorfasciaelatae','rectusfemoris','vastuslateralis','vastusmedialis','vastusintermedius','sartorius','adductorlongus','gracilis','bicepsfemoris','semitendinosus','semimembranosus','tibialisanterior','fibularislongus','fibularisbrevis','gastrocnemius','soleus','tibialisposterior','flexorcarpiradialis','pronatorteres','extensorcarpiradialislongus','supinator'];
export const PHASE3C_FAMILIES=[...PHASE3B_FAMILIES,...LIMBS_FAMILIES];
export const PHASE3C_MODULE_QUERY='modules='+PHASE3C_ASSET_IDS.join(',');
export const limbsCatalog=source=>cohortCatalog(source,PHASE3C_ASSET_IDS);

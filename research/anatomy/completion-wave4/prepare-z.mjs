import fs from 'node:fs/promises';
const out='.cache/anatomy-completion/wave4',prior='.cache/anatomy-completion/wave3';
const z=JSON.parse(await fs.readFile('.cache/phase4-expansion/z-inventory.json'));
const patterns={
 'lymphatic-nodes':/\bnodes?\b/i,'lymphatic-tonsils':/^Palatine tonsil/,
 'reproductive-ejaculatory':/Ejaculatory duct/,'integumentary-nails':/^Nail plate/,
 'integumentary-regions':/ region[. ]/i,'endocrine-subdivisions':/^(Adenohypophysis|Neurohypophysis)$/,
 'cardio-external-carotids':/^External carotid artery/,'cardio-external-jugulars':/^External jugular vein/,
 'cardio-profunda':/^Deep femoral artery/,'cardio-fibular':/^Fibular artery/,
 'nervous-brachial-cords':/^(Medial|Lateral) cord of brachial plexus/,
 'resp-sinuses':/^(Maxillary|Frontal|Sphenoidal) sinus|Ethmoidal (air )?cells/,
 'digestive-anal':/^Anal canal|Internal anal sphincter/,
 'reproductive-external':/Scrotum|Foreskin|Prepuce|Tunica vaginalis|Dartos/,
 'reproductive-bulbourethral':/Bulbourethral/,
};
const candidates=[];
for(const o of z.objects){const gaps=Object.entries(patterns).filter(([id,p])=>p.test(o.name)).map(([id])=>id);if(!gaps.length)continue;
if(/uterus|ovary|vagina|vulva|fallopian|mammary|kidney|cochlea|semicircular|Foramen caecum|Parotideomasseteric/i.test(o.name)||o.name.endsWith('.j'))continue;
let region=o.collections.some(c=>/Head|Brain/.test(c))?'craniofacial':o.collections.some(c=>/upper limb|Arm|Forearm|Hand/.test(c))?'upper':o.collections.some(c=>/lower limb|Pelvis|Thigh|Leg|Foot/.test(c))?'lower':'trunk';
if(/^(Adenohypophysis|Neurohypophysis)$/.test(o.name))region='craniofacial';
if(/Nail plate \(foot\)|Metatarsal region|Heel region|region of ankle|retromalleolar region/.test(o.name))region=o.name.endsWith('.l')?'foot_l':'foot_r';
candidates.push({sourceObject:o.name,gaps,type:o.type,sourcePolygons:o.polygons,collections:o.collections,region,license:'CC BY-SA 4.0',sourceLicenseExceptionsReviewed:true});}
await fs.writeFile(out+'/candidate-plan.json',JSON.stringify({sourceBlendSha256:'9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd',method:'Additional macro candidates. Reuses common transforms freshly computed during this program; no fit of an individual candidate. Separate source/destination validation below.',candidates},null,2)+'\n');
const reg=JSON.parse(await fs.readFile(prior+'/registration.json')),foot=JSON.parse(await fs.readFile(prior+'/foot-regional/registration.json'));Object.assign(reg.regions,foot.regions);await fs.writeFile(out+'/registration.json',JSON.stringify(reg,null,2)+'\n');
for(const file of ['reference-plan.json','target-bones.json','export-source.py','check-registration.py','check-soft.py'])await fs.copyFile(prior+'/'+file,out+'/'+file);
console.log('Z candidates',candidates.length,Object.fromEntries(Object.keys(patterns).map(g=>[g,candidates.filter(c=>c.gaps.includes(g)).length])));

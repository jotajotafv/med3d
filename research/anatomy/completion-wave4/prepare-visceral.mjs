import fs from 'node:fs/promises';
const out='.cache/anatomy-completion/wave4/visceral';await fs.mkdir(out,{recursive:true});
const plan=JSON.parse(await fs.readFile('.cache/anatomy-completion/wave4/candidate-plan.json'));plan.candidates=plan.candidates.filter(c=>c.gaps.includes('reproductive-ejaculatory'));
await fs.writeFile(out+'/candidate-plan.json',JSON.stringify(plan,null,2)+'\n');
const refs=[['Urinary bladder','uri:FMA15900'],['Prostate','rep:FMA9600'],['Seminal gland.l','rep:FMA19388'],['Seminal gland.r','rep:FMA19387'],['Ductus deferens.l','rep:FMA19236'],['Ductus deferens.r','rep:FMA19235']];
await fs.writeFile(out+'/reference-plan.json',JSON.stringify({pairs:refs.map(([source,target])=>({source,target}))},null,2)+'\n');
await fs.copyFile('.cache/anatomy-completion/wave4/export-source.py',out+'/export-source.py');

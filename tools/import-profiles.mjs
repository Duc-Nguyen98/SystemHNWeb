import {readFile} from 'node:fs/promises';
// Explicit registry: adding a module cannot silently broaden a scoped import.
export async function loadImportProfiles(){
 return Promise.all(['data-recon-20260923.json','app-pv-20260923.json','defect-catalog-20260923.json','inbound-receipts-20260923.json'].map(name=>readFile(new URL(`./import-profiles/${name}`,import.meta.url),'utf8').then(JSON.parse)));
}

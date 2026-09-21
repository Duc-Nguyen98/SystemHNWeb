import {readFile,writeFile} from 'node:fs/promises';
const drive=JSON.parse(await readFile('drive-screen-manifest.json','utf8'));
const main=JSON.parse(await readFile('screen-manifest.json','utf8'));
const plan=JSON.parse(await readFile('design-source/business-v1/targets.json','utf8'));
const claims=[
 {group:'danh_muc_san_pham',device:'desktop',expected:'6e00545c6fff4bd1be27a20bc6c75050e99f0e3e7a5979202adadbda692fce89',document:'HN_DANH_MUC_DANH_MUC_SAN_PHAM_BASELINE_V3_P00-P20_v1.0.md'},
 {group:'danh_muc_san_pham',device:'tablet',expected:'2c78c4bb39d513fac03033e4b76b3b2e995842bd189bbb6e26da2710e16cd70f',document:'HN_DANH_MUC_DANH_MUC_SAN_PHAM_BASELINE_V3_P00-P20_v1.0.md'},
 {group:'bao_hanh_sua_chua/phieu_xuat_linh_kien_bao_hanh',device:'desktop',expected:'4763e9898a4c537d6102bd8c30cf883f5fa86ac4cc08721ad2f6bcf4da7405d2',document:'HN_WARRANTY_PARTS_ISSUE_BASELINE_v3_STATE_PROMPTS_P00-P20_v1.0.md'},
 {group:'bao_hanh_sua_chua/phieu_xuat_linh_kien_bao_hanh',device:'tablet',expected:'9edb176412ab04441c396a20be52771ca7097cb0915da6c78b1f9589c3777858',document:'HN_WARRANTY_PARTS_ISSUE_BASELINE_v3_STATE_PROMPTS_P00-P20_v1.0.md'},
 {group:'bao_cao_nhan_dong_goi_in_lai',device:'desktop',expected:'04f3cf7fd2455d9e0c17dc1eb4091b7a9d5bf1094ed5469a0379d23974fdd49e',document:'HN_REPORT_PACKAGING_LABEL_PRINT_REPRINT_BASELINE_STATE_PROMPTS_v1.0.md'},
 {group:'bao_cao_nhan_dong_goi_in_lai',device:'tablet',expected:'875e171f5fcc82425fe652235027cd8659bf4d6bb2de8e707c4add4b0cc37a92',document:'HN_REPORT_PACKAGING_LABEL_PRINT_REPRINT_BASELINE_STATE_PROMPTS_v1.0.md'}
];
const baselines=drive.screens.filter(s=>/\bP01\b|\bdefault$/i.test(s.title)).map(s=>{
 const c=claims.find(c=>c.group===s.group&&c.device===s.device);
 return {group:s.group,device:s.device,screenId:s.id,sha256:s.sha256,src:s.src,reviewStatus:s.reviewStatus||'approval-not-recorded',
 baselineStatus:s.origin==='native-repair'?'candidate-not-approved':c?(c.expected===s.sha256?'matches-documented-file':'document-asset-conflict'):'reference-unverified',
 ...(c?{expectedDocumentHash:c.expected,sourceDocument:c.document}:{}),...(s.canonicalDesignKey?{canonicalDesignKey:s.canonicalDesignKey}:{})};
});
const registry={version:1,date:'2026-09-22',scope:'Priority business contradictions; does not certify the entire product',
 authority:'Only the owner/PM can approve a new baseline. A matching document hash is not runtime certification.',
 baselines,
 canonicalSession:{source:'design-source/business-v1',reviewStatus:'needs-owner-review',semantics:'Confirm session/context, never open a work shift',expired:'No user identity, role, warehouse state or report controls; only login recovery'},
 chartFixture:{source:'design-source/business-v1/fixtures.mjs',version:'business-v1',approval:'needs-owner-review',outbound:'Existing 1186 / 38+2+2+0 fixture retained; zero-value segment omitted',overview:'One proposed display fixture for all ranges/devices; 07/09 closing 685, 10/09 closing 647. Not production data.'},
 retired:plan.targets.map(t=>({collection:t.collection,screenId:t.id,sha256:t.original.sha256,archive:t.archived,status:'superseded-reference',reason:t.reason})),
 pendingDecisions:[
  'Owner approval of native business-v1 candidates, including proposed overview display fixture.',
  'Product catalog Tablet: supplied LOCKED file does not match the v3 document hash; do not silently replace the expected hash.',
  'Warranty: both original v3 master hashes are unavailable among supplied files; replacement is a candidate, not the recovered approved master.',
  'PKG artwork v1.2 versus specification v1.0 needs owner confirmation/changelog.',
  'Web product name/brand and real privacy, RBAC, API/idempotency contracts remain owner/backend decisions.'
 ],
 errata:[{id:'TRACE-RATIO',supersedesText:'96,8%',correctText:'94,5%',formula:'121 / 128 × 100 = 94.53125%',status:'arithmetic-correction; original document retained'}],
 primaryRepairs:main.screens.filter(s=>s.origin==='native-repair').map(s=>({id:s.id,canonicalDesignKey:s.canonicalDesignKey,sha256:s.sha256,reviewStatus:s.reviewStatus}))};
await writeFile('baseline-register.json',JSON.stringify(registry,null,2)+'\n');
console.log(`Registered ${baselines.length} baseline references and ${registry.retired.length} superseded records without fabricating approval.`);

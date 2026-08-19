import fs from 'node:fs';

const review = JSON.parse(fs.readFileSync('docs/investor-ready/g2-wave-a-plus3-review-v1.json','utf8'));
const copy = JSON.parse(fs.readFileSync('docs/investor-ready/g2-wave-a-plus3-spanish-master-v1.json','utf8'));

const fail = (m) => { throw new Error(m); };
if (review.status !== 'READY_FOR_MASTER_REVIEW_NOT_APPLIED') fail('review status');
if (review.contactFreeze !== 'ACTIVE') fail('contact freeze');
if (review.productionMutationPerformed !== false || review.pipelineReviewApplied !== false) fail('mutation boundary');
if (review.outreachAuthorized !== false || review.sendAuthorized !== false) fail('send boundary');
if (!Array.isArray(review.candidates) || review.candidates.length !== 3) fail('candidate count');
const ids = review.candidates.map(x=>x.restaurantId).sort((a,b)=>a-b);
if (JSON.stringify(ids) !== JSON.stringify([11,145,159])) fail('candidate ids');
for (const c of review.candidates) {
  if (c.masterReviewDecision !== 'PASS_CANDIDATE') fail(`decision ${c.restaurantId}`);
  if (c.recommendedOutreachLanguage !== 'ES') fail(`language ${c.restaurantId}`);
  if (!Array.isArray(c.evidence) || c.evidence.length < 1) fail(`evidence ${c.restaurantId}`);
}
if (review.waveAImpact.strictReadyBefore !== 15 || review.waveAImpact.candidateAdds !== 3 || review.waveAImpact.projectedStrictReadyAfterSeparateApprovedPipelinePromotion !== 18) fail('wave projection');
if (review.waveAImpact.cohortFrozenNow !== false) fail('cohort must remain unfrozen');
if (copy.status !== 'DRAFT_FOR_REVIEW_NOT_SENDABLE' || copy.contactFreeze !== 'ACTIVE') fail('copy freeze status');
if (!Array.isArray(copy.messages) || copy.messages.length !== 3) fail('message count');
for (const m of copy.messages) {
  if (!m.email?.includes('Sin compromiso')) fail(`no-commitment copy ${m.restaurantId}`);
  if (/garantiz|garantía de (?:ventas|reservas|posición)/i.test(m.email)) fail(`guarantee claim ${m.restaurantId}`);
}
if (!copy.claimRules.includes('No message may be sent while Contact Freeze is active')) fail('freeze rule missing');
console.log('G2 Wave A +3 review contract GREEN');

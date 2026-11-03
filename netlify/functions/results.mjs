import { getStore } from '@netlify/blobs';
const store = getStore({ name: 'eastasia-trade-results', consistency: 'strong' });
const PIN = process.env.TEACHER_PIN || 'CHANGE-ME-2468';
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}});
const rankRows = rows => rows.sort((a,b)=>b.score-a.score||b.accuracy-a.accuracy||a.duration-b.duration||new Date(a.submittedAt)-new Date(b.submittedAt)).map((r,i)=>({...r,rank:i+1}));
export default async (req) => {
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
 const action=new URL(req.url).searchParams.get('action');
 try {let rows=await store.get('records',{type:'json'})||[];
  if(req.method==='GET'&&action==='public') return json(rankRows(rows).slice(0,10));
  if(req.method==='POST'){const body=await req.json();
   if(action==='submit'){const name=String(body.name||'익명 탐험가').trim().slice(0,30)||'익명 탐험가';const score=Math.max(0,Math.min(10000,Math.round(Number(body.score)||0))),correct=Math.max(0,Math.min(100,Math.round(Number(body.correct)||0))),total=Math.max(0,Math.min(100,Math.round(Number(body.total)||0))),duration=Math.max(1,Math.min(86400,Math.round(Number(body.duration)||1))),completedRegions=Math.max(0,Math.min(8,Math.round(Number(body.completedRegions)||0)));const accuracy=total?Math.round(correct/total*100):0;const record={id:crypto.randomUUID(),name,score,correct,total,accuracy,duration,completedRegions,submittedAt:new Date().toISOString()};rows.push(record);rows=rankRows(rows).slice(0,500);await store.setJSON('records',rows);return json({ok:true,rank:rows.findIndex(r=>r.id===record.id)+1});}
   if(action==='teacher'){if(body.pin!==PIN)return json({error:'교사 인증번호가 올바르지 않습니다.'},401);return json(rankRows(rows));}
   if(action==='clear'){if(body.pin!==PIN)return json({error:'교사 인증번호가 올바르지 않습니다.'},401);await store.setJSON('records',[]);return json({ok:true});}}
  return json({error:'지원하지 않는 요청입니다.'},404);
 }catch(e){return json({error:e.message||'서버 오류'},500)}
};

const menu = [
 {id:'1',name:'烤鮭魚飯',price:220,ingredients:'鮭魚、白飯、時蔬',beef:false,pork:false,vegetarian:false,hotSoup:false},
 {id:'2',name:'小黃瓜壽司組合',price:120,ingredients:'小黃瓜、米飯、海苔',beef:false,pork:false,vegetarian:true,hotSoup:false},
 {id:'3',name:'湯烏龍麵',price:180,ingredients:'烏龍麵、蔬菜、湯底成分未驗證',beef:false,pork:false,vegetarian:false,hotSoup:true},
 {id:'4',name:'炸豬排定食',price:260,ingredients:'豬排、白飯、高麗菜',beef:false,pork:true,vegetarian:false,hotSoup:false},
 {id:'5',name:'牛肉丼飯',price:250,ingredients:'牛肉、白飯、洋蔥',beef:true,pork:false,vegetarian:false,hotSoup:false},
 {id:'6',name:'豆腐蔬菜飯',price:190,ingredients:'豆腐、蔬菜、白飯（調味未驗證）',beef:false,pork:false,vegetarian:true,hotSoup:false}
];
const reply=(status,obj)=>new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'}});
export default async function handler(request){
 if(request.method!=='POST')return reply(405,{error:'僅支援POST'});
 if(!process.env.OPENAI_API_KEY)return reply(503,{error:'尚未設定OPENAI_API_KEY，請到Netlify環境變數設定'});
 let body;try{body=await request.json()}catch{return reply(400,{error:'資料格式錯誤'})}
 const text=body?.text, p=body?.preferences||{};
 if(typeof text!=='string'||!text.trim()||text.length>1200)return reply(400,{error:'請輸入1至1200字的用餐需求'});
 const goal=['balanced','light','protein','none'].includes(p.goal)?p.goal:'balanced';
 const budget=[200,300,400,9999].includes(p.budget)?p.budget:300;
 const restriction=['auto','beef','pork','vegetarian','none'].includes(p.restriction)?p.restriction:'auto';
 const handling=['auto','easy','none'].includes(p.handling)?p.handling:'auto';
 const instruction=`你是AI友膳智慧用餐需求分析助理。僅使用繁體中文，輸出單一JSON物件，不要Markdown。輸出格式：{"needs":[{"label":"需求分類","detail":"具體描述","source":"explicit或inferred"}],"predictions":["值得確認的潛在問題"],"solutions":["給店家的簡短可執行建議"],"alternatives":["替代方案"],"recommendations":[{"id":"菜單ID","reason":"符合條件的理由","caution":"須確認的限制"}],"warnings":["重要警示"]}。每類最多6項，recommendations最多4項。區分顧客明確說出與AI推測；不把推測當成確定事實；處理衝突（例如想靠窗但輪椅空間不足、低預算與飲食限制衝突）要指出取捨，必要時詢問待確認問題。輪椅使用者不一定需要他人協助；「拿得到湯麵但端不穩」是安全端取，不是接近不到。不得虛構餐廳設施、價格、過敏原安全、營養成分或已提供的服務。菜單只有下方虛構品項；推薦只能用菜單中的id，不得自行新增餐點；必須符合明確飲食限制和預算；未知成分不得保證不含過敏原，若有過敏請明確警告全部菜單的成分及交叉接觸尚未驗證，不能視為安全；若無法安全推薦，recommendations為空。偏好選單若與自由輸入衝突，說明矛盾並優先採較安全、較嚴格限制，不能擅自忽略。不要提供醫療處方。菜單：${JSON.stringify(menu)}`;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),22000);
 try{
 const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{'authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',temperature:0.2,response_format:{type:'json_object'},messages:[{role:'system',content:instruction},{role:'user',content:JSON.stringify({description:text,preferences:{goal,budget,restriction,handling}})}],max_tokens:1300})});
 const raw=await r.json().catch(()=>({}));if(!r.ok){const code=r.status===401?'API金鑰無效':r.status===429?'API額度或請求限制':`AI服務回應錯誤（${r.status}）`;return reply(502,{error:code})}
 const obj=JSON.parse(raw.choices?.[0]?.message?.content||'{}');
 for(const k of ['needs','predictions','solutions','alternatives','recommendations','warnings'])if(!Array.isArray(obj[k]))obj[k]=[];
 const noBeef=restriction==='beef'||/不吃牛|不能吃牛|忌牛/.test(text);const noPork=restriction==='pork'||/不吃豬|不能吃豬|忌豬/.test(text);const vegetarian=restriction==='vegetarian'||/素食|全素|蛋奶素/.test(text);const allowed=new Map(menu.filter(m=>m.price<=budget && !(noBeef&&m.beef)&&!(noPork&&m.pork)&&!(vegetarian&&!m.vegetarian)).map(m=>[m.id,m]));
 const hasAllergy=/過敏|allerg/i.test(text);if(hasAllergy){obj.recommendations=[];obj.warnings.push('已提到食物過敏：示範菜單未驗證成分與交叉接觸，不能推薦為安全餐點，請向店家確認。')}
 else obj.recommendations=obj.recommendations.filter(x=>allowed.has(String(x.id))).slice(0,4);
 return reply(200,obj);
 }catch(e){return reply(502,{error:e?.name==='AbortError'?'AI回應逾時，請稍後重試':'AI分析暫時失敗，請稍後重試'})}finally{clearTimeout(timer)}
}
export const config={path:'/.netlify/functions/analyze'};

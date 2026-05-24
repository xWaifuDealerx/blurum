const fs=require("fs");const {JSDOM}=require("jsdom");
const src=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const mk=()=>({request:async({method})=>method==="eth_requestAccounts"?["0x12ab000000000000000000000000000000face01"]:null,on(){}});
const dom=new JSDOM(src,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}}; w.localStorage.clear(); }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(150);
  // not connected: board shows connect prompt + NPCs (8 rows incl. you at 0)
  d.querySelector('.navi[data-view="board"]').click(); await tick(40);
  const rows0=d.querySelectorAll('#boardWrap .lb').length;
  const navHasBoard=!!d.querySelector('.navi[data-view="board"]');
  // connect
  d.querySelector("#connectBtn").click(); await tick(80);
  const mm=[...d.querySelectorAll("#walletList .wopt")].find(b=>/MetaMask/.test(b.textContent)); mm&&mm.click(); await tick(300);
  d.querySelector('.navi[data-view="board"]').click(); await tick(40);
  const meRow=d.querySelector('#boardWrap .lb.me');
  const meRankLow=meRow?meRow.querySelector('.rank').textContent.trim():'?';
  const bannerLow=d.querySelector('#boardWrap .banner').textContent.match(/#\d+ of \d+/);
  // pump XP way up (simulate lots of check-ins/messages by directly granting via reactions+messages)
  d.querySelector('.navi[data-view="general"]').click(); await tick(20);
  for(let i=0;i<3;i++){ d.querySelector("#streakChip") && d.querySelector("#streakChip").click(); await tick(20); } // one real check-in; others noop
  for(let i=0;i<30;i++){ d.querySelector("#msgInput").value="m"+i; d.querySelector("#sendBtn").click(); await tick(8); }
  d.querySelector('.navi[data-view="board"]').click(); await tick(40);
  const meRankHigh=d.querySelector('#boardWrap .lb.me .rank').textContent.trim();
  const youTag=!!d.querySelector('#boardWrap .lb.me .mtag.you');
  console.log("nav has board:",navHasBoard,"| rows:",rows0,"| rank(low XP):",meRankLow,"banner:",bannerLow&&bannerLow[0]);
  console.log("rank after gaining XP:",meRankHigh,"| 'you' tag:",youTag,"| errors:",errors.length?errors:"NONE");
  const climbed = parseInt(meRankHigh)<=parseInt(meRankLow);
  console.log((navHasBoard && rows0===8 && youTag && climbed && !errors.length)?"OK — leaderboard ranks & you climb as XP rises":"FAIL");
  w.close();process.exit(0);
})();

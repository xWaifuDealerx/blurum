const fs=require("fs");const {JSDOM}=require("jsdom");
const src=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[]; let openedUrl=null;
const mk=()=>({request:async({method})=>method==="eth_requestAccounts"?["0x12ab000000000000000000000000000000face01"]:null,on(){}});
const dom=new JSDOM(src,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/app",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}}; w.localStorage.clear(); w.open=(u)=>{openedUrl=u;}; }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(200);
  d.querySelector("#connectBtn").click(); await tick(80);
  const mm=[...d.querySelectorAll("#walletList .wopt")].find(b=>/MetaMask/.test(b.textContent)); mm&&mm.click(); await tick(300);
  // share btn lives on profile + board headers (always present)
  const shareBtns=!!d.querySelector("#shareBtn")&&!!d.querySelector("#shareBtnB");
  d.querySelector("#shareBtn").click(); await tick(60);
  const scrimOpen=d.querySelector("#shareScrim").classList.contains("open");
  const svgEls=d.querySelectorAll("#shareCardBox svg").length;
  const svgTxt=(d.querySelector("#shareCardBox svg")||{}).textContent||"";
  const hasLevel=/Lv \d/.test(svgTxt), hasRank=/#\d/.test(svgTxt);
  // cast (no fc sdk in jsdom -> warpcast intent)
  d.querySelector("#castBtn").click(); await tick(80);
  const isWarpcast=/warpcast\.com\/~\/compose/.test(openedUrl||"")&&/embeds\[\]/.test(openedUrl||"");
  console.log("share buttons present:",shareBtns,"| scrim open:",scrimOpen,"| svg rendered:",svgEls,"| level&rank in svg:",hasLevel&&hasRank);
  console.log("cast opened warpcast intent:",isWarpcast);
  console.log("opened url:",(openedUrl||"").slice(0,90)+"...");
  console.log("page errors:",errors.length?errors:"NONE");
  console.log((shareBtns&&scrimOpen&&svgEls===1&&hasLevel&&hasRank&&isWarpcast&&!errors.length)?"OK — share card + Farcaster cast working":"FAIL");
  w.close();process.exit(0);
})();

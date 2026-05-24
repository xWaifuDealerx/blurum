const fs=require("fs");const {JSDOM}=require("jsdom");
const src=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
function run(label,url,setup){return new Promise(res=>{
  const errors=[]; let opened=null;
  const dom=new JSDOM(src,{runScripts:"dangerously",pretendToBeVisual:true,url,
    beforeParse(w){ w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}}; w.open=(u)=>{opened=u;}; setup(w); }});
  const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
  setTimeout(async()=>{
    d.querySelector("#connectBtn").click(); await new Promise(r=>setTimeout(r,120));
    const rabby=[...d.querySelectorAll("#walletList .wopt")].find(b=>/Rabby/.test(b.textContent));
    if(rabby) rabby.click(); await new Promise(r=>setTimeout(r,300));
    const noWalletShown=d.querySelector("#noWallet").style.display!=="none";
    const noWalletTxt=(d.querySelector("#noWallet").textContent||"").slice(0,40);
    const connected=d.querySelector("#connectBtn").textContent.trim();
    console.log(`[${label}] opened-url:`,opened,"| noWallet shown:",noWalletShown,"| connected:",connected,"| errors:",errors.length?errors:"NONE");
    console.log(`         noWallet msg: ${noWalletTxt}...`);
    w.close(); res();
  },150);
});}
const mk=flag=>{const p={request:async({method})=>method==="eth_requestAccounts"?["0x12ab000000000000000000000000000000face01"]:null,on(){}};if(flag)p[flag]=true;return p;};
(async()=>{
  await run("file:// no wallet","file:///C:/Users/k/index.html",w=>{}); // expect: no redirect, noWallet message
  await run("hosted + Rabby","https://blueroom.app/",w=>{ w.ethereum=mk("isRabby"); }); // expect: connected
  process.exit(0);
})();

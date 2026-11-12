/* Authored fissure geometry; rasterized once, shared by damage and the finale. */
(() => {
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const palettes=Object.freeze({
    home:['#123c32','#36c870','#a1ff94','#f2ffe9'],
    candy:['#572441','#ed54a8','#ffb4df','#fff1fa'],
    magma:['#592227','#ff4940','#ffae81','#fff4e9'],
    desert:['#183f6c','#39acfa','#9ce5ff','#f1fcff'],
    source:['#322348','#7850af','#c4ed45','#f7ffd7']
  });
  const paths=[
    {birth:0,points:[[.01,-.993],[-.045,-.91],[.025,-.83],[-.06,-.72],[.04,-.62],[-.01,-.50],[.09,-.34]]},
    {birth:.07,points:[[-.045,-.91],[-.21,-.92],[-.32,-.87],[-.45,-.89],[-.58,-.78],[-.67,-.68],[-.79,-.59]]},
    {birth:.12,points:[[.025,-.83],[.20,-.87],[.30,-.80],[.42,-.83],[.55,-.72],[.70,-.65],[.79,-.48]]},
    {birth:.25,points:[[-.06,-.72],[-.22,-.67],[-.31,-.57],[-.43,-.59],[-.53,-.43],[-.68,-.36]]},
    {birth:.29,points:[[.04,-.62],[.20,-.59],[.28,-.46],[.42,-.43],[.48,-.27],[.62,-.16]]},
    {birth:.33,points:[[-.32,-.87],[-.35,-.93],[-.45,-.89]]},
    {birth:.40,points:[[.42,-.83],[.48,-.85],[.55,-.72]]},
    {birth:.46,points:[[-.58,-.78],[-.69,-.69],[-.81,-.55],[-.87,-.36]]},
    {birth:.49,points:[[.70,-.65],[.83,-.48],[.89,-.28]]},
    {birth:.55,points:[[-.01,-.50],[-.14,-.42],[-.24,-.29],[-.39,-.25],[-.48,-.09]]},
    {birth:.60,points:[[.09,-.34],[.23,-.23],[.20,-.11],[.34,.02]]}
  ];
  const vents=Object.freeze([[-.58,-.78,.25],[-.32,-.87,.18],[.01,-.97,.05],[.30,-.80,.23],[.42,-.83,.32],[.70,-.65,.45]]);
  const jagged=paths.map((path,n)=>({...path,points:path.points.flatMap((a,i)=>{
    const b=path.points[i+1];if(!b)return [a];
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
    return Array.from({length:5},(_,j)=>{const t=j/5,bend=Math.sin(n*11.3+i*7.7+j*4.1)*.009*Math.sin(t*Math.PI);return [a[0]+dx*t-dy/length*bend,a[1]+dy*t+dx/length*bend];});
  })}));
  function canvas(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function frame(id,progress,size=512){
    const c=canvas(size),x=c.getContext('2d'),r=size*.488,center=size/2;
    const [dark,mid,light,white]=palette(id),p=clamp(progress);
    x.beginPath();x.arc(center,center,r,0,Math.PI*2);x.clip();
    for(let n=0;n<jagged.length;n++){
      const path=jagged[n],life=smooth((p-path.birth)/.42);if(life<=0)continue;
      const segments=path.points.length-1,at=life*segments,stop=Math.min(segments,Math.floor(at));
      const points=path.points.slice(0,stop+1).map(a=>a.slice());
      if(stop<segments){const a=path.points[stop],b=path.points[stop+1],t=at-stop;points.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
      if(points.length<2)continue;
      const width=(n<3?1:.58)*(.4+p*1.3)*size/512;
      // A dark irregular split, reflected color, then a fine white-hot interior.
      // Keep the white seam narrow so this reads as rock opening, not neon tubes.
      for(const [scale,color,blur]of [[3.2,dark,0],[1.7,mid+'d0',12],[.85,light+'f0',5],[.22,white,1]]){
        x.globalCompositeOperation=scale===3.2?'source-over':'lighter';
        x.shadowColor=light;x.shadowBlur=blur*size/512;
        x.beginPath();
        for(const side of [-1,1])for(let j=0;j<points.length;j++){
          const i=side<0?j:points.length-1-j,a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
          const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
          const taper=i===points.length-1?.03:.25+.75*Math.sin(i*2.7+n*1.9+side*.6)**2;
          const w=width*scale*taper;
          const px=center+points[i][0]*r-side*(b[1]-a[1])/len*w,py=center+points[i][1]*r+side*(b[0]-a[0])/len*w;
          if(side<0&&j===0)x.moveTo(px,py);else x.lineTo(px,py);
        }
        x.closePath();x.fillStyle=color;x.fill();
      }
      x.shadowBlur=0;
    }
    return c;
  }
  function ray(id){
    const c=canvas(160,512),x=c.getContext('2d'),[,mid,light,white]=palette(id);
    // A hot narrow root opens into a soft, broken fan, then dissolves in air.
    for(let j=0;j<7;j++){
      const tip=39+j*14,bend=Math.sin(j*2.3)*13;
      const g=x.createLinearGradient(0,510,0,22+j*9);
      g.addColorStop(0,white+'d9');g.addColorStop(.16,light+'b0');g.addColorStop(.58,mid+'55');g.addColorStop(1,light+'00');
      x.fillStyle=g;x.shadowColor=light;x.shadowBlur=12;
      x.beginPath();x.moveTo(77,510);x.bezierCurveTo(74+bend,395,tip-21,150,tip-31,14+j*9);
      x.lineTo(tip+29,12+j*9);x.bezierCurveTo(tip+18,170,86+bend,400,83,510);x.closePath();x.fill();
    }
    return c;
  }
  const palette=id=>palettes[id]||palettes.home;
  const forWorld=world=>({1:'home',3:'candy',4:'magma',5:'desert',6:'source'}[world]||'home');
  const api=Object.freeze({palette,forWorld,frame,ray,vents,paths});
  if(typeof window!=='undefined')window.SlimeCoreFractures=api;
  if(typeof module!=='undefined')module.exports=api;
})();

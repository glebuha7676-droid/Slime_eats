/* Same sprite dimensions and lossless alpha: no changes to crops or attachment points. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm'),sharp=require('sharp');
sharp.cache({memory:32});sharp.concurrency(2);
const dir='outputs/optimization-700';fs.mkdirSync(dir,{recursive:true});const previous=fs.existsSync(dir+'/images.json')?JSON.parse(fs.readFileSync(dir+'/images.json','utf8')).changed:[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const c={window:{}};vm.runInNewContext(fs.readFileSync('js/core/boot-manifest.js','utf8'),c);const changed=[];let totalBefore=0,totalAfter=0;
for(const a of c.window.SlimeBootManifest.assets){
 if(!/\.(webp|png)$/.test(a.url))continue;const input=fs.readFileSync(a.url);totalBefore+=input.length;let output=input;
 const newer=/slime\/forms\/|wardrobe\/accessories\/|parallax-v3\//.test(a.url);
 const done=previous.find(x=>x.file===a.url&&x.afterHash===hash(input));if(done){changed.push(done);totalAfter+=input.length;continue}
 if(input.length>100000||(newer&&input.length>35000)){
  const meta=await sharp(input).metadata();if(meta.format==='webp'){
   output=await sharp(input).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
   if(output.length<input.length*.90){
    const before=await sharp(input).ensureAlpha().raw().toBuffer(),after=await sharp(output).ensureAlpha().raw().toBuffer();let error=0,count=0;
    for(let i=0;i<before.length;i+=4){if(before[i+3]!==after[i+3])throw Error('Alpha changed: '+a.url);if(before[i+3]>32){for(let k=0;k<3;k++){error+=(before[i+k]-after[i+k])**2;count++}}}
    const rmse=Math.sqrt(error/Math.max(1,count));
    if(rmse<=8){const backup=path.join(dir,'originals',a.url);fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.writeFileSync(backup,input);fs.writeFileSync(a.url,output);changed.push({file:a.url,before:input.length,after:output.length,width:meta.width,height:meta.height,rmse,alphaExact:true,beforeHash:hash(input),afterHash:hash(output)})}else output=input;
   }else output=input;
  }
 }
 totalAfter+=output.length;
}
const report={totalBefore,totalAfter,savedBytes:changed.reduce((s,x)=>s+x.before-x.after,0),changed};fs.writeFileSync(dir+'/images.json',JSON.stringify(report,null,2));console.log(JSON.stringify({images:changed.length,savedBytes:report.savedBytes,totalAfter,alphaAndDimensions:'preserved'}));
})().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('fs'),vm=require('vm'),sharp=require('sharp');
(async()=>{const box={window:{}};vm.runInNewContext(fs.readFileSync('js/config/accessory-fit.js','utf8'),box);const fits={...box.window.SlimeAccessoryFit};
 for(const id of ['beard']){const source=`assets/ui/wardrobe/accessories/${id}-v692-master.png`,image=`assets/ui/wardrobe/accessories/${id}-v692.webp`;const info=await sharp(source).trim({threshold:8}).resize({width:768}).webp({quality:92,alphaQuality:100}).toFile(image);
 const fit={image,pixelWidth:info.width,pixelHeight:info.height,anchorX:info.width/2,anchorY:0,targetY:0};
 if(id==='beard'){fit.width=.82;fit.targetY=.38;}
 else {fit.kind=id==='lashes'?'lashes':'closed-lid';fit.width=id==='lashes'?.57:.46;fit.height=id==='lashes'?.28:.15;fit.eyeAnchorX=.455;fit.eyeAnchorY=.94;}
 fits[id]=fit;}
 fits.lashes={kind:'lashes'};delete fits.lashesClosed;
 fits.pixel={...fits.pixel,width:1.30,targetY:.035};
 fs.writeFileSync('js/config/accessory-fit.js','// Whole-sprite face fitting. Latest changes: tools/export_accessories_692.cjs\nwindow.SlimeAccessoryFit=Object.freeze('+JSON.stringify(fits,null,2)+');\n');console.log('692 exported');})().catch(e=>{console.error(e);process.exitCode=1});

const fs=require('node:fs'),sharp=require('sharp');
(async()=>{
 const base='assets/ui/slime/forms/slime-body-spores-growing-v1';
 fs.copyFileSync('C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12/exec-93a37954-2f62-4fbe-9242-009312624d4c.png',`${base}-master.png`);
 const {data,info}=await sharp(`${base}-master.png`).trim({threshold:10}).resize({width:476}).toBuffer({resolveWithObject:true});
 if(info.height>538)throw Error('Spore body exceeds sprite canvas');
 await sharp({create:{width:512,height:576,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left:Math.round((512-info.width)/2),top:538-info.height}]).webp({lossless:true}).toFile(`${base}.webp`);
 const preview=fs.readFileSync('editors/electric-forms-656.html','utf8')
  .replaceAll('Электричество — три стадии','Споры — три стадии').replace('Электричество · формы','Споры · формы')
  .replace('I · Разряды','I · Первые грибы').replace('II · Заряженная форма','II · Разрастание').replace('III · Электрическая форма','III · Грибница')
  .replace('Обычный цвет и небольшие разряды','Прежняя первая стадия').replace('Переход от зелёного слайма к молнии','Больше грибов и первые пятна грибницы')
  .replaceAll('electricSparks','sporesStage1').replaceAll('electricCharged','sporesStage2').replaceAll('electricUltra','sporesUltra')
  .replaceAll('electricEyes','sporesEyes').replaceAll('electric:','cloning:').replaceAll('electricFormsPreview','cloningFormsPreview')
  .replaceAll("'#ffd84e'","'#ce782f'").replaceAll('slime-avatar.js?v=658','slime-avatar.js?v=659');
 fs.writeFileSync('editors/spores-forms-659.html',preview);
 console.log(`${base}.webp: ${info.width} x ${info.height} visible sprite, 512 x 576 canvas`);
})().catch(error=>{console.error(error);process.exitCode=1;});

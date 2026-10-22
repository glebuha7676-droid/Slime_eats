const fs = require('node:fs'), path = require('node:path'), sharp = require('sharp');
const root = 'C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs = [
 ['electric-sparks', 'exec-507b9b88-82b6-484c-a5dc-5fb86cd32df6.png'],
 ['electric-charged', 'exec-1166b2f6-20a9-4778-ae31-5fe6546e06bd.png']
];
(async()=>{for(const [name,file] of jobs){
 const base = `assets/ui/slime/forms/slime-body-${name}-v1`;
 fs.copyFileSync(path.join(root,file), `${base}-master.png`);
 const {data,info} = await sharp(`${base}-master.png`).trim({threshold:10}).resize(434,435,{fit:'inside'}).toBuffer({resolveWithObject:true});
 await sharp({create:{width:512,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left:Math.round((512-info.width)/2),top:474-info.height}]).webp({lossless:true}).toFile(`${base}.webp`);
 console.log(`${base}.webp: ${info.width} x ${info.height} visible body`);
}
const preview = fs.readFileSync('editors/frost-forms-655.html','utf8')
 .replaceAll('Мороз — три стадии','Электричество — три стадии').replace('Мороз · формы','Электричество · формы')
 .replace('I · Мороз','I · Разряды').replace('II · Снеговик','II · Заряженная форма').replace('III · Ледяная форма','III · Электрическая форма')
 .replace('Подмороженный низ, прежний эффект','Обычный цвет и небольшие разряды').replace('Слайм-снеговик со снежинками','Переход от зелёного слайма к молнии')
 .replaceAll('frostChilled','electricSparks').replaceAll('frostSnowman','electricCharged').replaceAll('frostUltra','electricUltra')
 .replaceAll('frostEyes','electricEyes').replaceAll('frost:','electric:').replaceAll('frostFormsPreview','electricFormsPreview')
 .replace("'#3a9fff'","'#ffd84e'").replace(",cheekFilter:'hue-rotate(195deg) saturate(.85) brightness(1.08) contrast(1.06)',mouthStyle:MutationEffectDraft.isFrostBreathing(timestamp)?'pursed':''",'')
 .replaceAll('slime-avatar.js?v=655','slime-avatar.js?v=656');
fs.writeFileSync('editors/electric-forms-656.html',preview);
})().catch(error=>{console.error(error);process.exitCode=1;});

const sharp=require('sharp');
Promise.all([
 sharp('assets/ui/wardrobe/room-pedestal-v3-master.png').resize({width:1000}).webp({quality:88}).toFile('assets/ui/wardrobe/room-pedestal-v3.webp'),
 sharp('assets/ui/wardrobe/compact-synth-v1-master.png').resize({width:1000}).webp({quality:92,alphaQuality:100}).toFile('assets/ui/wardrobe/compact-synth-v1.webp')
]).then(results=>console.log(results)).catch(error=>{console.error(error);process.exitCode=1});

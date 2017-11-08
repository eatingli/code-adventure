import Season from './Season.js'

let season  = new Season(Date.now(),1000*60);

setInterval(()=>{
  let seasonName = ['春','夏','秋','冬'];
  console.log(new Date().toString(),seasonName[season.update()]);
},1000);

const DEFAULT_PERIOD = 1000 * 60 * 15;//15 minute

export default class Season {

  /**
   *
   * @param {Number} timer Inital time value.if not Specified,default is Date.now().
   * @param {Number} period Period of four seasons (ms).if not Specified,default is 15 minute.
   *@param {Number} tick Specific time point in period.if not Specified,default is a radom value in period.
   */
  constructor(timer,period,tick){
    this.timer = timer|| Date.now();
    this.period = period || DEFAULT_PERIOD;
    this.tick = tick || Math.floor(Math.random() * this.period);//random in 0 ~ this.period -1
    this.ranges = [1,1,1,1].map((e,i)=>(i+e) * this.period / 4);
  }

  /**
   *
   * @return {Number} exmple: 0 - spring, 1-summer, 2-autumn, 3-winter.
   */
  update(){
    let prev = this.timer;
    this.timer = Date.now();
    this.tick += (this.timer - prev);
    this.tick %= this.period;//0 ~ this.period -1
    return this.ranges.reduceRight((acc,e,i)=>{
      return this.tick < e ? i : acc;
    },0);
  }
}

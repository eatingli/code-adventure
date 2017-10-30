class GameAttr {

  /**
   *Game Attributes instance.
   * @param {World} world
   */
  constructor(world){
    this.world = world;//World
    this.nowTime = Date.now();//game timer
    this.roles =[];//Role list
    this.monsterList =[];//Monster list
    this.resourceList = [];//Resource list
    this.areaList = [];//Area list
    this.timerMap = new Map();//map of other timers
  }

  /**
   *Update game timer.
   * @returns {GameAttr}
   */
  updateTime(){
    this.nowTime = Date.now();
    return this;
  }

  /**
   *Add singe Role.
   *@param {Role} role
   * @returns {GameAttr}
   */
  addRole(role){
    this.roles.push(role);
    return this;
  }

  /**
   *Add multiple Roles.
   *@param {Array<Role>} roles
   * @returns {GameAttr}
   */
  addRoles(roles){
    Array.prototype.push.apply(this.roles, roles);
    return this;
  }

  /**
   *Add singe monster.
   *@param {Monster} monster
   * @returns {GameAttr}
   */
  addMonster(monster){
    this.monsterList.push(monster);
    return this;
  }

  /**
   *Add multiple Monsters.
   *@param {Array<Monster>} monsters
   * @returns {GameAttr}
   */
  addMonsters(monsters){
    Array.prototype.push.apply(this.monsterList, monsters);
    return this;
  }

  /**
   *Add multiple Monsters.
   *@param {function} fn
   * @returns {Array}
   */
  filterMonsters(fn){
    return this.monsterList.filter(fn);
  }

  /**
   *Add singe Resource.
   *@param {Resource} resource
   * @returns {GameAttr}
   */
  addResource(resource){
    this.resourceList.push(resource);
    return this;
  }

  /**
   *Add multiple Resources.
   *@param {Array<Resource>} resources
   * @returns {GameAttr}
   */
  addResources(resources){
    Array.prototype.push.apply(this.resourceList, resources);
    return this;
  }

  /**
   *Add singe area.
   *@param {Area} area
   * @returns {GameAttr}
   */
  addArea(area){
    this.areaList.push(area);
    return this;
  }

  /**
   *Add multiple Areas.
   *@param {Array<Area>} areas
   * @returns {GameAttr}
   */
  addAreas(areas){
    Array.prototype.push.apply(this.areaList, areas);
    return this;
  }

  /**
   *register or set a timer.
   *@param {any} key
   *@param {Number} time
   * @returns {GameAttr}
   */
  setTimer(key,time){
    this.timerMap.set(key, time);
    return this;
  }

  /**
   *get timer value.
   *@param {*} key
   * @returns {Number}
   */
  getTimer(key){
    return this.timerMap.get(key);
  }
  /**
   *unregister timer.
   *@param {any} key
   * @returns {GameAttr}
   */
  deleteTimer(key){
    this.timerMap.delete(key);
    return this;
  }
}

export default GameAttr;

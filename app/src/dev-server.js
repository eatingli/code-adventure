import express from 'express'
import {
  Point,
  Rect,
  Area,
  RoleValues,
  Role,
  MonsterValues,
  Monster,
  World,
  GameConfig,
  Resource,
} from './game.js'
import GameService from './game-service.js'
import GameAttr from './GameAttr.js'
import {delay} from './util.js'

let gameService = new GameService();

/*Game constant*/
const MONSTER_BORN_PERIOD = 3000;
const MONSTER_AMOUNT_MAX = 15;
const RESOURCE_APPEAR_PERIOD = 1000;
const RESOURCE_AMOUNT_MAX = 20;

/*Game Attributes*/
let gameAttr = new GameAttr(new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT));
gameAttr.addRole(new Role(new Point(5, 5), new RoleValues(999999, 999999, 99)))
  .addAreas([new Area([new Rect(0, 0, 5, 10)], []), new Area([new Rect(5, 0, 5, 10)], [])])
  .setTimer("gen_monster",Date.now())//timer for genarating monster
  .setTimer("gen_resource",Date.now());//timer for genarating resource

/*process functions*/

/**
 *
 *@param {gameAttr} attr
 * @returns {Point}
 */
function availablePoint(attr) {
    let width = attr.world.width;
    let height = attr.world.height;
    let usedPoints = [];
    usedPoints = usedPoints.concat(attr.monsterList.map((m) => m.point));
    usedPoints = usedPoints.concat(attr.resourceList.map((i) => i.point));

    let availablePoints = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let newPoint = new Point(x, y);
            let flag = true;
            for (let p of usedPoints) {
                if (p.same(newPoint)) {
                    flag = false;
                    break;
                }
            }
            if (flag) availablePoints.push(newPoint)
        }
    }
    // console.log(`availablePoints: ${availablePoints.length}`);
    if (availablePoints.length > 0) {
        let index = Math.floor(Math.random() * availablePoints.length)
        return availablePoints[index];
    } else {
        return null;
    }
}

/**
 *
 *@param {gameAttr} attr
 * @returns {Array<Point>}
 */
function usedPoints(attr) {
  let usedPoints = [];
  usedPoints = usedPoints.concat(attr.monsterList.map((m) => m.point));
  usedPoints = usedPoints.concat(attr.resourceList.map((i) => i.point));
  return usedPoints;
}

/**
 *
 *@param {Array<Point>} points
 *@param {Array<Point>} removePoints
 * @returns {Array<Point>}
 */
function filterPoints(points, removePoints) {
    return points.filter((p1) => {
        for (let p2 of removePoints) {
            if (p1.same(p2)) return false;
        }
        return true;
    })
}

/**
 *
 *@param {Array<Point>} points
 * @returns {Point|null}
 */
function randomPoint(points) {
    if (points.length > 0) {
        let index = Math.floor(Math.random() * points.length)
        return points[index];
    } else {
        return null;
    }
}

/**
 *Game Loop function
 *@param {GameAttr} attr
 */
function run(attr) {

  attr.updateTime();//nowTime = Date.now();

  // Check Amount
  if (attr.monsterList.length >= MONSTER_AMOUNT_MAX) attr.setTimer("gen_monster",attr.nowTime + MONSTER_BORN_PERIOD);
  if (attr.resourceList.length >= RESOURCE_AMOUNT_MAX) attr.setTimer("gen_resource",attr.nowTime + RESOURCE_APPEAR_PERIOD);

  // New Monster
  if(attr.nowTime > attr.getTimer("gen_monster")){

    for (let area of attr.areaList){

      // check
      let amount = attr.filterMonsters((m) => area.isPointInArea(m.point)).length;
      if (amount >= MONSTER_AMOUNT_MAX) continue;

      let points = area.getAllPoints();
      points = filterPoints(points, usedPoints(attr));

      let p = randomPoint(points);

      if (p) {
          let newMonster = new Monster(p, 0, new MonsterValues(200, 200, 15));
          attr.addMonster(newMonster);
          console.log(`New Monster ${JSON.stringify(p)}`);
      } else {
          console.log('No Available Point');
      }

      if (attr.monsterList.length >= MONSTER_AMOUNT_MAX) break;
    }

    attr.setTimer("gen_monster",attr.nowTime + MONSTER_BORN_PERIOD);
  }

  // New Resource
  if (attr.nowTime > attr.getTimer("gen_resource")) {
      let p = availablePoint(attr);
      if (p) {
          attr.setTimer("gen_resource",attr.nowTime + RESOURCE_APPEAR_PERIOD);
          let newResource = new Resource(p, 0);
          attr.addResource(newResource);
          console.log(`New Resource ${JSON.stringify(p)}`);
      } else {
          console.log('No Available Point');
      }
  }

  delay(1,attr).then(args=>run(...args));
}

/*========================================*/
const app = express();

app.listen(3000, function () {
    console.log('Dev Server listening on port 3000!');
    setInterval(() => console.log(`m:${gameAttr.monsterList.length} i:${gameAttr.resourceList.length}`),1000)
    run(gameAttr);
});

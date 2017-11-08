import express from 'express'
// import * as Game from './game.js'
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


const app = express();

// let monster = new Monster(new Point(5, 6), 0, new MonsterValues(200, 200, 15));
// let Resource = new Resource(new Point(5, 7), 0);

// Const
const MONSTER_BORN_PERIOD = 3000;
const MONSTER_AMOUNT_MAX = 15;
const RESOURCE_APPEAR_PERIOD = 1000;
const RESOURCE_AMOUNT_MAX = 20;

// Game Attributes
let nowTime = Date.now();
// let world = new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
let world = new World(10, 10);
let role = new Role(new Point(5, 5), new RoleValues(999999, 999999, 99));
/** @type {Array<Monster>} */
let monsterList = [];
/** @type {Array<Resource>} */
let resourceList = [];
/** @type {Array<Area>} */
let areaList = [new Area([new Rect(0, 0, 5, 10)], []), new Area([new Rect(5, 0, 5, 10)], [])];

let monsterTimer = Date.now();
let resourceTimer = Date.now();

/**
 * Check area cover
 */
// Area不重疊
if (areaList.length > 1) {
    for (let i = 0; i < areaList.length; i++) {
        for (let j = i + 1; j < areaList.length; j++) {
            for (let p1 of areaList[i].getAllPoints()) {
                for (let p2 of areaList[j].getAllPoints()) {
                    if (p1.same(p2)) throw new Error('Area Cover Error');
                }
            }
        }
    }
}
// 涵蓋整張地圖
let total = 0;
for (let area of areaList) total += area.getAllPoints().length;
if (total != world.height * world.height) throw new Error('Area Cover Error');


app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/move', function (req, res) {
    let x = Number.parseInt(req.query.x);
    let y = Number.parseInt(req.query.y);

    if (nowTime < role.values.actionTimer) return res.send(`Wait ActionTime`);
    let temp = role.point.move(x, y);
    if (world.isPointInWorld(temp)) role.point = temp;
    role.values.actionTimer = nowTime + role.values.moveDelay;

    let txt = `Role Move ... ${JSON.stringify(role.point)}`
    console.log(txt);
    res.send(txt);
});

app.get('/search', function (req, res) {
    if (nowTime < role.values.actionTimer) return res.send(`Wait ActionTime`);
    role.values.actionTimer = nowTime + role.values.searchDelay;

    // Search Monster, Resource
    let veiwableMonsters = monsterList.filter((m) => role.point.lineDistance(m.point) < role.values.searchDistance);
    let veiwableResources = resourceList.filter((resource) => role.point.lineDistance(resource.point) < role.values.searchDistance);

    if (veiwableMonsters.length == 0 && veiwableResources.length == 0) {
        return res.send(`Not Found`);
    } else {
        let txt = '';
        for (let m of veiwableMonsters) txt = txt + `Monster ${JSON.stringify(m.point)}</br>`;
        for (let i of veiwableResources) txt = txt + `Resource ${JSON.stringify(i.point)}</br>`;
        return res.send(txt);
    }
})

app.get('/atk', function (req, res) {
    if (nowTime < role.values.actionTimer) return res.send(`Wait ActionTime`);

    let hereMonster = monsterList.find((m) => role.point.same(m.point));

    if (hereMonster) {
        if (hereMonster.values.nowLife <= 0) return res.send(`Monster Already Died`); // 不可能被執行到

        let roleNewLife = role.values.nowLife - hereMonster.values.atk;
        let monsterNewLife = hereMonster.values.nowLife - role.values.atk;
        if (roleNewLife <= 0) return res.send(`Role Life Not Enough`);

        role.values.actionTimer = nowTime + role.values.collectDelay;
        role.values.nowLife = roleNewLife;

        if (monsterNewLife <= 0) {
            monsterList.splice(monsterList.indexOf(hereMonster), 1);
            return res.send(`Kill Monster Successs ${JSON.stringify(role.point)}}`);
        } else {
            hereMonster.values.nowLife = monsterNewLife;
            return res.send(`Atk Monster Successs. Role:${role.values.nowLife} Monster:${hereMonster.values.nowLife}`);
        }

    } else {
        return res.send(`No Monster Here ${JSON.stringify(role.point)}}`);
    }
})

app.get('/collect', function (req, res) {
    if (nowTime < role.values.actionTimer) return res.send(`Wait ActionTime`);

    let hereResource = resourceList.find((resource) => role.point.same(resource.point));

    if (hereResource) {
        role.values.actionTimer = nowTime + role.values.collectDelay;
        resourceList.splice(resourceList.indexOf(hereResource), 1);
        return res.send(`Collect Successs ${JSON.stringify(role.point)}}`);
    } else {
        return res.send(`No Resource Here ${JSON.stringify(role.point)}}`);
    }
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

function availablePoint() {
    let width = world.width;
    let height = world.height;
    let usedPoints = [];
    usedPoints = usedPoints.concat(monsterList.map((m) => m.point));
    usedPoints = usedPoints.concat(resourceList.map((i) => i.point));

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

function usedPoints() {
    let usedPoints = [];
    usedPoints = usedPoints.concat(monsterList.map((m) => m.point));
    usedPoints = usedPoints.concat(resourceList.map((i) => i.point));
    return usedPoints;
}

function filterPoints(points, removePoints) {
    return points.filter((p1) => {
        for (let p2 of removePoints) {
            if (p1.same(p2)) return false;
        }
        return true;
    })
}

function randomPoint(points) {
    if (points.length > 0) {
        let index = Math.floor(Math.random() * points.length)
        return points[index];
    } else {
        return null;
    }
}


// Game loop
setInterval(() => {
    nowTime = Date.now();

    // Check Amount
    if (monsterList.length >= MONSTER_AMOUNT_MAX) monsterTimer = nowTime + MONSTER_BORN_PERIOD;
    if (resourceList.length >= RESOURCE_AMOUNT_MAX) resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;

    // New Monster
    if (nowTime > monsterTimer) {

        for (let area of areaList) {

            // check
            let amount = monsterList.filter((m) => area.isPointInArea(m.point)).length;
            if (amount >= MONSTER_AMOUNT_MAX) continue;

            let points = area.getAllPoints();
            points = filterPoints(points, usedPoints());

            let p = randomPoint(points);

            if (p) {
                let newMonster = new Monster(p, 0, new MonsterValues(200, 200, 15));
                monsterList.push(newMonster);
                console.log(`New Monster ${JSON.stringify(p)}`);
            } else {
                console.log('No Available Point');
            }

            if (monsterList.length >= MONSTER_AMOUNT_MAX) break;
        }

        monsterTimer = nowTime + MONSTER_BORN_PERIOD;
    }

    // New Resource
    if (nowTime > resourceTimer) {
        let p = availablePoint();
        if (p) {
            resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;
            let newResource = new Resource(p, 0);
            resourceList.push(newResource);
            console.log(`New Resource ${JSON.stringify(p)}`);
        } else {
            console.log('No Available Point');
        }
    }

}, 10)

setInterval(() => {
    console.log(`m:${monsterList.length} i:${resourceList.length}`)
    return;
    let points = [];
    for (let area of areaList)
        points = points.concat(area.getAllPoints())

    let maxX = 0;
    let maxY = 0;
    for (let p of points) {
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    for (let y = 0; y <= maxY; y++) {
        let txt = '';
        for (let x = 0; x <= maxX; x++) {
            let point = new Point(x, y);
            if (points.find((p) => p.same(point))) {
                if (monsterList.find((m) => m.point.same(point)))
                    txt = txt + '怪';
                else if (resourceList.find((i) => i.point.same(point)))
                    txt = txt + '東';
                else
                    txt = txt + '口';
            } else
                txt = txt + '　';
        }
        console.log(txt);
    }
}, 1000)

// (async() => {
// })()
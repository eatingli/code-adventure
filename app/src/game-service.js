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


// Const
const MONSTER_BORN_PERIOD = 3000;
const MONSTER_AMOUNT_MAX = 15;
const RESOURCE_APPEAR_PERIOD = 1000;
const RESOURCE_AMOUNT_MAX = 20;

export default class Game {

    constructor() {
        this.nowTime = Date.now();
        // let world = new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
        let world = this.world = new World(10, 10);
        this.role = new Role(new Point(5, 5), new RoleValues(999999, 999999, 99));
        /** @type {Array<Monster>} */
        this.monsterList = [];
        /** @type {Array<Resource>} */
        this.resourceList = [];
        /** @type {Array<Area>} */
        let areaList = this.areaList = [new Area([new Rect(0, 0, 5, 10)], []), new Area([new Rect(5, 0, 5, 10)], [])];

        this.monsterTimer = Date.now();
        this.resourceTimer = Date.now();

        // 檢查 Area 不重疊
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
        // 檢查 Area 涵蓋整張地圖
        let total = 0;
        for (let area of areaList) total += area.getAllPoints().length;
        if (total != world.height * world.height) throw new Error('Area Cover Error');

        // Bind this
        // this.availablePoint = this.availablePoint.bind(this);
    }

    checkActionTimer() {
        return this.nowTime >= this.role.values.actionTimer;
    }

    move(x, y) {
        let dis = Math.abs(x) + Math.abs(y);
        if (dis > 1) throw new Error('Move too far');
        if (dis <= 0) throw new Error('Move too short');

        let role = this.role;
        let temp = role.point.move(x, y);
        if (this.world.isPointInWorld(temp)) role.point = temp;
        role.values.actionTimer = this.nowTime + role.values.moveDelay;
    }

    search() {
        let role = this.role;
        role.values.actionTimer = this.nowTime + role.values.searchDelay;

        // Search Monster, Resource
        let veiwableMonsters = this.monsterList.filter((m) => role.point.lineDistance(m.point) < role.values.searchDistance);
        let veiwableResources = this.resourceList.filter((resource) => role.point.lineDistance(resource.point) < role.values.searchDistance);

        return {
            veiwableMonsters: veiwableMonsters,
            veiwableResources: veiwableResources
        }
    }

    atk() {
        let role = this.role;
        let monsterList = this.monsterList;
        let hereMonster = monsterList.find((m) => role.point.same(m.point));

        if (hereMonster) {
            if (hereMonster.values.nowLife <= 0) throw new Error(`Monster Already Died`); // 不可能被執行到

            let roleNewLife = role.values.nowLife - hereMonster.values.atk;
            let monsterNewLife = hereMonster.values.nowLife - role.values.atk;
            if (roleNewLife <= 0) throw new Error(`Role Life Not Enough`);

            role.values.actionTimer = this.nowTime + role.values.collectDelay;
            role.values.nowLife = roleNewLife;

            // Kill
            if (monsterNewLife <= 0) {
                monsterList.splice(monsterList.indexOf(hereMonster), 1);
                return null;
            } else {
                hereMonster.values.nowLife = monsterNewLife;
                return hereMonster;
            }

        } else {
            throw new Error(`No Monster Here ${JSON.stringify(role.point)}}`);
        }
    }

    collect() {
        let role = this.role;
        let resourceList = this.resourceList;
        let hereResource = resourceList.find((resource) => role.point.same(resource.point));

        if (hereResource) {
            role.values.actionTimer = this.nowTime + role.values.collectDelay;
            resourceList.splice(resourceList.indexOf(hereResource), 1);
        } else {
            throw new Error(`No Resource Here ${JSON.stringify(role.point)}}`);
        }
    }

    /**
     * Get point without monster and item in the world
     */
    availablePoint() {
        let width = this.world.width;
        let height = this.world.height;

        // Used points: point with monster or item 
        let usedPoints = [];
        usedPoints = usedPoints.concat(this.monsterList.map((m) => m.point));
        usedPoints = usedPoints.concat(this.resourceList.map((i) => i.point));

        // Available points: 
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

        // Random point
        if (availablePoints.length > 0) {
            let index = Math.floor(Math.random() * availablePoints.length)
            return availablePoints[index];
        } else {
            return null;
        }
    }

    usedPoints() {
        let usedPoints = [];
        usedPoints = usedPoints.concat(this.monsterList.map((m) => m.point));
        usedPoints = usedPoints.concat(this.resourceList.map((i) => i.point));
        return usedPoints;
    }

    /**
     * Remove points from other points
     * @param {*} points 
     * @param {*} removePoints 
     */
    static filterPoints(points, removePoints) {
        return points.filter((p1) => {
            for (let p2 of removePoints) {
                if (p1.same(p2)) return false;
            }
            return true;
        })
    }

    /**
     * Get random point 
     * @param {*} points 
     */
    static randomPoint(points) {
        if (points.length > 0) {
            let index = Math.floor(Math.random() * points.length)
            return points[index];
        } else {
            return null;
        }
    }

    loop() {
        let nowTime = this.nowTime = Date.now();
        let monsterList = this.monsterList;
        let resourceList = this.resourceList;
        let areaList = this.areaList;

        // Check Amount
        if (monsterList.length >= MONSTER_AMOUNT_MAX) this.monsterTimer = nowTime + MONSTER_BORN_PERIOD;
        if (resourceList.length >= RESOURCE_AMOUNT_MAX) this.resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;

        // New Monster
        if (nowTime > this.monsterTimer) {

            for (let area of areaList) {

                // check
                let amount = monsterList.filter((m) => area.isPointInArea(m.point)).length;
                if (amount >= MONSTER_AMOUNT_MAX) continue;

                let points = area.getAllPoints();
                points = Game.filterPoints(points, this.usedPoints());

                let p = Game.randomPoint(points);

                if (p) {
                    let newMonster = new Monster(p, 0, new MonsterValues(200, 200, 15));
                    monsterList.push(newMonster);
                    // console.log(`New Monster ${JSON.stringify(p)}`);
                } else {
                    // console.log('No Available Point');
                }

                if (monsterList.length >= MONSTER_AMOUNT_MAX) break;
            }

            this.monsterTimer = nowTime + MONSTER_BORN_PERIOD;
        }

        // New Resource
        if (nowTime > this.resourceTimer) {
            let p = this.availablePoint();
            if (p) {
                this.resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;
                let newResource = new Resource(p, 0, 5);
                resourceList.push(newResource);
                // console.log(`New Resource ${JSON.stringify(p)}`);
            } else {
                // console.log('No Available Point');
            }
        }
    }

    start() {
        setInterval(this.loop.bind(this), 10);
    }
}
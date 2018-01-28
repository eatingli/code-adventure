import { Event } from "typescript.events";
import * as Config from './game-config'
import { Point, Rect, Area, } from './game.js'

class Role {
    id: number;
    p: Point;
    level: number;
    life: number;
    energy: number;
    exp: number;
    money: number;
    equip: Array<number>;
    bag: boolean;
    rest: number; // Timer 

    constructor(id: number, p: Point, life: number, energy: number) {
        this.id = id;
        this.p = p;
        this.level = 1;
        this.life = life;
        this.energy = energy;
        this.exp = 0;
        this.money = 0;
        this.equip = [0, 0, 0, 0, 0];
        this.bag = false;
        this.rest = 0;
    }

    /**
     * [角色增加經驗]
     * 檢查：等級上限、升等
     * 升等：角色等級、經驗歸零
     */
    public addExp(exp: number) {
        if (this.level < Config.Role.MAX_LEVEL) {
            let sum = this.exp + exp;
            let max = Config.Role.MAX_EXP(this.level);
            if (sum > max) {
                this.level++;
                this.exp = sum - max;
            } else {
                this.exp = sum
            }
        }
    }

    /**
     * [角色增加金錢]
     * 檢查：金錢上線
     */
    public addMoney(money: number) {
        let sum = this.money + money;
        let max = Config.Role.MAX_MONEY;
        this.money = Math.min(sum, max);
    }
}
class Resource {
    id: number;
    c: Config.Resources;
    p: Point;

    constructor(id: number, c: Config.Resources, p: Point) {
        this.id = id;
        this.c = c;
        this.p = p;
    }
}

class Monster {
    id: number;
    c: Config.Monsters;
    p: Point;
    life: number;

    constructor(id: number, c: Config.Monsters, p: Point, life: number) {
        this.id = id;
        this.c = c;
        this.p = p;
        this.life = life;
    }
}

class Building {

    id: number;
    c: Config.Buildings;
    p: Point;
    level: number;
    exp: number;

    constructor(id: number, c: Config.Buildings, p: Point) {
        this.id = id;
        this.c = c;
        this.p = p;
        this.level = 0;
        this.exp = 0;
    }
}

class Storage {
    iron: number = 0;
    wood: number = 0;
    food: number = 0;
    constructor() {

    }
}

class Quest {
    target: Config.Monsters | Config.Resource = null;
    constructor() { }
}

/**
 * 
 */
export default class GameService extends Event {

    private startTime: number = Date.now();

    /* Game Data */
    private roles: Array<Role> = [];
    private resources: Array<Resource> = [];
    private monsters: Array<Monster> = [];
    private buildings: Array<Building> = [];
    private storage: Map<Config.Storages, number> = new Map();
    private quest: Quest = new Quest();

    /* Id Counter */
    private roleIdConter: number = 0;
    private monsterIdCounter: number = 0;
    private resourceIdCounter: number = 0;

    /* Timer */
    private seasonTimer: number = Date.now();
    private monsterTimer: Map<Config.Monsters, number> = new Map();
    private resourceTimer: Map<Config.Resources, number> = new Map();
    private newQuestTimer: number = Date.now();
    private profitMoneyTimer: number = Date.now();
    private profitResourceTimer: number = Date.now();

    constructor() {
        super();
    }

    public getData() {
        return {
            roles: this.roles,
            resources: this.resources,
            monsters: this.monsters,
            buildings: this.buildings,
            storage: this.storage,
            quest: this.quest,
        }
    }

    /**
     * 取得區域內可放置物件的座標（去掉怪物、資源）
     */
    private availablePoint(area: Area): Array<Point> {
        let mPoints = this.monsters.map((m) => m.p);
        let rPoints = this.resources.map((r) => r.p);

        let available = area.getAllPoints().filter((p1) =>
            mPoints.every((p2) => !p1.same(p2)) && rPoints.every((p2) => !p1.same(p2))
        )

        return available;
    }

    /**
     * 取得隨機成員
     * To-Do：不屬於物件成員
     */
    private random<T>(item: Array<T>) {
        let mask = Math.floor(Math.random() * item.length);
        return item[mask];
    }

    /**
     * 
     */
    private getBuilding(c: Config.Buildings) {
        let building = this.buildings.filter((b) => b.c == c)[0];
        return building;
    }

    /**
     * [移動]
     * 檢查：移動距離、目的座標、Rest
     * 影響：角色座標、Rest
     */
    public roleMove(id: number, dx: number, dy: number) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let newP = role.p.move(dx, dy);
        let inWorld =
            (dx == 0 || dy == 0) && (dx + dy == 1) &&
            (newP.x >= 0 && newP.x < Config.Game.WORLD_WIDTH) &&
            (newP.y >= 0 && newP.y < Config.Game.WORLD_HEIGHT);

        if (free && inWorld) {
            // Point
            role.p = newP;
            // Delay
            let equip = role.equip[Config.Equips.E4];
            role.rest = now + Config.Role.DELAY_MOVE(equip);

            this.emit(Config.Event.ROLE_MOVE, id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [攻擊]
     * 檢查：目標、角色生命、怪物生命、Rest
     * 影響：角色生命、怪物生命、Rest
     * 擊敗：移除怪物、怪物經驗獎勵、怪物金錢獎勵、任務金錢獎勵
     */
    public roleAtk(id: number) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let mon = this.monsters.filter((m) => m.p.same(role.p))[0];

        if (mon && mon.life > 0 && role.life > 0 && free) {
            // Life 
            role.life -= 1;
            mon.life -= 1;
            // Delay
            let equipLv = role.equip[Config.Equips.E1]
            role.rest = now + Config.Role.DELAY_ATK(equipLv);

            // Defeat
            if (mon.life <= 0) {
                // Exp
                let exp = Config.Monster.EXP(mon.c);
                let buildingLv = this.getBuilding(Config.Buildings.B5).level;
                let sumExp = exp * Config.Role.EXP_RATE(buildingLv)
                role.addExp(sumExp);
                // Money (+Quest)
                let money = Config.Monster.Money(mon.c);
                let quest = (this.quest.target == mon.c) ? Config.Game.QUEST_MONEY : 0;
                buildingLv = this.getBuilding(Config.Buildings.B1).level;
                let sumMoney = (money + quest) * Config.Role.MONEY_RATE(buildingLv)
                role.addMoney(sumMoney);
                // Remove
                let index = this.monsters.indexOf(mon);
                this.monsters.splice(index, 1);
            }

            this.emit(Config.Event.ROLE_ATK, id, mon.id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [搜集資源]
     * 檢查：目標、角色體力、Rest
     * 影響：移除資源、角色體力、Rest、倉庫資源、任務金錢獎勵
     */
    public roleCollect(id: number) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let res = this.resources.filter((r) => r.p.same(role.p))[0];

        if (res && free && role.energy > 0) {
            // Energy
            role.energy -= 1;
            // Delay
            let equipLv = role.equip[Config.Equips.E2]
            role.rest = now + Config.Role.DELAY_COLLECT(equipLv);
            // Storage
            let type = Config.Resource.STORAGE_TYPE(res.c);
            let qty = Config.Resource.STORAGE_QTY(res.c);
            if (res.c == Config.Resources.R1) {
                // R1 building addition
                let buildingLv = this.getBuilding(Config.Buildings.B3).level;
                let addition = Config.Resource.R3_ADDITION(buildingLv);
                qty += addition;
            }
            let sum = Math.min(this.storage.get(type), Config.Resource.STORAGE_MAX);
            this.storage.set(type, sum);
            // Quest
            let quest = (this.quest.target == res.c) ? Config.Game.QUEST_MONEY : 0;
            let buildingLv = this.getBuilding(Config.Buildings.B1).level;
            let sumMoney = quest * Config.Role.MONEY_RATE(buildingLv)
            role.addMoney(sumMoney);
            // Remove
            let index = this.resources.indexOf(res);
            this.resources.splice(index, 1);

            this.emit(Config.Event.ROLE_COLLECT, id, res.id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [建築]
     * 檢查：目標、可升級、Bag、Rest
     * 影響：BuildingExp、Bag、Rest
     */
    public roleBuild(id: number) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let building = this.buildings.filter((b) => b.p.squareDistance(role.p) <= Config.Building.RANGE)[0];
        let available = building.level < Config.Building.MAX_LEVEL;

        if (building && available && free && role.bag == true) {
            // Bag
            role.bag = false;
            // Delay
            let equipLv = role.equip[Config.Equips.E3]
            role.rest = now + Config.Role.DELAY_BUILD(equipLv);
            // Building exp
            building.exp += 1;
            // Level Up
            let max = Config.Building.MAX_EXP(building.c, building.level);
            if (building.exp >= max) {
                building.level += 1;
                building.exp = 0;
            }

            this.emit(Config.Event.ROLE_BUILD, id, building.id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [恢復]
     * 檢查：建築範圍、Rest
     * 影響：生命、體力、Rest
     */
    public roleSleep(id: number) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let building = this.getBuilding(Config.Buildings.B1);
        let inRange = role.p.squareDistance(building.p) <= Config.Building.RANGE;

        if (inRange && free) {
            // Life Energy
            role.life = Config.Role.MAX_LIFE(role.level);
            role.energy = Config.Role.MAX_ENERGY(role.level);
            // Delay
            let equip = role.equip[Config.Equips.E5];
            role.rest = now + Config.Role.DELAY_SLEEP(equip);

            this.emit(Config.Event.ROLE_SLEEP, id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [升級裝備]
     * 檢查：建築範圍、可升級、角色金錢、Rest
     * 影響：角色金錢、裝備等級、Rest
     */
    public roleUpgrade(id: number, c: Config.Equips) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let available = role.equip[c] < Config.Role.MAX_EQUIP_LEVEL;
        let cost = Config.Role.UPGRADE_COST(c, role.level);
        let enough = role.money >= cost;
        let building = this.getBuilding(Config.Buildings.B3);
        let inRange = role.p.squareDistance(building.p) <= Config.Building.RANGE;

        if (inRange && available && enough && free) {
            // Money
            role.money -= cost;
            // Equip level
            role.equip[c]++;
            // Delay
            role.rest = now + Config.Role.DELAY_UPGRADE;

            this.emit(Config.Event.ROLE_UPGRADE, id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [載運資源]
     * 檢查：建築範圍、空手、庫存、Rest
     * 影響：背包、庫存、Rest
     */
    public roleCarry(id: number) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let empty = role.bag == false;
        let building = this.getBuilding(Config.Buildings.B2);
        let inRange = role.p.squareDistance(building.p) <= Config.Building.RANGE;
        let enough = Array.from(this.storage).every((s) => s[1] > 0);

        if (inRange && empty && free && enough) {
            // Bag
            role.bag = true;
            // Storage
            this.storage.forEach((value, key, map) => map.set(key, value - 1));
            //Delay
            role.rest = now + Config.Role.DELAY_CARRY;

            this.emit(Config.Event.ROLE_CARRY, id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [購買資源]
     * 檢查：建築範圍、庫存上限、金錢足夠、Rest
     * 影響：角色金錢、庫存、Rest
     */
    public roleTrade(id: number, stor: Config.Storages) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;
        let building = this.getBuilding(Config.Buildings.B4);
        let inRange = role.p.squareDistance(building.p) <= Config.Building.RANGE;
        let qty = this.storage.get(stor);
        let available = qty < Config.Resource.STORAGE_MAX;
        let cost = Config.Resource.BUY_PRICE(stor);
        let enough = role.money >= cost;

        if (free && inRange && available && enough) {
            // Money
            role.money -= cost;
            // Storage
            this.storage.set(stor, qty + 1)
            // Delay
            role.rest = now + Config.Role.DELAY_TRADE;

            this.emit(Config.Event.ROLE_TRADE, id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * [Hello]
     * 檢查：Rest
     * 影響：Rest
     */
    public roleHello(id: number, stor: Config.Storages) {
        let now = Date.now();
        let role = this.roles[id];
        let free = now > role.rest;

        if (free) {
            // Delay
            role.rest = now + Config.Role.DELAY_HELLO;

            this.emit(Config.Event.ROLE_HELLO, id);
        } else {
            this.emit(Config.Event.ROLE_FORBID, id);
        }
    }

    /**
     * 加入新資源
     */
    private newResource(c: Config.Resources, p: Point) {
        let id = this.resourceIdCounter++;
        let r = new Resource(id, c, p);
        this.resources.push(r);
        
        // let time = Date.now() - this.startTime;
        // let qty = this.resources.filter((r) => r.c === c).length;
        // console.log(`New Res: ${c} (${p.x}, ${p.y}) ${time} ${qty}`)
        this.emit(Config.Event.GEN_RESOURCE, r)
    }

    /**
     * 加入新怪物
     */
    private newMonster(c: Config.Monsters, p: Point, maxLife: number) {
        let id = this.monsterIdCounter++;
        let m = new Monster(id, c, p, maxLife);
        this.monsters.push(m);

        // let time = this.nowTime - this.startTime;
        // let qty = this.monsters.filter((r) => r.c === c).length;
        // console.log(`New Res: ${c} (${p.x}, ${p.y}) ${time} ${qty}`)

        this.emit(Config.Event.GEN_MONSTER, m)
    }

    /**
     * 週期性產生資源
     */
    private genResource(now: number) {
        let resourceClasses: Array<Config.Resources> = [
            Config.Resources.R1, Config.Resources.R2_0, Config.Resources.R3, Config.Resources.R4, Config.Resources.R5,
        ]
        for (let c of resourceClasses) {
            let timer = this.resourceTimer.get(c);
            let diffTime = now - timer;
            let period = Config.Resource.GEN_PERIOD(c);

            if (diffTime >= period) {
                let area = Config.Resource.GEN_AREA(c);
                let gen = Config.Resource.GEN_QTY(c);
                let max = Config.Resource.GEN_MAX(c);
                let exist = this.resources.filter((r2) => r2.c === c).length;
                let ap = this.availablePoint(area);

                // R4 少於產量則補到產量，否則倍數生產
                if (c === Config.Resources.R4)
                    gen = exist < gen ? gen - exist : Math.floor(exist * Config.Resource.R4_GEN_RATE);

                // 計算生產上限、空位上線
                let qty = exist + gen > max ? max - exist : gen;
                qty = Math.min(qty, ap.length);
                for (let i = 0; i < qty; i++) {
                    this.newResource(c, this.random(ap));
                }

                // Timer
                this.resourceTimer.set(c, timer + period);
            }
        }
    }


    /**
     * 週期性產生怪物
     */
    private genMonster(now: number) {
        let monsterClasses: Array<Config.Monsters> = [
            Config.Monsters.M1, Config.Monsters.M2, Config.Monsters.M3,
            Config.Monsters.M4, Config.Monsters.M5, Config.Monsters.M6
        ]
        for (let c of monsterClasses) {
            let timer = this.monsterTimer.get(c);
            let diffTime = now - timer;
            let period = Config.Monster.GEN_PERIOD(c);
            let area = Config.Monster.GEN_AREA(c);
            let max = Config.Monster.GEN_MAX(c);
            let maxLife = Config.Monster.MAX_LIFE(c);

            if (diffTime >= period) {
                let qty = this.monsters.filter((m) => m.c == c).length;
                let ap = this.availablePoint(area);
                if (qty < max && ap.length > 0) {
                    let p = this.random(ap);
                    this.newMonster(c, p, maxLife);
                }
                this.monsterTimer.set(c, timer + period);
            }
        }
    }

    /**
     * 週期新任務
     */
    private newQuest(now: number) {
        let diffTime = now - this.newQuestTimer;
        let period = Config.Game.NEW_QUEST_PERIOD;
        if (diffTime > period) {
            // To-Do: 設計任務模式

            let nq = this.random([].concat(Config.Game.QUEST_MONSTERS, Config.Game.QUEST_RESOURCES))
            this.quest.target = nq;
            this.emit(Config.Event.NEW_QUEST, nq);
            this.newQuestTimer = this.newQuestTimer + period;
        }
    }

    /**
     * 週期性利潤
     */
    private genProfit(now: number) {
        // Money
        let diffTime = now - this.profitMoneyTimer;
        let period = Config.Game.PROFIT_MONEY_PERIOD;
        if (diffTime > period) {
            let buildingLv = this.getBuilding(Config.Buildings.B4).level;
            let profit = Config.Game.PROFIT_MONEY_QTY(buildingLv)
            for (let role of this.roles) {
                role.money += profit;
            }
            this.emit(Config.Event.PROFIT_MONEY);
            this.profitMoneyTimer = now + period;
        }

        // Resource
        diffTime = now - this.profitResourceTimer;
        period = Config.Game.PROFIT_RESOURCE_PERIOD;
        if (diffTime > period) {
            let buildingLv = this.getBuilding(Config.Buildings.B2).level;
            let profit = Config.Game.PROFIT_RESOURCE_QTY(buildingLv)

            let r = [Config.Storages.IRON, Config.Storages.WOOD, Config.Storages.FOOD]
            for (let i = 0; i < profit; i++) {
                let mask = Math.floor(Math.random() * r.length);
                let value = this.storage.get(r[mask]);
                this.storage.set(r[mask], value + 1)
            }
            this.emit(Config.Event.PROFIT_RESOURCE);
            this.profitResourceTimer = now + period;
        }

    }

    /**
     * 遊戲初始化
     */
    init() {

        /* Storage */
        let storages = [Config.Storages.IRON, Config.Storages.WOOD, Config.Storages.FOOD]
        for (let stor of storages) {
            this.storage.set(stor, 0);
        }

        /* Monster Timer */
        let monsterClasses: Array<Config.Monsters> = [
            Config.Monsters.M1, Config.Monsters.M2, Config.Monsters.M3,
            Config.Monsters.M4, Config.Monsters.M5, Config.Monsters.M6,
        ]
        for (let c of monsterClasses) {
            this.monsterTimer.set(c, Date.now())
        }

        /* Resouece Timer */
        let resourceClasses: Array<Config.Resources> = [
            Config.Resources.R1, Config.Resources.R2_0, Config.Resources.R3, Config.Resources.R4, Config.Resources.R5,
        ]
        for (let c of resourceClasses) {
            this.resourceTimer.set(c, Date.now())
        }

        /* 初始化角色 */
        for (let i = 0; i < 12; i++) {
            let p = new Point(i * 2 + 1, 10);
            let role = new Role(i, p, Config.Role.MAX_LIFE(1), Config.Role.MAX_ENERGY(1));
            this.roles.push(role);
        }

        /* 初始化建築 */
        let buildingIdCounter = 0;
        let buildingClasses: Array<Config.Buildings> = [
            Config.Buildings.B1, Config.Buildings.B2, Config.Buildings.B3, Config.Buildings.B4, Config.Buildings.B5
        ]
        for (let c of buildingClasses) {
            let p = Config.Building.POINT(c)
            let building = new Building(buildingIdCounter++, c, p);
            this.buildings.push(building)
        }

    }

    /**
     * 遊戲主迴圈
     */
    loop() {
        /* 週期執行 */
        let nowTime = Date.now();
        this.genResource(nowTime);
        this.genMonster(nowTime);
        this.newQuest(nowTime);
        this.genProfit(nowTime);
    }

    /**
     * 啟動遊戲
     */
    start() {
        this.init();
        setInterval(this.loop.bind(this), 2);
    }
}
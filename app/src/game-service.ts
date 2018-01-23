import { Event } from "typescript.events";
import * as Config from './game-config'
import {
    Point,
    Rect,
    Area,
} from './game.js'

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
    rest: number;

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
    constructor() {

    }
}

export default class GameService extends Event {

    private startTime: number = Date.now();
    private nowTime: number = Date.now();

    private roles: Array<Role> = [];
    private resources: Array<Resource> = [];
    private monsters: Array<Monster> = [];
    private buildings: Array<Building> = [];
    private storage: Storage = new Storage();
    private quest: Quest = new Quest();

    private roleIdConter: number = 0;
    private monsterIdCounter: number = 0;
    private resourceIdCounter: number = 0;

    private seasonTimer: number = Date.now();
    private monsterTimer: Map<Config.Monsters, number> = new Map();
    private resourceTimer: Map<Config.Resources, number> = new Map();
    private newQuestTimer: number = Date.now();
    private profitMoneyTimer: number = Date.now();
    private profitResourceTimer: number = Date.now();

    // private event: Function = () => { };

    constructor() {
        super();
        // this.event = event;

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
    }

    getData() {
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
     * 取得區域內可放置物件的座標（去掉怪物、資源佔用）
     */
    availablePoint(area: Area): Array<Point> {

        return [
            new Point(0, 0), new Point(0, 0), new Point(0, 0),
            new Point(0, 0), new Point(0, 0), new Point(0, 0),
            new Point(0, 0), new Point(0, 0), new Point(0, 0),
            new Point(0, 0), new Point(0, 0), new Point(0, 0),
            new Point(0, 0), new Point(0, 0), new Point(0, 0)
        ]
    }

    /**
     * 取得隨機成員
     * To-Do：不屬於物件成員
     */
    random<T>(item: Array<T>) {
        let mask = Math.floor(Math.random() * item.length);
        return item[mask];
    }

    /**
     * 
     */
    private newResource(c: Config.Resources, p: Point) {
        let id = this.resourceIdCounter++;
        let r = new Resource(id, c, p);
        this.resources.push(r);

        let time = this.nowTime - this.startTime;
        let qty = this.resources.filter((r) => r.c === c).length;
        // console.log(`New Res: ${c} (${p.x}, ${p.y}) ${time} ${qty}`)
        this.emit(Config.Event.GEN_RESOURCE, r)
    }

    /**
     * 
     */
    private newMonster(c: Config.Monsters, p: Point, maxLife: number) {
        let id = this.monsterIdCounter++;
        let m = new Monster(id, c, p, maxLife);
        this.monsters.push(m);

        let time = this.nowTime - this.startTime;
        let qty = this.monsters.filter((r) => r.c === c).length;
        // console.log(`New Res: ${c} (${p.x}, ${p.y}) ${time} ${qty}`)

        this.emit(Config.Event.GEN_MONSTER, m)
    }

    /**
     * 週期性產生資源
     */
    private genResource() {
        let resourceClasses: Array<Config.Resources> = [
            Config.Resources.R1, Config.Resources.R2_0, Config.Resources.R3, Config.Resources.R4, Config.Resources.R5,
        ]
        for (let c of resourceClasses) {
            let timer = this.resourceTimer.get(c);
            let diffTime = this.nowTime - timer;
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

                // 累加Timer
                this.resourceTimer.set(c, timer + period);
            }
        }
    }


    /**
     * 週期性產生怪物
     */
    private genMonster() {
        let monsterClasses: Array<Config.Monsters> = [
            Config.Monsters.M1, Config.Monsters.M2, Config.Monsters.M3,
            Config.Monsters.M4, Config.Monsters.M5, Config.Monsters.M6
        ]
        for (let c of monsterClasses) {
            let timer = this.monsterTimer.get(c);
            let diffTime = this.nowTime - timer;
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
    private newQuest() {
        let diffTime = this.nowTime - this.newQuestTimer;
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
    private genProfit() {
        // Money
        let diffTime = this.nowTime - this.profitMoneyTimer;
        let period = Config.Game.PROFIT_MOMEY_PERIOD;
        if (diffTime > period) {
            for (let role of this.roles) {
                // To-Do: 根據建築給予金錢
                role.money += 5;
            }
            this.emit(Config.Event.PROFIT_MONEY, 'test');
            this.profitMoneyTimer = this.nowTime + period;
        }

        // Resource
        diffTime = this.nowTime - this.profitResourceTimer;
        period = Config.Game.PROFIT_RESOURCE_PERIOD;
        if (diffTime > period) {
            // To-Do: 根據建築增加資源
            this.storage.iron += 1;
            this.storage.wood += 1;
            this.storage.food += 1;
            this.emit(Config.Event.PROFIT_RESOURCE, 'test');
            this.profitResourceTimer = this.nowTime + period;
        }

    }

    /**
     * 遊戲初始化
     */
    init() {
        /**
         * 初始化角色
         */
        for (let i = 0; i < 12; i++) {
            let p = new Point(i * 2 + 1, 10);
            let role = new Role(i, p, Config.Role.MAX_LIFE(1), Config.Role.MAX_ENERGY(1));
            this.roles.push(role);
        }

        /**
         * 初始化建築
         */
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
        let nowTime = this.nowTime = Date.now();
        /**
         * 週期執行
         */
        this.genResource();
        this.genMonster();
        this.newQuest();
        this.genProfit();

    }

    /**
     * 啟動遊戲
     */
    start() {
        this.init();
        setInterval(this.loop.bind(this), 10);
    }
}
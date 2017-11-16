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
    Item,
    Quest,
    Shop,
} from './game.js'


// Const
const MONSTER_BORN_PERIOD = 1000;
const MONSTER_AMOUNT_MAX = 6;
// Resource
const RESOURCE_APPEAR_PERIOD = 1000;
const RESOURCE_AMOUNT_MAX = 6;
const FRUIT_GEN_MAX = 50;
const ANIMAL_STOCK_MAX = 10;
const PLANT_GEN_PERIOD = 1000;
const PLANT_GEN_MAX = 15;
const TREE_GEN_PERIOD = 1000;
const TREE_GEN_MAX = 5;
const MINE_GEN_MAX = 7;
const MINE_GEN_AMOUNT = 6;
const TREASURE_GEN_MAX = 2;

const SHOP_REFRESH_PERIOD = 10000;
const SHOP_ITEM_MAX = 5;
const SHOP_REFRESH_PRICE = 1500;
const SEASON_LONG = 2000;

const QUEST_MAX = 10;
const BAG_SIZE_MAX = 50;
const AREA_AMOUNT = 7;

const ANIMAL_INIT_STOCK = 2;

const MINES = [{ type: 501, stockMax: 3 }, { type: 502, stockMax: 3 }, { type: 503, stockMax: 3 }, { type: 504, stockMax: 2 }, { type: 505, stockMax: 2 }, { type: 506, stockMax: 2 }];

export default class GameService {

    nowTime: number;
    world: World;
    season: number; // 0~3：春、夏、秋、冬    
    role: Role;

    monsterList: Array<Monster>;
    resourceList: Array<Resource>;
    areaList: Array<Area>;
    questList: Array<Quest>;
    treeAreaMap: Map<Area, number> = new Map();

    shopList: Array<Shop>;
    shopMap: Map<Area, Shop>;

    itemIdCounter: number = 0;
    questIdConuter: number = 0;
    monsterIdCounter: number = 0;
    resourceIdCounter: number = 0;

    seasonTimer: number = Date.now();
    monsterTimer: number = Date.now();
    resourceTimer: number = Date.now();
    shopRefreshTimer: number = Date.now(); //+ SHOP_REFRESH_PERIOD;
    plantGenTimer: number = Date.now();
    treeGenTimer: number = Date.now();

    constructor() {
        let nowTime = this.nowTime = Date.now();
        this.world = new World(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
        this.season = 0;
        this.role = new Role(0, new Point(5, 5), new RoleValues(999999, 999999, 99));
        this.monsterList = [];
        this.resourceList = [];

        let area0 = new Area([new Rect(0, 22, 34, 10)], [new Rect(20, 22, 14, 1)]);
        let area1 = new Area([new Rect(0, 12, 20, 10)], []);
        let area2 = new Area([new Rect(0, 0, 17, 12)], []);
        let area3 = new Area([new Rect(34, 12, 23, 20)], []);
        let area4 = new Area([new Rect(17, 0, 17, 12)], []);
        let area5 = new Area([new Rect(34, 0, 23, 12)], []);
        let area6 = new Area([new Rect(20, 12, 14, 11)], []);
        this.areaList = [area0, area1, area2, area3, area4, area5, area6];
        this.questList = [];

        this.treeAreaMap.set(area0, 401);
        this.treeAreaMap.set(area1, 402);
        this.treeAreaMap.set(area2, 403);
        this.treeAreaMap.set(area3, 404);
        this.treeAreaMap.set(area4, 405);
        this.treeAreaMap.set(area5, 406);
        this.treeAreaMap.set(area6, 407);

        this.shopList = [];
        for (let i = 0; i < AREA_AMOUNT; i++) this.shopList.push(new Shop([]));
        this.shopMap = new Map();
        for (let i = 0; i < AREA_AMOUNT; i++) this.shopMap.set(this.areaList[i], this.shopList[i]);

        // 檢查 Area 數量
        if (this.areaList.length != AREA_AMOUNT) throw new Error('Area Amount Error');
        // 檢查 Area 不重疊
        if (this.areaList.length > 1) {
            for (let i = 0; i < this.areaList.length; i++) {
                for (let j = i + 1; j < this.areaList.length; j++) {
                    for (let p1 of this.areaList[i].getAllPoints()) {
                        for (let p2 of this.areaList[j].getAllPoints()) {
                            if (p1.same(p2)) throw new Error('Area Cover Error');
                        }
                    }
                }
            }
        }

        // 檢查 Area 涵蓋整張地圖
        let total = 0;
        for (let area of this.areaList) total += area.getAllPoints().length;
        if (total != this.world.width * this.world.height) throw new Error('Area Cover Error');

        // test
        this.role.money = 50000;
        for (let i = 0; i < 30; i++)
            this.role.itemList.push(this.newItem(i % 5));

        // 隨機任務
        for (let i = 0; i < QUEST_MAX; i++) {
            this.newRandomQuest();
        }

    }

    checkActionTimer() {
        return this.nowTime >= this.role.values.actionTimer;
    }

    move(x: number, y: number) {
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
                this.monsterReward(hereMonster.type);
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
        if (!hereResource) throw new Error(`No Resource Here ${JSON.stringify(role.point)}}`);
        if (hereResource.stock < 1) throw new Error(`No Enough Resource`);

        role.values.actionTimer = this.nowTime + role.values.collectDelay;
        hereResource.stock -= 1;
        if (hereResource.stock == 0)
            resourceList.splice(resourceList.indexOf(hereResource), 1);

        this.resourceReward(hereResource.type);
    }

    submit(questId: number) {
        let questList = this.questList;
        let role = this.role;
        let quest = questList.find((quest) => quest.id == questId);
        if (!quest) throw new Error('Quest not found');
        if (this.nowTime > quest.expiration) throw new Error('Quest expired');
        if (role.itemList.length - quest.requirements.length + quest.rewards.length > BAG_SIZE_MAX) throw new Error('Bag out of size');

        // Check role has enough items
        let temp: Array<Item> = [];
        let check = true;
        outer:
        for (let need of quest.requirements) {
            for (let has of role.itemList) {
                if (temp.find((item) => item == has)) continue;
                if (has.type == need.type) {
                    temp.push(has);
                    continue outer;
                }
            }
            check = false;
            break outer;
        }
        if (!check) throw new Error(`Don't reach quest requirements`);

        // Remove requirements from bag
        for (let item of temp)
            role.itemList.splice(role.itemList.indexOf(item), 1);
        // Add reward into bag
        for (let item of quest.rewards)
            role.itemList.push(item)

        // Money and score
        role.score += quest.score;
        role.money += quest.money;

        // Update Quest
        questList.splice(questList.findIndex((quest) => quest.id == questId), 1)
        this.newRandomQuest();
    }

    sellItem(id: number) {
        let item = this.role.itemList.find((i) => i.id == id);
        if (!item) throw new Error('Item not found');
        this.role.money += this.itemRecyclePrice(item.type);
        this.role.itemList.splice(this.role.itemList.findIndex((i) => i.id == id), 1);
    }

    buyItem(id: number) {

        if (this.role.itemList.length >= BAG_SIZE_MAX) throw new Error('Bag is full');
        let hereArea = this.hereArea();
        let hereShop = this.shopMap.get(hereArea);

        let item = hereShop.itemList.find((i) => i.id == id);
        if (!item) throw new Error('Item not found');

        // 扣錢
        let price = this.itemPrice(item.type);
        if (this.role.money < price) throw new Error('Money not enough');
        this.role.money -= price;

        // 領道具
        this.role.itemList.push(item);

        // 從商店中移除
        hereShop.itemList.splice(hereShop.itemList.findIndex((i) => i.id == id), 1);
    }

    hereArea() {
        let point = this.role.point;
        for (let area of this.areaList)
            if (area.getAllPoints().findIndex((p) => p.same(point)) > -1) return area;
    }

    refreshShop(shop: Shop) {
        shop.itemList.splice(0, shop.itemList.length);
        for (let i = 0; i < SHOP_ITEM_MAX; i++) {
            let randomType = Math.floor(Math.random() * 5);
            shop.itemList.push(this.newItem(randomType));
        }
    }

    refreshShopByMoney() {
        if (this.role.money < SHOP_REFRESH_PRICE) throw new Error('Money not enough');
        this.role.money -= SHOP_REFRESH_PRICE;

        let hereShop = this.shopMap.get(this.hereArea());
        this.refreshShop(hereShop);
    }

    /**
     * Get point without monster and item in the world
     */
    availablePoint() {
        let width = this.world.width;
        let height = this.world.height;

        // Used points: point with monster or item 
        let usedPoints: Array<Point> = [];
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

    private usedPoints() {
        let usedPoints: Array<Point> = [];
        usedPoints = usedPoints.concat(this.monsterList.map((m) => m.point));
        usedPoints = usedPoints.concat(this.resourceList.map((i) => i.point));
        return usedPoints;
    }

    /**
     * Remove points from other points
     */
    static filterPoints(points: Array<Point>, removePoints: Array<Point>) {
        return points.filter((p1) => {
            for (let p2 of removePoints) {
                if (p1.same(p2)) return false;
            }
            return true;
        })
    }

    /**
     * Get random point 
     */
    static randomArray(array: Array<any>) {
        if (array.length > 0) {
            let index = Math.floor(Math.random() * array.length)
            return array[index];
        } else {
            return null;
        }
    }

    static randomRange(min: number, max: number) {
        return Math.floor(min + Math.random() * (max - min + 1))
    }

    /**
     * 一定機率回傳 true 
     */
    static probability(rate: number): boolean {
        if (rate < 0 || rate > 1) throw new Error('probability() rate out of range');
        return Math.random() < rate;
    }

    static shuffle(array: Array<any>) {
        let currentIndex = array.length, temporaryValue, randomIndex;

        // clone
        array = array.map((a) => a);

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    newRandomQuest() {
        let randomTime = 10000 + Math.floor(Math.random() * 5000);
        let randomReq = Math.floor(Math.random() * 6);
        let randomRew = Math.floor(Math.random() * 6);
        let requirements = [this.newItem(randomReq), this.newItem(randomReq)];
        let rewards = [this.newItem(randomRew), this.newItem(randomRew)];
        let newQ = new Quest(this.questIdConuter++, this.nowTime + randomTime, requirements, rewards, 5, 5);
        this.questList.push(newQ)
    }

    newRandomMonster() {

        // 各區域獨立產生
        for (let area of this.areaList) {

            // 檢查區域數量上限
            let amount = this.monsterList.filter((monster) => area.isPointInArea(monster.point)).length;
            if (amount >= MONSTER_AMOUNT_MAX) continue;

            // Available Point: 只要沒有怪物都行
            let availablePoints = GameService.filterPoints(area.getAllPoints(), this.monsterList.map((monster) => monster.point));
            if (availablePoints.length < 1) continue;
            let p = GameService.randomArray(availablePoints);

            // 如果該位置有資源，則刪除掉
            let r = this.resourceList.findIndex((r) => r.point.same(p));
            if (r > -1) this.resourceList.splice(r, 1);

            // 產生該區域特色怪物
            let randomType = Math.floor(Math.random() * 5);
            let newMonster = new Monster(this.monsterIdCounter++, p, randomType, new MonsterValues(200, 200, 15));
            this.monsterList.push(newMonster);
        }
    }

    newRandomResource() {

        // 各區域獨立產生
        for (let area of this.areaList) {
            // 檢查區域數量上限
            let amount = this.resourceList.filter((r) => area.isPointInArea(r.point)).length;
            if (amount >= RESOURCE_AMOUNT_MAX) continue;

            // Available Point: 沒有怪物、沒有資源、不在佔領區
            let availablePoints = area.getAllPoints()
            availablePoints = GameService.filterPoints(availablePoints, this.monsterList.map((monster) => monster.point));
            availablePoints = GameService.filterPoints(availablePoints, this.resourceList.map((monster) => monster.point));
            if (availablePoints.length < 1) continue;
            let p = GameService.randomArray(availablePoints);

            // 產生資源
            let randomType = Math.floor(Math.random() * 5);
            let newResource = new Resource(this.resourceIdCounter++, p, randomType, 3);
            this.resourceList.push(newResource);

        }
    }

    newItem(type: number) {
        return new Item(this.itemIdCounter++, type)
    }

    monsterReward(type: number) {
        let items = [];
        let money = 0;
        let score = 0;
        switch (type) {
            case 0:
                if (Math.random() < 0.6) items.push(this.newItem(0))
                if (Math.random() < 0.1) items.push(this.newItem(0))
                if (Math.random() < 0.01) items.push(this.newItem(1))
                money = 5;
                score = 1;
                break;
            case 1:
                if (Math.random() < 0.6) items.push(this.newItem(1))
                if (Math.random() < 0.1) items.push(this.newItem(1))
                if (Math.random() < 0.01) items.push(this.newItem(2))
                money = 8;
                score = 1;
                break;
            case 2:
                if (Math.random() < 0.6) items.push(this.newItem(2))
                if (Math.random() < 0.1) items.push(this.newItem(2))
                if (Math.random() < 0.01) items.push(this.newItem(3))
                money = 12;
                score = 1;
                break;
            case 3:
                if (Math.random() < 0.6) items.push(this.newItem(3))
                if (Math.random() < 0.1) items.push(this.newItem(3))
                if (Math.random() < 0.01) items.push(this.newItem(4))
                money = 15;
                score = 1;
                break;
            case 4:
                if (Math.random() < 0.6) items.push(this.newItem(4))
                if (Math.random() < 0.2) items.push(this.newItem(4))
                if (Math.random() < 0.1) items.push(this.newItem(4))
                money = 30;
                score = 10;
                break;
        }
        for (let item of items)
            if (this.role.itemList.length < BAG_SIZE_MAX) this.role.itemList.push(item);
        this.role.score += score;
        this.role.money += money;
    }

    resourceReward(type: number) {
        let itemType = null;
        switch (type) {
            case 0: itemType = 0; break;
            case 1: itemType = 1; break;
            case 2: itemType = 2; break;
            case 3: itemType = 3; break;
            case 4: itemType = 4; break;
        }
        if (this.role.itemList.length < BAG_SIZE_MAX)
            this.role.itemList.push(this.newItem(itemType));
    }

    itemPrice(type: number) {
        switch (type) {
            case 0: return 20;
            case 1: return 20;
            case 2: return 20;
            case 3: return 20;
            case 4: return 1000;
            default: return NaN;
        }
    }

    itemRecyclePrice(type: number) {
        switch (type) {
            case 0: return 5;
            case 1: return 5;
            case 2: return 5;
            case 3: return 5;
            case 4: return 1000;
            default: return NaN;
        }
    }

    loop() {
        let nowTime = this.nowTime = Date.now();

        // Season Change (之後改用event...)
        if (nowTime - this.seasonTimer > SEASON_LONG) {
            this.seasonTimer += SEASON_LONG;
            this.season = (this.season + 1) % 4;

            // 動物：季節增值
            for (let type of [101, 102, 103, 104, 105, 106]) {
                let animal = this.resourceList.find((r) => r.type == type);
                if (!animal) continue;
                let stock = animal.stock * 2;
                animal.stock = (stock > ANIMAL_STOCK_MAX) ? ANIMAL_STOCK_MAX : stock;
            }

            // 動物：在家區域補充各種類的動物
            if (this.season == 0) { // 春季(之後建立類別和常數)
                let homeArea = this.areaList[0];
                for (let type of [101, 102, 103, 104, 105, 106]) {
                    if (this.resourceList.findIndex((r) => r.type == type) > -1) continue;
                    let availablePoints = GameService.filterPoints(homeArea.getAllPoints(), this.usedPoints());
                    let p = GameService.randomArray(availablePoints);
                    let newAnimal = new Resource(this.resourceIdCounter++, p, type, ANIMAL_INIT_STOCK);
                    this.resourceList.push(newAnimal);
                }
            }

            // 果子：清掉別季的果子
            for (let type of [201, 202, 203, 204, 205, 206, 207, 208]) {
                let i;
                while ((i = this.resourceList.findIndex((r) => r.type == type)) > -1) this.resourceList.splice(i, 1);
            }

            // 果子：產生當季的果子
            for (let i = 0; i < FRUIT_GEN_MAX; i++) {
                let availablePoints = GameService.filterPoints(this.world.getAllPoints(), this.usedPoints());
                if (availablePoints.length > 0) {
                    let p = GameService.randomArray(availablePoints);
                    let newFruit;
                    switch (this.season) {
                        case 0:
                            if (GameService.probability(0.5))
                                newFruit = new Resource(this.resourceIdCounter++, p, 201, GameService.randomRange(2, 5));
                            else
                                newFruit = new Resource(this.resourceIdCounter++, p, 202, GameService.randomRange(1, 3));
                            break;
                        case 1:
                            if (GameService.probability(0.5))
                                newFruit = new Resource(this.resourceIdCounter++, p, 203, GameService.randomRange(2, 5));
                            else
                                newFruit = new Resource(this.resourceIdCounter++, p, 204, GameService.randomRange(1, 3));
                            break;
                        case 2:
                            if (GameService.probability(0.5))
                                newFruit = new Resource(this.resourceIdCounter++, p, 205, GameService.randomRange(2, 5));
                            else
                                newFruit = new Resource(this.resourceIdCounter++, p, 206, GameService.randomRange(1, 3));
                            break;
                        case 3:
                            if (GameService.probability(0.5))
                                newFruit = new Resource(this.resourceIdCounter++, p, 207, GameService.randomRange(2, 5));
                            else
                                newFruit = new Resource(this.resourceIdCounter++, p, 208, GameService.randomRange(1, 3));
                            break;
                    }
                    this.resourceList.push(newFruit);
                }
            }

            // 礦石：冬季時家區域外出現
            if (this.season == 3) {
                // 產生多顆礦石
                for (let i = 0; i < MINE_GEN_AMOUNT; i++) {

                    // 檢查未滿的礦石種類
                    let mines = MINES.filter((mine) => (this.resourceList.filter((r) => r.type == mine.type).length < MINE_GEN_MAX));
                    if (mines.length == 0) break;

                    // Available Point
                    let availablePoints = GameService.filterPoints(this.world.getAllPoints(), this.usedPoints());
                    availablePoints = GameService.filterPoints(availablePoints, this.areaList[0].getAllPoints());
                    if (availablePoints.length == 0) break;

                    // New Mine                    
                    let p = GameService.randomArray(availablePoints);
                    let mine = GameService.randomArray(mines);
                    let newMine = new Resource(this.resourceIdCounter++, p, mine.type, GameService.randomRange(1, mine.stockMax));
                    this.resourceList.push(newMine);
                }
            }

            // 寶物：夏季出現
            if (this.season == 1 && this.resourceList.filter((r) => r.type == 601).length < TREASURE_GEN_MAX) {
                // Available Point
                let availablePoints = GameService.filterPoints(this.world.getAllPoints(), this.usedPoints());
                if (availablePoints.length > 0) {
                    let p = GameService.randomArray(availablePoints);
                    let newTreasure = new Resource(this.resourceIdCounter++, p, 601, 1);
                    this.resourceList.push(newTreasure);
                }
            }
        }

        // Check Amount
        if (this.monsterList.length >= MONSTER_AMOUNT_MAX * 2) this.monsterTimer = nowTime + MONSTER_BORN_PERIOD;
        if (this.resourceList.length >= RESOURCE_AMOUNT_MAX * 2) this.resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;

        // New Monster
        if (nowTime > this.monsterTimer) {
            this.newRandomMonster();
            this.monsterTimer = nowTime + MONSTER_BORN_PERIOD;
        }

        // New Resource
        // if (nowTime > this.resourceTimer) {
        //     this.newRandomResource();
        //     this.resourceTimer = nowTime + RESOURCE_APPEAR_PERIOD;
        // }

        // 產生草
        if (nowTime - this.plantGenTimer > PLANT_GEN_PERIOD) {
            for (let type of [301, 302, 303, 304, 305]) {
                if (this.resourceList.filter((r) => r.type == type).length >= PLANT_GEN_MAX) continue;
                let availablePoints = GameService.filterPoints(this.world.getAllPoints(), this.usedPoints());
                if (availablePoints.length == 0) break;
                let p = GameService.randomArray(availablePoints);
                let newPlant = new Resource(this.resourceIdCounter++, p, type, GameService.randomRange(1, 4))
                this.resourceList.push(newPlant);
            }
            this.plantGenTimer += PLANT_GEN_PERIOD;
        }

        // 產生樹
        if (nowTime - this.treeGenTimer > TREE_GEN_PERIOD) {
            for (let area of this.areaList) {
                let type = this.treeAreaMap.get(area);
                if (this.resourceList.filter((r) => r.type == type).length >= TREE_GEN_MAX) continue;
                let availablePoints = GameService.filterPoints(area.getAllPoints(), this.usedPoints());
                if (availablePoints.length == 0) continue;
                let p = GameService.randomArray(availablePoints);
                let newTree = new Resource(this.resourceIdCounter++, p, type, GameService.randomRange(2, 4))
                this.resourceList.push(newTree);
            }
            this.treeGenTimer += TREE_GEN_PERIOD;
        }

        // Update expire quest
        let expire = this.questList.filter((quest) => quest.expiration < nowTime);
        for (let quest of expire) {
            this.questList.splice(this.questList.indexOf(quest), 1);
        }
        for (let i = 0; i < expire.length; i++)
            this.newRandomQuest();

        // Shop refresh
        if (this.shopRefreshTimer < nowTime) {
            for (let shop of this.shopList) {
                this.refreshShop(shop);
            }
            this.shopRefreshTimer = nowTime + SHOP_REFRESH_PERIOD;
        }
    }

    start() {
        setInterval(this.loop.bind(this), 10);
    }
}
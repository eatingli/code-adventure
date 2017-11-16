
export class Point {

    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 
     */
    move(xDis: number, yDis: number): Point {
        return new Point(this.x + xDis, this.y + yDis);
    }

    /**
     * 
     */
    lineDistance(other: Point): number {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    /**
     * 
     */
    latticeDistance(other: Point): number {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    /**
     * 
     */
    same(other: Point): boolean {
        return this.x == other.x && this.y == other.y;
    }

}

export class Rect {

    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        if (width < 1 || height < 1) throw new Error('Rect: Width or Height Error');
    }

    /**
     * 
     */
    isPointInRect(point: Point): boolean {
        return point.x >= this.x && point.y >= this.y && point.x < this.x + this.width && point.y < this.y + this.height;
    }

    /**
     * 
     */
    getAllPoints(): Array<Point> {
        let points: Array<Point> = [];
        for (let x = this.x; x < this.x + this.width; x++) {
            for (let y = this.y; y < this.y + this.height; y++) {
                points.push(new Point(x, y));
            }
        }
        return points;
    }
}

export class Area {

    includeRectList: Array<Rect>;
    excludeRectList: Array<Rect>;
    private allPoints: Array<Point>;

    constructor(includeRectList: Array<Rect>, excludeRectList: Array<Rect>) {
        this.includeRectList = includeRectList;
        this.excludeRectList = excludeRectList;
        this.countAllPoint();
    }

    /**
     * 
     */
    isPointInArea(point: Point): boolean {
        let exc = this.excludeRectList.filter((rect) => rect.isPointInRect(point))
        if (exc.length > 0) return false;
        let inc = this.includeRectList.filter((rect) => rect.isPointInRect(point))
        if (inc.length > 0) return true;
    }

    private countAllPoint() {
        let points: Array<Point> = [];

        // Add include rect
        for (let rect of this.includeRectList) {
            points = points.concat(rect.getAllPoints());
        }

        // Filte exclude rect
        points = points.filter((p) => {
            for (let exRect of this.excludeRectList) {
                if (exRect.isPointInRect(p)) return false;
            }
            return true;
        })

        // Filte repeat
        let i1 = 0;
        while (i1 < points.length) {
            let p1 = points[i1];
            points = points.filter((p2, i2) => {
                if (i1 == i2) return true;
                if (p1.same(p2)) return false;
                return true;
            })
            i1++;
        }

        this.allPoints = points;
    }

    /**
     * 
     */
    getAllPoints(): Array<Point> {
        return this.allPoints.map((p) => p);
    }
}

export class RoleValues {

    maxLife: number;
    nowLife: number;
    atk: number;

    actionTimer: number;
    moveDelay: number;
    searchDelay: number;
    collectDelay: number;
    atkDelay: number;

    searchDistance: number;

    constructor(maxLife: number, nowLife: number, atk: number) {
        this.maxLife = maxLife;
        this.nowLife = nowLife;
        this.atk = atk;

        this.actionTimer = 0;
        this.moveDelay = 1; //1000
        this.searchDelay = 1; //1500
        this.collectDelay = 1; //1500
        this.atkDelay = 1; //1500

        this.searchDistance = 2.0;
    }
}

export class Role {

    id: number;
    point: Point;
    values: RoleValues;
    itemList: Array<Item>;
    money: number;
    score: number;

    /**
     * 
     */
    constructor(id: number, point: Point, values: RoleValues) {
        this.id = id;
        this.point = point;
        this.values = values;
        this.itemList = [];
        this.money = 0;
        this.score = 0;
    }
}

export class MonsterValues {

    maxLife: number;
    nowLife: number;
    atk: number;

    constructor(maxLife: number, nowLife: number, atk: number) {
        this.maxLife = maxLife;
        this.nowLife = nowLife;
        this.atk = atk;
    }
}

export class Monster {

    id: number;
    point: Point;
    type: number;
    values: MonsterValues;

    constructor(id: number, point: Point, type: number, values: MonsterValues) {
        this.id = id;
        this.point = point;
        this.type = type;
        this.values = values;
    }
}

export class Resource {

    id: number;
    point: Point;
    type: number;
    stock: number;

    constructor(id: number, point: Point, type: number, stock: number) {
        if (stock < 1) throw new Error('new Resource() stock amount error');
        this.id = id;
        this.point = point;
        this.type = type;
        this.stock = stock;
    }
}

export class World {

    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    /**
     * 
     */
    isPointInWorld(point: Point): boolean {
        return point.x >= 0 && point.y >= 0 && point.x < this.width && point.y < this.height;
    }

    /**
     * 
     */
    getAllPoints(): Array<Point> {
        let points: Array<Point> = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                points.push(new Point(x, y));
            }
        }
        return points;
    }
}

export class Item {

    id: number;
    type: number;

    constructor(id: number, type: number) {
        this.id = id;
        this.type = type;
    }
}

export class Quest {

    id: number;
    expiration: number;
    requirements: Array<Item>;
    rewards: Array<Item>;
    money: number;
    score: number;

    constructor(id: number, expiration: number, requirements: Array<Item>, rewards: Array<Item>, money: number = 0, score: number = 0) {
        this.id = id;
        this.expiration = expiration
        this.requirements = requirements;
        this.rewards = rewards;
        this.money = money;
        this.score = score;
    }
}

export class Shop {

    itemList: Array<Item>

    constructor(itemList: Array<Item>) {
        this.itemList = itemList;
    }
}


export class GameConfig {
    static WORLD_WIDTH = 57;
    static WORLD_HEIGHT = 32;
}
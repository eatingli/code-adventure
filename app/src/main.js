// import fs from 'fs'


class Point {

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @param {Number} xDis 
     * @param {Number} yDis 
     */
    move(xDis, yDis) {
        return new Point(this.x + xDis, this.y + yDis);
    }

    /**
     * 
     * @param {Point} other 
     */
    lineDistance(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    /**
     * 
     * @param {Point} other 
     */
    latticeDistance(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y, );
    }

}

class RangeValue {

    /**
     * 
     * @param {Number} min
     * @param {Number} max 
     * @param {Number} now 
     */
    constructor(min, max, now) {
        this.min = min;
        this.max = max;
        this.now = now;
    }
}

class PlayerValues {

    /**
     * 
     * @param {Number} maxLife 
     * @param {Number} nowLife 
     * @param {Number} atk 
     */
    constructor(maxLife, nowLife, atk) {
        this.maxLife = maxLife;
        this.nowLife = nowLife;
        this.atk = atk;
    }
}

class Player {

    /**
     * 
     * @param {Point} point
     * @param {PlayerValues} values
     */
    constructor(point, values) {
        this.point = point;
        this.values = values;
    }
}

class MonsterValues {

    /**
     * 
     * @param {Number} maxLife 
     * @param {Number} nowLife 
     * @param {Number} atk 
     */
    constructor(maxLife, nowLife, atk) {
        this.maxLife = maxLife;
        this.nowLife = nowLife;
        this.atk = atk;
    }
}

class Monster {

    /**
     * 
     * @param {Point} point 
     * @param {MonsterValues} values
     */
    constructor(point, values) {
        this.point = point;
        this.values = values;
    }
}

class World {

    /**
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * 
     * @param {Point} point 
     */
    isPointInWorld(point) {
        return point.x >= 0 && point.y >= 0 && point.x < this.width && point.y < this.height;
    }
}



let world = new World(57, 32);
let player = new Player(new Point(55, 8), new MonsterValues(100, 100, 35));
console.log(player)

// Move
let temp = player.point.move(1, -1);
if (world.isPointInWorld(temp)) player.point = temp;
console.log(player)


// Distance
let p1 = new Point(10, 10);
let p2 = new Point(20, 20);
console.log(p1.lineDistance(p2))
console.log(p1.latticeDistance(p2))

let monster = new Monster(new Point(56, 7), new PlayerValues(200, 200, 15));
console.log(monster);

// Atk
if (player.point.latticeDistance(monster.point) == 0) {
    console.log('atk!!!!!!!!!!!!!!!!!!!');
    for (let i = 0; i < 3; i++) {
        player.values.nowLife -= monster.values.atk;
        monster.values.nowLife -= player.values.atk;
    }
    console.log(player);
    console.log(monster);
}
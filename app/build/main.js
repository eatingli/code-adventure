'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import fs from 'fs'


var Point = function () {
    function Point() {
        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        (0, _classCallCheck3.default)(this, Point);

        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @param {Number} xDis 
     * @param {Number} yDis 
     */


    (0, _createClass3.default)(Point, [{
        key: 'move',
        value: function move(xDis, yDis) {
            return new Point(this.x + xDis, this.y + yDis);
        }

        /**
         * 
         * @param {Point} other 
         */

    }, {
        key: 'lineDistance',
        value: function lineDistance(other) {
            return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
        }

        /**
         * 
         * @param {Point} other 
         */

    }, {
        key: 'latticeDistance',
        value: function latticeDistance(other) {
            return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
        }
    }]);
    return Point;
}();

var RangeValue =

/**
 * 
 * @param {Number} min
 * @param {Number} max 
 * @param {Number} now 
 */
function RangeValue(min, max, now) {
    (0, _classCallCheck3.default)(this, RangeValue);

    this.min = min;
    this.max = max;
    this.now = now;
};

var PlayerValues =

/**
 * 
 * @param {Number} maxLife 
 * @param {Number} nowLife 
 * @param {Number} atk 
 */
function PlayerValues(maxLife, nowLife, atk) {
    (0, _classCallCheck3.default)(this, PlayerValues);

    this.maxLife = maxLife;
    this.nowLife = nowLife;
    this.atk = atk;
};

var Player =

/**
 * 
 * @param {Point} point
 * @param {PlayerValues} values
 */
function Player(point, values) {
    (0, _classCallCheck3.default)(this, Player);

    this.point = point;
    this.values = values;
};

var MonsterValues =

/**
 * 
 * @param {Number} maxLife 
 * @param {Number} nowLife 
 * @param {Number} atk 
 */
function MonsterValues(maxLife, nowLife, atk) {
    (0, _classCallCheck3.default)(this, MonsterValues);

    this.maxLife = maxLife;
    this.nowLife = nowLife;
    this.atk = atk;
};

var Monster =

/**
 * 
 * @param {Point} point 
 * @param {MonsterValues} values
 */
function Monster(point, values) {
    (0, _classCallCheck3.default)(this, Monster);

    this.point = point;
    this.values = values;
};

var World = function () {

    /**
     * 
     * @param {Number} width 
     * @param {Number} height 
     */
    function World(width, height) {
        (0, _classCallCheck3.default)(this, World);

        this.width = width;
        this.height = height;
    }

    /**
     * 
     * @param {Point} point 
     */


    (0, _createClass3.default)(World, [{
        key: 'isPointInWorld',
        value: function isPointInWorld(point) {
            return point.x >= 0 && point.y >= 0 && point.x < this.width && point.y < this.height;
        }
    }]);
    return World;
}();

var world = new World(57, 32);
var player = new Player(new Point(55, 8), new MonsterValues(100, 100, 35));
console.log(player);

// Move
var temp = player.point.move(1, -1);
if (world.isPointInWorld(temp)) player.point = temp;
console.log(player);

// Distance
var p1 = new Point(10, 10);
var p2 = new Point(20, 20);
console.log(p1.lineDistance(p2));
console.log(p1.latticeDistance(p2));

var monster = new Monster(new Point(56, 7), new PlayerValues(200, 200, 15));
console.log(monster);

// Atk
if (player.point.latticeDistance(monster.point) == 0) {
    console.log('atk!!!!!!!!!!!!!!!!!!!');
    for (var i = 0; i < 3; i++) {
        player.values.nowLife -= monster.values.atk;
        monster.values.nowLife -= player.values.atk;
    }
    console.log(player);
    console.log(monster);
}
//# sourceMappingURL=main.js.map
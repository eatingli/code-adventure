import * as Game from './game.js'

let rect1 = new Game.Rect(0, 0, 6, 6);
let rect2 = new Game.Rect(4, 4, 3, 3);
let rect3 = new Game.Rect(2, 1, 4, 2);

let area = new Game.Area([rect2, rect1], [rect3]);
printArea(area);

function printArea(area) {
    let points = area.getAllPoints();
    let maxX = 0;
    let maxY = 0;
    for (let p of points) {
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    for (let y = 0; y <= maxY; y++) {
        let txt = '';
        for (let x = 0; x <= maxX; x++) {

            if (points.find((p) => p.same(new Game.Point(x, y))))
                txt = txt + '口';
            else
                txt = txt + '　';
        }
        console.log(txt);
    }
}
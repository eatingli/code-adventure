
export class Point {

    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /* 回傳移動位移後的新座標 */
    move(xDis: number, yDis: number): Point {
        return new Point(this.x + xDis, this.y + yDis);
    }

    /* 直線距離 */
    lineDistance(other: Point): number {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    /* X+Y距離 */
    latticeDistance(other: Point): number {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    /* NxN的距離 */
    squareDistance(other: Point): number {
        let disX = Math.abs(this.x - other.y)
        let disY = Math.abs(this.y - other.y)
        return Math.max(disX, disY);
    }

    /* 同座標判斷 */
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

    /*  */
    isPointInRect(point: Point): boolean {
        return point.x >= this.x && point.y >= this.y && point.x < this.x + this.width && point.y < this.y + this.height;
    }

    /*  */
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

    private includeRectList: Array<Rect>;
    private excludeRectList: Array<Rect>;
    private allPoints: Array<Point>;

    constructor(includeRectList: Array<Rect>, excludeRectList: Array<Rect>) {
        this.includeRectList = includeRectList;
        this.excludeRectList = excludeRectList;
        this.countAllPoints();
    }

    /*  */
    private countAllPoints() {
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

    /*  */
    public isPointInArea(point: Point): boolean {
        let exc = this.excludeRectList.filter((rect) => rect.isPointInRect(point))
        if (exc.length > 0) return false;
        let inc = this.includeRectList.filter((rect) => rect.isPointInRect(point))
        if (inc.length > 0) return true;
    }

    /*  */
    public getAllPoints(): Array<Point> {
        return this.allPoints;
    }
}

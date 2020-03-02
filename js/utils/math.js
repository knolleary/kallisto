const DEG180 = Math.PI;
const DEG360 = Math.PI*2;
const DEG540 = Math.PI*3;

export function getHeading(x0,y0,x1,y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var heading;
    if (dx === 0) {
        heading = Math.PI/2;
    } else {
        heading = Math.atan(dy/dx);
        if (dx >= 0 && dy < 0) {
            heading += Math.PI;
        } else if (dx >= 0 && dy >= 0) {
            heading += Math.PI;
        }
    }
    return heading;
}

export function normaliseHeading(dir) {
    if (dir < 0) {
        dir += DEG360;
    } else if (dir > DEG360) {
        dir -= DEG360;
    }
    return dir;
}
export function getHeadingDifference(dir0,dir1) {
    // dir0 = normaliseHeading(dir0);
    // dir1 = normaliseHeading(dir1);
    return (dir1 - dir0 + DEG540) % DEG360 - DEG180;
}

export function getDistance(x0,y0,x1,y1) {
    var dx = x1-x0;
    var dy = y1-y0;
    return Math.sqrt(dx*dx+dy*dy);
}

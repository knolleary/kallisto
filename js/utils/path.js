
export function isWalkable(map,x0,y0,x1,y1) {
    var xo = x0;
    var yo = y0;
    var dx = x1-x0;
    var dy = y1-y0;
    var dh = Math.sqrt(dx*dx+dy*dy)/0.2;
    var lastDx = Math.abs(dx);
    var lastDy = Math.abs(dy);


    dx /= dh;
    dy /= dh;
    while (true) {
        x0 += dx;
        y0 += dy;

        var thisDx = Math.abs(x1-x0);
        var thisDy = Math.abs(y1-y0);

        if (thisDx >= lastDx && thisDy >= lastDy) {
            break;
        }
        lastDx = thisDx;
        lastDy = thisDy;

        if (!map.isPointClear(x0,y0)) {
            return false;
        }
    }
    return true;

}
function smoothPath(map,path) {
    if (path.length  < 3) {
        return path;
    }
    var newPath = [];
    var checkPointIndex = 0;
    var currentPointIndex = 1;
    newPath.push(path[checkPointIndex]);
    while(path[currentPointIndex+1] != null) {
        if (isWalkable(map,path[checkPointIndex].x,path[checkPointIndex].y,path[currentPointIndex+1].x,path[currentPointIndex+1].y)) {
            currentPointIndex++;
            if (currentPointIndex >= path.length) {
                newPath.push(path[currentPointIndex-1]);
                break;
            }
        } else {
            newPath.push(path[currentPointIndex]);
            checkPointIndex = currentPointIndex;
            currentPointIndex++;
        }
    }
    newPath.push(path[currentPointIndex])
    return newPath;
}


export function getPath(map,x0,y0,x1,y1) {
    var startCell = map.getCellAt(x0,y0);
    var endCell = map.getCellAt(x1,y1);
    // return {
    //     straight:[{x:x0,y:y0,z:startCell.z},{x:x1,y:y1,z:endCell.z}]
    // }

    // // Initialize both open and closed list
    var openList = new PriorityObjectList();
    var closedList = new Set();

    openList.push({
        cell:startCell,
        g:0,
        h:0,
        f:0
    })
    var count = 0;
    while(openList.size() > 0 && count < 30) {
        count++;
        var current = openList.shift();
        closedList.add(current.cell);
        if (current.cell === endCell) {
            var path = [];
            while (current) {
                path.unshift(current.cell);
                current = current.parent;
            }
            var c = path.shift();
            path.unshift({x:x0,y:y0,z:c.z});
            return {
                straight:[{x:x0,y:y0,z:startCell.z},{x:x1,y:y1,z:endCell.z}],
                aStar:path,
                smooth: smoothPath(map,path)};
        }
        current.cell.eachNeighbour(function(cell,p) {
            if (p %2 === 0) {
                return;
            }
            if (!cell.object && !closedList.has(cell)) {
                var dx = endCell.x-cell.x;
                var dy = endCell.y-cell.y;
                var g = current.g+1;
                var h = dx*dx + dy*dy;
                var f = g + h;
                var existing = openList.get(cell);
                if (existing) {
                    if (existing.g > g) {
                        existing.g = g;
                        existing.h = h;
                        existing.f = f;
                        existing.parent = current;
                        openList.sort();
                    }
                } else {
                    openList.push({
                        cell: cell,
                        g:g,
                        h:h,
                        f:f,
                        parent: current
                    })
                }
            }
        })
    }
    return null;

    //     // Generate children
    //     let the children of the currentNode equal the adjacent nodes
    //
    //     for each child in the children
    //         // Child is on the closedList
    //         if child is in the closedList
    //             continue to beginning of for loop
    //         // Create the f, g, and h values
    //         child.g = currentNode.g + distance between child and current
    //         child.h = distance from child to end
    //         child.f = child.g + child.h
    //         // Child is already in openList
    //         if child.position is in the openList's nodes positions
    //             if the child.g is higher than the openList node's g
    //                 continue to beginning of for loop
    //         // Add the child to the openList
    //         add the child to the openList

}


class PriorityObjectList {
    constructor() {
        this.itemList = [];

    }
    push(item) {
        this.itemList.push(item);
        this.sort();
    }

    shift() {
        return this.itemList.shift();
    }

    sort() {
        this.itemList.sort(function(A,B) {
            return A.f - B.f;
        })
    }
    size() {
        return this.itemList.length;
    }
    get(cell) {
        for (var i=0;i<this.itemList.length;i++) {
            if (this.itemList[i].cell === cell) {
                return this.itemList[i];
            }
        }
    }
}

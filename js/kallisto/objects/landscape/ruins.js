import {BaseObject} from "../baseObject.js"

var ROCK = new THREE.Color(0x999999);
export class Ruins extends BaseObject {
    constructor(cell, radius, cells) {
        super("ruins");
        radius *= 0.8;
        this.radiusSq = radius*radius;
        this.centre = cell;
        var minZ = cell.z;
        var maxZ = cell.z;
        var self = this;
        cells.forEach(function(c) {
            minZ = Math.min(minZ,c.z);
            maxZ = Math.max(maxZ,c.z);
            c.object = self;
        });

        minZ -= 0.8
        maxZ += 0.8

        var dzTop = maxZ - cell.z;
        var dzBottom = cell.z - minZ;

        this.height = dzTop;

        var r = new THREE.Mesh(
            new THREE.CylinderGeometry( radius,radius, maxZ - minZ, 16 ),
            new THREE.MeshLambertMaterial( {color: ROCK, flatShading:true, wireframe: false} )
        )
        r.castShadow = true;
        r.rotation.x = Math.PI/2;
        r.position.z = (dzTop-dzBottom)/2;
        this.add(r)
        this.setCell(cell);
        cell.object = this;

    }

    getHeightAt(x,y,z) {
        var dx = this.centre.x-x;
        var dy = this.centre.y-y;
        dx *= dx;
        dy *= dy;
        return (dx+dy < this.radiusSq)?(this.height+this.centre.z)-z:0;
    }
}

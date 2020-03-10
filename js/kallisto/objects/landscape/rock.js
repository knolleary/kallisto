import {BaseObject} from "../baseObject.js"

var ROCK = new THREE.Color(0x999999);
export class Rock extends BaseObject {
    constructor(cell,big) {
        var geoRadius = big?0.5:(0.2+0.3*Math.random()) ;
        super("rock");
        this.add(new THREE.Mesh(
            new THREE.IcosahedronGeometry( geoRadius ),
            new THREE.MeshLambertMaterial( {color: 0x999999, flatShading:true} )

        ))
        this.rotation.z = Math.random()*2*Math.PI;
        this.radius = geoRadius-0.1;
        this.radiusSq = this.radius*this.radius;
        this.height = geoRadius-0.1;
        this.setCell(cell);
    }

    getHeightAt(x,y) {
        var dx = this.cell.x - x;
        var dy = this.cell.y - y;
        var dd = dx*dx+dy*dy;
        if (dd > this.radiusSq) {
            return 0;
        } else {
            // console.log(dx,dy,dd,(this.radiusSq-dd)/this.radiusSq)
            return this.height*(this.radiusSq-dd)/this.radiusSq;
        }
    }
}

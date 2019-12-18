import {BaseObject} from "../baseObject.js"

var ROCK = new THREE.Color(0x999999);
export class Rock extends BaseObject {
    constructor(cell,big) {
        var geoRadius = (big?2:0.2)+(0.5*Math.random());
        super("rock");
        this.add(new THREE.Mesh(
            new THREE.IcosahedronGeometry( geoRadius ),
            new THREE.MeshLambertMaterial( {color: 0x999999, flatShading:true} )

        ))
        this.rotation.z = Math.random()*2*Math.PI;
        this.radius = geoRadius-0.1;
        this.height = geoRadius-0.1;
        this.setCell(cell);
    }
}

import {BaseObject} from "../baseObject.js"

var ROCK = new THREE.Color(0x999999);
export class Ruins extends BaseObject {
    constructor(cell,topZ) {
        super("ruins");
        this.height = (topZ-cell.z)*2 +(Math.random()*0.2-0.1);//+5*Math.random()
        var r = new THREE.Mesh(
            new THREE.BoxGeometry( 1,1, this.height ),
            new THREE.MeshLambertMaterial( {color: ROCK, flatShading:true} )
        )
        r.castShadow = true
        this.rotation.z = Math.random()*0.1

        this.add(r)
        this.setCell(cell);
    }

    getHeightAt(x,y) {
        return this.height/2;
    }
}

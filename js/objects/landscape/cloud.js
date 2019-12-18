import {BaseObject} from "../baseObject.js"

export class Cloud extends BaseObject {
    constructor() {
        super("cloud");
        this.add(new THREE.Mesh(
            new THREE.IcosahedronGeometry( 1+Math.random()*3 ),
            new THREE.MeshLambertMaterial( {color: 0xffffff, flatShading:true} )
        ));
    }
}

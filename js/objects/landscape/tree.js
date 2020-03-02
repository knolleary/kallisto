import {BaseObject} from "../baseObject.js"

var TRUNK = new THREE.Color(0x996633);
var LEAVES = new THREE.Color(0x5C9031)
class SimpleTreeGeometry extends THREE.Geometry {
    constructor() {
        super();
        this.type = "Tree1"
        var trunk = new THREE.ConeGeometry( 0.2, 2.3, 5 );
        trunk.rotateX(  Math.PI / 2 );
        trunk.translate(0,0,-0.2);
        trunk.faces.forEach(function(f) {
            f.color = TRUNK;
        })
        var leaves = new THREE.IcosahedronGeometry( 0.8 );
        leaves.translate(0,0,1.1);
        leaves.faces.forEach(function(f) {
            f.color = LEAVES;
        })

        this.merge(trunk);
        this.merge(leaves);
        this.mergeVertices(); // optional
        this.translate(0,0,1.3);
    }
}

class AnotherTreeGeometry extends THREE.Geometry {
    constructor() {
        super();
        this.type = "Tree2"
        var trunk = new THREE.ConeGeometry( 0.2, 1.8, 5 );
        trunk.rotateX(  Math.PI / 2 );
        trunk.translate(0,0,-0.2);
        trunk.faces.forEach(function(f) {
            f.color = TRUNK;
        })
        this.merge(trunk);
        for (var scale = 0; scale < 3; scale++) {
            var leaves = new THREE.IcosahedronGeometry( 0.6 - (scale*0.2) );
            leaves.vertices.forEach(function(v) {
                v.z = v.z*2;
            });
            leaves.rotateZ(scale);
            leaves.translate(0,0,(1*scale));
            leaves.faces.forEach(function(f) {
                f.color = LEAVES;
            })
            this.merge(leaves);
        }
        this.mergeVertices(); // optional
        this.translate(0,0,0.8);
    }
}



export class Tree1 extends BaseObject {
    constructor(cell) {
        super("tree1");

        var t = new THREE.Mesh(
            new SimpleTreeGeometry(),
            new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors, flatShading:true}  )
        )
        t.castShadow = true;
        this.add(t)
        this.setCell(cell);

        this.rotation.z = Math.random()*2*Math.PI;
        this.radius = 0.2;
        this.radiusSq = this.radius*this.radius;
        this.height = 2;
    }
    getHeightAt(x,y) {
        var dx = this.cell.x - x;
        var dy = this.cell.y - y;
        var dd = dx*dx+dy*dy;
        if (dd > this.radiusSq) {
            return 0;
        } else {
            // console.log(dx,dy,dd,(this.radiusSq-dd)/this.radiusSq)
            return this.height
        }
    }
}
export class Tree2 extends BaseObject {
    constructor(cell) {
        super("tree2");
        var t = new THREE.Mesh(
            new AnotherTreeGeometry(),
            new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors, flatShading:true}  )
        );
        t.castShadow = true;
        this.add(t);
        this.setCell(cell);
        this.rotation.z = Math.random()*2*Math.PI;
        this.radius = 0.6;
        this.radiusSq = this.radius*this.radius;
        this.height = 2;
    }
    getHeightAt(x,y) {
        var dx = this.cell.x - x;
        var dy = this.cell.y - y;
        var dd = dx*dx+dy*dy;
        if (dd > this.radiusSq) {
            return 0;
        } else {
            // console.log(dx,dy,dd,(this.radiusSq-dd)/this.radiusSq)
            return this.height
        }
    }
}

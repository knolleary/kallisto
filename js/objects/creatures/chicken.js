import {loadModel} from '../../utils/loader.js'

var chickenMesh;

loadModel(
    "models/chicken.glb",
    function ( gltf ) {
        chickenMesh = gltf.scene.children[0];
        chickenMesh.scale.set(.15,.15,.15);
        chickenMesh.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                if (o.material) {
                    o.material.flatShading = true;
                    o.material.emissiveIntensity = 0.2;
                    o.material.emissive.setHex( 0xffffff );
                    // o.material = new THREE.MeshLambertMaterial( {color: o.material.color, flatShading:true, skinning: true}  )
                }
            }
        });
    });

var FORWARD_OFFSET = -Math.PI/2;
var SPEED = 0.8;

export class Chicken extends THREE.Object3D {
    constructor(map) {
        super();
        this.map = map;
        this.height = 0;
        this.heading = Math.random()*2*Math.PI;
        this.mesh = chickenMesh.clone();
        this.add(this.mesh)
        this.updateHeading();
    }

    updateHeading() {
        this.dx = Math.cos(this.heading+FORWARD_OFFSET);
        this.dy = Math.sin(this.heading+FORWARD_OFFSET);
    }

    update(delta) {

        var newX = this.position.x;
        var newY = this.position.y;
        var moveSpeed = SPEED * delta;
        newX = this.position.x + this.dx*moveSpeed;
        newY = this.position.y + this.dy*moveSpeed;
        var cell = this.map.getCellAt(newX,newY);
        var dr = 2;
        var objRadius = 0;
        var collided = false;
        if (cell&&cell.object) {
            var dx = Math.abs(cell.x - newX);
            var dy = Math.abs(cell.y - newY);
            dr = dx*dx + dy*dy;
            objRadius = cell.object.radius;
            if (dr <= objRadius) {
                collided = true;
                this.heading += delta*Math.PI/2;
                this.updateHeading();
            }
        }
        if (!collided) {
            var landHeight = Math.max(-0.8,this.map.getHeightAt(newX,newY));
            var newZ = landHeight;
            this.position.x = newX;
            this.position.y = newY;
            this.position.z = newZ;
            this.rotation.z = this.heading;
        }

    }
}

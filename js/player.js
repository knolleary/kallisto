import {loadModel} from './utils/loader.js'

var C_ARM = new THREE.Color(0x3366ff);
var C_HEAD = new THREE.Color(0xFFE0BD);

var FORWARD_OFFSET = -Math.PI/2;
var Z_OFFSET = 0.05;
var ANIMATION_SCALE = 2;
var WALK_SPEED = 0.8 * ANIMATION_SCALE;
var RUN_SPEED = 2.6 * ANIMATION_SCALE;

var STATES = {
    IDLE: 0,
    WALKING: 1
}


var PLAYER_MODEL;
var loader = new THREE.GLTFLoader();
loadModel(
    "models/hero.glb",
    function ( gltf ) {
        PLAYER_MODEL = gltf;
    }
);


class PlayerGeometry extends THREE.Geometry {
    constructor() {
        super();
        this.type = "Player";
        var legL = new THREE.BoxGeometry(0.1,0.1,0.4);
        legL.translate(0,-0.1,0.2);
        legL.faces.forEach(function(f) {f.color = C_ARM;})
        this.merge(legL);

        var legR = new THREE.BoxGeometry(0.1,0.1,0.4);
        legR.translate(0,0.1,0.2);
        legR.faces.forEach(function(f) {f.color = C_ARM;})
        this.merge(legR);

        var torso = new THREE.BoxGeometry(0.15,0.3,0.5);
        torso.translate(0,0,0.675);
        torso.faces.forEach(function(f) {f.color = C_ARM;})
        this.merge(torso);

        var head = new THREE.BoxGeometry(0.2,0.2,0.2);
        head.translate(0,0,1.05);
        head.faces.forEach(function(f) {f.color = C_HEAD;})
        this.merge(head);

        var armL = new THREE.BoxGeometry(0.08,0.08,0.3);
        armL.rotateY(Math.PI/2)
        armL.translate(0.1,-0.22,0.83);
        armL.faces.forEach(function(f) {f.color = C_ARM;})
        this.merge(armL);

        var armR = new THREE.BoxGeometry(0.08,0.08,0.3);
        armR.translate(0,0.22,0.74);
        armR.faces.forEach(function(f) {f.color = C_ARM;})
        this.merge(armR);

        this.mergeVertices();
    }
}
export class Player extends THREE.Object3D {
    constructor(map, done) {
        super();
        this.currentAction = null;
        this.state = STATES.IDLE;
        this.lastItch = 1 + Math.random()*5;

        this.actions = {};

        this.mesh = PLAYER_MODEL.scene.children[0];


        this.mesh.scale.set(0.25,0.25,0.25);
        this.mesh.position.z = Z_OFFSET;
        this.mesh.traverse(o => {
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
        this.add(this.mesh);

        this.mixer = new THREE.AnimationMixer(this.mesh)
        this.mixer.timeScale = ANIMATION_SCALE;
        this.animations = PLAYER_MODEL.animations;
        console.log(this.animations.map(p=>p.name));
        this.actions.idle = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Idle"));
        this.actions.walk = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Walk"));
        this.actions.run = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Run"));
        this.actions.walkBack = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "WalkBack"));
        this.actions.headScratch = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "HeadScratch"));
        this.actions.headScratch.setLoop( THREE.LoopOnce );
        this.actions.headScratch.clampWhenFinished = true;

        this.currentAction = this.actions.idle;
        this.currentAction.play();
        this.state = STATES.IDLE;


        this.map = map;
        this.dir = 0;
        this.position.z = this.map.getHeightAt(this.position.x,this.position.y);
        this.deltaZ = 0;
        this.updateHeading();

    }

    updateHeading() {
        this.dx = Math.cos(this.dir+FORWARD_OFFSET);
        this.dy = Math.sin(this.dir+FORWARD_OFFSET);
    }
    jump() {
        if (this.deltaZ === 0) {
            this.deltaZ = 0.18;
        }
    }
    update(delta) {

        this.mixer.update(delta);
        var moveSpeed = (this.running?RUN_SPEED:WALK_SPEED)*delta;
        var moved = false;
        var newX = this.position.x;
        var newY = this.position.y;

        if (this.moveForward) {
            newX = this.position.x + this.dx*moveSpeed;
            newY = this.position.y + this.dy*moveSpeed;
            moved = true;
        } else if (this.moveBack) {
            newX = this.position.x - this.dx*moveSpeed;
            newY = this.position.y - this.dy*moveSpeed;
            moved = true;
        }
        if (this.turnLeft) {
            this.dir = (this.dir+(delta*1.5*Math.PI))%(Math.PI*2);
            this.mesh.rotation.z = this.dir;
            this.updateHeading();
        } else if (this.turnRight) {
            this.dir = (this.dir-(delta*1.5*Math.PI))%(Math.PI*2);
            this.mesh.rotation.z = this.dir;
            this.updateHeading();
        }

        if (moved || this.deltaZ != 0) {
            // this.mesh.position.z = -0.25;
            if (this.state !== STATES.WALKING) {
                var walkAction = this.running?this.actions.run:this.actions.walk;
                if (this.moveBack) {
                    walkAction = this.actions.walkBack;
                }
                walkAction.play();
                if (this.currentAction) {
                    this.currentAction.stop();
                }
                this.currentAction = walkAction;
                this.state = STATES.WALKING;
            }

            var landHeight = Math.max(-0.8,this.map.getHeightAt(newX,newY));
            var heightAboveLand = this.position.z - landHeight;
            // if (newZ === -0.8) {
            //     this.mesh.rotation.x = Math.PI/8;
            // } else {
            //     this.mesh.rotation.x = 0;
            // }
            var cell = this.map.getCellAt(newX,newY);
            var dr = 2;
            var objRadius = 0;
            if (cell&&cell.object) {
                var dx = Math.abs(cell.x - newX);
                var dy = Math.abs(cell.y - newY);
                dr = dx*dx + dy*dy;
                objRadius = cell.object.radius;
            }

            if (!cell||!cell.object || (dr > objRadius || cell.object.height < 0.5)) {
                if (dr <= objRadius && cell.object && cell.object.height) {
                    if (heightAboveLand < cell.object.height) {
                        this.mesh.position.z = cell.object.height-heightAboveLand + Z_OFFSET;
                    }
                } else {
                    this.mesh.position.z = Z_OFFSET;
                }
                this.position.x = newX;
                this.position.y = newY;
            } else {
                cell.object.highlight(true);
            }
            this.deltaZ -= 0.02;
            var newZ = this.position.z + this.deltaZ;
            if (newZ < landHeight) {
                this.deltaZ = 0;
                newZ = landHeight;
            }


            this.position.z = newZ;
            // }
            // this.tracker.position.set(0,0,0);
        } else {
            this.lastItch -= delta;
            if (this.state !== STATES.IDLE) {
                this.lastItch = 1 + Math.random()*5;
                this.actions.idle.play();
                this.currentAction.stop();
                this.currentAction = this.actions.idle;
                this.state = STATES.IDLE;
            } else if (this.lastItch < 0) {
                this.lastItch = 1 + Math.random()*5;
                this.actions.headScratch.reset().play();
                this.actions.idle.stop();
                this.currentAction = this.actions.headScratch;
            }

        }
    }
}

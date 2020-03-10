import {loadModel} from './utils/loader.js'
import {Character} from './objects/baseObject.js'
import * as IslandMath from './utils/math.js'

var C_ARM = new THREE.Color(0x3366ff);
var C_HEAD = new THREE.Color(0xFFE0BD);

var FORWARD_OFFSET = -Math.PI/2;
var Z_OFFSET = 0.05;
var ANIMATION_SCALE = 2;
var WALK_SPEED = 0.9 * ANIMATION_SCALE;
var RUN_SPEED = 2.6 * ANIMATION_SCALE;

var STATES = {
    IDLE: 0,
    WALKING: 1,
    RUNNING: 2,
    JUMPING: 3
}


var PLAYER_MODEL;
var loader = new THREE.GLTFLoader();
loadModel(
    "models/hero.glb",
    function ( gltf ) {
        PLAYER_MODEL = gltf;
    }
);

export class Player extends Character {
    constructor(map) {
        super("player",map);
        this.FORWARD_OFFSET = -Math.PI/2;
        this.Z_OFFSET = 0.05;
        // this.HIGHLIGHT_REGION = true;
        this.MAX_Z_STEP = 0.5;
        this.FLOAT_OFFSET = -0.8;
        this.REACH = 0.8;
        this.RADIUS = 0.3;
        this.currentAction = null;
        this.state = STATES.IDLE;
        this.lastItch = 1 + Math.random()*5;
        this.currentCell = null;
        this.actions = {};

        this.mesh = PLAYER_MODEL.scene.children[0];

        this.mesh.scale.set(0.25,0.25,0.25);
        this.mesh.position.z = Z_OFFSET;
        this.mesh.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                if (o.material) {
                    o.material.flatShading = true;
                    // o.material.emissiveIntensity = 0.2;
                    // o.material.emissive.setHex( 0xffffff );
                }
            }
        });
        this.add(this.mesh);

// var light = new THREE.PointLight( 0xffffff, 8, 2 );
// light.position.set( 0.1, 0.1, 1  );
// this.add(light)

        this.mixer = new THREE.AnimationMixer(this.mesh)
        this.mixer.timeScale = ANIMATION_SCALE;
        this.animations = PLAYER_MODEL.animations;
        console.log(this.animations.map(p=>p.name));
        this.actions.idle = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Idle"));
        this.actions.walk = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Walk"));
        this.actions.run = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Run"));
        this.actions.walkBack = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "WalkBack"));
        this.actions.standingJumpTakeOff = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "StandingJumpTakeOff"));
        this.actions.standingJumpTakeOff.setLoop( THREE.LoopOnce );
        this.actions.standingJumpTakeOff.clampWhenFinished = true;

        this.actions.headScratch = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "HeadScratch"));
        this.actions.headScratch.setLoop( THREE.LoopOnce );
        this.actions.headScratch.clampWhenFinished = true;

        this.currentAction = this.actions.idle;
        this.currentAction.play();
        this.state = STATES.IDLE;

        this.position.z = this.map.getHeightAt(this.position.x,this.position.y);
        this.updateHeading();

        this.inventory = {};

    }
    interact() {
        // console.log(this.currentCell.z,Math.abs(this.currentCell.minZ - this.currentCell.maxZ));
        // var col = generateColor();
        // var candidateObjects = new Set();
        // var facingCells = new Set();
        // facingCells.add(this.currentCell);
        // for (var ang = this.heading-Math.PI/2-Math.PI/8; ang <= this.heading+Math.PI/2+Math.PI/8; ang += Math.PI/16) {
        //     var dx = Math.cos(ang+this.FORWARD_OFFSET);
        //     var dy = Math.sin(ang+this.FORWARD_OFFSET);
        //     for (var r = 0;r<2;r+=1) {
        //         var px = this.position.x+(this.REACH+r)*dx;
        //         var py = this.position.y+(this.REACH+r)*dy;
        //         // var b = new THREE.Mesh(
        //         //     new THREE.IcosahedronGeometry( 0.1 ),
        //         //     new THREE.MeshLambertMaterial( {color: 0x0099ff, flatShading:true} )
        //         // );
        //         // b.position.set(px,py,1);
        //         // this.map.add(b);
        //         var c = this.map.getCellAt(px,py);
        //         // c.highlight(true,col)
        //         if (c.object) {
        //             candidateObjects.add(c.object);
        //         }
        //         facingCells.add(c);
        //     }
        // }
        //
        // var regionObjects = [...this.currentCell.region.contains];
        // if (this.currentCell.object) {
        //     regionObjects.push(this.currentCell.object);
        // }
        // this.currentCell.region.cells.forEach(function(c) {
        //     if (c.object) {
        //         regionObjects.push(c.object);
        //     }
        // })
        //
        // this.map.getRegionNeighbours(this.currentCell.region).forEach(r => {
        //     regionObjects = regionObjects.concat([...r.contains]);
        //     r.cells.forEach(function(c) {
        //         if (c.object) {
        //             regionObjects.push(c.object);
        //         }
        //     })
        // })
        // var self = this;
        // regionObjects.forEach(function(obj) {
        //     if (obj!==self) {
        //         var objHeading = IslandMath.normaliseHeading(Math.PI+IslandMath.getHeading(self.position.x,self.position.y,obj.position.x,obj.position.y))
        //         var headingDelta = IslandMath.getHeadingDifference(self.heading+self.FORWARD_OFFSET,objHeading)
        //         var distance = IslandMath.getDistance(self.position.x,self.position.y,obj.position.x,obj.position.y)
        //         if (Math.abs(headingDelta) < Math.PI/2+Math.PI/8 && distance < 2) {
        //             // var px = self.position.x+distance*Math.cos(objHeading);
        //             // var py = self.position.y+distance*Math.sin(objHeading);
        //             // var b = new THREE.Mesh(
        //             //     new THREE.IcosahedronGeometry( 0.1 ),
        //             //     new THREE.MeshLambertMaterial( {color: 0x0099ff, flatShading:true} )
        //             // );
        //             // b.position.set(px,py,obj.position.z+0.2);
        //             // self.map.add(b);
        //
        //             if (obj.type === "chicken") {
        //                 obj.spook();
        //             }
        //             candidateObjects.add(obj);
        //         }
        //     }
        // })
        // console.log([...candidateObjects])
        var candidateObjects = this.getNearbys(true,Math.PI/2+Math.PI/8,2)
        if (candidateObjects.length > 0) {
            var nearest = candidateObjects[0];
            if (nearest.object.type === 'chicken') {
                nearest.object.spook();
            } else if (nearest.object.type === 'grassPatch') {
                nearest.object.cycle()
            } else {
                console.log(nearest);
            }
        }
    }
    jump(isJump) {
        if (isJump && !this.jumping) {
            this.jumpTimer = 0;
        }
        this.jumping = isJump
    }
    update(delta) {

        this.mixer.update(delta);
        var moved = false;
        var newX = this.position.x;
        var newY = this.position.y;

        if (this.moveForward) {
            this.SPEED = this.running?RUN_SPEED:WALK_SPEED;
            moved = true;
        } else if (this.moveBack) {
            this.SPEED = -WALK_SPEED;
            moved = true;
        } else {
            this.SPEED = 0;
        }
        if (this.turnLeft) {
            this.heading = (this.heading+(delta*1.5*Math.PI))%(Math.PI*2);
            this.updateHeading();
        } else if (this.turnRight) {
            this.heading = (this.heading-(delta*1.5*Math.PI))%(Math.PI*2);
            this.updateHeading();
        }
        if (this.jumping) {
            this.jumpTimer += delta;
            if (this.jumpTimer < 0.2) {
                var proportion = this.jumpTimer/0.2;
                this.dz += 0.06*(1-proportion);
            }

        }
        this.step(delta);
        if (moved) {
            // this.mesh.position.z = -0.25;
            if (this.state === STATES.IDLE || !this.moveBack && ((this.running && this.state === STATES.WALKING) || (!this.running && this.state === STATES.RUNNING))) {
                var walkAction = this.running?this.actions.run:this.actions.walk;
                if (this.moveBack) {
                    walkAction = this.actions.walkBack;
                }
                walkAction.play();
                if (this.currentAction) {
                    this.currentAction.stop();
                }
                this.currentAction = walkAction;
                this.state = this.running?STATES.RUNNING:STATES.WALKING;
            }
        } else {
            this.lastItch -= delta;
            // if (this.jumping) {
            //     if (this.state !== STATES.JUMPING) {
            //         this.actions.standingJumpTakeOff.play();
            //         this.currentAction.stop();
            //         this.currentAction = this.actions.standingJumpTakeOff;
            //         this.state = STATES.JUMPING;
            //     }
            // } else

            if (this.dz === 0 && this.state !== STATES.IDLE) {
                this.lastItch = 1 + Math.random()*5;
                this.actions.idle.play();
                this.currentAction.stop();
                this.currentAction = this.actions.idle;
                this.state = STATES.IDLE;
            }
            else if (this.lastItch < 0) {
                this.lastItch = 1 + Math.random()*5;
                this.actions.headScratch.reset().play();
                this.actions.idle.stop();
                this.currentAction = this.actions.headScratch;
            }
        }
        if (this.currentCell) {
            // console.log(this.currentCell.region.contains.size);
        }

    }
}

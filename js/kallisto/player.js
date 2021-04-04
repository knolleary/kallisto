import {loadModel} from './utils/loader.js'
import {Character} from './objects/baseObject.js'
import * as IslandMath from './utils/math.js'
import {StateMachine, State} from './utils/states.js'
import * as Keyboard from "./utils/keyboard.js"

var C_ARM = new THREE.Color(0x3366ff);
var C_HEAD = new THREE.Color(0xFFE0BD);

var FORWARD_OFFSET = -Math.PI/2;
var Z_OFFSET = 0.05;
var ANIMATION_SCALE = 1;
var WALK_SPEED = 1.1 * ANIMATION_SCALE;
var RUN_SPEED = 2.8 * ANIMATION_SCALE;

var PLAYER_MODEL;
var loader = new THREE.GLTFLoader();
loadModel(
    "models/hero2.glb",
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
        this.idleTime = 0;
        this.lastItch = 1 + Math.random()*5;
        this.currentCell = null;

        this._logStateChanges = true;

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
        window.p = this.animations;
        console.log(this.animations.map(p=>p.name));
        this.actions.idle = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Idle"));
        this.actions.idleSwim = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "IdleSwim"));

        this.actions.walk = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Walk"));
        this.actions.run = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Run"));
        this.actions.swim = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Swim"));
        this.actions.walkBack = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "WalkBack"));

        this.actions.standingJumpTakeOff = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "StandingJumpTakeOff"));
        this.actions.standingJumpTakeOff.setLoop( THREE.LoopOnce );
        this.actions.standingJumpTakeOff.clampWhenFinished = true;

        this.actions.headScratch = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "HeadScratch"));
        this.actions.headScratch.setLoop( THREE.LoopOnce );
        this.actions.headScratch.clampWhenFinished = true;

        this.actions.swipe = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Swipe"));
        this.actions.swipe.setLoop( THREE.LoopOnce );
        this.actions.swipe.clampWhenFinished = true;

        this.actions.sitDown = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "SitDown"));
        this.actions.sitDown.setLoop( THREE.LoopOnce );
        this.actions.sitDown.clampWhenFinished = true;

        this.actions.standUp = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "StandUp"));
        this.actions.standUp.setLoop( THREE.LoopOnce );
        this.actions.standUp.clampWhenFinished = true;

        this.actions.sit = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Sit"));
        this.actions.sit.setLoop( THREE.LoopOnce );
        this.actions.sit.clampWhenFinished = true;

        this.actions.pickUp = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "PickUp"));
        this.actions.pickUp.setLoop( THREE.LoopOnce );
        this.actions.pickUp.clampWhenFinished = true;

        this.position.z = this.map.getHeightAt(this.position.x,this.position.y);
        this.updateHeading();

        this.state.add("idle", IdleState);
        this.state.add("walk", WalkState);
        this.state.add("run", RunState);
        this.state.add("sitdown", SitDownState);
        this.state.add("sit", SittingState);
        this.state.add("standup", StandUpState);
        this.state.add("swipe", SwipeState);
        this.state.add("standing-jump", StandingJumpState);
        this.state.add("pickup", PickUpState);
        this.state.add("idleSwim", IdleSwimState);
        this.state.add("swim", SwimState);
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
            nearest.object.notify("swipe",{source: this})
            // if (nearest.object.type === 'chicken') {
            //     nearest.object.spook();
            // } else if (nearest.object.type === 'grassPatch') {
            //     nearest.object.cycle()
            // } else {
            console.log(nearest);
            // }
        }
    }
    update(delta) {
        if (!this.state.current) {
            this.state.set("idle");
        }
        this.mixer.update(delta);
        var moved = false;

        if (this.state.current.type === "walk" || this.state.current.type === "run" || this.state.current.type === "standing-jump" || this.state.current.type === "swim") {
            if (Keyboard.state.w || Keyboard.state.arrowup) {
                this.SPEED = Keyboard.state.shift?RUN_SPEED:WALK_SPEED
            } else if (Keyboard.state.s || Keyboard.state.arrowdown) {
                this.SPEED = Keyboard.state.shift?-RUN_SPEED:-WALK_SPEED
            }
        } else {
            this.SPEED = 0;
        }
        if (this.SPEED !== 0 || this.state.current.type === "idle" || this.state.current.type === "idleSwim") {
            if (Keyboard.state.a || Keyboard.state.arrowleft) {
                this.heading = (this.heading+(delta*1.5*Math.PI))%(Math.PI*2);
                this.updateHeading();
            } else if (Keyboard.state.d || Keyboard.state.arrowright) {
                this.heading = (this.heading-(delta*1.5*Math.PI))%(Math.PI*2);
                this.updateHeading();
            }
        }
        this.step(delta);
        // if (this.currentCell) {
        //     // console.log(this.currentCell.region.contains.size);
        // }
    }
}



class IdleState extends State {
    constructor(parent) {
        super("idle", parent);
        this.action = this.parent.character.actions['idle'];
    }
    enter(previousState) {
        this.time = 0;
        this.parent.character.FLOAT_OFFSET = -0.8;
        this.landHeight = this.parent.character.map.getHeightAt(this.parent.character.position.x,this.parent.character.position.y);
        if (previousState && previousState.action) {
            this.action.reset().play();
            previousState.action.stop();
            // this.action.reset();
            // this.action.crossFadeFrom(previousState.action, 0.1, false);
        } else {
            this.action.reset().play();
        }
    }
    step(time) {
        this.time += time;
        if (Keyboard.state.w || Keyboard.state.arrowup || Keyboard.state.s || Keyboard.state.arrowdown) {
            if (Keyboard.state.shift) {
                this.parent.set("run");
            } else {
                this.parent.set("walk");
            }
            return;
        }
        if (Keyboard.state.e) {
            this.parent.set("swipe");
            return
        }
        if (Keyboard.state.r) {
            this.parent.set("pickup");
            return
        }
        if (Keyboard.state[" "]) {
            this.parent.set("standing-jump");
            return;
        }
        if (this.time > 15 && this.landHeight > 0) {
            this.parent.set("sitdown")
        }

    }
}

class SitDownState extends State {
    constructor(parent) {
        super("sitdown", parent);
        this.action = this.parent.character.actions['sitDown'];
    }
    enter(previousState) {
        addOneEvent(this.action.getMixer(),'finished', () => {
            this.parent.set("sit")
        });

        if (previousState && previousState.action) {
            previousState.action.stop();
            this.action.reset().play();
        } else {
            this.action.reset().play();
        }
    }
}

class SittingState extends State {
    constructor(parent) {
        super("sit", parent);
        this.action = this.parent.character.actions['sit'];
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            previousState.action.stop();
            this.action.reset().play();
        } else {
            this.action.play();
        }
    }
    step(time) {
        if (Keyboard.state.e) {
            this.parent.set("swipe");
            return
        }
        if (Keyboard.state.w || Keyboard.state.arrowup || Keyboard.state.s || Keyboard.state.arrowdown) {
            this.parent.set("standup");
        }
    }
}

class StandUpState extends State {
    constructor(parent) {
        super("standup", parent);
        this.action = this.parent.character.actions['standUp'];
    }
    enter(previousState) {
        addOneEvent(this.action.getMixer(),'finished', () => {
            this.parent.set("idle")
        });

        if (previousState && previousState.action) {
            this.action.reset().play();
            this.action.crossFadeFrom(previousState.action, 0.1, false);
        } else {
            this.action.reset().play();
        }
    }
}

class WalkState extends State {
    constructor(parent) {
        super("walk",parent);
        this.walk = this.parent.character.actions['walk'];
        this.walkBack = this.parent.character.actions['walkBack'];
        this.action = this.walk;
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            previousState.action.stop();
            // this.action.timeScale = 1;
            this.action.reset();
            this.action.play();
            // this.action.reset();
            // this.action.crossFadeFrom(previousState.action, 0.25, true);
        } else {
            this.action.play();
        }
    }
    step(time) {

        if (!this.parent.character.currentCell || this.parent.character.currentCell.ocean) {
            let depth = this.parent.character.map.getHeightAt(this.parent.character.position.x,this.parent.character.position.y);
            if (depth < -0.8) {
                this.parent.set("idleSwim");
                return;
            }
        }

        if (Keyboard.state.e) {
            this.parent.set("swipe");
            return
        }
        if (Keyboard.state.r) {
            this.parent.set("pickup");
            return
        }
        if (Keyboard.state[" "]) {
            this.parent.set("standing-jump");
            return;
        }

        if ((Keyboard.state.s || Keyboard.state.arrowdown) && this.action !== this.walkBack) {
            this.action.stop();
            this.action = this.walkBack;
            this.action.reset().play();
        } else if ((Keyboard.state.w || Keyboard.state.arrowup) && this.action !== this.walk) {
            this.action.stop();
            this.action = this.walk;
            this.action.reset().play();
        }

        if (Keyboard.state.w || Keyboard.state.arrowup || Keyboard.state.s || Keyboard.state.arrowdown) {
            if (Keyboard.state.shift) {
                this.parent.set("run");
            }
            return
        }
        this.parent.set("idle");
    }
}

class RunState extends State {
    constructor(parent) {
        super("run",parent);
        this.action = this.parent.character.actions['run'];
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            previousState.action.stop();
            this.action.timeScale = 1;
            this.action.reset();
            this.action.play();
            // this.action.reset();
            // this.action.crossFadeFrom(previousState.action, 0.25, true);
        } else {
            this.action.play();
        }
    }
    step(time) {
        if (Keyboard.state[" "]) {
            this.parent.set("standing-jump");
            return;
        }
        if (Keyboard.state.w || Keyboard.state.arrowup || Keyboard.state.s || Keyboard.state.arrowdown) {
            if (!Keyboard.state.shift) {
                this.parent.set("walk");
            }
            return
        }
        this.parent.set("idle");
    }
}

class SwipeState extends State {
    constructor(parent) {
        super("swipe",parent);
        this.action = this.parent.character.actions['swipe'];
    }
    enter(previousState) {
        this.parent.character.interact();
        addOneEvent(this.action.getMixer(),'finished', () => {
            this.parent.set(previousState.type)
        });
        if (previousState && previousState.action) {
            this.action.reset().play();
            this.action.crossFadeFrom(previousState.action, 0.1, false);
        } else {
            this.action.reset().play();
        }
    }
}

class StandingJumpState extends State {
    constructor(parent) {
        super("standing-jump",parent);
        this.action = this.parent.character.actions['standingJumpTakeOff'];
        this.time = 0;
        this.start = 0;
        this.launched = false;
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            this.action.reset().play();
            this.action.crossFadeFrom(previousState.action, 0.1, false);
        } else {
            this.action.reset().play();
        }
    }
    step(time) {
        this.time += time;
        if (!this.launched) {
            if (this.time > 0.3) {
                this.parent.character.dz = 0.15;
                this.launched = true;
            }
        } else if (Keyboard.state[" "] && this.time < 0.5  ) {
            var proportion = (this.time-0.3)/0.2;
            this.parent.character.dz += 0.04*(1-proportion);
        } else if (this.parent.character.dz === 0) {
            this.parent.set("idle");
        }
    }
}

class PickUpState extends State {
    constructor(parent) {
        super("pickup",parent);
        this.action = this.parent.character.actions['pickUp'];
    }
    enter(previousState) {
        addOneEvent(this.action.getMixer(),'finished', () => {
            this.parent.set(previousState.type)
        });
        if (previousState && previousState.action) {
            this.action.reset().play();
            this.action.crossFadeFrom(previousState.action, 0.1, false);
        } else {
            this.action.reset().play();
        }
    }
}

class IdleSwimState extends State {
    constructor(parent) {
        super("idleSwim", parent);
        this.action = this.parent.character.actions['idleSwim'];
    }
    enter(previousState) {
        this.time = 0;
        this.parent.character.FLOAT_OFFSET = -0.2;
        if (previousState && previousState.action) {


            // this.action.reset();
            // this.action.crossFadeFrom(previousState.action, 0.25, true);

            previousState.action.stop();
            this.action.reset().play();
        } else {
            this.action.reset().play();
        }
    }
    step(time) {

        if (!this.parent.character.currentCell || this.parent.character.currentCell.ocean) {
            let depth = this.parent.character.map.getHeightAt(this.parent.character.position.x,this.parent.character.position.y);
            if (depth >= -0.6) {
                this.parent.set("idle");
                return;
            }
        } else {
            this.parent.set("idle");
        }
        if (Keyboard.state.w || Keyboard.state.arrowup || Keyboard.state.s || Keyboard.state.arrowdown) {
            this.parent.set("swim");
            return;
        }
    }
}

class SwimState extends State {
    constructor(parent) {
        super("swim", parent);
        this.action = this.parent.character.actions['swim'];
    }
    enter(previousState) {
        this.time = 0;
        this.parent.character.FLOAT_OFFSET = -0.2;
        if (previousState && previousState.action) {
            previousState.action.stop();
            this.action.reset().play();
        } else {
            this.action.reset().play();
        }
    }
    step(time) {

        if (!this.parent.character.currentCell || this.parent.character.currentCell.ocean) {
            let depth = this.parent.character.map.getHeightAt(this.parent.character.position.x,this.parent.character.position.y);
            if (depth >= -0.6) {
                this.parent.set("idle");
                return;
            }
        } else {
            this.parent.set("idle");
        }

        if (Keyboard.state.w || Keyboard.state.arrowup || Keyboard.state.s || Keyboard.state.arrowdown) {
            return
        }
        this.parent.set("idleSwim");
    }
}




function addOneEvent(emitter, type, handler) {
    const cb = function(event) {
        emitter.removeEventListener(type,cb);
        handler.call(emitter, event)
    }
    emitter.addEventListener(type,cb);
}
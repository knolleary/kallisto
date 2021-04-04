import {loadModel} from '../../utils/loader.js'
import {Character} from '../baseObject.js'
import {StateMachine, State} from '../../utils/states.js'
import * as IslandMath from '../../utils/math.js'
import * as Paths from '../../utils/path.js'

var CHICKEN_MODEL;
var ANIMATION_SCALE = 1.2;

var WALK_SPEED = 0.6;
var RUN_SPEED = 1.2;

loadModel(
    "models/chicken.glb",
    function ( gltf ) {
        CHICKEN_MODEL = gltf;
    });

var SPEED = WALK_SPEED;

var SHOW_CHICKEN_PATHS = false;

function makeMarker() {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 128;
    ctx.canvas.height = 128

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(64,64,40,+Math.PI/8,Math.PI-Math.PI/8,true);
    ctx.lineTo(64,120);
    ctx.closePath()
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.stroke();


    // ctx.canvas.width = 64;
    // ctx.canvas.height = 64;
    // ctx.font = '20px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.textBaseline = 'middle';
    // ctx.fillStyle = '#FFF';
    // ctx.fillText("C", ctx.canvas.width / 2, ctx.canvas.height / 2);


    const noteMaterial = new THREE.SpriteMaterial({
        // color: new THREE.Color().setHSL(Math.random()*1, 1, 0.5),
        map: new THREE.CanvasTexture(ctx.canvas),
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.NormalBlending
    });
    const note = new THREE.Sprite(noteMaterial);
    return note;
}


export class Chicken extends Character {
    constructor(map) {
        super("chicken",map);

        this.clock = Math.random()*5;
        this.FORWARD_OFFSET = -Math.PI/2;
        this.SPEED = 0;
        this.FLOAT_OFFSET = -0.2;
        this.Z_OFFSET = 0.02;
        this.MAX_Z_STEP = 0.2;
        // this.HIGHLIGHT_REGION = true;
        this.updateHeading();
        this.scene = THREE.SkeletonUtils.clone(CHICKEN_MODEL.scene);
        this.mesh = this.scene.children[0];
        this.mesh.scale.set(.35,.35,.35);
        this.mesh.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                if (o.material) {
                    o.material.flatShading = true;
                    // o.material.emissiveIntensity = 0.2;
                    // o.material.emissive.setHex( 0xffffff );
                    // o.material = new THREE.MeshLambertMaterial( {color: o.material.color, flatShading:true, skinning: true}  )
                }
            }
        });
        this.add(this.mesh);

        // this.marker = makeMarker();
        // this.marker.position.z = 1.2;
        // this.add(this.marker);

        this.mixer = new THREE.AnimationMixer(this.mesh)
        this.mixer.timeScale = ANIMATION_SCALE;
        this.animations = CHICKEN_MODEL.animations;
        this.actions = {};
        this.actions.idle = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Idle"));
        this.actions.walk = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Walk"));
        this.actions.jump = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Jump"));
        this.actions.jump.setLoop( THREE.LoopOnce )
        this.actions.peck = this.mixer.clipAction(THREE.AnimationClip.findByName(this.animations, "Peck"));
        this.actions.peck.setLoop( THREE.LoopOnce )

        // this.actions.idle.play();
        // for (var i in this.actions) {
        //     console.log(i,this.actions[i].getClip().duration)
        // }

        this.state.add("idle", IdleState);
        this.state.add("seek", SeekState);
        this.state.add("walk", WalkState);
        this.state.add("avoid", AvoidState);
        this.state.add("pickGoal", PickGoalState);
        this.state.add("dead", DeadState);

        this.path =  null;
        this.goal = null;
        this.currentWaypoint;
        this.distanceToWaypoint;
        this.waypoints = [];
    }
    notify(event,payload) {
        switch(event) {
            case "swipe":
                if (this.state.current !== "dead") {
                    this.state.set("dead");
                }
                break;
            case "pickup":
                if (this.state.current !== "dead") {
                    this.state.set("dead");
                }
                break;

        }
        if (event === "swipe") {
            this.state.set("dead");
        } else if (event === "pickup") {
            if (this.state.current === "dead") {
            }
        }
    }
    jump(d) {
        this.dz = d || 0.1;
        this.actions.jump.reset().play();
    }
    peck() {
        this.actions.peck.reset().play();
    }
    spook() {
        this.jump(0.2);
        this.goal = null;
    }
    update(delta) {
        if (!this.state.current) {
            this.state.set("idle");
        }
        this.mixer.update(delta);
        var avoiding = false;
        if (this.step(delta)) {
            // Collided
            this.waypoints = [];
            this.currentWaypoint = null;
            this.goal = null;
            this.heading += Math.PI/8;
            this.goalHeading = this.heading;
            this.state.set("idle");
        }
        this.clock = this.clock+delta;

        // if (this.clock > 5) {
        //     // Random hop
        //     this.clock = 0;
        //     if (Math.random()<0.8) {
        //         this.jump(0.1);
        //     }
        // }
    }
}



class IdleState extends State {
    constructor(parent) {
        super("idle", parent);
        this.action = this.parent.character.actions['idle'];
    }
    enter(previousState) {
        this.SPEED = 0;
        if (previousState && previousState.action) {
            this.action.reset().play();
            previousState.action.stop();
        } else {
            this.action.reset().play();
        }
        this.parent.set("pickGoal");
    }
    step(time) {

    }
}

class AvoidState extends State {
    constructor(parent) {
        super("avoid", parent);
        this.action = this.parent.character.actions['walk'];
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            this.action.reset().play();
            previousState.action.stop();
        } else {
            this.action.reset().play();
        }
    }
    step(time) {
        let self = this.parent.character;

        var nb = self.getNearbys(false, Math.PI, 2);
        if (nb.length > 0) {
            if (nb[0].object.type !== "chicken" && nb[0].object.SPEED > 0) {
                var dh = 0.04;
                if (nb[0].distance < 1) {
                    dh = 0.08;
                }
                self.SPEED = RUN_SPEED;
                if (nb[0].headingDelta < 0) {
                    self.heading += dh;
                } else if (nb[0].headingDelta > 0){
                    self.heading -= dh;
                }
                // this.heading = nb[0].headingDelta + Math.PI/2;
                self.updateHeading();
            }
        } else {
            this.parent.set("walk");
        }
    }
}

class WalkState extends State {
    constructor(parent) {
        super("walk", parent);
        this.action = this.parent.character.actions['walk'];
    }
    enter(previousState) {

        if (previousState && previousState.action) {
            this.action.reset().play();
            previousState.action.stop();
        } else {
            this.action.reset().play();
        }
        this.SPEED = WALK_SPEED
    }
    step(time) {
        let self = this.parent.character;
        if (!self.currentWaypoint) {
            this.parent.set("seek")
            return;
        }
        var nb = self.getNearbys(false, Math.PI, 2);
        if (nb.length > 0 && nb[0].object.type !== "chicken" && nb[0].object.SPEED > 0) {
            this.parent.set("avoid");
            return;
        }


        self.goalHeading = IslandMath.getHeading(self.position.x,self.position.y,self.currentWaypoint.x,self.currentWaypoint.y)
        self.goalHeading += self.FORWARD_OFFSET;
        // this.heading = this.goalHeading;
        self.updateHeading();


        // We have a waypoint to head towards
        // if (self.SPEED === 0) {
        // Not moving, so turn towards waypoint
        var delta = IslandMath.getHeadingDifference(self.heading,self.goalHeading);
        if (Math.abs(delta) > 0.3) {
            if (delta > 0) {
                self.heading += 0.2;
            } else {
                self.heading -= 0.2;
            }
            self.updateHeading();
        } else {
            self.heading = self.goalHeading;
            // this.SPEED = WALK_SPEED;
            self.updateHeading();
        }
        // } else {
        // Already moving, check if we have arrived yet
        var distanceToWaypoint = IslandMath.getDistance(self.position.x,self.position.y,self.currentWaypoint.x,self.currentWaypoint.y)
        // if (distanceToWaypoint > this.distanceToWaypoint) {
        // moving away - stop moving to reset heading
        // this.SPEED = 0;
        // console.log(distanceToWaypoint);
        if (distanceToWaypoint < 0.01) {
            // Clear the current waypoint so the next waypoint is picked
            this.parent.set("seek")
        }
        // this.distanceToWaypoint = distanceToWaypoint;
        // }
    }
}

class PickGoalState extends State {
    constructor(parent) {
        super("pickGoal", parent);
    }
    step(time) {
        let self = this.parent.character;
        if (!self.currentCell) {
            return;
        }
        var region = self.currentCell.region;
        var cells = [];
        self.map.getRegionNeighbours(region).forEach(function(r) {
            cells = cells.concat(r.cells);
        })
        var count = 0;
        while(count < 50 && (!self.goal || self.goal.object || self.goal.minZ < 0)) {
            count++;
            self.goal = cells[Math.floor(Math.random()*cells.length)]
        }
        if (count ===50) {
            return;
        }
        // Get the path to the goal
        var path = Paths.getPath(self.map,self.position.x,self.position.y,self.goal.x,self.goal.y);
        if (path) {
            self.waypoints = path.smooth|| path.aStar|| path.smooth||path.aStar||path.straight;
            //                    console.log("got a path",this.waypoints.length,"waypoints");
            self.currentWaypoint = null;
            // self.goal.highlight(true);
            if (SHOW_CHICKEN_PATHS) {
                //
                if (self.path) {
                    self.map.remove(self.path)
                }
                self.path = new THREE.Object3D();
                self.map.add( self.path  );

                var drawPath = function(self,path,zoff) {
                    var curvePath = new THREE.CurvePath();
                    for (var i=0;i<path.length-1;i++) {
                        curvePath.add(new THREE.LineCurve3(
                            new THREE.Vector3(path[i].x,path[i].y,path[i].z + zoff),
                            new THREE.Vector3(path[i+1].x,path[i+1].y,path[i+1].z + zoff)
                        ))
                        var b = new THREE.Mesh(
                            new THREE.IcosahedronGeometry( 0.1 ),
                            new THREE.MeshLambertMaterial( {color: 0x0099ff, flatShading:true} )
                        );
                        b.position.copy(path[i]);
                        b.position.z += zoff
                        self.path.add(b);

                        var x0 = path[i].x;
                        var x1 = path[i+1].x;
                        var y0 = path[i].y;
                        var y1 = path[i+1].y;

                        var dx = x1-x0;
                        var dy = y1-y0;
                        var dh = Math.sqrt(dx*dx+dy*dy)/0.2;
                        dx /= dh;
                        dy /= dh;
                        var c = 0;
                        while (Math.abs(x0-x1) > 0.02 && Math.abs(y0-y1) > 0.02 && c <30) {
                            x0 += dx;
                            y0 += dy;
                            var walkable = self.map.isPointClear(x0,y0);
                            var b = new THREE.Mesh(
                                new THREE.IcosahedronGeometry( 0.09 ),
                                new THREE.MeshLambertMaterial( {color: walkable?0x00ff00:0xff0000, flatShading:true} )
                            );
                            b.position.copy({x:x0,y:y0,z:path[i].z+zoff});
                            self.path.add(b);
                            c++;

                        }


                    }
                    var b = new THREE.Mesh(
                        new THREE.IcosahedronGeometry( 0.1 ),
                        new THREE.MeshLambertMaterial( {color: 0x0099ff, flatShading:true} )
                    );
                    b.position.copy(path[path.length-1]);
                    b.position.z += zoff
                    self.path.add(b);
                    var tg = new THREE.TubeGeometry( curvePath, path.length*10, 0.05, 4, false );
                    var material = new THREE.MeshLambertMaterial( { color: 0xff00ff, flatShading:true } );
                    self.path.add(new THREE.Mesh( tg, material ));
                }
                // if (path.straight) {
                //     drawPath(this,path.straight,0.05);
                // }
                // if (path.aStar) {
                //     drawPath(this,path.aStar,0.15);
                // }
                if (path.smooth) {
                    drawPath(self,path.smooth,0.25);
                }
            }

            this.parent.set("walk");
        } else {
            self.goal = null;
            self.waypoints = null;
            self.currentWaypoint = null;
            this.parent.set("idle");
        }

    }
}

class SeekState extends State{
    constructor(parent) {
        super("seek", parent);
    }
    enter(previousState) {
        let self = this.parent.character;
        if (self.waypoints.length > 0) {
            // We have a set of waypoints, but not an active one
            // Pick the next waypoint to head towards
            self.currentWaypoint = self.waypoints.shift();
            self.distanceToWaypoint = IslandMath.getDistance(self.position.x,self.position.y,self.currentWaypoint.x,self.currentWaypoint.y)
            while (self.distanceToWaypoint < 0.01) {
                self.currentWaypoint = self.waypoints.shift();
                self.distanceToWaypoint = IslandMath.getDistance(self.position.x,self.position.y,self.currentWaypoint.x,self.currentWaypoint.y)
            }
            // this.SPEED = 0;
            self.goalHeading = IslandMath.getHeading(self.position.x,self.position.y,self.currentWaypoint.x,self.currentWaypoint.y)
            self.goalHeading += self.FORWARD_OFFSET;
            self.updateHeading();
            self.SPEED = 0.6;
            // if (this.goalHeading < 0) { this.goalHeading += Math.PI*2 }
            // else if (this.goalHeading > Math.PI*2) { this.goalHeading -= Math.PI*2 }
            this.parent.set("walk");
        } else if (self.goal) {
            self.currentWaypoint = null;
            self.waypoints = [];
            self.SPEED = 0;
            self.peck();
            self.goal = null;

            this.parent.set("idle");
        }
    }

}


class DeadState extends State {
    constructor(parent) {
        super("dead", parent);
        this.action = this.parent.character.actions['idle'];
    }
    enter(previousState) {
        this.parent.character.SPEED = 0;
        if (previousState && previousState.action) {
            this.action.reset().play();
            previousState.action.stop();
        } else {
            this.action.reset().play();
        }
    }
    step(time) {

    }
}

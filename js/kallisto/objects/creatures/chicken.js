import {loadModel} from '../../utils/loader.js'
import {Character} from '../baseObject.js'
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
        this.actions.walk.play();
        // for (var i in this.actions) {
        //     console.log(i,this.actions[i].getClip().duration)
        // }

        this.path =  null;
        this.goal = null;
        this.currentWaypoint;
        this.distanceToWaypoint;
        this.waypoints = [];
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
        this.mixer.update(delta);
        var avoiding = false;
        if (this.step(delta)) {
            // Collided
            // if (this.goal) {
            //     this.goal.highlight(false);
            // }
            this.waypoints = [];
            this.currentWaypoint = null;
            this.goal = null;
            this.heading += Math.PI/8;
            this.goalHeading = this.heading;
            // this.SPEED = 0;
        } else if (this.currentCell) {
            var nb = this.getNearbys(false, Math.PI, 2);
            if (nb.length > 0) {
                if (nb[0].object.type !== "chicken" && nb[0].object.SPEED > 0) {
                    var dh = 0.04;
                    if (nb[0].distance < 1) {
                        dh = 0.08;
                    }
                    this.SPEED = RUN_SPEED;
                    if (nb[0].headingDelta < 0) {
                        this.heading += dh;
                    } else if (nb[0].headingDelta > 0){
                        this.heading -= dh;
                    }
                    avoiding = true;
                    // this.heading = nb[0].headingDelta + Math.PI/2;
                    this.updateHeading();
                }
            }
        }
        if (avoiding) {
            this.waypoints = [];
            this.currentWaypoint = null;
            this.goal = null;
            this.goalHeading = this.heading;
        } else if (this.SPEED === RUN_SPEED){
            this.SPEED = WALK_SPEED
        }
        this.clock = this.clock+delta;

        if (this.clock > 5) {
            // Random hop
            this.clock = 0;
            if (Math.random()<0.8) {
                this.jump(0.1);
            }
        }
        if (!avoiding) {
            if (this.goal === null && this.currentCell) {
//                console.log("find a goal")
                // Find a new goal to move towards
                var region = this.currentCell.region;
                var cells = [];
                this.map.getRegionNeighbours(region).forEach(function(r) {
                    cells = cells.concat(r.cells);
                })
                var count = 0;
                while(count < 50 && (!this.goal || this.goal.object || this.goal.minZ < 0)) {
                    count ++;
                    this.goal = cells[Math.floor(Math.random()*cells.length)]
                }
                if (count ===50) {
                    return;
                }
                // Get the path to the goal
                var path = Paths.getPath(this.map,this.position.x,this.position.y,this.goal.x,this.goal.y);
                if (path) {
                    this.waypoints = path.smooth|| path.aStar|| path.smooth||path.aStar||path.straight;
//                    console.log("got a path",this.waypoints.length,"waypoints");
                    this.currentWaypoint = null;
                    // this.goal.highlight(true);
                    if (this.path) {
                        this.map.remove(this.path)
                    }
                    this.path = new THREE.Object3D();
                    this.map.add( this.path  );

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
                    // if (path.smooth) {
                    //     drawPath(this,path.smooth,0.25);
                    // }
                } else {
                    this.goal = null;
                }

            }

            if (this.currentWaypoint === null && this.waypoints) {
                if (this.waypoints.length > 0) {
//                    console.log("get next waypoint");
                    // We have a set of waypoints, but not an active one
                    // Pick the next waypoint to head towards
                    this.currentWaypoint = this.waypoints.shift();
                    this.distanceToWaypoint = IslandMath.getDistance(this.position.x,this.position.y,this.currentWaypoint.x,this.currentWaypoint.y)
                    while (this.distanceToWaypoint < 0.01) {
                        this.currentWaypoint = this.waypoints.shift();
                        this.distanceToWaypoint = IslandMath.getDistance(this.position.x,this.position.y,this.currentWaypoint.x,this.currentWaypoint.y)
                    }
                    // this.SPEED = 0;
                    this.goalHeading = IslandMath.getHeading(this.position.x,this.position.y,this.currentWaypoint.x,this.currentWaypoint.y)
                    this.goalHeading += this.FORWARD_OFFSET;
                    // this.heading = this.goalHeading;
                    this.updateHeading();
                    this.SPEED = 0.6;
                    // if (this.goalHeading < 0) { this.goalHeading += Math.PI*2 }
                    // else if (this.goalHeading > Math.PI*2) { this.goalHeading -= Math.PI*2 }
                } else if (this.goal) {
//                    console.log("reached the goal");
                    // No more waypoints - pick a new goal
                    // this.goal.highlight(false);
                    this.currentWaypoint = null;
                    this.waypoints = [];
                    this.SPEED = 0;
                    this.peck();
                    this.goal = null;
                }
            } else if (this.currentWaypoint) {
                this.goalHeading = IslandMath.getHeading(this.position.x,this.position.y,this.currentWaypoint.x,this.currentWaypoint.y)
                this.goalHeading += this.FORWARD_OFFSET;
                // this.heading = this.goalHeading;
                this.updateHeading();


                // We have a waypoint to head towards
                // if (this.SPEED === 0) {
                    // Not moving, so turn towards waypoint
                    var delta = IslandMath.getHeadingDifference(this.heading,this.goalHeading);
                    if (Math.abs(delta) > 0.3) {
                        if (delta > 0) {
                            this.heading += 0.2;
                        } else {
                            this.heading -= 0.2;
                        }
                        this.updateHeading();
                    } else {
                        this.heading = this.goalHeading;
                        // this.SPEED = WALK_SPEED;
                        this.updateHeading();
                    }
                // } else {
                    // Already moving, check if we have arrived yet
                    var distanceToWaypoint = IslandMath.getDistance(this.position.x,this.position.y,this.currentWaypoint.x,this.currentWaypoint.y)
                    // if (distanceToWaypoint > this.distanceToWaypoint) {
                    // moving away - stop moving to reset heading
                    // this.SPEED = 0;
                    // console.log(distanceToWaypoint);
                    if (distanceToWaypoint < 0.01) {
                        // Clear the current waypoint so the next waypoint is picked
                        this.currentWaypoint = null;
                    }
                    // this.distanceToWaypoint = distanceToWaypoint;
                // }
            }
        }


    }
}

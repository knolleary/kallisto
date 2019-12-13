(function() {

    var C_ARM = new THREE.Color(0x3366ff);
    var C_HEAD = new THREE.Color(0xFFE0BD);

    var PLAYER_MATERIAL =new THREE.MeshLambertMaterial( {color: 0xff9933, flatShading:true} )

    var FORWARD_OFFSET = -Math.PI/2;
    var Z_OFFSET = 0.6;
    var ANIMATION_SCALE = 2;
    var WALK_SPEED = 0.8 * ANIMATION_SCALE;

    var STATES = {
        IDLE: 0,
        WALKING: 1
    }

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
    class Player extends THREE.Object3D {
        constructor(map, done) {
            super();
            var self = this;
            this.currentAction = null;
            this.state = STATES.IDLE;
            this.lastItch = 1 + Math.random()*5;

            // this.mesh = new ISLAND.objects.BaseMesh(new PlayerGeometry());
            // this.add(this.mesh)
            self.actions = {};

            var loader = new THREE.GLTFLoader();
            loader.load(
                "models/hero.glb",
                function ( gltf ) {
                    self.mesh = gltf.scene.children[0];


                    self.mesh.scale.set(0.25,0.25,0.25);
                    self.mesh.position.z = Z_OFFSET;
                    self.mesh.traverse(o => {
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
                    self.add(self.mesh);
                    // self.add(new ISLAND.objects.BaseMesh(new PlayerGeometry()))

                    self.mixer = new THREE.AnimationMixer(self.mesh)
                    self.mixer.timeScale = ANIMATION_SCALE;
                    self.animations = gltf.animations;
                    self.actions.idle = self.mixer.clipAction(THREE.AnimationClip.findByName(self.animations, "Idle"));
                    self.actions.walk = self.mixer.clipAction(THREE.AnimationClip.findByName(self.animations, "Walk"));
                    self.actions.headScratch = self.mixer.clipAction(THREE.AnimationClip.findByName(self.animations, "HeadScratch"));
                    self.actions.headScratch.setLoop( THREE.LoopOnce );
                    self.actions.headScratch.clampWhenFinished = true;

                    self.currentAction = self.actions.idle;
                    self.currentAction.play();
                    self.state = STATES.IDLE;
                    done();
                    // console.log(gltf.scene.children[1]);
                    // console.log(gltf.scene.children[1].isMesh);
                    // gltf.scene.children[1].position.z =14;
                    // gltf.scene.traverse( function ( child ) {
                    //
                    //     // if (child.isMesh) child.material = material;
                    // });
                    //
                    //
                    // camera.lookAt(gltf.scene.children[0].position);
                },
            );




            this.map = map;
            this.dir = 0;
            this.position.z = this.map.getHeightAt(this.position.x,this.position.y);
            this.deltaZ = 0;
            // this.tracker = new THREE.Object3D();

            // this.tracker = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.1, 3 );

            // this.helper = new THREE.CameraHelper(this.tracker);
            /*new ISLAND.objects.BaseMesh(
            new THREE.BoxGeometry( 1,1,1 ),
            new THREE.MeshLambertMaterial( {color: 0xff0000, flatShading:true} )
            )*/
            // this.tracker.position.y = 10;
            // this.tracker.position.z = 10;
            // this.tracker.lookAt(this.position);
            // this.add(this.helper);
            // this.add(this.tracker);
            // this.tracker.position.set(0,0,0);
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
            var moveSpeed = WALK_SPEED*delta;
            var moved = false;
            var newX = this.position.x;
            var newY = this.position.y;

            if (this.moveForward) {
                newX = this.position.x + this.dx*moveSpeed;
                newY = this.position.y + this.dy*moveSpeed;
                moved = true;
            } else if (this.moveBack) {
                newX = this.position.x - this.dx*moveSpeed*0.8;
                newY = this.position.y - this.dy*moveSpeed*0.8;
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
                    this.actions.walk.play();
                    if (this.currentAction) {
                        this.currentAction.stop();
                    }
                    this.currentAction = this.actions.walk;
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
    ISLAND.Player = Player;


})();

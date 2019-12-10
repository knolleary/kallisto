(function() {

    var C_ARM = new THREE.Color(0x3366ff);
    var C_HEAD = new THREE.Color(0xFFE0BD);

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
        constructor(map) {
            super();
            this.mesh = new ISLAND.objects.BaseMesh(new PlayerGeometry());
            this.add(this.mesh)


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
            this.dx = Math.cos(this.dir);
            this.dy = Math.sin(this.dir);
        }
        jump() {
            if (this.deltaZ === 0) {
                this.deltaZ = 0.18;
            }
        }
        update(delta) {
            var moveSpeed = 4*delta;
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
                            this.mesh.position.z = cell.object.height-heightAboveLand;
                        }
                    } else {
                        this.mesh.position.z = 0;
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
            }
        }
    }
    ISLAND.Player = Player;


})();

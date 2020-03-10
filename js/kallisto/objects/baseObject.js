import * as IslandMath from '../utils/math.js'


export class BaseMesh extends THREE.Mesh {
    constructor(geometry,material) {
        super(
            geometry,
            material || new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors, flatShading:true}  )
        );
        this.castShadow = true;
    }
}
export class BaseObject extends THREE.Object3D {
    constructor(type) {
        super();
        this.type = type;
    }

    setCell(cell) {
        this.cell = cell;
        this.position.x = cell.x;
        this.position.y = cell.y;
        this.position.z = cell.z;
    }
    highlight(on) {
        if (this.cell) {
            this.cell.highlight(on)
        }
    }

    getHeightAt(dx,dy) {
        // Get the height of the object at the given x/y from its center
        return 0;
    }
}


export class Character extends THREE.Object3D {
    constructor(type,map) {
        super();
        this.type = type;
        this.map = map;
        this.currentCell = null;
        this.heading = Math.random()*2*Math.PI;
        this.dx = 0;
        this.dy = 0;
        this.dz = 0;
        this.FORWARD_OFFSET = 0; // Offset to heading to point mesh in right dir
        this.SPEED = 0;          // Moving speed
        this.FLOAT_OFFSET = 0;   // z offset when floating
        this.MAX_Z_STEP = 0;     // maximum z-step allowed
        this.updateHeading();

        // this.BLOB_A = new BaseMesh(
        //     new THREE.IcosahedronGeometry( 0.1 ),
        //     new THREE.MeshLambertMaterial( {color: 0xff0000, flatShading:true} )
        // );
        // this.add(this.BLOB_A);
        // this.BLOB_B = new BaseMesh(
        //     new THREE.IcosahedronGeometry( 0.1 ),
        //     new THREE.MeshLambertMaterial( {color: 0x00ff00, flatShading:true} )
        // );
        // this.add(this.BLOB_B);
        // this.BLOB_C = new BaseMesh(
        //     new THREE.IcosahedronGeometry( 0.1 ),
        //     new THREE.MeshLambertMaterial( {color: 0x0000ff, flatShading:true} )
        // );
        // this.add(this.BLOB_C);


    }
    updateHeading() {
        if (this.heading < 0) { this.heading += Math.PI*2 }
        else if (this.heading > Math.PI*2) { this.heading -= Math.PI*2 }
        this.dx = Math.cos(this.heading+this.FORWARD_OFFSET);
        this.dy = Math.sin(this.heading+this.FORWARD_OFFSET);

        this.dx0 = Math.cos(this.heading+this.FORWARD_OFFSET-Math.PI/6);
        this.dy0 = Math.sin(this.heading+this.FORWARD_OFFSET-Math.PI/6);

        this.dx1 = Math.cos(this.heading+this.FORWARD_OFFSET+Math.PI/6);
        this.dy1 = Math.sin(this.heading+this.FORWARD_OFFSET+Math.PI/6);
    }
    getNearbys(includeStatic,arcRange,range) {
        var nearbys = [];
        if (this.currentCell) {
            var regionObjects = [...this.currentCell.region.contains];
            if (includeStatic) {
                this.currentCell.region.cells.forEach(function(c) {
                    if (c.object) {
                        regionObjects.push(c.object);
                    }
                })
            }
            this.map.getRegionNeighbours(this.currentCell.region).forEach(r => {
                regionObjects = regionObjects.concat([...r.contains]);
                if (includeStatic) {
                    r.cells.forEach(function(c) {
                        if (c.object) {
                            regionObjects.push(c.object);
                        }
                    })
                }
            })
            var self = this;
            // console.log("arcRange",arcRange)
            // console.log("Candidate",regionObjects);
            regionObjects.forEach(function(obj) {
                if (obj !== self) {
                    var objHeading = IslandMath.normaliseHeading(Math.PI+IslandMath.getHeading(self.position.x,self.position.y,obj.position.x,obj.position.y))
                    var headingDelta = IslandMath.getHeadingDifference(self.heading+self.FORWARD_OFFSET,objHeading)
                    var distance = IslandMath.getDistance(self.position.x,self.position.y,obj.position.x,obj.position.y)
                    if ((arcRange === undefined || Math.abs(headingDelta) < arcRange ) && range === undefined || distance < range) {
                        nearbys.push({
                            object: obj,
                            heading: objHeading,
                            headingDelta: headingDelta,
                            distance: distance
                        })
                        // var px = self.position.x+distance*Math.cos(objHeading);
                        // var py = self.position.y+distance*Math.sin(objHeading);
                        // var b = new THREE.Mesh(
                        //     new THREE.IcosahedronGeometry( 0.2 ),
                        //     new THREE.MeshLambertMaterial( {color: 0x0099ff, flatShading:true} )
                        // );
                        // b.position.set(px,py,obj.position.z+0.7);
                        // self.map.add(b);
                    // } else {
                    //     console.log("Fail",headingDelta,distance,obj)
                    //     var px = self.position.x+distance*Math.cos(objHeading);
                    //     var py = self.position.y+distance*Math.sin(objHeading);
                    //     var b = new THREE.Mesh(
                    //         new THREE.IcosahedronGeometry( 0.2 ),
                    //         new THREE.MeshLambertMaterial( {color: 0xff0000, flatShading:true} )
                    //     );
                    //     b.position.set(px,py,obj.position.z+0.6);
                    //     self.map.add(b);
                    }
                }
            });
        }
        nearbys.sort(function(A,B) {
            return A.distance-B.distance
        })
        return nearbys;
    }
    step(delta) {
        var newX = this.position.x;
        var newY = this.position.y;
        var newZ;
        var cellObjectHeight = 0;
        var collided = false;
        if (this.SPEED != 0) {
            var moveSpeed = this.SPEED * delta;
            newX = this.position.x + this.dx*moveSpeed;
            newY = this.position.y + this.dy*moveSpeed;

            // this.BLOB_A.position.set(this.dx0*this.RADIUS,this.dy0*this.RADIUS,0.1);
            // this.BLOB_B.position.set(this.dx1*this.RADIUS,this.dy1*this.RADIUS,0.1);
            // this.BLOB_C.position.set(this.dx*this.RADIUS,this.dy*this.RADIUS,0.1);


            // Check the character location height
            newZ = Math.max(this.FLOAT_OFFSET,this.map.getHeightAt(newX,newY));
            if (newZ > this.position.z + this.MAX_Z_STEP) {
                newX = this.position.x;
                newY = this.position.y;
                collided = true;
            } else {
                var dir = Math.sign(moveSpeed);
                // Check at their edge
                newZ = Math.max(this.FLOAT_OFFSET,this.map.getHeightAt(newX+this.dx0*dir*this.RADIUS,newY+this.dy0*dir*this.RADIUS));
                if (newZ > this.position.z + this.MAX_Z_STEP*2) {
                    newX = this.position.x;
                    newY = this.position.y;
                    collided = true;
                } else {
                    newZ = Math.max(this.FLOAT_OFFSET,this.map.getHeightAt(newX+this.dx1*dir*this.RADIUS,newY+this.dy1*dir*this.RADIUS));
                    if (newZ > this.position.z + this.MAX_Z_STEP*2) {
                        newX = this.position.x;
                        newY = this.position.y;
                        collided = true;
                    }
                }
            }
            // var cell = this.map.getCellAt(newX,newY);
            // var dr = 2;
            // var objRadius = 0;
            //
            // if (cell&&cell.object) {
            //     var dx = Math.abs(cell.x - newX);
            //     var dy = Math.abs(cell.y - newY);
            //     dr = dx*dx + dy*dy;
            //     objRadius = cell.object.radius;
            // }
            // if (!cell||!cell.object || (dr > objRadius || cell.object.height < this.MAX_Z_STEP)) {
            //     if (dr <= objRadius && cell.object && cell.object.height) {
            //         cellObjectHeight = cell.object.height;
            //     } else {
                    // this.mesh.position.z = this.Z_OFFSET;
            //     }
            // } else {
            //     collided = true;
            // }
        }
        var cell = this.map.getCellAt(newX,newY);
        if (cell && !this.currentCell) {
            this.currentCell = cell;
            this.currentCell.region.contains.add(this);
        }
        var landHeight = Math.max(this.FLOAT_OFFSET,this.map.getHeightAt(newX,newY));
        // var heightAboveLand = this.position.z - landHeight;
        // if (cellObjectHeight > 0 && heightAboveLand < cellObjectHeight) {
        //     this.mesh.position.z = cellObjectHeight - heightAboveLand + this.Z_OFFSET;
        // }
        this.dz -= 0.02;
        newZ = this.position.z + this.dz;
        if (newZ < landHeight) {
            this.dz = 0;
            newZ = landHeight;
        }

        this.position.z = newZ;
        this.rotation.z = this.heading;

        if (!collided && this.SPEED != 0) {
            this.position.x = newX;
            this.position.y = newY;
            if (cell !== this.currentCell) {
                if (this.currentCell) {
                    this.currentCell.region.contains.delete(this);
                    if (this.HIGHLIGHT_REGION) {
                        this.map.getRegionNeighbours(this.currentCell.region).forEach(r => {
                            r.cells.forEach(c => c.highlight(false))
                        })
                        this.currentCell.region.cells.forEach(c => c.highlight(false));
                        this.currentCell.highlight(false);
                    }
                }
                // this.currentCell.highlight(false);
                this.currentCell = cell;
                // this.currentCell.highlight(true,0xff0000);
                if (cell) {
                    this.currentCell.region.contains.add(this);
                    if (this.HIGHLIGHT_REGION) {
                        this.map.getRegionNeighbours(this.currentCell.region).forEach(r => {
                            r.cells.forEach(c => c.highlight(true,0x0000ff))
                        })
                        this.currentCell.region.cells.forEach(c => c.highlight(true));
                        this.currentCell.highlight(true);
                    }
                }
            }
        }


        return collided;
    }
}
/**
 * BaseObject extends THREE.Object3D
 *  - type
 *
 * StaticObject extends BaseObject
 *  - cell
 *
 */

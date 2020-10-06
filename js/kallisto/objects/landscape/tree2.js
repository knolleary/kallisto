import {BaseObject} from "../baseObject.js"

var TRUNK = new THREE.Color(0x996633);

var LEAVES = [
    new THREE.Color('#5C9031'),
    new THREE.Color('#6A9E42'),
    new THREE.Color('#77AC52'),
    new THREE.Color('#85B963'),
    new THREE.Color('#92C773'),
]


function stepTree(t) {
    if (t.step()) {
        setTimeout(function() { stepTree(t); }, 5000 )
    }
}

var treeStyles = [
{"trunkBaseRadius":0.2,"trunkTopRadius":0.1,"trunkHeight":2.4000000000000004,"trunkRadialSegments":5,"branchRadius":0.11,"branchSteps":6,"branchStepSize":0.30000000000000004,"branchRadialSegments":4,"branchSimplifyEpsilon":0.62,"drawBranchPoints":false,"drawBranchFullPath":false,"attractionPointArc":1.6,"attractionPointRadius":2.2,"attractionPointCount":133,"attractionPointHeightOffset":-1.4000000000000001,"attractionBiasX":0,"attractionBiasY":0.21,"attractionBiasZ":0,"drawAttractionPoints":false,"leafDepthRatio":0.193,"drawFoliage":true,"drawTrunk":true,"attractionVerticalRatio":1.6},
]


export class Tree extends BaseObject {
    constructor(cell) {
        super("tree");
        var t = new TreeObj({
            "trunkBaseRadius": 0.3,
            "trunkTopRadius": 0.1,
            "trunkHeight": 2.5+Math.random(),
            "trunkRadialSegments": 5,
            "branchRadius": 0.1,
            "branchSteps": 6+Math.floor(2*Math.random()),
            "branchStepSize": 0.3+(0.2*Math.random()),
            "branchRadialSegments": 5,
            "branchSimplifyEpsilon": 0.9,
            "drawBranchPoints": false,
            "drawBranchFullPath": false,
            "attractionPointArc": 1.5707963267948966,
            "attractionPointRadius": 3.7,
            "attractionPointCount": 150,
            "attractionPointHeightOffset": 0,
            "attractionBiasX": 0,
            "attractionBiasY": 0,
            "attractionBiasZ": 0,
            "drawAttractionPoints": false,
            "leafDepthRatio": 0.183,
            "drawFoliage": true,
            "drawTrunk": true,
            "attractionVerticalRatio": 0.6
        });
        t.castShadow = true;
        this.add(t);
        this.setCell(cell);
        this.rotation.x = Math.PI/2;

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

export class TreeObj extends THREE.Object3D {
    constructor(params, stepBuild) {
        super();

        this.config = Object.assign({
            drawFoliage: true,
            drawTrunk: true,
            drawBranchPoints: false,
            drawBranchFullPath: false,
            drawAttractionPoints: false,
            trunkBaseRadius: 0.2,
            trunkTopRadius: 0.05,
            trunkHeight: 3,
            trunkRadialSegments: 5,
            branchRadius: 0.05,
            branchSteps: 6,
            branchStepSize: 0.3,
            branchRadialSegments: 5,
            branchSimplifyEpsilon: 0.2,
            attractionPointArc: Math.PI/2,
            attractionPointRadius: 5,
            attractionPointCount: 50,
            attractionPointHeightOffset: -1,
            attractionBiasX: 0,
            attractionBiasY: 0,
            attractionBiasZ: 0,
            leafDepthRatio: 0.2,
            attractionVerticalRatio: 1
        }, params||{});

        this.debugObject = new THREE.Object3D();
        if (this.config.drawBranchPoints || this.config.drawBranchFullPath || this.config.drawAttractionPoints) {
            this.add(this.debugObject);
        }

        var self = this;
        this.leafNodes = new Set();
        this.workingBranches = [];

        this.stage = 0;

        // var boundingBoxGeo = new THREE.BoxGeometry( this.attractionPointRadius*2, this.config.trunkHeight+this.attractionPointRadius, this.attractionPointRadius*2 );
        // var boundingBoxMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: true } );
        // var boundingBox = new THREE.Mesh( boundingBoxGeo, boundingBoxMaterial );
        // scene.add( boundingBox );
        // boundingBox.position.y = (this.config.trunkHeight+this.attractionPointRadius)/2;
        this.distances = {}
        this.points = [];
        this.aps = [];
        for (var i=0;i<this.config.attractionPointCount;i++) {
            var azimuth = Math.random()*Math.PI*2;
            var elevation = Math.PI/2 + Math.random()*this.config.attractionPointArc;

            var x = this.config.attractionPointRadius * Math.cos(elevation) * Math.cos(azimuth);
            var z = this.config.attractionPointRadius * Math.cos(elevation) * Math.sin(azimuth);
            var y = this.config.trunkHeight + this.config.attractionPointHeightOffset + this.config.attractionPointRadius * Math.sin(elevation) * this.config.attractionVerticalRatio;
            this.aps.push({x:x,y:y,z:z,dToNearest:1000});
            if (this.config.drawAttractionPoints) {
                this.debugObject.add(markPoint(x,y,z,0xff9900));
            }
        }

        var i=0;
        for (var y = 0;y<this.config.trunkHeight;y += 0.4) {
            var p = {
                x:0,
                y:y,
                z:0,
                nearest: new Set(),
                connected: [],
                trunk: true,
                i: this.points.length
            };
            if (i > 0) {
                this.points[i-1].connected.push(p);
            }
            i++;
            this.points.push(p);
            this.calculateDistancesForPointAt(p);
        }




        // for (var i = 0;i<6;i++) {
        //     this.iterate(i);
        //     if (this.aps.length === 0) {
        //         break;
        //     }
        // }

        this.leafNodes.forEach(function(p) {
            var geometry = new THREE.IcosahedronGeometry( p.gen/6 );
            var material = new THREE.MeshLambertMaterial( {color: LEAVES[Math.floor(Math.random()*LEAVES.length)],flatShading:true} );
            var point = new THREE.Mesh( geometry, material );
            point.position.set(p.x,p.y,p.z);
            self.add( point );
        });

        // this.aps.forEach(function(aps) {
        //     var curvePath = new THREE.CurvePath();
        //     curvePath.add(new THREE.LineCurve3(
        //         aps,
        //         aps.nearest
        //     ))
        //     var tg = new THREE.TubeGeometry( curvePath, 4, 0.05, 4, false );
        //     var material = new THREE.MeshLambertMaterial( { color: 0xff00ff, flatShading:true } );
        //     scene.add(new THREE.Mesh( tg, material ));
        // })

        if (!stepBuild) {
            while(this.step()){}
        }
    }

    step() {
        var self = this;
        if (this.stage === 0) {
            if (this.config.drawTrunk) {
                var trunkGeometry = new THREE.CylinderGeometry( this.config.trunkTopRadius, this.config.trunkBaseRadius, this.config.trunkHeight, this.config.trunkRadialSegments );
                var trunkMaterial = new THREE.MeshLambertMaterial( {color: TRUNK,flatShading:true} );
                var trunk = new THREE.Mesh( trunkGeometry, trunkMaterial );
                trunk.position.set(0,this.config.trunkHeight/2,0);
                this.add( trunk );
            }
        } else if (this.stage < this.config.branchSteps) {
            this.iterate(this.stage-1);
        } else if (this.stage === this.config.branchSteps) {
            this.simplify()
            if (this.config.drawBranchFullPath) {
                this.drawBranches(false);
            }
            this.drawBranches(true);
        } else {
            if (this.config.drawFoliage) {
                this.leafNodes.forEach(function(p) {
                    var geometry = new THREE.IcosahedronGeometry( p.gen*self.config.leafDepthRatio );
                    var material = new THREE.MeshLambertMaterial( {color: LEAVES[Math.floor(Math.random()*LEAVES.length)],flatShading:true} );
                    var point = new THREE.Mesh( geometry, material );
                    point.position.set(p.x,p.y,p.z);
                    self.add( point );
                });
            }
            return false;
        }

        this.stage++;
        return true;
    }

    iterate(generation) {
        var self = this;
        var newPoints = [];
        this.points.forEach(function(p) {
            if (p.nearest.size > 0) {
                var delta = new THREE.Vector3();
                var distance = new THREE.Vector3();
                p.nearest.forEach(function(aps) {
                    distance.subVectors(aps,p);
                    delta.add(distance);
                })
                delta.normalize().multiplyScalar(self.config.branchStepSize).add(p);
                delta.x += self.config.attractionBiasX;
                delta.y += self.config.attractionBiasY;
                delta.z += self.config.attractionBiasZ;
                var p2 = {
                    x: delta.x,
                    y: delta.y,
                    z: delta.z,
                    nearest: new Set(),
                    connected: [],
                    gen:generation,
                    i: self.points.length+newPoints.length
                };
                p.connected.push(p2);
                newPoints.push({from:p,to:p2});
                self.leafNodes.delete(p);
                self.leafNodes.add(p2);

            }
        })
        newPoints.forEach(function(np) {
            self.points.push(np.to);
            self.calculateDistancesForPointAt(np.to);
            var line = markLine(np.from,np.to,0x996633,self.config.branchRadius,self.config.branchRadialSegments);
            self.workingBranches.push(line);
            self.add(line);
        })

        var recalculate = [];

        for (var i=this.aps.length-1;i>=0;i--) {
            var aps = this.aps[i];
            if (aps.dToNearest < 0.2) {
                this.aps.splice(i,1);
                aps.nearest.nearest.delete(aps);
                recalculate.push(aps.nearest.nearest);
            }
        }
        recalculate.forEach(function(p) {
            self.calculateDistancesForPointAt(p);
        })

        return newPoints.length > 0;
    }

    simplify() {
        var self = this;
        this.workingBranches.forEach(function(b) {
            self.remove(b);
        })

        var workingPoints = [this.points[0]];

        if (this.config.drawBranchPoints) {
            this.points.forEach(function(p) {
                self.debugObject.add(markPoint(p.x,p.y,p.z,0x0000ff,0.1));
            });
        }
        var branches = [];
        var currentBranch = [];
        var workingStack = [];

        while(workingPoints.length > 0) {
            var p = workingPoints.shift();
            if (!p.trunk) {
                // Add this branch node to the currentBranch
                currentBranch.push(p);
            }
            if (p.connected.length === 0) {
                // End of an branch
                branches.push(currentBranch);
                currentBranch = workingStack.shift();
                if (currentBranch) {
                    workingPoints.push(currentBranch.pop());
                }
            } else if (p.connected.length > 0){
                if (!p.connected[0].trunk && currentBranch.length === 0) {
                    currentBranch.push(p);
                }
                workingPoints.push(p.connected[0]);
                if (p.connected.length > 1) {
                    for (var i=1;i<p.connected.length;i++) {
                        workingStack.push([p,p.connected[i]])
                    }
                }
            }
        }


        this.branches = branches;
        this.simpleBranches = [];
        this.branchPointsRemoved = 0;
        this.branches.forEach(function(b) {
            if (b.length > 2) {
                var newBranch = simplifyBranch(b,self.config.branchSimplifyEpsilon)
                self.simpleBranches.push(newBranch);
                self.branchPointsRemoved += (b.length - newBranch.length)
            } else {
                self.simpleBranches.push(b);
            }
        })
    }

    drawBranches(simple) {
        var self = this;
        //
        // this.workingBranches.forEach(function(b) {
        //     self.remove(b);
        // })

        var branches = this.branches;
        if (simple) {
            branches = this.simpleBranches;
        }

        branches.forEach(function(b) {
            if (b.length > 1) {
                var path = markPath(b,simple?0x996633:0xffff00,simple?self.config.branchRadius:0.03,self.config.branchRadialSegments);
                self.workingBranches.push(path);
                if (simple) {
                    self.add(path);
                } else {
                    self.debugObject.add(path);
                }

                if (self.config.drawBranchPoints) {
                    b.forEach(function(p) {
                        self.debugObject.add(markPoint(p.x,p.y,p.z,0xff0000,0.1));
                    });
                }

            }
        })
    }

    calculateDistancesForPointAt(p) {
        this.aps.forEach(function(aps) {
            var dx = aps.x-p.x;
            var dy = aps.y-p.y;
            var dz = aps.z-p.z;
            var dd = dx*dx+dy*dy+dz*dz;
            if (dd < aps.dToNearest) {
                aps.dToNearest = dd;
                if (aps.nearest) {
                    aps.nearest.nearest.delete(aps)
                }
                aps.nearest = p;
                aps.nearest.nearest.add(aps);

            }
        })
    }

    stats() {
        var self = this;
        var vc = 0;
        this.children.forEach(function(g) { if (g !== self.debugObject) vc += g.geometry.vertices.length;})
        return {
            vertexCount: vc,
            branchPointsRemoved: this.branchPointsRemoved
        }
    }

}

function simplifyBranch(points, epsilon) {
    var subBranches = [];
    var currentBranch = [];
    for (var i=0;i<points.length;i++) {
        currentBranch.push(points[i]);
        if (points[i].connected.length > 1 || i === points.length-1) {
            subBranches.push(currentBranch);
            currentBranch = [points[i]];
        }
    }
    var result = [];
    subBranches.forEach(function(sb) {
        var simplifiedSubBranch = simplifyLine(sb,epsilon);
        if (result.length === 0) {
            result = simplifiedSubBranch;
        } else {
            result = result.concat(simplifiedSubBranch.slice(1));
        }
    })
    return result;


}
function simplifyLine(points, epsilon) {
    if (points.length < 3) {
        return points;
    }
    // Find the point with the maximum distance
    var dmax = 0;
    var index = 0;
    var end = points.length
    for (var i=1; i<end-1; i++) {
        var d = getPointToLineDistance(points[i], points[0], points[end-1])
        if (d > dmax) {
            index = i
            dmax = d
        }
    }
    var result = [];

    // If max distance is greater than epsilon, recursively simplify
    if (dmax > epsilon) {
        // Recursive call
        var r1 = simplifyLine(points.slice(0,index+1), epsilon)
        var r2 = simplifyLine(points.slice(index+1), epsilon)
        result = r1.slice(0,-1).concat(r2)
    } else {
        result = [points[0],points[end-1]]
    }
    return result;
}
var p0 = new THREE.Vector3();
var p1 = new THREE.Vector3();
var p2 = new THREE.Vector3();

var d1 = new THREE.Vector3();
var d2 = new THREE.Vector3();
var d3 = new THREE.Vector3();

function getPointToLineDistance(p,l0,l1) {
    // |(p0-p1)x(p0-p2)| / |p2-p1]
    p0.set(p.x,p.y,p.z);
    p1.set(l0.x,l0.y,l0.z);
    p2.set(l1.x,l1.y,l1.z);

    d1.subVectors(p0,p1);
    d2.subVectors(p0,p2);
    var s1 = d1.cross(d2).length();
    var s2 = d3.subVectors(p2,p1).length();
    return s1/s2;
    // var d1 =
}

function markPoint(x,y,z,c,r) {
    var geometry = new THREE.SphereGeometry( r||0.05 );
    var material = new THREE.MeshBasicMaterial( {color: c||0xaa0000} );
    var point = new THREE.Mesh( geometry, material );
    point.position.set(x,y,z);
    return point;
}

function markLine(p1,p2,c,r,rs) {
    var curvePath = new THREE.CurvePath();
        curvePath.add(new THREE.LineCurve3(
            p1,
            p2
        ))
        var tg = new THREE.TubeGeometry( curvePath, 1, r , rs, false );
        var material = new THREE.MeshLambertMaterial( { color: 0xff00ff } );
        return new THREE.Mesh( tg, material );
}


function markPath(points,c,r,rs) {
    var curvePath = new THREE.CurvePath();
        for (var i=1;i<points.length;i++) {
            curvePath.add(new THREE.LineCurve3(
                points[i-1],
                points[i]
            ))
        }
        var tg = new THREE.TubeGeometry( curvePath, points.length*3, r , rs, false );
        var material = new THREE.MeshLambertMaterial( { color: c||0xff00ff, flatShading:true } );
        return new THREE.Mesh( tg, material );
}
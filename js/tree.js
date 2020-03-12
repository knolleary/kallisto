
// http://algorithmicbotany.org/papers/colonization.egwnp2007.large.pdf



var gui = new dat.GUI({
    height : 5 * 32 - 1
});

var statsGui = new dat.GUI({height : 5 * 32 - 1,autoPlace: true});
statsGui.domElement.id = "report"

var params = {
    trunkBaseRadius: 0.2,
    trunkTopRadius: 0.05,
    trunkHeight: 3,
    trunkRadialSegments: 5,
    branchRadius: 0.05,
    branchSteps: 6,
    branchStepSize: 0.3,
    branchRadialSegments: 5,
    branchSimplifyEpsilon: 0.2,
        drawBranchPoints: true,
    drawBranchFullPath: false,
    attractionPointArc: Math.PI/2,
    attractionPointRadius: 5,
    attractionPointCount: 50,
    attractionPointHeightOffset: -1,
    drawAttractionPoints: false,
    leafDepthRatio: 0.2,
        drawFoliage: false,
    drawTrunk: true,
    attractionVerticalRatio: 1
};

if (document.location.hash && document.location.hash.length > 1) {
    Object.assign(params,decodeParams(document.location.hash.substring(1)))
}


var guiControls = {
    rotateView: true,
    regenerate: true,
}
gui.add(guiControls,"rotateView").name("Rotate");
gui.add(guiControls,"regenerate").name("Regenerate").onChange(function(value) {
    clearTimeout(generateTimeout);
    if (value && !generating) {
        generateTree();
    }
});

var trunkFolder = gui.addFolder('Trunk');
trunkFolder.open();
trunkFolder.add(params,"drawTrunk").name("Draw");
trunkFolder.add(params,"trunkHeight").name("Height").min(1).max(5).step(0.2);
trunkFolder.add(params,"trunkRadialSegments").name("Radial Segs").min(3).max(9).step(1);
trunkFolder.add(params,"trunkTopRadius").name("Top Radius").min(0).max(1).step(0.05);
trunkFolder.add(params,"trunkBaseRadius").name("Base Radius").min(0.05).max(1).step(0.05);

var branchFolder = gui.addFolder('Branch');
branchFolder.open();
branchFolder.add(params,"branchRadius").name("Radius").min(0.01).max(0.3).step(0.01);
branchFolder.add(params,"branchRadialSegments").name("Radial Segs").min(3).max(9).step(1);
branchFolder.add(params,"branchSteps").name("Steps").min(1).max(20).step(1);
branchFolder.add(params,"branchStepSize").name("Step Size").min(0.1).max(1).step(0.1);
branchFolder.add(params,"branchSimplifyEpsilon").name("Simplify factor").min(0.005).max(0.8).step(0.005);
branchFolder.add(params,"drawBranchPoints").name("Draw Points");
branchFolder.add(params,"drawBranchFullPath").name("Draw Full Path");
var leafFolder = gui.addFolder('Foliage');
leafFolder.open();
leafFolder.add(params,"drawFoliage").name("Draw");
leafFolder.add(params,"leafDepthRatio").name("Depth/Size Ratio").min(0.005).max(0.3).step(0.001);

var apFolder = gui.addFolder('Attraction Points');
apFolder.add(params,"drawAttractionPoints").name("Draw");
apFolder.add(params,"attractionPointCount").name("Count").min(1).max(500).step(1);
apFolder.add(params,"attractionPointRadius").name("Radius").min(0.1).max(10).step(0.1);
apFolder.add(params,"attractionPointHeightOffset").name("Height Offset").min(-2).max(2).step(0.2);
apFolder.add(params,"attractionVerticalRatio").name("Vertical Ratio").min(0.1).max(5).step(0.1);
apFolder.add(params,"attractionPointArc").name("Elevation Arc").min(0.1).max(3.1).step(0.1);

apFolder.open();

var treeStats = {
    vertexCount:"",
    branchPointsRemoved:""
}
statsGui.add(treeStats,"vertexCount").listen();
statsGui.add(treeStats,"branchPointsRemoved").listen();



var scene = new THREE.Scene();
scene.background = new THREE.Color(0xBFD1E5);

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("render").appendChild( renderer.domElement );

var ambientLight = new THREE.AmbientLight( 0xcccccc );
scene.add( ambientLight );

var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.3 );
directionalLight2.castShadow = true;
directionalLight2.position.set( 1, 1, 5 ).normalize();
scene.add( directionalLight2 );


var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
directionalLight.castShadow = true;
directionalLight.position.set( -1, 1, -5 ).normalize();
scene.add( directionalLight );

var camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 200 );
camera.position.set(2,8,10);
var geometry = new THREE.PlaneGeometry( 10, 10, 8, 8 );
var material = new THREE.MeshBasicMaterial( {color: 0xffffff,side: THREE.DoubleSide,wireframe: true } );
var plane = new THREE.Mesh( geometry, material );
scene.add( plane );
plane.rotation.x = Math.PI/2;


// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
// var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
// var cube = new THREE.Mesh( geometry, material );
// cube.position.y = 0.5;
// scene.add( cube );
//
// var wireframe = new THREE.WireframeGeometry( geometry );
//
// var line = new THREE.LineSegments( wireframe );
// line.material.depthTest = false;
// line.material.opacity = 0.8;
// line.material.transparent = true;
//
// cube.add( line );

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0,2,0);
var animate = function () {
    if (guiControls.rotateView) {
        controls.flyOrbit();
    }
    controls.update();
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
}

animate();



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

class Tree extends THREE.Object3D {
    constructor() {
        super();

        this.debugObject = new THREE.Object3D();
        this.add(this.debugObject);

        this.config = Object.assign({
            trunkHeight: 3,
            attractionPointRadius: 1.8,
            attractionPointCount:40,
            attractionPointHeightOffset: -1,
            attractionVerticalRatio: 1,
            attractionPointArc: Math.PI,
            drawAttractionPoints: false,
            trunkRadialSegments: 5,
            trunkBaseRadius: 0.2,
            trunkTopRadius: 0.1,
            branchSteps: 7,
            branchStepSize: 0.3,
            branchRadialSegments: 5,
            branchSimplifyEpsilon: 0.2,
            leafDepthRatio: 0.2,
            drawFoliage: true,
            drawBranchPoints: false,
            drawBranchFullPath: false,
            drawTrunk: true
        }, params);

        var self = this;
        this.config.trunkHeight = this.config.trunkHeight;
        this.attractionPointRadius = 1.8;
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
            var material = new THREE.MeshLambertMaterial( {color: 0x33ee66,flatShading:true} );
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


    }

    step() {
        var self = this;
        if (this.stage === 0) {
            if (this.config.drawTrunk) {
                var trunkGeometry = new THREE.CylinderGeometry( this.config.trunkTopRadius, this.config.trunkBaseRadius, this.config.trunkHeight, this.config.trunkRadialSegments );
                var trunkMaterial = new THREE.MeshLambertMaterial( {color: 0x996633,flatShading:true} );
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
                    var material = new THREE.MeshLambertMaterial( {color: 0x33ee66,flatShading:true} );
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

var generating = false;
var currentTree;
function generateTree() {
    encodeParams();
    generating = true;
    if (currentTree) {
        scene.remove(currentTree);
    }
    Object.keys(treeStats).forEach(function(s) {
        treeStats[s] = "";
    })


    currentTree = new Tree();
    scene.add(currentTree);
    stepTree();
}

var generateTimeout;
function stepTree() {
    if (currentTree.step()) {
        setTimeout(stepTree,100);
    } else {
        generating = false
        if (guiControls.regenerate) {
            generateTimeout = setTimeout(function() {
                if (guiControls.regenerate) {
                    generateTree()
                }
            },3000)
        }
        var stats = currentTree.stats();
        Object.keys(stats).forEach(function(s) {
            if (treeStats.hasOwnProperty(s)) {
                treeStats[s] = stats[s];
            }
        })
    }
}
generateTree();



function encodeParams() {
    document.location.hash = "#"+btoa(Object.keys(params).map(function(k) {return k[0]+k[Math.floor(k.length*0.25)]+k[Math.floor(k.length*0.75)]+k[k.length-1]+"="+params[k]}).join(":"))
}
function decodeParams(encodedParams) {
    var result = {};
    var paramMap = {}
    Object.keys(params).forEach(function(k) {
        paramMap[k[0]+k[Math.floor(k.length*0.25)]+k[Math.floor(k.length*0.75)]+k[k.length-1]] = k;
    })
    atob(encodedParams).split(":").forEach(function(kv) {
        var parts = kv.split("=");
        var longParam = paramMap[parts[0]];
        if (longParam) {
            if (typeof params[longParam] === "number") {
                parts[1] = parseFloat(parts[1]);
            } else if (typeof params[longParam] === "boolean") {
                parts[1] = parts[1]==="true";
            }
        }
        result[paramMap[parts[0]]] = parts[1];
    })
    return result;

}

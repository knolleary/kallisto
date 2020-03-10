

var gui = new dat.GUI({
    height : 5 * 32 - 1
});

var params = {
    rotateView: true,
    trunkBaseRadius: 0.2,
    trunkTopRadius: 0.1,
    trunkHeight: 3,
    branchRadius: 0.05,
    branchSteps: 6,
    attractionPointRadius: 5,
    attractionPointCount: 50,
    attractionPointHeightOffset: -1,
    drawAttractionPoints: false,
    leafDepthRatio: 0.2
};
gui.add(params,"rotateView").name("Rotate");

var trunkFolder = gui.addFolder('Trunk');
trunkFolder.open();
trunkFolder.add(params,"trunkHeight").name("Height").min(1).max(5).step(0.2);

trunkFolder.add(params,"trunkTopRadius").name("Top Radius").min(0).max(1).step(0.05);
trunkFolder.add(params,"trunkBaseRadius").name("Base Radius").min(0.05).max(1).step(0.05);

var branchFolder = gui.addFolder('Branch');
branchFolder.open();
branchFolder.add(params,"branchRadius").name("Radius").min(0.01).max(0.15).step(0.01);
branchFolder.add(params,"branchSteps").name("Steps").min(1).max(20).step(1);

var leafFolder = gui.addFolder('Foliage');
leafFolder.open();
leafFolder.add(params,"leafDepthRatio").name("Depth/Size Ratio").min(0.02).max(1).step(0.001);

var apFolder = gui.addFolder('Attraction Points');
apFolder.add(params,"drawAttractionPoints").name("Draw");
apFolder.add(params,"attractionPointCount").name("Count").min(1).max(500).step(1);
apFolder.add(params,"attractionPointRadius").name("Radius").min(0.1).max(10).step(0.1);
apFolder.add(params,"attractionPointHeightOffset").name("Height Offset").min(-2).max(2).step(0.2);
apFolder.open();


var scene = new THREE.Scene();
scene.background = new THREE.Color(0xBFD1E5);

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("render").appendChild( renderer.domElement );

var ambientLight = new THREE.AmbientLight( 0xcccccc );
scene.add( ambientLight );

var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;  // default
directionalLight.shadow.mapSize.height = 1024; // default
directionalLight.shadow.camera.near = -100 // default
directionalLight.shadow.camera.far = 100 // default
directionalLight.shadow.camera.top = -100 // default
directionalLight.shadow.camera.right = 100 // default
directionalLight.shadow.camera.left = -100 // default
directionalLight.shadow.camera.bottom = 100 // default
directionalLight.position.set( 1, 1, 5 ).normalize();
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

var animate = function () {
    if (params.rotateView) {
        controls.flyOrbit();
    }
    controls.update();
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
}

animate();



function markPoint(x,y,z,c) {
    var geometry = new THREE.SphereGeometry( 0.05 );
    var material = new THREE.MeshBasicMaterial( {color: c||0xaa0000} );
    var point = new THREE.Mesh( geometry, material );
    point.position.set(x,y,z);
    return point;
}

function markLine(p1,p2,c,r) {
    var curvePath = new THREE.CurvePath();
        curvePath.add(new THREE.LineCurve3(
            p1,
            p2
        ))
        var tg = new THREE.TubeGeometry( curvePath, 2, r , 3, false );
        var material = new THREE.MeshLambertMaterial( { color: c||0xff00ff, flatShading:true } );
        return new THREE.Mesh( tg, material );
}

class Tree extends THREE.Object3D {
    constructor() {
        super();

        this.config = Object.assign({
            trunkHeight: 3,
            attractionPointRadius: 1.8,
            attractionPointCount:40,
            attractionPointHeightOffset: -1,
            drawAttractionPoints: false,
            trunkBaseRadius: 0.2,
            trunkTopRadius: 0.1,
            branchSteps: 7,
            leafDepthRatio: 0.2
        },params);

        var self = this;
        this.config.trunkHeight = this.config.trunkHeight;
        this.attractionPointRadius = 1.8;
        this.leafNodes = new Set();

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
            var elevation = Math.random()*Math.PI//-1.5;

            var x = this.config.attractionPointRadius * Math.cos(elevation) * Math.cos(azimuth);
            var z = this.config.attractionPointRadius * Math.cos(elevation) * Math.sin(azimuth);
            var y = this.config.trunkHeight + this.config.attractionPointHeightOffset + this.config.attractionPointRadius * Math.sin(elevation);
            this.aps.push({x:x,y:y,z:z,dToNearest:1000});
            if (this.config.drawAttractionPoints) {
                this.add(markPoint(x,y,z,0xff9900));
            }
        }

        for (var y = 0;y<this.config.trunkHeight;y += 0.4) {
            var p = {x:0,y:y,z:0,nearest: new Set()};
            this.points.push(p);
            this.calculateDistancesForPointAt(p);
            // if (this.points.length > 1) {
            //     this.add(markLine(this.points[this.points.length-2],this.points[this.points.length-1],0x996633));
            // }
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
            var trunkGeometry = new THREE.CylinderGeometry( this.config.trunkTopRadius, this.config.trunkBaseRadius, this.config.trunkHeight, 5 );
            var trunkMaterial = new THREE.MeshLambertMaterial( {color: 0x996633,flatShading:true} );
            var trunk = new THREE.Mesh( trunkGeometry, trunkMaterial );
            trunk.position.set(0,this.config.trunkHeight/2,0);
            this.add( trunk );
        } else if (this.stage < this.config.branchSteps) {
            this.iterate(this.stage-1);
        } else {
            this.leafNodes.forEach(function(p) {
                var geometry = new THREE.IcosahedronGeometry( p.gen*self.config.leafDepthRatio );
                var material = new THREE.MeshLambertMaterial( {color: 0x33ee66,flatShading:true} );
                var point = new THREE.Mesh( geometry, material );
                point.position.set(p.x,p.y,p.z);
                self.add( point );
            });
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
                delta.normalize().multiplyScalar(0.3).add(p);
                var p2 = {x:delta.x,y:delta.y,z:delta.z,nearest: new Set(),gen:generation};
                newPoints.push({from:p,to:p2});
                self.leafNodes.delete(p);
                self.leafNodes.add(p2);

            }
        })
        newPoints.forEach(function(np) {
            self.points.push(np.to);
            // self.add(markPoint(np.to.x,np.to.y,np.to.z,c));
            self.calculateDistancesForPointAt(np.to);
            self.add(markLine(np.from,np.to,0x996633,self.config.branchRadius));
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

}

var t = new Tree();
scene.add(t);

function stepTree() {
    if (t.step()) {
        setTimeout(stepTree,100);
    } else {
        setTimeout(function() {
            scene.remove(t);
            t = new Tree();
            scene.add(t);
            stepTree();
        },2000)
    }
}
stepTree()

// for (var x = 0; x<4;x++) {
//     for (var y = 0; y<4;y++) {
//         var t = new Tree();
//         t.position.set(4*x+Math.random()-6,0,4*y+Math.random()-6);
//         scene.add(t);
//     }
// }

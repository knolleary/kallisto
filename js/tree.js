
// http://algorithmicbotany.org/papers/colonization.egwnp2007.large.pdf
// https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm

import {TreeObj as Tree} from "./kallisto/objects/landscape/tree2.js"

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
    drawBranchPoints: false,
    drawBranchFullPath: false,
    attractionPointArc: Math.PI/2,
    attractionPointRadius: 5,
    attractionPointCount: 50,
    attractionPointHeightOffset: -1,
    attractionBiasX: 0,
    attractionBiasY: 0,
    attractionBiasZ: 0,
    drawAttractionPoints: false,
    leafDepthRatio: 0.2,
    drawFoliage: true,
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
apFolder.add(params,"attractionPointHeightOffset").name("Height Offset").min(-6).max(6).step(0.2);
apFolder.add(params,"attractionVerticalRatio").name("Vertical Ratio").min(0.1).max(5).step(0.1);
apFolder.add(params,"attractionPointArc").name("Elevation Arc").min(0.1).max(3.1).step(0.1);
apFolder.add(params,"attractionBiasX").name("Bias X").min(-0.4).max(0.4).step(0.01);
apFolder.add(params,"attractionBiasY").name("Bias Y").min(-0.4).max(0.4).step(0.01);
apFolder.add(params,"attractionBiasZ").name("Bias Z").min(-0.4).max(0.4).step(0.01);

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


    currentTree = new Tree(params,true);
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
    console.log(JSON.stringify(params));
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

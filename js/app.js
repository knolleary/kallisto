var hud = document.getElementById("hud");


var clock = new THREE.Clock();

var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfd1e5 );

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


document.addEventListener( 'keydown', onDocumentKeyDown, false );
document.addEventListener( 'keyup', onDocumentKeyUp, false );

var camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var height = 100;
var width = 100;
var clouds = [];
var trees = [];
var treeMeshes = [];
var rocks = [];

var map = ISLAND.generate(scene, {width:width, height: height});



var waterColor = new THREE.Color("#ccddff");
var ww = width*1.5;
var ws = width*1.5;
var wh = height*1.5;
var wsX = Math.floor(width*1.5);
var wsY = Math.floor(height*1.5);
var deltaX = Math.floor((wsX-(width+1))/2);
var deltaY= Math.floor((wsY-(height+1))/2);
var waterGeo = new THREE.PlaneGeometry(ww,wh,wsX,wsY);
waterGeo.vertices.forEach(function(v,i) {
    v.z = Math.random()*0.4-0.2;
})
waterGeo.computeFlatVertexNormals()
const waterPlane = new THREE.Mesh(waterGeo,
    new THREE.MeshLambertMaterial({
        color: waterColor,
        // wireframe: true,
        transparent: true,
        opacity: 0.8,
        flatShading:true,
    })
)
scene.add(waterPlane)



var cloudCount = 6+Math.floor(Math.random()*10);
for (var i=0;i<cloudCount;i++) {
    var cloud = new ISLAND.objects.cloud();
    cloud.position.x = -width*.6 + Math.random()*width*1.2;
    cloud.position.y = -height*.6 + Math.random()*height*1.2;
    cloud.position.z = 35+Math.random()*5;
    cloud.rotation.z = Math.random()*2*Math.PI;
    clouds.push(cloud);
    scene.add( cloud );
}


scene.rotateX( - Math.PI / 2 );


var followPlayer = true;

var controls = new THREE.OrbitControls( camera, renderer.domElement,map);
controls.enableKeys = !followPlayer;
controls.enablePan = !followPlayer;
controls.enableZoom = !followPlayer;
controls.maxPolarAngle = (Math.PI/2)-0.2;
if (!followPlayer) {
    camera.position.set( -36, 85, 63 );
}
camera.position.set( -36, 85, 63 );

var player = new ISLAND.Player(map);
scene.add(player);



var target = new THREE.Vector3();
var direction = new THREE.Vector3();



var animate = function () {
    var delta = clock.getDelta();
    requestAnimationFrame( animate );
    if (followPlayer) {
        // update the transformation of the camera so it has an offset position to the current target
        player.getWorldPosition(controls.target);
        //
        controls.update();
        direction.subVectors( camera.position, controls.target );
        direction.normalize().multiplyScalar( 12 );
        camera.position.copy( direction.add( controls.target ) );
        var camHeight = (camera.position.y - map.getHeightAt(camera.position.x, -camera.position.z));
        if (camHeight < 0.1) {
            controls.rotateUp(0.05);
            controls.update();
        }
    } else {
        controls.update();
    }
    player.update(delta)

    renderer.render( scene, camera );


    hud.innerHTML = "CAM<br>Pos: "+camera.position.x.toFixed(2)+" , "+camera.position.y.toFixed(2)+" , "+camera.position.z.toFixed(2)+"<br>"+
                    "Angle Az: "+THREE.Math.radToDeg(controls.getAzimuthalAngle()).toFixed(2)+" Polar: "+THREE.Math.radToDeg(controls.getPolarAngle()).toFixed(2)+"<br>"+
                    "Cam Height: "+(camera.position.y - map.getHeightAt(camera.position.x, -camera.position.z))+"<br>"+
                    // "rx:"+camera.rotation.x.toFixed(2)+"<br>"+"ry:"+camera.rotation.y.toFixed(2)+"<br>"+"rz:"+camera.rotation.z.toFixed(2)+"<br>"+
                    "Player<br>Pos: "+player.position.x.toFixed(2)+" , "+player.position.y.toFixed(2)+" , "+player.position.z.toFixed(2)+"<br>"+"ph:"+player.dir.toFixed(2)+"<br>"+
                    "pDz:"+player.deltaZ.toFixed(3)+"<br>"

};




animate();


function onDocumentKeyDown( event ) {
    switch(event.code) {
        case "KeyW": case "ArrowUp": player.moveForward = true; break;
        case "KeyS": case "ArrowDown": player.moveBack = true; break;
        case "KeyD": case "ArrowRight": player.turnRight = true; break;
        case "KeyA": case "ArrowLeft": player.turnLeft = true; break;
        case "Space": player.jump(); break;

    }
}
function onDocumentKeyUp( event ) {
    switch(event.code) {
        case "KeyW": case "ArrowUp": player.moveForward = false; break;
        case "KeyS": case "ArrowDown": player.moveBack = false; break;
        case "KeyD": case "ArrowRight": player.turnRight = false; break;
        case "KeyA": case "ArrowLeft": player.turnLeft = false; break;
    }
}

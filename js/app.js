import KALLISTO from "./kallisto.js"
import * as Time from "./utils/time.js"
import * as Status from "./utils/status.js"

KALLISTO.onReady(function() {
    var hud = document.getElementById("hud");
    var clockUI = document.getElementById("clock");

    var stats = new Stats();
    document.getElementById("stats").appendChild( stats.dom );
    stats.dom.style.cssText = 'position:absolute;top:0px;right:0px;';

    var currentTime = 0;

    var CAMERA_DISTANCE_TO_PLAYER = 7;
    var START_IN_MIDDLE = true;
    var CAMERA_STATE = 0;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xBFD1E5);

    var renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );



    // function setSkyColor(pct) {
    //     scene.background.setRGB(
    //         (191*pct)/255,
    //         (209*pct)/255,
    //         (17+pct*212)/255
    //     )
    // }

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
    document.addEventListener( 'wheel', zoom);
    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        skyCamera.left = window.innerWidth / - skyCameraScale;
        skyCamera.right = window.innerWidth / skyCameraScale
        skyCamera.top = window.innerHeight / skyCameraScale
        skyCamera.bottom = window.innerHeight / - skyCameraScale
        skyCamera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }


    var skyCameraScale = 16
    var skyCamera = new THREE.OrthographicCamera( window.innerWidth / - skyCameraScale, window.innerWidth / skyCameraScale, window.innerHeight / skyCameraScale, window.innerHeight / - skyCameraScale, 1, 1000 );
    function zoom(event) {
        if (activeCamera === skyCamera) {
            skyCameraScale += event.deltaY * -0.05;
            // Restrict scale
            skyCameraScale = Math.min(Math.max(5, skyCameraScale), 256);
            skyCamera.left = window.innerWidth / - skyCameraScale;
            skyCamera.right = window.innerWidth / skyCameraScale
            skyCamera.top = window.innerHeight / skyCameraScale
            skyCamera.bottom = window.innerHeight / - skyCameraScale
            skyCamera.updateProjectionMatrix();
        } else {
            CAMERA_DISTANCE_TO_PLAYER += event.deltaY * 0.01;
            CAMERA_DISTANCE_TO_PLAYER = Math.min(Math.max(2, CAMERA_DISTANCE_TO_PLAYER), 15);
        }
    }

    var camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 200 );


    var height = 100;
    var width = 100;

    var island = KALLISTO.Island.generate({width:width, height: height});
    scene.add(island);

    var sea = new KALLISTO.objects.Sea(width, height);
    scene.add(sea);

    var sky = new KALLISTO.objects.Sky(width, height);
    scene.add(sky);


    scene.rotateX( - Math.PI / 2 );

    var followPlayer = true;

    var target = new THREE.Vector3();
    var direction = new THREE.Vector3();

    var player = new KALLISTO.Player(island);

    Status.log("Finding starting cell")

    var beachCells = island.cells.filter(function(c) { return c.ocean && c.beach && c.maxZ-c.minZ < 0.7});
    var startingCell = null;
    var tries = 0;
    if (beachCells.length > 0) {
        while(!startingCell && tries < 50) {
            startingCell = beachCells[Math.floor(Math.random()*beachCells.length)];
            if (startingCell.object) {
                startingCell = null;
            }
        }
    }

    if (!START_IN_MIDDLE && startingCell) {
        player.position.x = startingCell.x;
        player.position.y = startingCell.y;
        player.position.z = startingCell.z;

        player.getWorldPosition(direction);
        direction.normalize().multiplyScalar( CAMERA_DISTANCE_TO_PLAYER/2 ).add(player.position);
        camera.position.set( direction.x, 1, -direction.y );
        // (function() {
        //     var geometry = new THREE.IcosahedronGeometry( 2,1);
        //     var material = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe: true} );
        //     var blob = new THREE.Mesh( geometry, material );
        //     blob.position.set( direction.x,direction.y,2 );
        //     scene.add( blob );
        // })();
        camera.lookAt(player.position.x, player.position.z, -player.position.y);
    }

    scene.add(player);
    Status.log("Finding starting cell - done")


    var controls = new THREE.OrbitControls(camera, renderer.domElement,island);
    controls.enableKeys = !followPlayer;
    controls.enablePan = !followPlayer;
    controls.enableZoom = !followPlayer;
    controls.maxPolarAngle = (Math.PI/2)-0.1;
    if (!followPlayer) {
        camera.position.set( -36, 85, 63 );
    }
    controls.first = true;

    controls.target.set(player.position.x, player.position.z, -player.position.y);

    skyCamera.position.set( 0, 20, 0 );
    skyCamera.lookAt(0,0,0);

    // var cameraHelper = new THREE.Mesh( new THREE.ConeGeometry( 5, 20, 6 ),new THREE.MeshBasicMaterial( {color: 0xffff00} ) );
    // cameraHelper.rotation.x = Math.PI;
    // scene.add( cameraHelper );



    var activeCamera = camera;

    var animate = function () {
        stats.update();
        var delta = Time.delta();

        var now = Time.now();
        if (currentTime != now) {
            clockUI.innerHTML = Time.getTimestamp();
            currentTime = now;
            var phase = Time.getPhaseOfDay();
            var phasePct = Time.getPercentageOfPhase();
            // console.log("phase",phase,phasePct);
            // console.log("AL.intensity",ambientLight.intensity)
            // console.log("DL.intensity",directionalLight.intensity)
            switch(phase) {
                case Time.NIGHT:
                    ambientLight.intensity = 0.1;
                    directionalLight.intensity = 0;
                    // setSkyColor(0);
                    break;
                case Time.DAY:
                    ambientLight.intensity = 1;
                    directionalLight.intensity = 0.3;
                    // setSkyColor(1);
                    break;
                case Time.SUNSET:
                    ambientLight.intensity = 1-(0.9*phasePct);
                    directionalLight.intensity = 0.3*(1-phasePct);
                    // setSkyColor(1-phasePct);
                    break;
                case Time.SUNRISE:
                    ambientLight.intensity = 0.1+0.9*phasePct;
                    directionalLight.intensity = 0.3*phasePct;
                    // setSkyColor(phasePct);
                    break;
                break;
            }
        }
        requestAnimationFrame( animate );
        if (followPlayer) {
            // update the transformation of the camera so it has an offset position to the current target
            controls.target.set(player.position.x, player.position.z+1, -player.position.y);
            //
            controls.update();
            direction.subVectors( camera.position, controls.target );
            direction.normalize().multiplyScalar( CAMERA_DISTANCE_TO_PLAYER );
            camera.position.copy( direction.add( controls.target ) );

            var camHeight = (camera.position.y - island.getHeightAt(camera.position.x, -camera.position.z));
            if (camHeight < 0.1) {
                controls.rotateUp(0.05);
                controls.update();
            }
        } else {
            controls.update();
        }



        sea.update(Time.getElapsedTime());
        sky.update(camera.position, controls.target)
        island.update(delta);
        player.update(delta)
        renderer.render( scene, activeCamera );

        // hud.innerHTML = "CAM<br>Pos: "+camera.position.x.toFixed(2)+" , "+camera.position.y.toFixed(2)+" , "+camera.position.z.toFixed(2)+"<br>"+
        //                 // "CAM Helper<br>Pos: "+cameraHelper.position.x.toFixed(2)+" , "+cameraHelper.position.y.toFixed(2)+" , "+cameraHelper.position.z.toFixed(2)+"<br>"+
        //                 // "Angle Az: "+controls.getAzimuthalAngle().toFixed(2)+" Polar: "+controls.getPolarAngle().toFixed(2)+"<br>"+
        //                 // "Cam Height: "+(camera.position.y - island.getHeightAt(camera.position.x, -camera.position.z))+"<br>"+
        //                 // // "rx:"+camera.rotation.x.toFixed(2)+"<br>"+"ry:"+camera.rotation.y.toFixed(2)+"<br>"+"rz:"+camera.rotation.z.toFixed(2)+"<br>"+
        //                 "Player<br>Pos: "+player.position.x.toFixed(2)+" , "+player.position.y.toFixed(2)+" , "+player.position.z.toFixed(2)+"<br>"+"ph:"+player.heading.toFixed(2)+"<br>"+
        //                 ""
        //                 // "pDz:"+player.dz.toFixed(3)+"<br>"

    };

    Status.log("Go!")


    animate();


    function onDocumentKeyDown( event ) {
        switch(event.code) {
            case "ShiftLeft": case "ShiftRight": player.running = true; break;
            case "KeyW": case "ArrowUp": player.moveForward = true; break;
            case "KeyS": case "ArrowDown": player.moveBack = true; break;
            case "KeyD": case "ArrowRight": player.turnRight = true; break;
            case "KeyA": case "ArrowLeft": player.turnLeft = true; break;
            case "KeyE": player.interact(); break;
            case "Space": player.jump(true); break;
            case "KeyC":
                CAMERA_STATE = (CAMERA_STATE+1)%3;
                if (CAMERA_STATE === 0) {
                    activeCamera = camera;
                } else if (CAMERA_STATE === 1) {
                    activeCamera = skyCamera;
                    skyCamera.position.set( 0, 20, 0 );
                    skyCamera.lookAt(0,0,0);
                } else if (CAMERA_STATE === 2) {
                    activeCamera = skyCamera;
                    skyCamera.position.set( 100, 0, 0 );
                    skyCamera.lookAt(0,0,0);
                }
        }
    }
    function onDocumentKeyUp( event ) {
        switch(event.code) {
            case "ShiftLeft": case "ShiftRight": player.running = false; break;
            case "KeyW": case "ArrowUp": player.moveForward = false; break;
            case "KeyS": case "ArrowDown": player.moveBack = false; break;
            case "KeyD": case "ArrowRight": player.turnRight = false; break;
            case "KeyA": case "ArrowLeft": player.turnLeft = false; break;
            case "Space": player.jump(false); break;
        }
    }


});

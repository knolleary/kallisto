import { Cloud } from "./cloud.js"

export class Sky extends THREE.Object3D {
    constructor(width, height) {
        super();

        this.direction = new THREE.Vector3();

        var skyGeo = new THREE.PlaneGeometry( 2000, 250, 1, 2 );
        var skyC1 = new THREE.Color('#2980B9');
        var skyC2 = new THREE.Color('#6DD5FA');
        var skyC3 = new THREE.Color('#FFFFFF');
        skyGeo.faces[0].vertexColors = [skyC1,skyC2,skyC1]
        skyGeo.faces[1].vertexColors = [skyC2,skyC2,skyC1]
        skyGeo.faces[2].vertexColors = [skyC2,skyC3,skyC2]
        skyGeo.faces[3].vertexColors = [skyC3,skyC3,skyC2]
        this.skyPlane = new THREE.Mesh(
            skyGeo,
            new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors})
        )

        this.add( this.skyPlane );

        var geometry = new THREE.CircleGeometry( 5, 64 );
        var material = new THREE.MeshLambertMaterial( { color: 0xffff00 , emissive: 0xffff00, emissiveIntensity:1} );
        this.sunMesh = new THREE.Mesh( geometry, material );
        this.add( this.sunMesh );
        this.sunMesh.position.set(30,30,10).normalize().multiplyScalar( 99 );

        this.clouds = [];
        var cloudCount = 6+Math.floor(Math.random()*10);
        for (var i=0;i<cloudCount;i++) {
            var cloud = new Cloud();
            cloud.position.x = -width*.6 + Math.random()*width*1.2;
            cloud.position.y = -height*.6 + Math.random()*height*1.2;
            cloud.position.z = 20+Math.random()*5;
            cloud.rotation.z = Math.random()*2*Math.PI;
            this.add( cloud );
            this.clouds.push(cloud);
        }


    }
    update(cameraPos,playerPos) {
        this.direction.subVectors( cameraPos, playerPos );
        this.direction.y = 0;
        this.direction.normalize().multiplyScalar( -100 );
        this.skyPlane.position.set(this.direction.x,-this.direction.z,50);
        this.skyPlane.lookAt(0,0,0);

        this.sunMesh.lookAt(cameraPos);
    }
}

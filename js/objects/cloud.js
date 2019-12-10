(function() {

class Cloud extends ISLAND.objects.BaseMesh {
    constructor() {
        super(
            new THREE.IcosahedronGeometry( 1+Math.random()*3 ),
            new THREE.MeshLambertMaterial( {color: 0xffffff, flatShading:true} )
        );
    }
}

ISLAND.objects.cloud = Cloud;

})();

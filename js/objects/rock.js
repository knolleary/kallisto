(function() {
    var ROCK = new THREE.Color(0x999999);
    class Rock extends ISLAND.objects.BaseObject {
        constructor(cell,big) {
            var geoRadius = (big?2:0.2)+(0.5*Math.random());
            super(
                "rock",
                cell,
                new THREE.IcosahedronGeometry( geoRadius ),
                new THREE.MeshLambertMaterial( {color: 0x999999, flatShading:true} )
            );
            this.rotation.z = Math.random()*2*Math.PI;
            this.radius = geoRadius-0.1;
            this.height = geoRadius-0.1;
        }
    }

    ISLAND.objects.rock = Rock;

})();

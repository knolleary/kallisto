(function() {
    var WATER = new THREE.Color(0xadd8e6 );//0xccddff);

    class RiverGeometry extends THREE.Geometry {
        constructor(verts,faces) {
            super();
            var that = this;
            verts.forEach(function(v) {
                that.vertices.push(new THREE.Vector3( v.x, v.y,v.z-0.2));
            })
            faces.forEach(function(f) {
                that.faces.push(new THREE.Face3(f[0],f[1],f[2]))
            })
        }
    }

    class River extends THREE.Mesh {
        constructor(verts,faces) {
            var geo = new RiverGeometry(verts,faces);
            super(
                geo,
                new THREE.MeshLambertMaterial({
                    color: WATER,
                    transparent: true,
                    opacity: 0.8,
                    flatShading:true,
                    side:THREE.DoubleSide

                })
            );

            var edges = new THREE.EdgesGeometry( geo );
            this.lines = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) );
        }
    }

    ISLAND.objects.river = River;
    
})();

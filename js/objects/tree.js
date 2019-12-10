(function() {
    var TRUNK = new THREE.Color(0x996633);
    var LEAVES = new THREE.Color(0x5C9031)
    class SimpleTreeGeometry extends THREE.Geometry {
        constructor() {
            super();
            this.type = "Tree1"
            var trunk = new THREE.ConeGeometry( 0.2, 1.8, 5 );
            trunk.rotateX(  Math.PI / 2 );
            trunk.translate(0,0,-0.2);
            trunk.faces.forEach(function(f) {
                f.color = TRUNK;
            })
            var leaves = new THREE.IcosahedronGeometry( 0.8 );
            leaves.translate(0,0,0.8);
            leaves.faces.forEach(function(f) {
                f.color = LEAVES;
            })

            this.merge(trunk);
            this.merge(leaves);
            this.mergeVertices(); // optional
            this.translate(0,0,0.8);
        }
    }

    class AnotherTreeGeometry extends THREE.Geometry {
        constructor() {
            super();
            this.type = "Tree2"
            var trunk = new THREE.ConeGeometry( 0.2, 1.8, 5 );
            trunk.rotateX(  Math.PI / 2 );
            trunk.translate(0,0,-0.2);
            trunk.faces.forEach(function(f) {
                f.color = TRUNK;
            })
            this.merge(trunk);
            for (var scale = 0; scale < 3; scale++) {
                var leaves = new THREE.IcosahedronGeometry( 0.6 - (scale*0.2) );
                leaves.vertices.forEach(function(v) {
                    v.z = v.z*2;
                });
                leaves.rotateZ(scale);
                leaves.translate(0,0,(1*scale));
                leaves.faces.forEach(function(f) {
                    f.color = LEAVES;
                })
                this.merge(leaves);
            }
            this.mergeVertices(); // optional
            this.translate(0,0,0.8);
        }
    }



    class Tree1 extends ISLAND.objects.BaseObject {
        constructor(cell) {
            super(
                "tree1",
                cell,
                new SimpleTreeGeometry(),
            );
            this.rotation.z = Math.random()*2*Math.PI;
            this.radius = 0.08;
            this.height = 1;
        }
    }
    class Tree2 extends ISLAND.objects.BaseObject {
        constructor(cell) {
            super(
                "tree2",
                cell,
                new AnotherTreeGeometry(),
            );
            this.rotation.z = Math.random()*2*Math.PI;
            this.radius = 0.4;
            this.height = 1;
        }
    }

    ISLAND.objects.tree1 = Tree1;
    ISLAND.objects.tree2 = Tree2;


})();

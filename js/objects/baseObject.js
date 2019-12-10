(function() {
    class BaseMesh extends THREE.Mesh {
        constructor(geometry,material) {
            super(
                geometry,
                material || new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors, flatShading:true}  )
            );
            this.castShadow = true;
        }
    }
    class BaseObject extends BaseMesh {
        constructor(type,cell, geometry, material) {
            super(geometry, material);
            this.geometry = geometry;
            this.type = type;
            this.cell = cell;
            this.position.x = cell.x;
            this.position.y = cell.y;
            this.position.z = cell.z;
            this.geometry.computeBoundingBox();
        }

        highlight(on) {
            this.cell.highlight(on)
        }
    }

    ISLAND.objects.BaseMesh = BaseMesh;
    ISLAND.objects.BaseObject = BaseObject;

})();

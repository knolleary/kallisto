export class BaseMesh extends THREE.Mesh {
    constructor(geometry,material) {
        super(
            geometry,
            material || new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors, flatShading:true}  )
        );
        this.castShadow = true;
    }
}
export class BaseObject extends THREE.Object3D {
    constructor(type) {
        super();
        this.type = type;
    }

    setCell(cell) {
        this.cell = cell;
        this.position.x = cell.x;
        this.position.y = cell.y;
        this.position.z = cell.z;
    }
    highlight(on) {
        if (this.cell) {
            this.cell.highlight(on)
        }
    }
}

/**
 * BaseObject extends THREE.Object3D
 *  - type
 *
 * StaticObject extends BaseObject
 *  - cell
 *
 */

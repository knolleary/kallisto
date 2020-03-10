import {BaseObject} from "../baseObject.js"
import {generateColor} from "../../utils/color.js"
import * as Time from "../../utils/time.js"

export var GrassShader;
var GrassMaterial = new THREE.MeshLambertMaterial({
    vertexColors: THREE.VertexColors, //color: 0x00ff00,
    flatShading:true,
    onBeforeCompile: function(shader) {
        shader.uniforms.time = { value: 0 }
        shader.vertexShader = `
        uniform float time;
        attribute float grassVIndex;
        attribute float density;
        ` + shader.vertexShader

        const token = '#include <begin_vertex>'
        const customTransform = `
        vec3 transformed = vec3(position);
        if (grassVIndex == 1.0) {
            float freq = 2.0;
            float amp = 0.1*(0.5-cos(density)/2.0);
            float angle = (time + position.x)*freq;
            transformed.z += sin(angle)*amp;
        }
        transformed.y += -0.4*(1.0-density);
        `
        shader.vertexShader = shader.vertexShader.replace(token,customTransform)
        GrassShader = shader;
    }
})

var HIGHLIGHT_COL = new THREE.Color('#ffff00')
var GRASS_PALETTE = [
    // new THREE.Color('#336600'),
    // new THREE.Color('#417410'),
    // new THREE.Color('#4E8221'),
    new THREE.Color('#5C9031'),
    new THREE.Color('#6A9E42'),
    new THREE.Color('#77AC52'),
    new THREE.Color('#85B963'),
    new THREE.Color('#92C773'),
    new THREE.Color('#A0D584'),
    new THREE.Color('#AEE394'),
    // new THREE.Color('#BBF1A5'),
    // new THREE.Color('#C9FFB5'),
    // new THREE.Color('#D9FFC5'),
    // new THREE.Color('#E9FFD5'),
    // new THREE.Color('#F9FFE5')
]


var GRASS = new THREE.Color(0x999999);

export class GrassPatch extends BaseObject {

    constructor(cells,island) {
        super("grassPatch");
        this.needsUpdate = false;
        this.lastUpdate = 0;
        var geos = [];
        this.height = 0;
        this.setCell(cells[0])
        var ox = cells[0].x;
        var oy = cells[0].y;
        var oz = cells[0].z;

        var bladeVertexCount = 26;

        this.cells = {};
        var self = this;
        var randoCol = new THREE.Color(generateColor());
        cells.forEach(cell => {
            // Create a proxy object... bit hacky...
            cell.object = {
                height: 0,
                type: "grassPatch",
                position: {
                    x: cell.x,
                    y: cell.y,
                    z: cell.z
                },
                cycle: function() {
                    self.cycle(cell);
                }
            }
            // cell.face0.baseColor = randoCol;
            // cell.face1.baseColor = randoCol;
            // cell.face0.color.set(cell.face0.baseColor);
            // cell.face1.color.set(cell.face1.baseColor);
            var bladeCount = 0;

            var cdx = cell.x - ox;
            var cdy = cell.y - oy;
            var cdz = cell.z - oz;


            this.cells[cell.i] = {
                start: geos.length*bladeVertexCount,
                density: Math.random()
            }

            var positionHelper = new THREE.Object3D();
            var x = 0,y=0;

            for (var x=-0.8;x<1;x+=0.2) {
                for (var y=-0.8;y<1;y+=0.2) {
                    var dd = x*x+y*y;
                    var highlightBlade = false;
                    if (dd >= 0.5) {//} || dd > 0.5 && Math.random() < 0.2) {
                        var neighbour1 = cell.getNeighbour(Math.sign(x),0);
                        var neighbour2 = cell.getNeighbour(0,Math.sign(y));
                        var neighbour3 = cell.getNeighbour(Math.sign(x),Math.sign(y));
                        if (
                            (!neighbour1.grass&&!neighbour2.grass&&!neighbour3.grass) ||
                            (!neighbour1.grass && Math.abs(x) > 0.6 && Math.random()<0.5) ||
                            (!neighbour2.grass && Math.abs(y) > 0.6 && Math.random()<0.5)
                        ) {
                            highlightBlade = true;
                            // neighbour.highlight(true);
                            continue;
                        }
                    }

                    var colIndex = Math.floor(Math.random()*(GRASS_PALETTE.length-2));

                    var grassBlade = new THREE.CylinderBufferGeometry(0.01,0.03,0.2+Math.random()*0.4,3,2);
                    grassBlade.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( grassBlade.attributes.position.count * 3 ), 3 ) );

                    var vIndex = new Float32Array( grassBlade.attributes.position.count );
                    for (var i=0;i<vIndex.length;i++) {
                        vIndex[i] = (i<4 || (i>=12 && i<19))?1.0:0.0;
                        var col = GRASS_PALETTE[colIndex];
                        if (i < vIndex.length/2) {
                            col = GRASS_PALETTE[colIndex+2];
                        }
                        if (highlightBlade) {
                            col = HIGHLIGHT_COL;
                        }
                        grassBlade.attributes.color.setXYZ(i,col.r,col.g,col.b);
                    }
                    grassBlade.setAttribute( 'grassVIndex', new THREE.BufferAttribute( vIndex, 1 ) );

                    var px = ((Math.random()*0.3-0.15)+x)*0.5;
                    var py = ((Math.random()*0.3-0.15)+y)*0.5;

                    positionHelper.position.x = cdx+px;
                    positionHelper.position.z = -cdy+py;

                    positionHelper.position.y = (island.getHeightAt(cell.x + px, cell.y - py))-oz;
                    positionHelper.rotation.x = 0.4*Math.random()-0.2;
                    positionHelper.rotation.z = 0.4*Math.random()-0.2;

                    positionHelper.updateWorldMatrix(true,false);
                    grassBlade.applyMatrix(positionHelper.matrixWorld);

                    var dx = 0;//Math.random()*0.2-0.1
                    var dy = 0;//Math.random()*0.2-0.1
                    // top 0-11
                    // middle 12-23
                    // bottom 24-35
                    // topCap 36-56
                    // bottomCap 57-78
                    for (var i = 0;i<12;i+=3) {
                        grassBlade.attributes.position.array[i]     += dx;
                        grassBlade.attributes.position.array[i+1]   += 0;
                        grassBlade.attributes.position.array[i+2]   += dy;
                    }
                    for (var i = 36; i < 57;i+=3) {
                        grassBlade.attributes.position.array[i]     += dx;
                        grassBlade.attributes.position.array[i+1]   += 0;
                        grassBlade.attributes.position.array[i+2]   += dy;

                    }
                    geos.push(grassBlade);
                    bladeCount++;
                }
            }


            this.cells[cell.i].count = bladeCount*bladeVertexCount;


        });


        this.geometry = THREE.BufferGeometryUtils.mergeBufferGeometries( geos, false);
        var densities = new Float32Array(this.geometry.attributes.position.count);
        var den = 0;

        cells.forEach(cell => {
            for (var i = this.cells[cell.i].start; i<this.cells[cell.i].start+this.cells[cell.i].count;i++) {
                densities[i] = this.cells[cell.i].density;
            }
        })
        this.needsUpdate = true;

        this.geometry.setAttribute( 'density', new THREE.BufferAttribute(densities,1));

        // console.log("gl",geos.length,"mgl",mergedGeometry.attributes.position.count,"vpc",mergedGeometry.attributes.position.count/geos.length)

        var grass = new THREE.Mesh(this.geometry,GrassMaterial);

        grass.rotation.x = Math.PI/2;
        grass.position.z += 0.2;
        this.add(grass);
        // var g = new Grass(cell,island);
        // this.add(g);
        // cell.object = g;
    }
    update(delta) {
        if (this.needsUpdate) {
            if (this.lastUpdate > 0.5) {
                this.lastUpdate = 0;
                var stillNeedsUpdate = false;
                for (var id in this.cells) {
                    if (this.cells.hasOwnProperty(id)) {
                        if (this.cells[id].density < 1.0) {
                            this.cells[id].density += 0.0125;
                            if (this.cells[id].density > 1.0) {
                                this.cells[id].density = 1;
                            }
                            var densities = this.geometry.attributes.density.array;
                            for (var i = this.cells[id].start; i<this.cells[id].start+this.cells[id].count;i++) {
                                densities[i] = this.cells[id].density;
                            }
                            this.geometry.attributes.density.needsUpdate = true;
                            if (this.cells[id].density < 1.0) {
                                stillNeedsUpdate = true;
                            }
                        }
                    }
                }
                this.needsUpdate = stillNeedsUpdate;
            } else {
                this.lastUpdate += delta;
            }
        }
    }
    cycle(cell) {
        if (this.cells[cell.i]) {
            if (this.cells[cell.i].density > 0) {
                var newValue = Math.max(0,this.cells[cell.i].density-0.2);
                this.cells[cell.i].density = newValue;
                var densities = this.geometry.attributes.density.array;
                for (var i = this.cells[cell.i].start; i<this.cells[cell.i].start+this.cells[cell.i].count;i++) {
                    densities[i] = newValue;
                }
                this.geometry.attributes.density.needsUpdate = true;
                this.needsUpdate = true;
            }
        }

    }


}

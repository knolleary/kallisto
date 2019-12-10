// https://raw.githubusercontent.com/josephg/noisejs/master/perlin.js
// http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/

var ISLAND = (function() {

    function makeTextTexture(str) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = 64;
        ctx.canvas.height = 64;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFF';
        ctx.fillText(str, ctx.canvas.width / 2, ctx.canvas.height / 2);
        return new THREE.CanvasTexture(ctx.canvas);
    }
    function makeLabel(text) {
        const noteTexture = makeTextTexture(text);
        const noteMaterial = new THREE.SpriteMaterial({
            color: new THREE.Color().setHSL(Math.random()*1, 1, 0.5),
            map: noteTexture,
            side: THREE.DoubleSide,
            transparent: true,
        });
        const note = new THREE.Sprite(noteMaterial);
        return note;
    }




    var WATER_COLOR = new THREE.Color("#ccddff");
    var CLIFF_COLOR = new THREE.Color("#dddd99");
    var HIGHLIGHT_COLOR = new THREE.Color('#ff0000');
    var SAND_COLOR = new THREE.Color("#eeeeaa");
    var LAND_PALETTE = [
        new THREE.Color('#336600'),
        new THREE.Color('#417410'),
        new THREE.Color('#4E8221'),
        new THREE.Color('#5C9031'),
        new THREE.Color('#6A9E42'),
        new THREE.Color('#77AC52'),
        new THREE.Color('#85B963'),
        new THREE.Color('#92C773'),
        new THREE.Color('#A0D584'),
        new THREE.Color('#AEE394'),
        new THREE.Color('#BBF1A5'),
        new THREE.Color('#C9FFB5'),
        new THREE.Color('#D9FFC5'),
        new THREE.Color('#E9FFD5'),
        new THREE.Color('#F9FFE5')
    ]


    noise.seed(Math.random());
    var fbm_noise = function(amplitudes, nx, ny) {
        let sum = 0, sumOfAmplitudes = 0;
        for (let octave = 0; octave < amplitudes.length; octave++) {
            let frequency = 1 << octave;
            sum += amplitudes[octave] * noise.simplex2(nx * frequency, ny * frequency, octave);
            sumOfAmplitudes += amplitudes[octave];
        }
        return sum / sumOfAmplitudes;
    };
    var mix = function(a, b, t) {
        return a * (1.0-t) + b * t;
    };

    function generate(scene, opts) {
        var m = new Map(scene,opts);
        m.populate();
        return m;
    }

    class Map {
        constructor(scene, opts) {
            var self = this;
            this.scene = scene;
            this.options = Object.assign({},{
                width: 100,
                height: 100,
                islandShape: {
                    round: 0.45,
                    inflate:0.35,
                    amplitudes: [1/2, 1/4, 1/8, 1/16]
                }
            },opts)
            this.midHeight = (this.options.height) / 2;
            this.midWidth = (this.options.width) / 2;

            this.vertices = [];
            this.cells = [];
            this.geometry = new THREE.Geometry();
            this.geometry.colorsNeedUpdate = true
            this.geometry.verticesNeedUpdate = true


            for (var y = 0; y < this.options.height; y++) {
                for (var x = 0; x < this.options.width; x++) {

                    var nx = (x - this.midWidth) / this.midWidth;
                    var ny = (y - this.midHeight) / this.midHeight;
                    var distance = Math.max(Math.abs(nx), Math.abs(ny));
                    var n = fbm_noise(this.options.islandShape.amplitudes, nx, ny);
                    n = mix(n, 0.5, this.options.islandShape.round);
                    var v = new THREE.Vector3(
                        x-this.midWidth,
                        this.options.height-y-this.midHeight-1,
                        3+16*(n - (1.0 - this.options.islandShape.inflate) * distance*distance)
                    );
                    v.n = [];

                    if (x > 0) {
                        v.n.push(this.vertices[y*this.options.height+x-1])
                        this.vertices[y*this.options.height+x-1].n.push(v);
                    }
                    if (y > 0) {
                        v.n.push(this.vertices[(y-1)*this.options.height+x])
                        this.vertices[(y-1)*this.options.height+x].n.push(v);
                    }
                    this.geometry.vertices.push(v);
                    this.vertices.push(v);

                    if (x > 0 && y > 0) {
                        var cell = {
                            i: this.cells.length,
                            x:0,y:0,z:0,
                            minZ: 1000, maxZ: -1000,
                            corners: [
                                this.vertices[(y-1)*this.options.height+x-1],
                                this.vertices[(y-1)*this.options.height+x],
                                this.vertices[y*this.options.height+x],
                                this.vertices[y*this.options.height+x-1],
                            ],
                            face0: new THREE.Face3(
                                (y-1)*this.options.height+x-1, // c0
                                y*this.options.height+x-1,     // c3
                                (y-1)*this.options.height+x    // c1
                            ),
                            face1: new THREE.Face3(
                                y*this.options.height+x-1,     // c3
                                y*this.options.height+x,       // c2
                                (y-1)*this.options.height+x    // c1
                            ),
                            highlight: function(v) {
                                if (v) {
                                    this.face0.color.set(HIGHLIGHT_COLOR);
                                    this.face1.color.set(HIGHLIGHT_COLOR);
                                    self.geometry.colorsNeedUpdate = true
                                }
                            }
                        }

                        cell.corners.reduce(function(cell, v) {
                            cell.x += v.x;
                            cell.y += v.y;
                            cell.z += v.z;
                            cell.minZ = Math.min(cell.minZ,v.z);
                            cell.maxX = Math.max(cell.maxZ,v.z);
                            return cell;
                        },cell);
                        cell.x /= 4;
                        cell.y /= 4;
                        cell.z /= 4;

                        this.vertices[(y-1)*this.options.height+x].c = cell;
                        // this.vertices[(y-1)*this.options.height+x].c.push(cell);
                        // this.vertices[y*this.options.height+x].c.push(cell);
                        // this.vertices[y*this.options.height+x-1].c.push(cell);


                        if (x === 1) {
                            if (cell.corners[0].z > 0) {
                                cell.corners[0].z = -0.3;
                                cell.cliff = true;
                            }
                            if (cell.corners[3].z > 0) {
                                cell.corners[3].z = -0.3;
                                cell.cliff = true;
                            }
                        }
                        if (x === this.options.width - 1) {
                            if (cell.corners[1].z > 0) {
                                cell.corners[1].z = -0.3;
                                cell.cliff = true;
                            }
                            if (cell.corners[2].z > 0) {
                                cell.corners[2].z = -0.3;
                                cell.cliff = true;
                            }
                        }
                        if (y === 1) {
                            if (cell.corners[0].z > 0) {
                                cell.corners[0].z = -0.3;
                                cell.cliff = true;
                            }
                            if (cell.corners[1].z > 0) {
                                cell.corners[1].z = -0.3;
                                cell.cliff = true;
                            }
                        }
                        if (y === this.options.height - 1) {
                            if (cell.corners[2].z > 0) {
                                cell.corners[2].z = -0.3;
                                cell.cliff = true;
                            }
                            if (cell.corners[3].z > 0) {
                                cell.corners[3].z = -0.3;
                                cell.cliff = true;
                            }
                        }
                        if (cell.cliff) {
                            cell.face0.color.set(CLIFF_COLOR)
                            cell.face1.color.set(CLIFF_COLOR)
                        } else if (cell.minZ < 0) {
                            // Coastline and underwater
                            cell.face0.color.set(SAND_COLOR)
                            cell.face1.color.set(SAND_COLOR)
                        } else {
                            cell.face0.color.set(LAND_PALETTE[Math.max(0, Math.floor(Math.abs(cell.minZ)+1)+Math.floor(Math.random()*2)-1 )])
                            cell.face1.color.set(LAND_PALETTE[Math.max(0, Math.floor(Math.abs(cell.minZ)+1)+Math.floor(Math.random()*2)-1 )])
                        }


                        this.cells.push(cell);
                        this.geometry.faces.push(cell.face0);
                        this.geometry.faces.push(cell.face1);
                    }
                }
            }
            this.geometry.computeFlatVertexNormals()
            this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshLambertMaterial({
                // wireframe:true,
                vertexColors: THREE.VertexColors,
                //required for flat shading
                // flatShading:true,
                side: THREE.DoubleSide,
            }))
            this.mesh.receiveShadow = true;

            scene.add(this.mesh);



            this.BLOB_A = new ISLAND.objects.BaseMesh(
                new THREE.IcosahedronGeometry( 0.2 ),
                new THREE.MeshLambertMaterial( {color: 0xff0000, flatShading:true} )
            );
            scene.add(this.BLOB_A);
            this.BLOB_B = new ISLAND.objects.BaseMesh(
                new THREE.IcosahedronGeometry( 0.2 ),
                new THREE.MeshLambertMaterial( {color: 0x00ff00, flatShading:true} )
            );
            scene.add(this.BLOB_B);

            this.BLOBS = [];
            for (var i=0;i<4;i++) {
                this.BLOBS[i] = new ISLAND.objects.BaseMesh(
                    new THREE.IcosahedronGeometry( 0.1 ),
                    new THREE.MeshLambertMaterial( {color: 0x0000ff, flatShading:true} )
                );
                scene.add(this.BLOBS[i]);
            }

            for (var i=4;i<8;i++) {
                this.BLOBS[i] = new ISLAND.objects.BaseMesh(
                    new THREE.IcosahedronGeometry( 0.1 ),
                    new THREE.MeshLambertMaterial( {color: 0xff00ff, flatShading:true} )
                );
                scene.add(this.BLOBS[i]);
            }


        }
        populate() {
            this.rivers = [];
            var waterCells = [];
            this.trees = [];
            this.rocks = [];
            var that = this;
            var riverId = 100;
            this.cells.forEach(function(cell) {
                if (cell.cliff) {
                    return
                }
                if (cell.z > 8 && Math.random() < 0.005) {
                    cell.water = true;
                    that.rivers.push(cell);
                    waterCells.push(cell);
                }

                if (!cell.water && cell.z > 2 && cell.z < 6  && Math.random()<0.05) {
                    cell.object =  Math.random()<0.5?new ISLAND.objects.tree1(cell):new ISLAND.objects.tree2(cell);
                    that.trees.push(cell.object);
                } else if (
                    (cell.z >=0 && cell.z < 1 && Math.random()<0.08) ||
                    (cell.z > 1 && Math.random()<0.02)
                ) {
                    cell.object = new ISLAND.objects.rock(cell);
                    that.rocks.push(cell.object);
                }

                if (cell.object) {
                    scene.add(cell.object);
                }
            });

            while(waterCells.length > 0){
                var waterVerts = [];
                var c = waterCells.shift();
                if (c.object) continue;
                var height = c.z;
                var currentVert, nextVert,lastVert;
                // Find the lowest vertex
                c.corners.forEach(function(v,i) {
                    if (i===0 || v.z < currentVert.z) {
                        currentVert = v;
                    }
                })
                var l = 0;
                var river = [];
                riverId++;
                // console.log("--------")
                // console.log("river",riverId);
                var faces = [];
                var riverVerts = {};
                var currentLine = null;
                var lastAv,lastBv;
                while (currentVert !== null && l < 30) {
                    l++
                    if (!currentVert.water) {
                        currentVert.water = true;
                        currentVert.waterLength = waterVerts.length;
                        waterVerts.push(currentVert);
                        var neighbours = [];
                        currentVert.n.forEach(function(nv,i) {
                            if (i === 0 || nv.z < nextVert.z) {
                                nextVert = nv;
                            }
                        });
                        var addedVerts = [];
                        currentVert.n.forEach(function(nv) {
                            if (nv !== nextVert && nv !== lastVert) {
                                var key = nv.x+":"+nv.y;
                                if (!riverVerts[key]) {
                                    var rv = {x:nv.x, y:nv.y, z:nv.z-0.08};
                                    if (
                                        (currentVert.x === nv.x && currentVert.y < nv.y) ||
                                        (currentVert.y === nv.y && currentVert.x < nv.x)
                                    ) {
                                        rv.side = -1;
                                    } else {
                                        rv.side = 1;
                                    }
                                    // if (lastVert) {
                                    //     rv.distance = ((currentVert.y-lastVert.y)*nv.x - (currentVert.x-lastVert.x)*nv.y + currentVert.x*lastVert.y - currentVert.y*lastVert.x).toFixed(1);
                                    // }
                                    river.push(rv);
                                    addedVerts.push(river.length-1);
                                    riverVerts[key] = river.length-1;
                                } else if (lastVert) {
                                    addedVerts.push(riverVerts[key])
                                    // riverVerts[key].distance += ","+((currentVert.y-lastVert.y)*nv.x - (currentVert.x-lastVert.x)*nv.y + currentVert.x*lastVert.y - currentVert.y*lastVert.x).toFixed(2);

                                }
                            }
                        })
                        if (river.length === 3) {
                            for (var h=0;h<3;h++) {
                                var Ai = h, Bi = (h+1)%3, Ci = (h+2)%3;
                                var A = river[Ai];
                                var B = river[Bi];
                                var C = river[Ci];
                                var D = river[3];
                                if (B.x === C.x || B.y === C.y) {
                                    faces.push([Ai,Bi,Ci])
// console.log(faces.length-1,"A",faces[faces.length-1])
                                    lastAv = Bi;
                                    lastBv = Ci;
                                    // this.faces.push(new THREE.Face3(Bi,Ci,3))
                                    // this.faces.push(new THREE.Face3(
                                    //     B.x!==D.x && B.y!==D.y ? Bi: Ci,
                                    //     3,4
                                    // ))
                                    // startV = 3;
                                    break;
                                }
                            }
                        } else if (river.length > 3) {
                            var vA = river[addedVerts[0]];
                            var vB = river[addedVerts[1]];
                            if (vA.x === vB.x || vA.y === vB.y) {
                                // Straight line
                                // 3 5 7
                                faces.push([lastAv,lastBv,addedVerts[0]])
// console.log(faces.length-1,"B",faces[faces.length-1])
                                // faces.push([lastBv,river.length-2,river.length-1])
                                // 5 7 3
                                faces.push([
                                    river[lastAv].x!==vA.x && river[lastAv].y!==vA.y ? lastAv: lastBv,
                                    addedVerts[0],
                                    addedVerts[1]
                                ])
// console.log(faces.length-1,"C",faces[faces.length-1])


                                lastAv = addedVerts[0];
                                lastBv = addedVerts[1];
                            } else {
                                if (vB.x === lastAv.x || vB.y === lastAv.y || vB.x === lastBv.x || vB.y === lastBv.y ) {
                                    // swap vA and vB and vB comes 'first'
                                    var vA = river[addedVerts[1]];
                                    var vB = river[addedVerts[0]];
                                }
                                var innerVertex = river[lastAv].x!==vA.x && river[lastAv].y!==vA.y ? lastAv: lastBv;
                                // this.markVertex(scene, {x:river[innerVertex].x,y:river[innerVertex].y,z:river[innerVertex].z+1}, 0x0099ff, "in",0.4)

                                var outerVertex = river[lastAv].x!==vA.x && river[lastAv].y!==vA.y ? lastBv: lastAv;
                                // this.markVertex(scene, {x:river[outerVertex].x,y:river[outerVertex].y,z:river[outerVertex].z+1}, 0x0099ff, "out")

                                var nextOuter = river[outerVertex].x === vA.x || river[outerVertex].y === vA.y ? addedVerts[0]: addedVerts[1];
                                // this.markVertex(scene, {x:river[nextOuter].x,y:river[nextOuter].y,z:river[nextOuter].z+1}, 0x0099ff, "out+1")

                                var nextNextOuter = river[outerVertex].x === vA.x || river[outerVertex].y === vA.y ? addedVerts[1]: addedVerts[0];
                                // this.markVertex(scene, {x:river[nextNextOuter].x,y:river[nextNextOuter].y,z:river[nextNextOuter].z+1}, 0x0099ff, "out+2")
                                // Corner
                                faces.push([innerVertex,outerVertex,nextOuter])
// console.log(faces.length-1,"D",faces[faces.length-1])
                                faces.push([innerVertex,nextOuter,nextNextOuter])
// console.log(faces.length-1,"E",faces[faces.length-1])

                                if (innerVertex === lastAv) {
                                    lastBv = nextNextOuter;
                                } else {
                                    lastAv = nextNextOuter;
                                }
                            }
                        }


                        if (nextVert.z - currentVert.z < .2 && nextVert.z > -1) {
                            lastVert = currentVert;
                            currentVert = nextVert;
                        } else {
                            currentVert = null;
                        }
                    } else {
                        currentVert = null;
                    }
                }
                if (river.length < 8) {
                    waterVerts.forEach(function(v) { delete v.water; delete v.waterLength })
                } else {
                    c.object = new ISLAND.objects.rock(c,true);
                    that.rocks.push(c.object);
                    scene.add(c.object);

                    var r = new ISLAND.objects.river(river,faces);
                    this.scene.add(r)
                    // this.scene.add(r.lines)
                    // river.forEach(function(v,i) {
                    //     v.z += 1.3
                    //     that.markVertex(scene,v,0x0000ff,""+i);//v.distance);//(v.distance<0?"l":"r")+i)
                    //     v.z -= 1.3
                    // })
                    waterVerts.forEach(function(v,i) {
                        // v.z += 0.8;
                        // that.markVertex(scene,v,0xff0000, i===0?riverId:i)
                        // v.z -= 0.8;;
                        v.z -= 1;//(0.5+v.waterLength*0.01);
                    })
                 }

                //

                // if (!lowestVert.c.water && lowestVert.z > 0) {
                //     lowestVert.c.water = true;
                //     lowestVert.c.water2 = true;
                //     waterCells.push(lowestVert.c);
                // }
            }
        }
        markVertex(scene,v,c,n,off) {
            var b = new ISLAND.objects.BaseMesh(
                new THREE.IcosahedronGeometry( 0.1 ),
                new THREE.MeshLambertMaterial( {color: c||0x0099ff, flatShading:true} )
            );
            b.position.copy(v);
            if (n) {
                var note = makeLabel(n);
                note.position.copy(v);
                note.position.z += 0.1+(off||0);
                scene.add(note);
            }

            scene.add(b)

        }


        getCellAt(x,y) {
            var pAx = Math.floor(x) + this.midWidth;
            var pAy = this.options.height-Math.floor(y)-this.midHeight-1;
            var pCx = Math.ceil(x) + this.midWidth;
            var pCy = this.options.height- Math.ceil(y) - this.midHeight-1;

            var vAIndex = pAy*this.options.width+pAx;
            var vCIndex = pCy*this.options.width+pCx;
            var A = this.vertices[vAIndex];
            var C = this.vertices[vCIndex];
            // if (this.BLOB_A) {
            //     this.BLOB_A.position.copy(this.geometry.vertices[vAIndex]);
            //     this.BLOB_B.position.copy(this.geometry.vertices[vCIndex]);
            // }
            // if (this.BLOBS) {
            //     var that = this;
            //     // A.c.corners.forEach(function(v,i) {
            //     //     that.BLOBS[i].position.copy(v);
            //     // })
            //     C.c.corners.forEach(function(v,i) {
            //         that.BLOBS[i+4].position.copy(v);
            //     })
            // }
            if (C) {
                return C.c;
            }

        }
        getHeightAt(x,y) {
            var dx = x - Math.floor(x);
            var dy = y - Math.floor(y);

            var pAx = Math.floor(x) + this.midWidth;
            var pAy = this.options.height-Math.floor(y)-this.midHeight-1;
            var pBx,pBy,pCx,pCy;

            if (dx < dy) {
                pBx = pAx;
                pBy = this.options.height- Math.ceil(y) - this.midHeight-1;
            } else {
                pBx = Math.ceil(x) + this.midWidth;
                pBy = pAy;

            }
            pCx = Math.ceil(x) + this.midWidth;
            pCy = this.options.height- Math.ceil(y) - this.midHeight-1;
            if (
                pAx >= 0 && pAy >= 0 && pAx < this.options.width && pAy < this.options.height &&
                pBx >= 0 && pBy >= 0 && pBx < this.options.width && pBy < this.options.height &&
                pCx >= 0 && pCy >= 0 && pCx < this.options.width && pCy < this.options.height
            ) {
                var vAIndex = pAy*this.options.width+pAx;
                var vBIndex = pBy*this.options.width+pBx;
                var vCIndex = pCy*this.options.width+pCx;
                // console.log(vLIndex,vXIndex,vYIndex);
                if (
                    vAIndex >= 0 && vAIndex < this.vertices.length &&
                    vBIndex >= 0 && vBIndex < this.vertices.length &&
                    vCIndex >= 0 && vCIndex < this.vertices.length
                ) {
                    var A = this.vertices[vAIndex];
                    var B = this.vertices[vBIndex];
                    var C = this.vertices[vCIndex];
                    // this.oldA = this.geometry.vertices[vAIndex];
                    // this.oldB = this.geometry.vertices[vBIndex];
                    // this.oldC = this.geometry.vertices[vCIndex];
                    // if (this.blobOne) {
                    //     this.blobOne.position.copy(this.oldA);
                    //     this.blobTwo.position.copy(this.oldB);
                    //     this.blobThree.position.copy(this.oldC);
                    // }
                    if (vAIndex === vBIndex && vAIndex === vCIndex) {
                        // console.log("A",A.z)
                        return A.z;
                    } else if (vAIndex === vBIndex) {
                        // console.log("B",A.z + (C.z-A.z)*(y-Math.floor(y)))
                        return A.z + (C.z-A.z)*(y-Math.floor(y))
                    } else if (vAIndex === vCIndex|| vBIndex === vCIndex) {
                        // console.log("C",A.z + (B.z-A.z)*(x-Math.floor(x)))
                        return A.z + (B.z-A.z)*(x-Math.floor(x))
                    } else {
                        var  a1 = B.x - A.x;
                        var  b1 = B.y - A.y;
                        var  c1 = B.z - A.z;
                        var  a2 = C.x - A.x;
                        var  b2 = C.y - A.y;
                        var  c2 = C.z - A.z;

                        var  a = b1 * c2 - b2 * c1;
                        var  b = a2 * c1 - a1 * c2;
                        var  c = a1 * b2 - b1 * a2;
                        var  d = (- a * A.x - b * A.y - c * A.z);
                        var h = (-d - b * y - a * x) / c;
                        // console.log("D",h)
                        return h;
                    }
                }
            }
            return -10;
        }
    }

    return {
        objects: {},
        generate: generate
    }
})();

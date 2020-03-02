
export class Sea extends THREE.Object3D {
    constructor(width,height) {
        super();
        var waterColor = new THREE.Color("#ccddff");
        var ww = width*1.5;
        var ws = width*1.5;
        var wh = height*1.5;
        var wsX = Math.floor(width*1.5);
        var wsY = Math.floor(height*1.5);
        var deltaX = Math.floor((wsX-(width+1))/2);
        var deltaY= Math.floor((wsY-(height+1))/2);
        var waterGeo = new THREE.PlaneGeometry(ww,wh,wsX,wsY);
        waterGeo.vertices.forEach(function(v,i) {
            v.z = Math.random()*0.4-0.2;
        })
        this.waterShader;
        var that = this;
        waterGeo.computeFlatVertexNormals()
        const waterPlane = new THREE.Mesh(waterGeo,
            new THREE.MeshLambertMaterial({
                color: waterColor,
                // wireframe: true,
                transparent: true,
                opacity: 0.8,
                flatShading:true,
                onBeforeCompile: function(shader) {
                    shader.uniforms.time = { value: 0}
                    shader.vertexShader = `
                        uniform float time;
                    ` + shader.vertexShader

                    const token = '#include <begin_vertex>'
                    const customTransform = `
                        vec3 transformed = vec3(position);
                        float freq = 1.0;
                        float amp = 0.05;
                        float angle = (time + position.x)*freq;
                        float tidalAngle = time * 0.01;
                        transformed.z += sin(angle)*amp - 0.5+sin(tidalAngle)*0.5;
                    `
                    shader.vertexShader = shader.vertexShader.replace(token,customTransform)
                    that.waterShader = shader;
                }
            })
        )
        this.add(waterPlane)

        const sandPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(ww,wh,1,1),
            new THREE.MeshBasicMaterial( {color: new THREE.Color("#eeeeaa") })
        )
        sandPlane.position.z = -10
        this.add( sandPlane );

    }

    update(time) {
        if (this.waterShader) {
            this.waterShader.uniforms.time.value = time;
        }

    }
}

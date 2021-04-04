function makeTextTexture(str) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 128;
    ctx.canvas.height = 128;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.fillText(str, ctx.canvas.width / 2, ctx.canvas.height / 2);
    return new THREE.CanvasTexture(ctx.canvas);
}
export function makeLabel(text) {
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
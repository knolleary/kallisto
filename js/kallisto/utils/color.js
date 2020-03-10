function generateBit() {
    return Math.floor(Math.random()*255);
}
export function generateColor() {
    return (generateBit()<<16)+(generateBit()<<8)+generateBit()
}

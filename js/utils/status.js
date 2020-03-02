export function log(evt) {
    console.log(timestamp(),evt);
}


function timestamp() {
    var n = new Date();
    return n.toLocaleTimeString()+"."+(n.getMilliseconds())
}

var isReady = false;
var readyCallbacks = [];
var manager = new THREE.LoadingManager();

manager.onLoad = function ( ) {
    isReady = true;
    readyCallbacks.forEach(func => { func() })
}
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  //  GLTFLoader doubles up the events for internal reasons,
  //  but it ensures the `onLoad` event is fired at the right
  //  time.
}
manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
}


export function loadModel(model, callback) {
    var loader = new THREE.GLTFLoader(manager);
    loader.load(model,callback);
}

export function onReady(callback) {
    if (isReady) {
        func();
    } else {
        readyCallbacks.push(callback);
    }
}

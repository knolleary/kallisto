// import * as State from "./state.js"
//
//
// var eventListeners = {}
//
//
// export function onKey(state, keyCode, downCallback, upCallback) {
//     if (downCallback) {
//         addEventListener('keydown', state, keyCode, downCallback);
//     }
//     if (upCallback) {
//         addEventListener('keyup', state, keyCode, upCallback);
//     }
// }
//
// export function onKeyUp(state, keyCode, callback) {
//     addEventListener('keyup', state, keyCode, callback);
// }
// export function onKeyDown(state, keyCode, callback) {
//     addEventListener('keydown', state, keyCode, callback);
// }
//
// function addEventListener(eventName, state, keyCode, callback) {
//     eventListeners[eventName][state] = eventListeners[eventName][state] || {};
//
//     if (!Array.isArray(keyCode)) {
//         keyCode = [keyCode]
//     }
//
//     keyCode.forEach(function(code) {
//         eventListeners[eventName][state][code] = eventListeners[eventName][state][code] || [];
//         eventListeners[eventName][state][code].push(callback);
//     })
//
// }
//
//
// function setupEventHandler(eventName) {
//     document.addEventListener(eventName, function(event) {
//         var stateListeners = eventListeners[eventName][State.get()] || {};
//         var listeners = stateListeners[event.code];
//         if (listeners) {
//             listeners.forEach(function(listener) {
//                 listener.call(null);
//             })
//         }
//     }, false)
//     eventListeners[eventName] = {};
// }
//
// setupEventHandler("keydown");
// setupEventHandler("keyup");

export const state = {}

document.addEventListener("keydown", function(evt) {
    // console.log(evt.key);
    state[evt.key.toLowerCase()] = true;
})

document.addEventListener("keyup", function(evt) {
    delete state[evt.key.toLowerCase()];
})

export const INIT = 'init';
export const MENU = 'menu';
export const PLAYING = 'playing';
export const PAUSED = 'paused';

var state = INIT;

export function get() {
    return state;
}
export function set(newState) {
    state = newState;
}
export function is(s) {
    return state === s;
}

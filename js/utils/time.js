var clock = new THREE.Clock();

var GSECS_PER_MIN = 0.5;
var GSECS_PER_HOUR = GSECS_PER_MIN*60;
var GSECS_PER_DAY = GSECS_PER_HOUR*24;

var START_TIME = 12*GSECS_PER_HOUR;


export const NIGHT = 0;   // 23:00 - 02:59
export const SUNRISE = 1; // 03:00 - 06:59
export const DAY = 2;     // 07:00 - 18:59
export const SUNSET = 3;  // 19:00 - 22:59

export function delta() {
    return Math.min(clock.getDelta(),0.5);
}
export function getElapsedTime() {
    return clock.getElapsedTime();
}
export function now() {
    return Math.floor(clock.getElapsedTime());
}
export function getTime() {
    return (Math.floor(clock.getElapsedTime())+START_TIME)%GSECS_PER_DAY;
}
export function getTimestamp() {
    var time = getTime();
    var hour = Math.floor(time/GSECS_PER_HOUR);
    var mins = Math.floor((time%GSECS_PER_HOUR)/GSECS_PER_MIN);
    return (hour<10?"0":"")+hour+":"+(mins<10?"0":"")+mins;
}

export function getPhaseOfDay() {
    var time = getTime();
    var hour = Math.floor(time/GSECS_PER_HOUR);
    if (hour < 3) {
        return NIGHT
    } else if (hour < 7) {
        return SUNRISE
    } else if (hour < 19) {
        return DAY
    } else if (hour < 23) {
        return SUNSET
    } else {
        return NIGHT
    }
}

export function getPercentageOfPhase() {
    var time = getTime();
    // offset by 1 hour to make night easier to handle
    var hour = (Math.floor(time/GSECS_PER_HOUR)+1)%24;
    var mins = (hour*60)+Math.floor((time%GSECS_PER_HOUR)/GSECS_PER_MIN);
    if (mins < 240) {
        return mins/240;
    } else if (mins < 480) {
        return (mins-240)/240
    } else if (mins < 1200) {
        return (mins-480)/720
    } else {
        return (mins-1200)/240
    }
}

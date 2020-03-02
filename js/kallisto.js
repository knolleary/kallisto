import {Island} from "./island.js"
import {Player} from "./player.js"
import * as Objects from "./objects/index.js"
import {onReady} from "./utils/loader.js"

export default {
    Island: {
        generate: function(scene,opts) {
            var map = new Island(scene,opts);
            map.populate();
            return map;
        },
    },
    Player: Player,
    objects: Objects,
    onReady: onReady
};

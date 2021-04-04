export class StateMachine {
    constructor(character) {
        this.character = character;
        this.states = {};
        this.current = null;
    }

    add(type, state) {
        this.states[type] = state;
    }

    set(type) {
        // console.log("GO TO",type)
        if (!this.states[type])  {
            throw new Error("Unknown state: "+type)
        }
        const previousState = this.current;
        if (previousState) {
            if (previousState.type === type) {
                return
            }
            previousState.exit();
        }
        this.current = new this.states[type](this);
        this.current.enter(previousState)
        this.character.onStateChange(previousState&&previousState.type,type)
    }
    step(time) {
        if (this.current) {
            this.current.step(time);
        }
    }
}

export class State {
    constructor(type, parent, character) {
        this.type = type;
        this.parent = parent;
        this.character = character;
    }
    enter(previousState) {}
    exit() {}
    step(time) {}
}
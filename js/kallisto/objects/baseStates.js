export class IdleState extends State {
    constructor(parent) {
        super("idle", parent);
        console.log(this.parent);
        this.action = this.parent.character.actions['idle'];
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            this.action.reset();
            this.action.crossFadeFrom(previousState.action, 0.1, false);
        } else {
            this.action.play();
        }
    }
    step(time) {
        if (Keyboard.state.w || Keyboard.state.ArrowUp || Keyboard.state.s || Keyboard.state.ArrowDown) {
            this.parent.set("walk")
        }
    }
}

export class WalkingState extends State {
    constructor(parent) {
        super("walk", parent);
        this.action = this.parent.character.actions['walk'];
    }
    enter(previousState) {
        if (previousState && previousState.action) {
            previousState.action.stop();
            this.action.timeScale = 1;
            this.action.reset();
            this.action.play();
            // this.action.reset();
            // this.action.crossFadeFrom(previousState.action, 0.25, true);
        } else {
            this.action.play();
        }
    }
    step(time) {
        if (Keyboard.state.w || Keyboard.state.ArrowUp || Keyboard.state.s || Keyboard.state.ArrowDown) {
            return
        }
        this.parent.set("idle");
    }
}
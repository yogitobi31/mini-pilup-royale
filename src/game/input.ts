import { InputState } from './types';

const JOYSTICK_DEADZONE = 0.08;

type MovementKey = 'up' | 'down' | 'left' | 'right';
type ActionKey = 'attackPressed' | 'skillPressed';

const keyboardMovement: Record<MovementKey, boolean> = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const joystickMovement: Record<MovementKey, boolean> = {
  up: false,
  down: false,
  left: false,
  right: false,
};

export const inputState: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  analogX: 0,
  analogY: 0,
  attackPressed: false,
  skillPressed: false,
};

function syncDigitalMovement() {
  inputState.up = keyboardMovement.up || joystickMovement.up;
  inputState.down = keyboardMovement.down || joystickMovement.down;
  inputState.left = keyboardMovement.left || joystickMovement.left;
  inputState.right = keyboardMovement.right || joystickMovement.right;
}

export function setKeyboardMovement(key: MovementKey, pressed: boolean) {
  keyboardMovement[key] = pressed;
  syncDigitalMovement();
}

export function setJoystickAnalog(analogX: number, analogY: number) {
  const x = Math.max(-1, Math.min(1, analogX));
  const y = Math.max(-1, Math.min(1, analogY));

  inputState.analogX = Math.abs(x) > JOYSTICK_DEADZONE ? x : 0;
  inputState.analogY = Math.abs(y) > JOYSTICK_DEADZONE ? y : 0;

  joystickMovement.left = inputState.analogX < 0;
  joystickMovement.right = inputState.analogX > 0;
  joystickMovement.up = inputState.analogY < 0;
  joystickMovement.down = inputState.analogY > 0;

  syncDigitalMovement();
}

export function setActionPressed(key: ActionKey, pressed: boolean) {
  inputState[key] = pressed;
}

export function resetInputState() {
  (Object.keys(keyboardMovement) as MovementKey[]).forEach((key) => {
    keyboardMovement[key] = false;
    joystickMovement[key] = false;
  });

  inputState.analogX = 0;
  inputState.analogY = 0;
  inputState.attackPressed = false;
  inputState.skillPressed = false;
  syncDigitalMovement();
}

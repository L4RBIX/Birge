const DEFAULT_ACTIVITY = [
  "Айгерим из Алматы вступила · место №15",
  "Данияр прошёл SIM ID · место №16",
  "Тир 20 почти разблокирован · осталось 4",
];

const SAVINGS_TEXT = "Вы только что сэкономили друг другу 36 400 ₸";
export const DUPLICATE_MESSAGE =
  "Это устройство уже занимает место в группе. 1 SIM = 1 место.";

export interface LiveDemoState {
  participants: number;
  target: number;
  price: number;
  retailPrice: number;
  discount: number;
  duplicateBlocked: number;
  activity: string[];
  updatedAt: number;
  finaleUnlocked: boolean;
  savingsText: string;
}

interface MutableLiveDemoState extends LiveDemoState {
  joinedDevices: Set<string>;
}

declare global {
  var birgeLiveDemoState: MutableLiveDemoState | undefined;
}

function createInitialState(): MutableLiveDemoState {
  return {
    participants: 14,
    target: 20,
    price: 17900,
    retailPrice: 25200,
    discount: -29,
    duplicateBlocked: 0,
    activity: [...DEFAULT_ACTIVITY],
    updatedAt: Date.now(),
    finaleUnlocked: false,
    savingsText: SAVINGS_TEXT,
    joinedDevices: new Set<string>(),
  };
}

function getMutableState(): MutableLiveDemoState {
  if (!globalThis.birgeLiveDemoState) {
    globalThis.birgeLiveDemoState = createInitialState();
  }
  return globalThis.birgeLiveDemoState;
}

function serializeState(state: MutableLiveDemoState): LiveDemoState {
  return {
    participants: state.participants,
    target: state.target,
    price: state.price,
    retailPrice: state.retailPrice,
    discount: state.discount,
    duplicateBlocked: state.duplicateBlocked,
    activity: state.activity,
    updatedAt: state.updatedAt,
    finaleUnlocked: state.finaleUnlocked,
    savingsText: state.savingsText,
  };
}

function addActivity(state: MutableLiveDemoState, message: string) {
  state.activity = [message, ...state.activity].slice(0, 6);
}

function unlockTier(state: MutableLiveDemoState) {
  state.participants = state.target;
  state.price = 15900;
  state.finaleUnlocked = true;
  addActivity(state, "Тир 20 разблокирован · цена снизилась");
}

export function getLiveDemoState(): LiveDemoState {
  return serializeState(getMutableState());
}

export function joinLiveDemoGroup({
  name,
  deviceId,
}: {
  name: string;
  deviceId?: string;
}):
  | { ok: true; slot: number; state: LiveDemoState }
  | { ok: false; status: number; duplicate?: boolean; message: string } {
  const normalizedName = name.trim();

  if (normalizedName.length < 2) {
    return {
      ok: false,
      status: 400,
      message: "Введите имя минимум из 2 символов.",
    };
  }

  // Generate a fallback deviceId if missing — never reject the join because of this
  const effectiveDeviceId =
    deviceId?.trim() ||
    `server-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const state = getMutableState();

  if (state.joinedDevices.has(effectiveDeviceId)) {
    state.duplicateBlocked += 1;
    state.updatedAt = Date.now();
    addActivity(state, `Дублирующее устройство заблокировано · SIM ID защита`);

    return {
      ok: false,
      status: 409,
      duplicate: true,
      message: DUPLICATE_MESSAGE,
    };
  }

  state.joinedDevices.add(effectiveDeviceId);
  state.participants = Math.min(state.target, state.participants + 1);
  const slot = state.participants;
  state.updatedAt = Date.now();

  addActivity(
    state,
    `${normalizedName} из Алматы вступил(а) · место №${slot}`
  );

  if (state.participants >= state.target && !state.finaleUnlocked) {
    state.price = 15900;
    state.finaleUnlocked = true;
    addActivity(state, "Тир 20 разблокирован · цена снизилась");
  }

  return {
    ok: true,
    slot,
    state: serializeState(state),
  };
}

export function resetLiveDemoState(): LiveDemoState {
  globalThis.birgeLiveDemoState = createInitialState();
  return serializeState(globalThis.birgeLiveDemoState);
}

export function unlockLiveDemoTier(): LiveDemoState {
  const state = getMutableState();
  unlockTier(state);
  state.updatedAt = Date.now();
  return serializeState(state);
}

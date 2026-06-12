"use client";

import { useState } from "react";

export function AntiBotDemo() {
  const [joined, setJoined] = useState(false);
  const [blocked, setBlocked] = useState(false);

  function handleJoin() {
    if (joined) {
      setBlocked(true);
      return;
    }
    setJoined(true);
    setBlocked(false);
  }

  return (
    <div className="border border-ff-hairline p-[20px]">
      <div className="flex flex-col gap-[16px] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[13px] leading-[17px] font-bold text-[#007f67]">
            Anti-bot live demo
          </p>
          <h3 className="mt-[6px] text-[22px] leading-[28px] font-normal">
            Попробуйте занять место дважды
          </h3>
          <p className="mt-[8px] max-w-[620px] text-[15px] leading-5 text-ff-gray-text">
            Первый вход закрепляет слот за SIM ID. Повторная попытка с того же
            устройства блокируется, чтобы счетчик группы оставался честным.
          </p>
        </div>
        <button
          type="button"
          onClick={handleJoin}
          className="h-[48px] min-w-[180px] bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white ff-transition hover:opacity-80"
        >
          Попробовать вход
        </button>
      </div>

      <div className="mt-[20px] min-h-[54px] border-t border-ff-hairline pt-[16px]">
        {!joined && (
          <p className="text-[15px] leading-5 text-ff-gray-text">
            Устройство еще не занимает место в группе.
          </p>
        )}
        {joined && !blocked && (
          <p className="text-[15px] leading-5 font-bold text-[#007f67]">
            Вы заняли место в группе
          </p>
        )}
        {blocked && (
          <p className="text-[15px] leading-5 font-bold text-[rgb(34,34,34)]">
            Это устройство уже занимает место в группе. 1 SIM = 1 место.
          </p>
        )}
      </div>
    </div>
  );
}

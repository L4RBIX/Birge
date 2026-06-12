import { BannerStrip } from "@/components/BannerStrip";
import { AntiBotDemo } from "@/components/AntiBotDemo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TelecomSecurityStatusCard } from "@/components/telecom/TelecomSecurityStatusCard";

// ─── Architecture flow steps ─────────────────────────────────────────────────
const FLOW_STEPS = [
  "User phone",
  "Telecom Network API",
  "Number Verify",
  "SIM swap risk",
  "Birge Trust Engine",
  "Trusted group slot",
  "Escrow risk check",
  "Marketplace order",
] as const;

// ─── Capability cards ─────────────────────────────────────────────────────────
const CAPABILITIES = [
  {
    title: "Number Verification",
    body: "Через GSMA Open Gateway или оператора Beeline/Kcell проверяем, что номер активен и привязан к SIM-карте в сети. Проверка происходит молча — без OTP, через IP-to-network binding. В dev-режиме симулируется — для реальной верификации нужны операторские credentials.",
  },
  {
    title: "SIM Swap Risk",
    body: "Модель риска анализирует недавние смены SIM-карты. При высоком риске слот блокируется, сделки замораживаются. Это защищает от классической мошеннической схемы, когда злоумышленник перевыпускает SIM жертвы для захвата аккаунта.",
  },
  {
    title: "Device-Bound Group Slot",
    body: "После верификации устройство привязывается к конкретному слоту в групповой сделке. Попытка занять второй слот с того же устройства или номера немедленно блокируется. В prod-режиме это подкреплено реальной проверкой оператора.",
  },
  {
    title: "Duplicate Join Blocking",
    body: "Trust Engine хранит хэши device ID и phone number — сырые данные не сохраняются. Любая попытка повторного входа с того же идентификатора фиксируется в audit log и отклоняется. Счётчик группы всегда остаётся честным.",
  },
  {
    title: "Escrow Risk Check",
    body: "Перед подтверждением платежа Trust Engine запускает pre-check: достаточен ли trust score для эскрирования средств. Если score ниже порога или SIM-риск высок — транзакция ставится на hold до повторной верификации.",
  },
  {
    title: "Carrier Billing Future",
    body: "Архитектура предусматривает прямую интеграцию оплаты через billing оператора — без банковской карты. Пользователь Beeline сможет оплачивать групповые покупки со счёта мобильного телефона, снижая барьер входа.",
  },
  {
    title: "Operator Distribution via eSIM",
    body: "Через QR-провизионинг eSIM оператор может распространять доступ к Birge как часть цифрового профиля. Новый абонент сразу получает verified identity в маркетплейсе — без отдельной регистрации.",
  },
  {
    title: "Secure Commerce Ecosystem",
    body: "Оператор становится trust anchor для коллективной торговли: подтверждает личность, обеспечивает billing, провизирует eSIM. Birge встраивается в super-app оператора как trusted commerce layer — белая метка, ноль изменений кода.",
  },
] as const;

// ─── Production readiness checklist ──────────────────────────────────────────
const PROD_CHECKLIST = [
  "Server-side provider adapters (mock / GSMA / Vonage / custom)",
  "Env-based credentials — no secrets in client bundle",
  "Audit logs with hashed PII (sha256 server-side)",
  "Trust decision engine (allow / step_up / block)",
  "SIM swap risk model wired to deal freeze logic",
  "Dev-mode clearly labeled everywhere — no false claims",
] as const;

export default function SecurityPage() {
  return (
    <div className="bg-white">
      <BannerStrip />
      <SiteHeader />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] py-[56px]">
          <p className="text-[15px] leading-5 font-bold text-[#007f67] uppercase tracking-widest">
            Level 2 Telecom Identity
          </p>
          <h1 className="mt-[12px] max-w-[900px] text-[34px] leading-[44px] font-normal max-[479px]:text-[26px] max-[479px]:leading-[34px]">
            SIM/eSIM identity layer + telecom integration + secure commerce
            ecosystem
          </h1>
          <p className="mt-[20px] max-w-[780px] text-[17px] leading-[26px] text-ff-gray-text">
            В хакатоне без операторских credentials мы не можем выполнить
            реальную сетевую проверку. Поэтому Birge реализует
            production-ready telecom identity layer: provider adapters, server
            API, trust scoring, audit logs, device binding, SIM swap risk
            model, and secure group slot logic.
          </p>
          <p className="mt-[16px] max-w-[780px] text-[15px] leading-[22px] text-ff-gray-text">
            Live phone verification works now via SMS OTP. SIM/eSIM silent
            Network API is production-ready and can replace OTP once operator
            credentials are available.
          </p>
        </section>

        {/* ── KEY IDENTITY LINE ─────────────────────────────────────────────── */}
        <section className="border-y border-[rgb(34,34,34)] bg-[rgb(34,34,34)]">
          <div className="max-w-[1440px] mx-auto px-[24px] py-[36px]">
            <p className="text-[36px] leading-[46px] font-bold text-white max-[479px]:text-[28px] max-[479px]:leading-[36px]">
              1 SIM/eSIM identity = 1 trusted group slot.
            </p>
          </div>
        </section>

        {/* ── LIVE STATUS + ARCHITECTURE FLOW ──────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] py-[56px]">
          <div className="grid gap-[32px] lg:grid-cols-[1fr_1fr] lg:items-start">
            {/* Live status card */}
            <div>
              <p className="text-[15px] leading-5 font-bold mb-[16px]">
                Live API Status
              </p>
              <TelecomSecurityStatusCard />
            </div>

            {/* Architecture flow */}
            <div>
              <p className="text-[15px] leading-5 font-bold mb-[16px]">
                Architecture Flow
              </p>
              <div className="border border-ff-hairline p-[20px]">
                <div className="flex flex-wrap gap-0">
                  {FLOW_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center">
                      <div className="my-[6px] flex-shrink-0">
                        <div className="border border-[rgb(34,34,34)] px-[10px] py-[6px]">
                          <p className="text-[11px] leading-[14px] text-ff-gray-text font-bold">
                            {String(i + 1).padStart(2, "0")}
                          </p>
                          <p className="mt-[2px] text-[13px] leading-[18px] font-bold">
                            {step}
                          </p>
                        </div>
                      </div>
                      {i < FLOW_STEPS.length - 1 && (
                        <span className="px-[6px] text-[#007f67] font-bold text-[14px] flex-shrink-0">
                          →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CAPABILITY CARDS ─────────────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[56px]">
          <p className="text-[15px] leading-5 font-bold text-[#007f67] uppercase tracking-widest mb-[24px]">
            8 Core Capabilities
          </p>
          <div className="grid gap-[12px] sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map(({ title, body }, i) => (
              <article key={title} className="border border-ff-hairline p-[18px]">
                <p className="text-[12px] leading-[16px] font-bold text-ff-gray-text">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-[8px] text-[17px] leading-[22px] font-bold">
                  {title}
                </h3>
                <p className="mt-[10px] text-[14px] leading-[20px] text-ff-gray-text">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── TODAY IN DEMO vs PRODUCTION ──────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[56px]">
          <p className="text-[15px] leading-5 font-bold text-[#007f67] uppercase tracking-widest mb-[20px]">
            Сегодня в демо vs Production с оператором
          </p>
          <div className="grid gap-[12px] sm:grid-cols-2">
            {/* Demo column */}
            <article className="border border-ff-hairline p-[18px]">
              <p className="text-[12px] leading-[16px] font-bold text-ff-gray-text mb-[12px] uppercase tracking-widest">
                Сегодня в демо
              </p>
              <ul className="space-y-[10px]">
                {[
                  "Live SMS OTP verification",
                  "Device-bound group slot",
                  "Duplicate join blocking",
                  "Audit logs",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-[10px]">
                    <span className="mt-[2px] flex-shrink-0 h-[16px] w-[16px] border border-[#007f67] flex items-center justify-center">
                      <span className="text-[#007f67] text-[10px] font-bold leading-none">
                        ✓
                      </span>
                    </span>
                    <p className="text-[14px] leading-[20px]">{item}</p>
                  </li>
                ))}
              </ul>
            </article>

            {/* Production column */}
            <article className="border border-ff-hairline p-[18px]">
              <p className="text-[12px] leading-[16px] font-bold text-ff-gray-text mb-[12px] uppercase tracking-widest">
                Production с оператором
              </p>
              <ul className="space-y-[10px]">
                {[
                  "Silent SIM/eSIM number verification",
                  "SIM swap risk check",
                  "Carrier billing",
                  "eSIM onboarding",
                  "Secure commerce ecosystem",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-[10px]">
                    <span className="mt-[2px] flex-shrink-0 h-[16px] w-[16px] border border-[rgb(34,34,34)] flex items-center justify-center">
                      <span className="text-[rgb(34,34,34)] text-[10px] font-bold leading-none">
                        →
                      </span>
                    </span>
                    <p className="text-[14px] leading-[20px]">{item}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Honesty footnote */}
          <p className="mt-[14px] text-[13px] leading-[18px] text-ff-gray-text border-l-[3px] border-ff-hairline pl-[12px]">
            SMS OTP подтверждает номер. Silent SIM/eSIM Network API подтверждает
            SIM — это следующий уровень, не то же самое.
          </p>
        </section>

        {/* ── CURRENT LIVE LAYER ───────────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[56px]">
          <div className="border border-ff-hairline p-[18px] bg-[rgb(250,252,250)]">
            <p className="text-[13px] leading-[17px] font-bold text-[#007f67] uppercase tracking-widest mb-[10px]">
              Текущий и будущий уровни верификации
            </p>
            <p className="text-[14px] leading-[22px] text-ff-gray-text">
              <span className="font-bold text-[rgb(34,34,34)]">Сейчас (Live Layer):</span>{" "}
              SMS OTP верификация номера телефона — работает при настроенном
              провайдере (mock / Twilio / Vonage / custom).
            </p>
            <p className="mt-[8px] text-[14px] leading-[22px] text-ff-gray-text">
              <span className="font-bold text-[rgb(34,34,34)]">Production Level 2:</span>{" "}
              Silent SIM/eSIM верификация через GSMA Open Gateway / Vonage
              Silent Auth / operator Network API — без OTP, прямой запрос к сети
              оператора — плюс SIM swap risk check, carrier billing, eSIM
              onboarding и дистрибуция.
            </p>
          </div>
        </section>

        {/* ── SIM SWAP PROTECTION NOTE ─────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[56px]">
          <div className="border-l-[4px] border-[rgb(34,34,34)] pl-[20px] py-[8px]">
            <p className="text-[20px] leading-[28px] font-bold">
              При смене SIM-карты активные сделки замораживаются до повторной
              верификации.
            </p>
          </div>
        </section>

        {/* ── ANTI-BOT DEMO (preserved) ────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto grid gap-[24px] px-[24px] py-[56px] lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-[15px] leading-5 font-bold text-[#007f67]">
              Anti-fraud proof
            </p>
            <h2 className="mt-[10px] max-w-[540px] text-[30px] leading-[38px] font-normal">
              Один реальный SIM ID занимает один слот. Накрутка группы не
              меняет цену.
            </h2>
          </div>
          <AntiBotDemo />
        </section>

        {/* ── PRODUCTION READINESS BLOCK ───────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[56px]">
          <div className="border border-ff-hairline p-[24px]">
            <p className="text-[15px] leading-5 font-bold text-[#007f67] uppercase tracking-widest mb-[20px]">
              Production Readiness
            </p>
            <div className="grid gap-[10px] sm:grid-cols-2">
              {PROD_CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-[10px]">
                  <span className="mt-[2px] flex-shrink-0 h-[16px] w-[16px] border border-[#007f67] flex items-center justify-center">
                    <span className="text-[#007f67] text-[10px] font-bold leading-none">
                      ✓
                    </span>
                  </span>
                  <p className="text-[14px] leading-[20px]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHITE-LABEL OPERATOR VISION ──────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[72px]">
          <div className="border-t border-[rgb(34,34,34)] pt-[32px]">
            <p className="text-[15px] leading-5 font-bold text-[#007f67]">
              White-label operator vision
            </p>
            <h2 className="mt-[10px] text-[30px] leading-[38px] font-normal max-w-[700px]">
              Birge can be embedded into an operator super-app or eSIM
              onboarding flow as a trusted commerce layer.
            </h2>
            <div className="mt-[24px] grid gap-[12px] lg:grid-cols-4">
              {[
                [
                  "Identity",
                  "SIM ID подтверждает, что слот в группе занимает реальный человек.",
                ],
                [
                  "Billing",
                  "В будущем оплата может идти через carrier billing или локальные платёжные rails.",
                ],
                [
                  "Distribution",
                  "eSIM/onboarding позволяет оператору распространять сервис как часть цифрового профиля.",
                ],
                [
                  "Secure Commerce Ecosystem",
                  "Оператор становится trust layer для коллективной торговли.",
                ],
              ].map(([title, copy]) => (
                <article
                  key={title}
                  className="border border-ff-hairline p-[18px]"
                >
                  <h3 className="text-[18px] leading-[24px] font-bold">
                    {title}
                  </h3>
                  <p className="mt-[8px] text-[15px] leading-5 text-ff-gray-text">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── ORIGINAL ECOSYSTEM MAP (preserved) ───────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-[24px] pb-[72px]">
          <p className="mb-[14px] text-[15px] leading-5 font-bold">
            Marketplace data → Localization → Recommendation score → User feed
            → Group purchase → SIM ID trust layer → Escrow mock → Order
            consolidation
          </p>
          <div className="grid gap-[10px] border border-ff-hairline p-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Marketplace data",
              "Localization",
              "Recommendation score",
              "User feed",
              "Group purchase",
              "SIM ID trust layer",
              "Escrow mock",
              "Order consolidation",
            ].map((item, index) => (
              <div
                key={item}
                className="min-h-[92px] border border-[rgb(238,238,238)] p-[14px]"
              >
                <p className="text-[13px] leading-[17px] text-ff-gray-text">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-[8px] text-[16px] leading-[22px] font-bold">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

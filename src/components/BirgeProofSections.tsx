import { AntiBotDemo } from "@/components/AntiBotDemo";
import { formatKzt, profile } from "@/lib/birge-content";

export function BirgeProofSections() {
  return (
    <>
      <section className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[24px]">
        <div className="grid gap-[24px] lg:grid-cols-2">
          <div>
            <img
              src="/images/cms/2026-06-01-mw-webapp-boggi-milano-vacation-boggi-milano-multicategory-img.jpeg"
              alt="Birge SIM trust"
              className="aspect-[684/796] w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[15px] leading-5 font-bold text-[#007f67]">
              SIM ID Security
            </p>
            <h2 className="mt-[12px] max-w-[620px] text-[38px] leading-[48px] font-normal max-[479px]:text-[28px] max-[479px]:leading-[36px]">
              SIM защищает не только аккаунт. SIM защищает саму экономику групповой покупки.
            </h2>
            <p className="mt-[16px] text-[15px] leading-5 text-ff-gray-text">
              Обычные group-buy платформы страдают от fake joins, duplicate devices,
              unreliable counters и suspicious accounts. Birge показывает только
              SIM-verified buyers, one SIM = one group slot, trusted counter и escrow
              protected оплату.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[24px]">
        <AntiBotDemo />
      </section>

      <section id="how-it-works" className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[24px]">
        <div className="grid gap-[24px] border-y border-ff-hairline py-[28px] lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-[15px] leading-5 font-bold text-[#007f67]">
              Recommendation layer
            </p>
            <h2 className="mt-[10px] text-[30px] leading-[38px] font-normal">
              Почему эти товары в вашей ленте
            </h2>
            <p className="mt-[10px] text-[15px] leading-5 text-ff-gray-text">
              Рекомендации строятся прозрачно: 40% интересы, 20% бюджет, 20% город, 20% скорость набора группы.
            </p>
            <p className="mt-[10px] text-[13px] leading-[17px] font-bold">
              score = 0.40 interest + 0.20 budget + 0.20 city + 0.20 momentum
            </p>
          </div>
          <div className="grid gap-[12px] sm:grid-cols-4">
            {[
              ["0.40", "Interest match"],
              ["0.20", "Budget fit"],
              ["0.20", "City match"],
              ["0.20", "Momentum"],
            ].map(([weight, label]) => (
              <div key={label} className="border border-ff-hairline p-[16px]">
                <p className="text-[22px] leading-[28px] font-bold text-[#007f67]">
                  {weight}
                </p>
                <p className="mt-[6px] text-[15px] leading-5 font-bold">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[24px]">
        <div className="border-y border-[rgb(34,34,34)] py-[32px] text-center">
          <p className="text-[15px] leading-5 font-bold text-[#007f67]">
            Tier unlocked
          </p>
          <h2 className="mt-[12px] text-[38px] leading-[48px] font-normal max-[479px]:text-[28px] max-[479px]:leading-[36px]">
            Вы только что сэкономили друг другу 36 400 ₸
          </h2>
          <dl className="mt-[24px] grid grid-cols-2 gap-[12px] lg:grid-cols-4">
            {[
              ["Экономия на покупателя", "7 300 ₸"],
              ["Экономия группы", "36 400 ₸"],
              ["Тир", "20 человек · −29%"],
              ["SIM-verified", "20/20"],
            ].map(([label, value]) => (
              <div key={label} className="border border-ff-hairline p-[16px]">
                <dt className="text-[13px] leading-[17px] text-ff-gray-text">
                  {label}
                </dt>
                <dd className="mt-[4px] text-[18px] leading-[24px] font-bold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-[24px] text-[15px] leading-5 font-bold">
            Так выглядит честная групповая покупка
          </p>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[24px]">
        <div className="grid gap-[24px] lg:grid-cols-2">
          <div>
            <h2 className="text-[38px] leading-[48px] font-normal max-[479px]:text-[28px] max-[479px]:leading-[36px]">
              Уровень 2: оператор как trust layer для commerce
            </h2>
            <p className="mt-[16px] text-[15px] leading-5 text-ff-gray-text">
              Оператор не просто даёт SIM. Он становится trust-layer для commerce.
            </p>
          </div>
          <div className="grid gap-[12px] sm:grid-cols-2">
            {[
              "Identity: SIM ID подтверждает, что слот в группе занимает реальный человек.",
              "Billing: в будущем оплата может идти через carrier billing или локальные платёжные rails.",
              "Distribution: eSIM/onboarding позволяет оператору распространять Birge как часть цифрового профиля.",
              "Secure commerce ecosystem: оператор становится слоем доверия для групповых покупок, эскроу и защиты от накрутки.",
            ].map((item) => (
              <div key={item} className="border border-ff-hairline p-[16px]">
                <p className="text-[15px] leading-5 font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-[18px] text-[15px] leading-5 font-bold">
          App → SIM/eSIM ID → Trusted profile → Group slot → Escrow mock → Marketplace order
        </p>
      </section>

      <section className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[48px]">
        <div className="grid gap-[24px] border-y border-ff-hairline py-[24px] lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-[13px] leading-[17px] text-[#007f67] font-bold">
              SIM ID verified
            </p>
            <h2 className="mt-[8px] text-[30px] leading-[38px] font-normal">
              {profile.name}
            </h2>
            <p className="mt-[6px] text-[15px] leading-5 text-ff-gray-text">
              {profile.city} · {profile.budgetBand}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-[12px] lg:grid-cols-4">
            {[
              ["Trust Score", `${profile.trustScore}/100`],
              ["Active deals", String(profile.activeDeals)],
              ["Closed deals", String(profile.closedDeals)],
              ["Saved total", formatKzt(profile.savedMoney)],
            ].map(([label, value]) => (
              <div key={label} className="border border-ff-hairline p-[16px]">
                <dt className="text-[13px] leading-[17px] text-ff-gray-text">
                  {label}
                </dt>
                <dd className="mt-[4px] text-[18px] leading-[24px] font-bold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}

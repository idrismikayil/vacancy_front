import { useEffect, useState } from "react";
import { BiCheckCircle } from "react-icons/bi";
import PricingPlansApi from "../api/apiList/pricing";
import { toast } from "react-toastify";
import SubscriptionApi from "../api/apiList/subscriptions";
import { useUser } from "../context/UserContext";
import { useTranslation } from "react-i18next";
const BACKGROUND_IMAGE_PATH = '../../assets/images/hero/bg.jpg';

export default function Pricing() {
  const [selected, setSelected] = useState(null);
  const [plans, setPlans] = useState([]);
  const { user } = useUser();
  const { t } = useTranslation();

  // const companyId = localStorage.getItem('companyId') ?? null;

  const mapPackages = (data) =>
    data.map((item) => ({
      id: item?.id,
      name: item.name,
      price: Number(item.price),
      currency: "AZN",
      btn: t('pricing.createAd'),
      features: item.features,
      type: item?.type
    }));

  const handleClickPayment = async (plan) => {
    if (!plan) return;

    if (plan.type === "one-time") {
      const params = { pricing_plan_id: plan.id, company_id: user?.data?.id };
      const response = await SubscriptionApi.createOnetimePurchase(params);

      if (response?.data?.status === "PAYER_ACTION_REQUIRED") {
        const link = response?.data?.payer_action_link;
        if (link) {
          window.open(link, "_blank", "noopener,noreferrer");
        }
      } else {
      }
    }
    else if (plan.type === "regular") {
      const params = { pricing_plan_id: plan.id, company_id: user?.data?.id };
      const response = await SubscriptionApi.createSubsscription(params);

      if (response?.data?.data?.paypal?.status === "APPROVAL_PENDING") {
        const link = response?.data?.data?.paypal?.approve_link;
        if (link) {
          window.open(link, "_blank", "noopener,noreferrer");
        }
      } else {
        toast.error("Abonelik başlatılamadı.");
      }
    }
  }



  const getPricingPlans = async () => {
    try {
      const response = await PricingPlansApi.getPricingPlans();

      if (response.status === 200) {
        const mapped_plans_data = mapPackages(response?.data?.data);
        // Sort plans ascending by price
        mapped_plans_data.sort((a, b) => a.price - b.price);
        setPlans(prevState => [...mapped_plans_data]);

      }
      else {
        throw new Error(response?.data)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  }

  useEffect(() => {
    getPricingPlans();
  }, [])

  return (
    <>
      <section
        className="relative table w-full py-36 bg-top bg-no-repeat bg-cover"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGE_PATH})` }}
      >
        <div className="absolute inset-0 bg-emerald-900/90"></div>
        <div className="container">
          <div className="grid grid-cols-1 text-center mt-10">
            <h3 className="md:text-3xl text-2xl md:leading-snug tracking-wide leading-snug font-medium text-white">
              {t('pricing.title')}
            </h3>
          </div>
        </div>
      </section>

      <section className="relative lg:py-24 py-16">
        <div className="container">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-[30px] items-center">

            {plans.map((plan, index) => {
              const isRecommended = index === 2; // 3rd box 
              return (
                <div
                  key={index}
                  onClick={() => setSelected(index)}
                  className={`
                  group relative shadow-sm hover:shadow-md dark:shadow-gray-800 rounded-md 
                  transition-all duration-500 cursor-pointer bg-white dark:bg-slate-900 border 
                  ${!isRecommended && (selected === index ? "border-emerald-600" : "border-transparent")} 
                  ${isRecommended ? "transform scale-105 z-10 shadow-lg" : ""}
                `}
                  style={{
                    borderWidth: isRecommended ? '2px' : '1px',
                    borderColor: isRecommended ? '#FFD700' : undefined
                  }}
                >
                  <div className="p-6 py-8">
                    <h6 className="text-lg font-bold uppercase mb-5 text-emerald-600">
                      {t(`pricing.packages.${index}.title`)}
                    </h6>

                    <div className="flex mb-5">
                      <span className="text-xl font-semibold">₼</span>
                      <span className="price text-4xl font-semibold mb-0">
                        {plan.price}
                      </span>


                      {(index === 1 || index === 3) && (
                        <span className="text-xl font-semibold self-end mb-1">
                          {t('pricing.monthly')}
                        </span>
                      )}
                    </div>

                    <ul className="list-none text-slate-400 border-t border-gray-100 dark:border-gray-700 pt-5">
                      {Array.isArray(t(`pricing.packages.${index}.features`, { returnObjects: true })) &&
                        t(`pricing.packages.${index}.features`, { returnObjects: true }).map((feature, idx) => (
                          <li key={idx} className="my-2 flex items-center">
                            <BiCheckCircle className="text-emerald-600 text-xl me-2 min-w-[20px]" />{" "}
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClickPayment(plan);
                      }}
                      className={`py-1 px-5 inline-block font-semibold tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center rounded-md mt-5 w-full ${isRecommended ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700" : "bg-emerald-600/5 text-emerald-600 border-emerald-600/10 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"}`}
                    >
                      {plan.btn}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  );
}
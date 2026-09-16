import { useState } from "react";
import type { CurrencyCode, ScaleId } from "@/types";
import { BUY_PLAN_DATA } from "@/data/buyplan-data";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import BuyPlanHeader from "@/components/BuyPlanHeader";
import BuyPlanControls from "@/components/BuyPlanControls";
import ColourKey from "@/components/ColourKey";
import BuyPlanTable from "@/components/BuyPlanTable";

export default function BuyPlanPage() {
  const [currency, setCurrency] = useState<CurrencyCode>("EUR");
  const [scale, setScale] = useState<ScaleId>("M");
  const { rate, source, loading, error, refresh, setManualRate } = useExchangeRate();

  return (
    <div className="bp-page">
      <BuyPlanHeader />
      <BuyPlanControls
        currency={currency}
        setCurrency={setCurrency}
        scale={scale}
        setScale={setScale}
        rate={rate}
        rateSource={source}
        rateLoading={loading}
        rateError={error}
        onRefreshRate={refresh}
        onManualRate={setManualRate}
      />
      <ColourKey />
      <BuyPlanTable dataset={BUY_PLAN_DATA} scale={scale} currency={currency} rate={rate} />
    </div>
  );
}


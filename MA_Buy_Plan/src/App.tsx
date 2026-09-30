import BuyPlanPage from "@/components/BuyPlanPage";
import { CurrencyFormatProvider } from "@/context/CurrencyFormatContext";

const App = () => {
  return (
    <CurrencyFormatProvider>
      <div className="bp-root">
        <BuyPlanPage />
      </div>
    </CurrencyFormatProvider>
  );
};

export default App;

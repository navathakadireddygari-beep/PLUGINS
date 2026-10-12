import Header from "@/components/Header";
import Table from "@/components/Table";
import { CurrencyFormatProvider } from "@/context/CurrencyFormatContext";
import { DateFormatProvider } from "@/context/DateFormatContext";
import { SaveModelProvider } from "@/context/SaveModelContext";

const App = () => {
  return (
    <DateFormatProvider>
      <CurrencyFormatProvider>
        {/* Lets the header's "Save Model" button reach the save logic that
            lives inside <Table>. Renders no markup. */}
        <SaveModelProvider>
          <div className="mna_widget mna:min-h-screen mna:bg-slate-50 mna:text-slate-900">
            <div className="mna:flex mna:w-full mna:flex-col mna:gap-3 mna:py-6">
              <Header />
              <Table />
            </div>
          </div>
        </SaveModelProvider>
      </CurrencyFormatProvider>
    </DateFormatProvider>
  );
};

export default App;

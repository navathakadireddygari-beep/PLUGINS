// import { TooltipProvider } from "@radix-ui/react-tooltip";
// // import { PivotTableExample } from "./components/Table";
// import PivotTableWithAPI from "./components/Table.tsx";

// function App() {
//   console.log("App component rendered");
//   return (
//     <TooltipProvider>
//       <div>
//         {/* <h1>Pivot Table App</h1> */}
//         <PivotTableExample />
//       </div>
//     </TooltipProvider>
//   );
// }

// export default App;

import { TooltipProvider } from "@radix-ui/react-tooltip";
import ForecastDashboard from "./components/ForecastDashboard";

function App() {
  console.log("App component rendered");
  return (
    <TooltipProvider>
      <div>
        <ForecastDashboard />
      </div>
    </TooltipProvider>
  );
}
 
export default App;
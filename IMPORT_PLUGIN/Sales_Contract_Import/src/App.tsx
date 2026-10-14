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
import PivotTableWithAPI from "./components/Table";
 
function App() {
  return (
    <TooltipProvider>
      <div
        id="fin-eval-widget-root"
        style={{ position: "relative", boxSizing: "border-box" }}
      >
        <PivotTableWithAPI />
      </div>
    </TooltipProvider>
  );
}
 
export default App;
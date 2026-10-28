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
import PostInvestmentReview from "./components/PostInvestmentReview";

function App() {
  return (
    <TooltipProvider>
      <div>
        <PostInvestmentReview />
      </div>
    </TooltipProvider>
  );
}
 
export default App;
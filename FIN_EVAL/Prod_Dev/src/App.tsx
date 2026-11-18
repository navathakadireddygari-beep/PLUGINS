import PivotTableWithAPI from "./components/Table";

function App() {
  return (
    <div
      id="fin-eval-widget-root"
      style={{ position: "relative", boxSizing: "border-box" }}
    >
      <PivotTableWithAPI />
    </div>
  );
}

export default App;

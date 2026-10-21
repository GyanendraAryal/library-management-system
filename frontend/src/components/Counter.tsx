import { useState } from "react";

function Counter() {
  const [count, setCount] = useState<number>(0);
  const incrementCount = () => {
    setCount((prev) => prev + 1);
  };
  const decrementCount = () => {
    setCount((prev) => prev - 1);
  };
  return (
    <>
      <span>Count: {count}</span>
      <button
        onClick={incrementCount}
        className="h-5 rounded-2xl border px-3 py-1 text-[10px]"
      >
        Increment
      </button>
      <button
        onClick={decrementCount}
        className="h-5 rounded-2xl border px-3 py-1 text-[10px]"
      >
        Decrement
      </button>
    </>
  );
}

export default Counter;

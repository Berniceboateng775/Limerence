import React, { useState, useEffect } from "react";

const Typewriter = ({ words, speed = 150, deleteSpeed = 100, delay = 1000 }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const timeout2 = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout2);
  }, []);

  useEffect(() => {
    if (index === words.length) {
        // Loop back
        setIndex(0);
        return;
    }

    if (subIndex === words[index].length + 1 && !reverse) {
      setReverse(true);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? deleteSpeed : speed, parseInt(Math.random() * 50)));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, speed, deleteSpeed]);

  return (
    <span>
      {`${words[index].substring(0, subIndex)}${blink ? "|" : " "}`}
    </span>
  );
};

export default Typewriter;

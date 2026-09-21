import { StyleSheet } from "react-native";
import { theme } from "./theme";

// Initialize global flag
global.sageModeActive = false;

const originalCreate = StyleSheet.create;

const mapValue = (val) => {
  if (typeof val !== "string") return val;
  const upper = val.toUpperCase().trim();

  if (global.sageModeActive) {
    if (upper === "#E21E42") return "#5A8264";
    if (upper === "#B81531") return "#436049";
    if (upper === "#FFF5F6") return "#F3F7F4";
    if (upper === "#FFF0F2") return "#E6EFEA";
    if (upper === "#FAD9DD") return "#DCE5DD";
    if (upper === "#FCE8EB") return "#EBF1EC";
    if (upper === "#FEE2E2") return "#D0E1D4";
    if (upper === "#FFE9E6") return "#E6EFEA";
    if (
      upper.includes("226, 30, 66") ||
      upper.includes("192, 57, 43") ||
      upper.includes("229, 62, 62")
    ) {
      return val
        .replace(/226,\s*30,\s*66/g, "90, 130, 100")
        .replace(/192,\s*57,\s*43/g, "67, 96, 73")
        .replace(/229,\s*62,\s*62/g, "67, 96, 73");
    }
  }
  return val;
};

StyleSheet.create = (styles) => {
  const resolvedStyles = originalCreate(styles);
  const proxy = {};

  for (const className in styles) {
    Object.defineProperty(proxy, className, {
      get() {
        const originalClassStyle = styles[className];
        if (global.sageModeActive) {
          const mapped = {};
          for (const prop in originalClassStyle) {
            mapped[prop] = mapValue(originalClassStyle[prop]);
          }
          return mapped;
        }
        return resolvedStyles[className];
      },
      enumerable: true,
      configurable: true,
    });
  }

  return proxy;
};

import { useEffect, useState } from "react";
import {
  getFromStorage,
  setToStorage
} from "../utils/storage";

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    return getFromStorage<T>(key, initialValue);
  });

  useEffect(() => {
    setToStorage<T>(key, value);
  }, [key, value]);

  return [value, setValue];
};
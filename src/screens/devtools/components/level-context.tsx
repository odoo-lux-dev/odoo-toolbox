import { createContext, useContext, type JSX } from "solid-js";

interface LevelContextValue {
  level: number;
}

const LevelContext = createContext<LevelContextValue | undefined>(undefined);

interface LevelProviderProps {
  level: number;
  children: JSX.Element;
}

export const LevelProvider = (props: LevelProviderProps) => {
  return (
    <LevelContext.Provider value={{ level: props.level }}>{props.children}</LevelContext.Provider>
  );
};

export const useLevel = (): number => {
  const context = useContext(LevelContext);
  if (context === undefined) {
    return 0;
  }
  return context.level;
};

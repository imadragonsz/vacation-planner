import { createContext, useContext } from "react";

export const ThemeContext = createContext({
  themeVars: {},
  theme: "light",
  setTheme: (theme: string) => {},
});

// Define the User type
interface User {
  id: string;
  [key: string]: any; // Add other properties as needed
}

// Define the UserContextType
interface UserContextType {
  user: User | null;
}

// Update the UserContext definition
export const UserContext = createContext<UserContextType>({
  user: null,
});

export const useUser = () => {
  return useContext(UserContext);
};

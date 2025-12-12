import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const { login, logout, currentUser } = useContext(AuthContext);
  return { login, logout, currentUser };
}

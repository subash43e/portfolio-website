import { useContext } from "react";
import { StoreContext } from "../contexts/StoreContext";

export function useStore() {
  const { mdContent, setMdContent, blogs, saveBlog } = useContext(StoreContext);
  return { mdContent, setMdContent, blogs, saveBlog };
}

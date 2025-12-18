import { createContext, useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

const StoreContext = createContext();

export { StoreContext };

export const StoreProvider = ({ children }) => {
  const [mdContent, setMdContent] = useState("");
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      const querySnapshot = await getDocs(collection(db, "Blogs"));
      const blogsData = [];
      querySnapshot.forEach((doc) => {
        if (doc.exists()) {
          blogsData.push({ ...doc.data(), id: doc.id });
        }
      });
      setBlogs(blogsData);
    };
    fetchBlogs();
  }, []);

  const saveBlog = async (content) => {
    const words = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);
    try {
      await addDoc(collection(db, "Blogs"), {
        content: content,
        createdAt: new Date(),
        date: Date.now(),
        readTime: `${readingTime} min read`,
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const value = { mdContent, setMdContent, blogs, saveBlog };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

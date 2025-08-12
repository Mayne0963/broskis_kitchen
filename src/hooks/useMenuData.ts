import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { menuItems as fallbackMenuItems, categories as fallbackCategories } from '../data/menu-data';

interface MenuItem {
  id: string;
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

export const useMenuData = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        if (!categoriesSnap.empty) {
          setCategories(
            categoriesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
          );
        }
        const itemsSnap = await getDocs(collection(db, 'menuItems'));
        if (!itemsSnap.empty) {
          setMenuItems(
            itemsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
          );
        }
      } catch (err) {
        console.warn('Error fetching menu data from Firebase:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isFirebaseConfigured) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  return { menuItems, categories, loading };
};

export default useMenuData;

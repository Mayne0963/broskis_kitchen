import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface HeroContent {
  hero_title1?: string;
  hero_title2?: string;
  hero_title3?: string;
  hero_cta1?: string;
  hero_cta2?: string;
  welcome_title?: string;
  welcome_description?: string;
}

export const useHeroContent = () => {
  const [heroContent, setHeroContent] = useState<HeroContent>({
    hero_title1: 'HOME OF THE AWARD-WINNING',
    hero_title2: 'BOOSIE WINGS',
    hero_title3: "CAUSE IT'S BADAZZ",
    hero_cta1: 'Order Now',
    hero_cta2: 'Explore Our Menu',
    welcome_title: "WELCOME TO BROSKI'S KITCHEN",
    welcome_description: 'Luxury Street Gourmet – where culinary culture meets legacy flavor. From our Boosie Wings to Infused Broski Dust Fries, every plate is served with soul sauce.'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        // Try to fetch from Firebase, but use defaults if it fails
        const heroContentRef = collection(db, 'hero_content');
        const snapshot = await getDocs(heroContentRef);
        
        if (!snapshot.empty) {
          const content: HeroContent = {};
          snapshot.forEach((doc) => {
            content[doc.id as keyof HeroContent] = doc.data().text || doc.data().content;
          });
          setHeroContent(prev => ({ ...prev, ...content }));
        }
      } catch (err) {
        console.warn('Firebase not configured or error fetching hero content:', err);
        // Continue with default content
      } finally {
        setLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  return { heroContent, loading, error };
};
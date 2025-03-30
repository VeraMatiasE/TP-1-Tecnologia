"use client"

import { useEffect, useState, useRef } from "react";
import timelineData from "./timelineData.json";

interface TimelineEvent {
  age: string;
  year: number;
  title: string;
  description: string;
  image?: string;
}

export default function Timeline() {
  const ages: string[] = ["all", "prehistory", "ancient-history", "middle-ages", "early-modern", "contemporary"];
  const edades: string[] = ["Todo", "Prehistoria", "Edad Antigua", "Edad Media", "Edad Moderna", "Edad Contemporanea"];

  const [activeIndices, setActiveIndices] = useState<Record<string, number>>(
    ages.reduce((acc, age) => ({ ...acc, [age]: 0 }), {})
  );
  const [activeAge, setActiveAge] = useState<string>("all");
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);  
  const [loadedImages, setLoadedImages] = useState<Record<number, string>>({});
  const [filteredTimelineData, setFilteredTimelineData] = useState<TimelineEvent[]>(timelineData);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isTabsVisible, setIsTabsVisible] = useState<boolean>(true);

  const changeTab = (direction: "left" | "right") => {
    const currentIndex = ages.indexOf(activeAge);
    let newIndex;

    if (direction === "right") {
      newIndex = (currentIndex + 1) % ages.length;
    } else {
      newIndex = (currentIndex - 1 + ages.length) % ages.length;
    }

    setActiveAge(ages[newIndex]);
  };

  useEffect(() => {
    // Detectar tamaño de pantalla al cargar y en resize
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize(); // Inicializar
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Controlar la visibilidad de las tabs en móvil al hacer scroll
  useEffect(() => {
    if (isMobileView) {
      let lastScrollTop = 0;
      const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
          // Scroll hacia abajo - ocultar tabs
          setIsTabsVisible(false);
        } else {
          // Scroll hacia arriba - mostrar tabs
          setIsTabsVisible(true);
        }
        lastScrollTop = scrollTop;
      };
      
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsTabsVisible(true);
    }
  }, [isMobileView]);

  useEffect(() => {
    const filtered = activeAge === "all" 
      ? timelineData 
      : timelineData.filter((event) => event.age === activeAge);
    
    setFilteredTimelineData(filtered);
    setActiveIndices((prev) => ({ ...prev, [activeAge]: 0 }));
    setLoadedImages({});
    
    setTimeout(() => {
      if (sectionsRef.current[0]) {
        sectionsRef.current[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, [activeAge]);

  const setActiveIndex = (index: number) => {
    setActiveIndices((prev) => ({
      ...prev,
      [activeAge]: index,
    }));
  };

  const activeIndex = activeIndices[activeAge];

  const navigateVertical = (direction: "up" | "down") => {
    let newIndex = direction === "down"
      ? Math.min(activeIndex + 1, filteredTimelineData.length - 1)
      : Math.max(activeIndex - 1, 0);

    setActiveIndices({ ...activeIndices, [activeAge]: newIndex });
    
    if (sectionsRef.current[newIndex]) {
      sectionsRef.current[newIndex].scrollIntoView({ behavior: "instant", block: "center" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      let currentIndex = 0;
      sectionsRef.current.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top < window.innerHeight / 2) {
            currentIndex = index;
          }
        }
      });

      if (currentIndex !== activeIndex) {
        setActiveIndex(currentIndex);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeIndex, filteredTimelineData]);

  useEffect(() => {
    const newLoadedImages: Record<number, string> = {};
    filteredTimelineData.forEach((event, index) => {
      if (Math.abs(activeIndex - index) <= 2) {
        newLoadedImages[index] = event.image || "";
      }
    });
    setLoadedImages((prevLoadedImages) => ({
      ...prevLoadedImages,
      ...newLoadedImages,
    }));
  }, [activeIndex, filteredTimelineData]);

  const handleClick = (index: number) => {
    setActiveIndex(index);
    if (sectionsRef.current[index]) {
      sectionsRef.current[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") navigateVertical("down");
    else if (event.key === "ArrowUp") navigateVertical("up");
    else if (event.key === "ArrowLeft") changeTab("left");
    else if (event.key === "ArrowRight") changeTab("right");
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAge, activeIndex, filteredTimelineData]);

  // Renderiza un dropdown para móvil en lugar de tabs
  const renderAgeSelector = () => {
    if (isMobileView) {
      return (
        <div className={`fixed top-0 left-0 right-0 z-30 p-2 transition-transform duration-300 ${isTabsVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <select 
            className="w-full p-2 bg-gray-800 text-white rounded-lg border border-gray-700"
            value={activeAge}
            onChange={(e) => setActiveAge(e.target.value)}
          >
            {ages.map((age, i) => (
              <option key={age} value={age}>{edades[i]}</option>
            ))}
          </select>
        </div>
      );
    }
    
    return (
      <div className="fixed top-0 left-0 right-0 z-30 flex justify-center  gap-2 p-2">
        {ages.map((age, i) => (
          <button
            key={age}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-sm md:text-lg shadow-md 
              ${activeAge === age 
                ? "bg-blue-600 text-white shadow-blue-500/40 scale-105" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105"}`}
            onClick={() => setActiveAge(age)}
          >
            {edades[i]}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Selector de edades adaptativo */}
      {renderAgeSelector()}

      {/* Línea de tiempo fija - adaptada para móvil */}
      <div className={`fixed ${isMobileView ? 'left-4' : 'left-11'} top-1/4 bottom-1/4 w-1 bg-gray-700 z-20`}></div>

      {/* Puntos de la línea de tiempo - adaptados para móvil */}
      <div className={`fixed ${isMobileView ? 'left-3' : 'left-10'} top-1/4 bottom-1/4 flex flex-col items-center justify-around z-20`}>
        {filteredTimelineData.map((event, index) => {
          if (Math.abs(activeIndex - index) <= 2) {
            return (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer transform ${
                  activeIndex === index ? "bg-blue-400 scale-150" : "bg-gray-700"
                }`}
                onClick={() => handleClick(index)}
              ></div>
            );
          }
          return null;
        })}
      </div>

      {/* Años a la izquierda - adaptados para móvil */}
      <div className={`fixed ${isMobileView ? 'left-8' : 'left-16'} top-1/4 bottom-1/4 flex flex-col items-start justify-around text-white z-20`}>
        {filteredTimelineData.map((event, index) => {
          if (Math.abs(activeIndex - index) <= 2) {
            return (
              <div
                key={index}
                className={`transition-all font-bold cursor-pointer ${
                  activeIndex === index 
                    ? `${isMobileView ? 'text-lg' : 'text-2xl'} text-blue-400` 
                    : 'text-gray-400 text-sm md:text-base'
                }`}
                onClick={() => handleClick(index)}
              >
                {event.year}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Contenido de la línea de tiempo - adaptado para móvil */}
      <div className="relative z-10 mt-16">
        {filteredTimelineData.map((event, index) => (
          <section
            key={index}
            ref={(el) => { sectionsRef.current[index] = el; }}
            className="timeline-section min-h-screen flex flex-col justify-center p-4 md:p-20 transition-opacity duration-500"
            style={{
              backgroundImage: loadedImages[index]
                ? `linear-gradient(to right, rgba(0,0,0,0.95), rgba(0,0,0,0.7)), url(${loadedImages[index]})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: activeIndex === index ? 1 : 0.3
            }}
          >
            <h2 className={`${isMobileView ? 'ml-16' : 'ml-16 md:ml-60'} text-white text-2xl md:text-5xl font-extrabold mb-3 md:mb-6 drop-shadow-lg drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]`}>
              {event.title}
            </h2>
            <p className={`${isMobileView ? 'ml-16' : 'ml-16 md:ml-60'} text-gray-300 text-base md:text-xl leading-relaxed drop-shadow-md p-2 rounded md:bg-transparent drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]`}>
              {event.description}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

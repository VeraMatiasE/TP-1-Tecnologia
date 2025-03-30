"use client"

import { useEffect, useState, useRef } from "react";
import timelineData from "./timelineData.json";

export default function Timeline() {
  const ages = ["all", "prehistory", "ancient-history", "middle-ages", "early-modern", "contemporary"]; 
  const edades = ["Todo", "Prehistoria", "Edad Antigua", "Edad Media", "Edad Moderna", "Edad Contemporanea"]; 

  const [activeIndices, setActiveIndices] = useState(
    ages.reduce((acc, age) => ({ ...acc, [age]: 0 }), {})
  );
  const [activeAge, setActiveAge] = useState("all");
  const sectionsRef = useRef([]);
  const [loadedImages, setLoadedImages] = useState({});
  const [filteredTimelineData, setFilteredTimelineData] = useState(timelineData);

  // Cambiar a la pestaña anterior o siguiente
  const changeTab = (direction) => {
    const currentIndex = ages.indexOf(activeAge);
    let newIndex;
    
    if (direction === 'right') {
      newIndex = (currentIndex + 1) % ages.length;
    } else { // left
      newIndex = (currentIndex - 1 + ages.length) % ages.length;
    }
    
    setActiveAge(ages[newIndex]);
  };

  useEffect(() => {
    // Filtrar datos según la edad seleccionada
    const filtered = activeAge === "all" 
      ? timelineData 
      : timelineData.filter(event => event.age === activeAge);
    
    setFilteredTimelineData(filtered);
    
    // Resetear el índice a 0 cuando cambias de pestaña
    setActiveIndices(prev => ({
      ...prev,
      [activeAge]: 0
    }));
    
    // Limpiar imágenes cargadas al cambiar de pestaña
    setLoadedImages({});
    
    // Scroll al primer elemento
    setTimeout(() => {
      if (sectionsRef.current[0]) {
        sectionsRef.current[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, [activeAge]);

  // Función auxiliar para actualizar el índice activo
  const setActiveIndex = (index) => {
    setActiveIndices(prev => ({
      ...prev,
      [activeAge]: index
    }));
  };

  // Obtener el índice activo para la edad actual
  const activeIndex = activeIndices[activeAge];

  // Navegar arriba/abajo entre eventos
  const navigateVertical = (direction) => {
    
    let newIndex;
    if (direction === 'down') {
      newIndex = Math.min(activeIndex + 1, filteredTimelineData.length - 1);
    } else { // up
      newIndex = Math.max(activeIndex - 1, 0);
    }
    
    // Actualizar el índice directamente, sin usar el callback
    setActiveIndices({
      ...activeIndices,
      [activeAge]: newIndex
    });
    
    // Desplazarse al elemento
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
    const newLoadedImages = {};
    filteredTimelineData.forEach((event, index) => {
      if (Math.abs(activeIndex - index) <= 2) {
        newLoadedImages[index] = event.image;
      }
    });
    setLoadedImages(prevLoadedImages => ({
      ...prevLoadedImages,
      ...newLoadedImages
    }));
  }, [activeIndex, filteredTimelineData]);

  const handleClick = (index) => {
    setActiveIndex(index);
    if (sectionsRef.current[index]) {
      sectionsRef.current[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleKeyDown = (event) => {
    // Navegación vertical (arriba/abajo) para años
    if (event.key === "ArrowDown") {
      navigateVertical('down');
    } else if (event.key === "ArrowUp") {
      navigateVertical('up');
    }
    
    // Navegación horizontal (izquierda/derecha) para pestañas
    if (event.key === "ArrowLeft") {
      changeTab('left');
    } else if (event.key === "ArrowRight") {
      changeTab('right');
    }
  };

  // Configurar el event listener para las teclas
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAge, activeIndex, filteredTimelineData]);

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Tabs de edades */}
      <div className="fixed top-0 left-0 right-0 z-30 flex justify-center space-x-4 p-4 "> 
        {ages.map((age,i) => (
          <button
            key={age}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-lg shadow-md 
              ${activeAge === age 
                ? "bg-blue-600 text-white shadow-blue-500/40 scale-110" 
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105"}`}
            onClick={() => setActiveAge(age)}
          >
            {
            edades[i]
            }
          </button>
        ))}
      </div>

      {/* Línea de tiempo fija */}
      <div className="fixed left-11 top-1/4 bottom-1/4 w-1 bg-gray-700 z-20"></div>

      {/* Puntos de la línea de tiempo */}
      <div className="fixed left-10 top-1/4 bottom-1/4 flex flex-col items-center justify-around z-20">
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

      {/* Años a la izquierda */}
      <div className="fixed left-16 top-1/4 bottom-1/4 flex flex-col items-start justify-around text-white z-20">
        {filteredTimelineData.map((event, index) => {
          if (Math.abs(activeIndex - index) <= 2) {
            return (
              <div
                key={index}
                className={`transition-all font-bold cursor-pointer ${
                  activeIndex === index ? "text-2xl text-blue-400" : "text-gray-400"
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

      {/* Contenido de la línea de tiempo */}
      <div className="relative z-10 mt-16">
        {filteredTimelineData.map((event, index) => (
          <section
            key={index}
            ref={(el) => (sectionsRef.current[index] = el)}
            className="timeline-section min-h-screen flex flex-col justify-center p-20 transition-opacity duration-500"
            style={{
              backgroundImage: loadedImages[index]
                ? `linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0)), url(${loadedImages[index]})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: activeIndex === index ? 1 : 0.3
            }}
          >

                <h2 className="ml-60 text-white text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg  drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{event.title}</h2>
                <p className="ml-60 text-gray-300 text-lg md:text-xl leading-relaxed drop-shadow-md p-2 rounded  drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">{event.description}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
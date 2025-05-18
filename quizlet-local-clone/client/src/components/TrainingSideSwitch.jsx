
import React, { useEffect } from 'react';
import './TrainingSideSwitch.css';

/**
 * Switch à trois positions pour choisir le côté d'entraînement (terme, définition, les deux)
 * @param {Object} props - Propriétés du composant
 * @param {string} props.value - Valeur actuelle ("term", "definition", "both")
 * @param {function} props.onChange - Fonction appelée lors du changement de valeur
 */
export default function TrainingSideSwitch({ value = "term", onChange }) {
  const options = [
    { id: "term", label: "Terme" },
    { id: "definition", label: "Définition" },
    { id: "both", label: "Les deux" }
  ];

  // Persister la valeur dans localStorage à chaque changement
  useEffect(() => {
    if (value) {
      localStorage.setItem('trainingSideValue', value);
    }
  }, [value]);

  return (
    <div className="q-training-switch-container">
      <div className="q-training-switch">
        {options.map(option => (
          <button
            key={option.id}
            className={`q-training-switch-option ${value === option.id ? 'active' : ''}`}
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
          >
            {option.label}
          </button>
        ))}
        <div 
          className="q-training-switch-slider" 
          style={{ 
            left: value === "term" ? "0%" : value === "definition" ? "33.33%" : "66.66%"
          }}
        />
      </div>
    </div>
  );
}
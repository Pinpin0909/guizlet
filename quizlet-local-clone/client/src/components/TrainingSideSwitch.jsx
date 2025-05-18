// TrainingSideSwitch.jsx
import React from "react";

const options = [
  { value: "term", label: "Termes" },
  { value: "definition", label: "Définitions" },
  { value: "both", label: "Les deux" },
];

export default function TrainingSideSwitch({ value, onChange }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            background: value === opt.value ? "#ff9400" : "#181b3a",
            color: value === opt.value ? "#222" : "#ff9400",
            border: "1px solid #ff9400",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 18,
            padding: "5px 16px",
            cursor: "pointer",
            outline: "none",
            margin: "0 5px"
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

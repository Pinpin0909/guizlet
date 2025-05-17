import React from "react";

export default function SearchBar({ value, onChange }) {
  return (
    <form
      onSubmit={e => e.preventDefault()} // pour éviter le rechargement de page
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        marginLeft: 50,
        marginRight: 40,
      }}
    >
      <input
        type="text"
        placeholder="Rechercher des tests d'entraînement"
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        style={{
          width: "100%",
          background: "var(--q-bg-card)",
          color: "var(--q-text)",
          border: "none",
          borderRadius: 8,
          fontSize: 18,
          padding: "0.65em 1.1em",
          outline: "none",
          boxShadow: "var(--q-shadow)"
        }}
      />
    </form>
  );
}
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import SetDetail from "./components/SetDetail";
import EditSet from "./components/EditSet";
import FlashcardsMode from "./modes/FlashcardsMode";
import LearnMode from "./modes/LearnMode";
import WriteMode from "./modes/WriteMode";
import SpellMode from "./modes/SpellMode";
import TestMode from "./modes/TestMode";
import MatchMode from "./modes/MatchMode";
import GravityMode from "./modes/GravityMode";

// Sidebar component
function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: "var(--q-bg-card)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "1em 0",
        boxShadow: "var(--q-shadow)",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      <div style={{ padding: "0 1.2em 1.2em 1.2em", fontWeight: 700, fontSize: 26 }}>
        <span style={{ marginRight: 7, fontSize: 24 }}>🔍</span>
        Quizlet Local
      </div>
      <nav>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0.7em 1.2em",
            background: "var(--q-bg)",
            color: "var(--q-text)",
            borderLeft: "4px solid var(--q-primary)",
            textDecoration: "none",
            fontWeight: 600,
            marginBottom: 5,
            borderRadius: 0,
          }}
        >
          🏠 Accueil
        </Link>
        <Link
          to="/sets/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0.7em 1.2em",
            background: "none",
            color: "var(--q-text)",
            borderLeft: "4px solid transparent",
            textDecoration: "none",
            fontWeight: 400,
            marginBottom: 5,
            borderRadius: 0,
          }}
        >
          ➕ Créer une liste
        </Link>
      </nav>
      <div style={{ marginTop: "2em", color: "var(--q-text-light)", fontSize: 13, paddingLeft: "1.2em" }}>
        <div>Commencez ici</div>
        <div style={{ margin: "0.7em 0 0.7em 0.3em" }}>
          <div>📇 Cartes</div>
          <div>📝 Programmes d'étude</div>
        </div>
      </div>
    </aside>
  );
}

// SearchBar component
function SearchBar({ value, onChange }) {
  return (
    <form
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        marginLeft: 50,
        marginRight: 40,
      }}
      onSubmit={e => e.preventDefault()}
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
          boxShadow: "var(--q-shadow)",
        }}
      />
    </form>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--q-bg)" }}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            marginLeft: 220,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              padding: "1em 1.5em 0.5em 0",
              background: "var(--q-bg)",
              borderBottom: "1px solid var(--q-border)",
              position: "sticky",
              top: 0,
              zIndex: 9,
            }}
          >
            <SearchBar value={search} onChange={setSearch} />
            <Link to="/sets/new">
              <button
                style={{
                  marginLeft: 16,
                  background: "var(--q-primary)",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "0.55em 1.2em",
                  borderRadius: 20,
                  border: "none",
                }}
              >
                +
              </button>
            </Link>
            <button
              style={{
                marginLeft: 24,
                background: "var(--q-accent)",
                color: "#222",
                padding: "0.55em 1.2em",
                borderRadius: 20,
                border: "none",
                fontWeight: "bold",
              }}
              disabled
              title="Fonctionnalité à venir"
            >
              Obtenir un essai gratuit
            </button>
            <div
              style={{
                marginLeft: 24,
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--q-bg-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              J
            </div>
          </header>
          <main
            style={{
              flex: 1,
              padding: "2.5em 2em",
              background: "var(--q-bg)",
              minHeight: "100vh",
            }}
          >
            <Routes>
              <Route path="/" element={<Home search={search} />} />
              <Route path="/sets/new" element={<EditSet />} />
              <Route path="/sets/:id" element={<SetDetail />} />
              <Route path="/sets/:id/flashcards" element={<FlashcardsMode />} />
              <Route path="/sets/:id/learn" element={<LearnMode />} />
              <Route path="/sets/:id/write" element={<WriteMode />} />
              <Route path="/sets/:id/spell" element={<SpellMode />} />
              <Route path="/sets/:id/test" element={<TestMode />} />
              <Route path="/sets/:id/match" element={<MatchMode />} />
              <Route path="/sets/:id/gravity" element={<GravityMode />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
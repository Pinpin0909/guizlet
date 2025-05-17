import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { TbTrash } from 'react-icons/tb' // Tabler Trash icon

export default function Home({ search }) {
  const [sets, setSets] = useState([])

  useEffect(() => {
    axios.get('/api/sets').then(r => setSets(r.data))
  }, [])

  // Suppression d'une liste
  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette liste ?")) {
      await axios.delete(`/api/sets/${id}`)
      setSets(sets => sets.filter(set => set.id !== id))
    }
  }

  // Filtre avec recherche
  const filteredSets = !search
    ? sets
    : sets.filter(set =>
        set.title.toLowerCase().includes(search.toLowerCase()) ||
        set.description?.toLowerCase().includes(search.toLowerCase())
      )

  return (
    <div>
      <h2 style={{color: "var(--q-text-light)", fontWeight: 500}}>Récemment consultées</h2>
      <div style={{display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 40}}>
        {filteredSets.map(set =>
          <div key={set.id}
            style={{
              background: "var(--q-bg-card)",
              borderRadius: 16,
              minWidth: 240, minHeight: 120,
              boxShadow: "var(--q-shadow)",
              padding: "1.2em 1.2em 0.5em 1.2em",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: "var(--q-text)",
              position: "relative"
            }}>
            {/* Bouton supprimer en haut à droite */}
            <button
              onClick={() => handleDelete(set.id)}
              title="Supprimer cette liste"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "#ff6700",
                border: "none",
                borderRadius: 12,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px #0002",
                cursor: "pointer",
                transition: "background 0.18s",
                zIndex: 2,
                padding: 0
              }}
              onMouseOver={e => e.currentTarget.style.background = "#ff884d"}
              onMouseOut={e => e.currentTarget.style.background = "#ff6700"}
            >
              <TbTrash size={20} color="#fff" />
            </button>
            <Link to={`/sets/${set.id}`} style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--q-primary)",
              textDecoration: "none",
              marginBottom: 8,
              marginTop: 6,
              wordBreak: "break-word"
            }}>
              {set.title}
            </Link>
            <div style={{
              color: "var(--q-text-light)",
              fontSize: 14,
              margin: "0.5em 0",
              minHeight: 24,
              wordBreak: "break-word"
            }}>
              {set.description}
            </div>
          </div>
        )}
        {filteredSets.length === 0 && (
          <div style={{
            color: "var(--q-text-light)",
            fontSize: 17,
            opacity: 0.7,
            margin: "2em auto"
          }}>
            Aucune liste trouvée.
          </div>
        )}
      </div>
    </div>
  )
}
// src/Components/StatCard.jsx
import formatCOP from "../Services/utils";
import "./StatCard.css"; // opcional si quieres estilos separados

export default function StatCard({ title, value, type }) {
    return (
        <div className={`card ${type}`}>
            <h3>{title}</h3>
            <p>{formatCOP(value)}</p>
        </div>
    );
}
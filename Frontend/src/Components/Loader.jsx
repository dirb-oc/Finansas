
import { LoaderCircle } from "lucide-react";
import "./Loader.css";

export default function Loader({ message = "Cargando..." }) {
    return (
        <div className="loader-container">
            <LoaderCircle className="loader-spinner" size={36} />
            <p>{message}</p>
        </div>
    );
}

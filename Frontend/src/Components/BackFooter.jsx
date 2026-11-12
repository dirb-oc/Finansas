
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./BackFooter.css";

export default function BackFooter({ to }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <footer className="back-footer">
            <hr />

            <button
                type="button"
                className="back-footer-button"
                onClick={handleBack}
            >
                <ArrowLeft size={18} strokeWidth={2} />
                <span>Ir hacia atras</span>
            </button>
        </footer>
    );
}

import { useEffect } from "react";
import "./Modal.css";

function Modal({ isOpen, onClose, className, children }) {

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === "Escape") { onClose(); } };
        document.addEventListener("keydown", handleEscape);

        return () => document.removeEventListener("keydown", handleEscape);

    }, [onClose]);

    if (!isOpen) return null;

    return (

        <div className="modal-overlay" onClick={onClose}>

            <div className={`modal-content ${className}`}  onClick={(e) => e.stopPropagation()} >
                <div className="modal-body">{children}</div>
            </div>

        </div>

    );
}

export default Modal;
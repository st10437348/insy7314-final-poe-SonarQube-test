import { Link } from "react-router-dom";
import "./Hero.css";

function Hero({ title, description, primary, secondary }) {
    return (
        <section className="hero">
            <div className="hero-content">
                <h1>{title}</h1>
                <p>{description}</p>
                <div className="hero-buttons">
                    <Link to={primary.to} className="button hero-button">
                        {primary.label}
                    </Link>
                    <Link to={secondary.to} className="button button-secondary hero-button">
                        {secondary.label}
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default Hero;

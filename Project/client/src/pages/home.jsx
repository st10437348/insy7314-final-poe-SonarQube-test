import { Link } from "react-router-dom";
import Hero from "../components/common/Hero";
import { useAuth } from "../context/AuthContext";

const homeContent = {
    Guest: {
        title: "Find Work. Hire Talent. Grow.",
        description: "HustleHub+ connects clients with talented freelancers for projects of all kinds.",
        primary: { label: "Browse Gigs", to: "/marketplace" },
        secondary: { label: "Create Account", to: "/signup" },
        features: [
            { title: "Explore Services", description: "Discover services offered by freelancers.", to: "/marketplace" },
            { title: "Join HustleHub+", description: "Create a client or freelancer account to get started.", to: "/signup" },
            { title: "Already a Member?", description: "Sign in to manage your work and bookings.", to: "/login" }
        ],
        stepsHeading: "Start hustling in three steps.",
        steps: [
            { title: "Create an account", description: "Choose whether you are here to hire or offer a service." },
            { title: "Explore the marketplace", description: "Browse the services available from freelancers." },
            { title: "Get started", description: "Book a gig or publish one of your own." }
        ],
        ctaTitle: "Turn your ideas into opportunities.",
        ctaDescription: "Join HustleHub+ to book a service or offer your skills.",
        cta: { label: "Create Account", to: "/signup" }
    },
    Client: {
        title: "Find the right service for your project.",
        description: "Browse gigs, book a freelancer, and follow your requests in one place.",
        primary: { label: "Browse Gigs", to: "/marketplace" },
        secondary: { label: "My Bookings", to: "/bookings" },
        features: [
            { title: "Browse Services", description: "Find a freelancer for your next project.", to: "/marketplace" },
            { title: "Track Bookings", description: "See the status of every service you have booked.", to: "/bookings" },
            { title: "My Profile", description: "Keep your account information up to date.", to: "/profile" }
        ],
        stepsHeading: "Book a service in three steps.",
        steps: [
            { title: "Browse gigs", description: "Find a service that matches your project." },
            { title: "Confirm a booking", description: "Choose a date and send your request." },
            { title: "Track progress", description: "Follow the booking and its transaction." }
        ],
        ctaTitle: "Ready to get your project moving?",
        ctaDescription: "Explore available gigs and choose the right service.",
        cta: { label: "Browse Gigs", to: "/marketplace" }
    },
    Freelancer: {
        title: "Build your freelance business.",
        description: "Publish services, manage client bookings, and track your income.",
        primary: { label: "My Gigs", to: "/my-gigs" },
        secondary: { label: "Create a Gig", to: "/create-gig" },
        features: [
            { title: "Manage Gigs", description: "Create and update the services you offer.", to: "/my-gigs" },
            { title: "Manage Bookings", description: "Accept work and keep clients informed.", to: "/bookings" },
            { title: "Track Income", description: "See completed earnings and estimated tax.", to: "/income" }
        ],
        stepsHeading: "Grow your work in three steps.",
        steps: [
            { title: "Create a gig", description: "Publish the service you want to offer." },
            { title: "Manage bookings", description: "Accept requests and update their progress." },
            { title: "Track income", description: "Review completed earnings and estimated tax." }
        ],
        ctaTitle: "Ready for your next client?",
        ctaDescription: "Publish a service to make it available in the marketplace.",
        cta: { label: "Create a Gig", to: "/create-gig" }
    },
    Admin: {
        title: "Keep the marketplace running.",
        description: "Review users, gigs, bookings, and platform activity.",
        primary: { label: "Admin Dashboard", to: "/admin" },
        secondary: { label: "Manage Users", to: "/admin/users" },
        features: [
            { title: "Manage Users", description: "Review accounts and their roles.", to: "/admin/users" },
            { title: "Manage Gigs", description: "Review services listed on the platform.", to: "/admin/gigs" },
            { title: "Review Bookings", description: "Follow and manage marketplace bookings.", to: "/admin/bookings" }
        ],
        stepsHeading: "Review the platform in three steps.",
        steps: [
            { title: "Manage users", description: "Review accounts and role assignments." },
            { title: "Review listings", description: "Keep marketplace gigs in order." },
            { title: "Follow activity", description: "Monitor bookings and platform usage." }
        ],
        ctaTitle: "Review platform activity.",
        ctaDescription: "Open the dashboard for a summary of the marketplace.",
        cta: { label: "Open Dashboard", to: "/admin" }
    }
};

function Home() {
    const { user } = useAuth();
    const content = homeContent[user?.role] || homeContent.Guest;

    return (
        <div className="home-page">
            <Hero {...content} />

            <section className="features">
                <div className="section-container">
                    <div className="section-heading">
                        <span className="section-eyebrow">WHY HUSTLEHUB+</span>
                        <h2>Everything you need to<span> build your hustle.</span></h2>
                        <p>Find the next step for your account and continue where you left off.</p>
                    </div>

                    <div className="feature-grid">
                        {content.features.map((feature, index) => (
                            <Link className="feature-card" key={feature.to} to={feature.to}>
                                <span className="feature-number">0{index + 1}</span>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <span className="feature-arrow" aria-hidden="true">→</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="how-it-works" id="how-it-works">
                <div className="section-container">
                    <div className="section-heading">
                        <span className="section-eyebrow">HOW IT WORKS</span>
                        <h2>{content.stepsHeading}</h2>
                    </div>

                    <div className="steps-grid">
                        {content.steps.map((step, index) => (
                            <div className="step" key={step.title}>
                                <span>0{index + 1}</span>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-cta">
                <div className="section-container">
                    <div className="cta-card">
                        <span className="section-eyebrow">YOUR NEXT STEP</span>
                        <h2>{content.ctaTitle}</h2>
                        <p>{content.ctaDescription}</p>
                        <Link className="button cta-button" to={content.cta.to}>
                            {content.cta.label} <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

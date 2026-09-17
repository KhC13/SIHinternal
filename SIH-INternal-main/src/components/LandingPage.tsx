import { ArrowRight, BarChart3, Building2, ChevronRight, ClipboardCheck, FileText, Lightbulb, Menu, Network, Play, Rocket, ShieldCheck, Sparkles, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LandingPageProps { onOpenAuth: () => void; }

const journey = [
	{ icon: Building2, number: '01', title: 'Government Problems', text: 'Departments publish real challenges for innovators to solve.' },
	{ icon: Rocket, number: '02', title: 'Startup Ecosystem', text: 'Discover and respond to verified public-sector needs.' },
	{ icon: Sparkles, number: '03', title: 'AI-Powered Matching', text: 'Find the best-fit solutions with explainable AI.' },
	{ icon: Lightbulb, number: '04', title: 'Pilot & Validate', text: 'Test solutions in the field with measurable outcomes.' },
	{ icon: ClipboardCheck, number: '05', title: 'Procurement & Scale', text: 'Move proven innovation into transparent procurement.' },
	{ icon: BarChart3, number: '06', title: 'Data & Analytics', text: 'Track impact, adoption, and value at every stage.' },
];

const processSteps: Array<[string, string, LucideIcon]> = [
	['01', 'Publish Challenge', FileText],
	['02', 'Discover Startups', Rocket],
	['03', 'AI Matchmaking', Sparkles],
	['04', 'Evaluate & Shortlist', ClipboardCheck],
	['05', 'Pilot & Track', Lightbulb],
	['06', 'Procurement', ShieldCheck],
];

const heroImages = [
	'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=2000&q=85',
	'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=2000&q=85',
	'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=2000&q=85',
	'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2000&q=85',
];

export function LandingPage({ onOpenAuth }: LandingPageProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [heroImageIndex, setHeroImageIndex] = useState(0);
	const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };

	useEffect(() => {
		const timer = window.setInterval(() => {
			setHeroImageIndex((currentIndex) => (currentIndex + 1) % heroImages.length);
		}, 2000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<div className="landing-page">
			<header className="landing-nav">
				<button className="landing-brand" onClick={() => scrollTo('top')} aria-label="Go to top"><span className="landing-brand-mark"><ShieldCheck size={22} /></span><span><strong>InnovProcure</strong><small>Innovation for Maharashtra</small></span></button>
				<nav className={menuOpen ? 'landing-links is-open' : 'landing-links'}>
					<button onClick={() => scrollTo('how-it-works')}>How It Works</button><button onClick={() => scrollTo('impact')}>Government</button><button onClick={() => scrollTo('ecosystem')}>Startups</button><button onClick={() => scrollTo('impact')}>Impact</button>
					<button className="landing-mobile-cta" onClick={onOpenAuth}>Open platform <ArrowRight size={15} /></button>
				</nav>
				<div className="landing-nav-actions"><button className="landing-login" onClick={onOpenAuth}>Log in</button><button className="landing-primary small" onClick={onOpenAuth}>Get Started <ArrowRight size={15} /></button><button className="landing-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
			</header>

			<main id="top">
				<section className="landing-hero"><div className="landing-hero-image" style={{ backgroundImage: `url('${heroImages[heroImageIndex]}')` }} key={heroImageIndex} /><div className="landing-hero-overlay" /><div className="landing-hero-content"><div className="landing-kicker"><span /> Government of Maharashtra</div><h1>From Government Problems to <em>Scalable Innovation</em></h1><p>Connect public-sector challenges with bold ideas, validated solutions, and measurable impact. Together, we build a more innovative Maharashtra.</p><div className="landing-hero-actions"><button className="landing-primary" onClick={onOpenAuth}>Explore the Platform <ArrowRight size={17} /></button><button className="landing-secondary" onClick={() => scrollTo('how-it-works')}><Play size={15} fill="currentColor" /> See How It Works</button></div></div><div className="landing-hero-note"><Network size={17} /> A shared path from problem to public impact</div></section>

				<section className="landing-journey" id="ecosystem"><div className="landing-section-heading"><span className="landing-overline">One connected ecosystem</span><h2>Innovation that moves with purpose.</h2><p>Every step is designed to turn the right idea into a solution people can feel.</p></div><div className="landing-journey-grid">{journey.map(({ icon: Icon, number, title, text }) => <article className="landing-journey-item" key={title}><div className="landing-icon"><Icon size={21} /></div><span className="landing-step">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

				<section className="landing-path" id="how-it-works"><div className="landing-section-heading left"><span className="landing-overline">How it works</span><h2>A seamless path from problem to impact.</h2><p>A structured, transparent workflow that helps departments and startups move from first conversation to meaningful change.</p><button className="landing-text-button" onClick={onOpenAuth}>Explore the process <ChevronRight size={17} /></button></div><div className="landing-process-map">{processSteps.map(([step, label, Icon]) => <div className="landing-process-step" key={step}><span>{step}</span><div><Icon size={18} /><strong>{label}</strong></div></div>)}</div></section>

				<section className="landing-impact" id="impact"><div className="landing-impact-copy"><span className="landing-overline">Building a more innovative Maharashtra</span><h2>Real problems. Creating lasting impact.</h2><p>From resilient cities to better public services, the strongest ideas are already taking shape across Maharashtra.</p><div className="landing-impact-stats"><div><strong>20+</strong><span>Departments</span></div><div><strong>50+</strong><span>Challenges solved</span></div><div><strong>150+</strong><span>Startups engaged</span></div><div><strong>80+</strong><span>Solutions scaled</span></div></div></div><div className="landing-impact-images"><div className="impact-image city" /><div className="impact-image nature" /><div className="impact-image water" /></div></section>
			</main>

			<footer className="landing-footer"><div><span className="landing-brand-mark"><ShieldCheck size={18} /></span><strong>InnovProcure</strong></div><span>Innovation for Maharashtra</span><button onClick={onOpenAuth}>Enter the platform <ArrowRight size={15} /></button></footer>
		</div>
	);
}

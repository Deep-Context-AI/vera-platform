import React from 'react';
import Header from './components/Header';
import { AnimatedHero } from './components/AnimatedHero';
import VeraLogoSection from './components/VeraLogoSection';
import SocialProofBar from './components/SocialProofBar';
import ProblemSolutionSection from './components/ProblemSolutionSection';
import ValuePropTiles from './components/ValuePropTiles';
import LiveMetrics from './components/LiveMetrics';
import ProductDemo from './components/ProductDemo';
import WorkflowDiagram from './components/WorkflowDiagram';
import SecurityCompliance from './components/SecurityCompliance';
import IntegrationsSection from './components/IntegrationsSection';
import PricingSection from './components/PricingSection';
import FAQSection from './components/FAQSection';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import { BoltNewBadge } from './components/ui/BoltNewBadge';

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <AnimatedHero />
      <VeraLogoSection />
      <SocialProofBar />
      <ProblemSolutionSection />
      <ValuePropTiles />
      <LiveMetrics />
      <ProductDemo />
      <WorkflowDiagram />
      <SecurityCompliance />
      <IntegrationsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <BoltNewBadge 
        position="bottom-right" 
        variant="auto" 
        size="medium"
      />
    </div>
  );
}

export default App;
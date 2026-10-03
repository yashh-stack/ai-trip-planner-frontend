import { ItineraryView } from '../components/ItineraryView';
import { TripForm } from '../components/TripForm';
import { useSSEItinerary } from '../hooks/useSSEItinerary';

export default function Home() {
  const generation = useSSEItinerary();

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/">
          <span aria-hidden="true">AI</span>
          AI Trip Planner
        </a>
        <span>Built at Google Gen AI Exchange Hackathon 2025</span>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <span className="section-label">Streaming RAG travel planning</span>
          <h1>Plan a richer trip before your coffee cools.</h1>
          <p>
            Tell the planner where you are going, then watch grounded local knowledge turn into a day-by-day itinerary
            with maps, costs, and shareable trip links.
          </p>
        </div>
        <TripForm onSubmit={generation.generate} status={generation.status} />
      </section>

      <ItineraryView
        error={generation.error}
        itinerary={generation.itinerary}
        status={generation.status}
        tokens={generation.tokens}
      />

      <footer className="site-footer">
        <span>Powered by Gemini 1.5 Flash · RAG · Streamed via SSE · Open source</span>
        <a href="https://github.com/Yashsh101/ai-trip-planner-frontend" rel="noreferrer" target="_blank">
          GitHub
        </a>
      </footer>
    </main>
  );
}

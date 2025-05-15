// Main application component
const App = () => {
    const [query, setQuery] = React.useState("");
    const [recommendations, setRecommendations] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [sentiment, setSentiment] = React.useState(null);
    const [searched, setSearched] = React.useState(false);
    const [error, setError] = React.useState(null);

    const API_URL = "http://localhost:5000/api/recommend";
    
    const handleSearch = async () => {
        if (!query.trim()) return;
        
        setLoading(true);
        setSearched(true);
        setError(null);
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    top_k: 3
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            setSentiment(data.sentiment);
            setRecommendations(data.recommendations);
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            setError(`Failed to get recommendations: ${err.message}`);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="container">
            <div className="input-section">
                <h2>Tell us about your coffee preferences</h2>
                <p>Describe what you like or dislike in a coffee, such as flavor notes, roast level, or brewing method.</p>
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="e.g., I love a rich and bold coffee with chocolate notes"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>Find My Match</button>
                </div>
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                {sentiment && (
                    <div className="sentiment-info">
                        <p>
                            <span className="sentiment-label">Sentiment analysis:</span> {sentiment.label} (confidence: {(sentiment.score * 100).toFixed(0)}%)
                        </p>
                        <p>
                            {sentiment.label === "POSITIVE" 
                                ? "We found coffees similar to your preferences." 
                                : "We found coffees that might provide an alternative to what you described."}
                        </p>
                    </div>
                )}
            </div>
            
            {loading ? (
                <div className="loading">
                    <div className="beans-loader">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <p>Brewing your recommendations...</p>
                </div>
            ) : (
                <>
                    {searched && recommendations.length === 0 && !error ? (
                        <div className="no-results">
                            <h3>No matches found</h3>
                            <p>Try adjusting your search query to be more specific about flavors or brewing methods.</p>
                        </div>
                    ) : (
                        recommendations.length > 0 && (
                            <>
                                <h2>Your Coffee Matches</h2>
                                <div className="recommendations">
                                    {recommendations.map((coffee, index) => (
                                        <div className="coffee-card" key={index}>
                                            <div className="coffee-image">
                                                {coffee.coffee_name}
                                            </div>
                                            <div className="coffee-info">
                                                <h3 className="coffee-name">{coffee.coffee_name}</h3>
                                                <p className="coffee-review">{coffee.review}</p>
                                                <span className="match-score">
                                                    {coffee.match_score}% Match
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )
                    )}
                </>
            )}
            
            <div className="about-section">
                <h2>How It Works</h2>
                <p>Coffee Match uses advanced natural language processing to understand your coffee preferences. Our system:</p>
                <ul>
                    <li>Analyzes the sentiment of your description (positive or negative)</li>
                    <li>Creates an embedding (vector representation) of your preferences</li>
                    <li>Searches our database for coffee reviews with similar characteristics</li>
                    <li>If your sentiment is positive, we find coffees similar to your description</li>
                    <li>If your sentiment is negative, we find coffees that are different from what you described</li>
                </ul>
                <p>This approach helps you discover coffees that match your taste profile or expand your horizons with new flavors!</p>
            </div>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('app'));

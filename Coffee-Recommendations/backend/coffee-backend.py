from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import faiss

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes to allow frontend requests

# Load model and data (do this at startup to avoid reloading for each request)
print("Loading models and data...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
sentiment_model = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# Load dataset
df = pd.read_csv("coffee_reviewsV2.csv")
reviews = df["review"].dropna().tolist()
coffee_names = df["coffee_name"].dropna().tolist()

# Build FAISS index
review_embeddings = embedding_model.encode(reviews, convert_to_numpy=True)
dimension = review_embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(review_embeddings)
print("Models and data loaded successfully!")

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    # Get user input from request
    data = request.json
    user_input = data.get('query', '')
    top_k = data.get('top_k', 3)
    
    if not user_input:
        return jsonify({'error': 'Query is required'}), 400
    
    try:
        # 1. Analyze sentiment
        sentiment_result = sentiment_model(user_input)[0]
        sentiment = {
            'label': sentiment_result['label'],
            'score': float(sentiment_result['score'])  # Convert to float for JSON serialization
        }
        
        # 2. Embed user input
        user_embedding = embedding_model.encode([user_input], convert_to_numpy=True)
        
        # 3. Search similar reviews
        distances, indices = index.search(user_embedding, k=len(reviews))
        
        # 4. Select recommendations based on sentiment
        if sentiment['label'] == "POSITIVE":
            selected_indices = indices[0][:top_k]  # Most similar
        else:
            selected_indices = indices[0][-top_k:]  # Least similar (opposite taste)
        
        # 5. Prepare recommendations with coffee names and matching scores
        recommendations = []
        for i, idx in enumerate(selected_indices):
            # Convert distance to a similarity score (0-100%)
            # Lower distance means higher similarity, so we invert it
            max_distance = 10.0  # Normalize based on your typical distance range
            similarity = max(0, min(100, 100 * (1 - (distances[0][i] / max_distance))))
            
            recommendations.append({
                "coffee_name": coffee_names[idx],
                "review": reviews[idx],
                "match_score": int(similarity)
            })
        
        return jsonify({
            'sentiment': sentiment,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("App is now Running")
    app.run(debug=True, port=5000)
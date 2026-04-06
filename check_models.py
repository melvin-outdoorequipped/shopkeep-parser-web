import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load your API key from the .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") # Use the key name from your .env file

if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file")
else:
    genai.configure(api_key=api_key)

    print("Available models for content generation:\n")
    # List all models and filter for those that can generate content
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"- {model.name}")
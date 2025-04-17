# Call to openAI API
import os
import openai
from dotenv import load_dotenv

def generate_response(prompt):
    # Load environment variables from .env file
    load_dotenv()

    # Set up the OpenAI API key
    openai.api_key = os.getenv("OPENAI_API_KEY")

    try:
        # Make the API call
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract and print the response
        result = response.choices[0].message.content
        print(result)
        return result
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
    
if __name__ == "__main__":
    user_prompt = "Hi This is a test, please reply by saying Hello!"
    generate_response(user_prompt)
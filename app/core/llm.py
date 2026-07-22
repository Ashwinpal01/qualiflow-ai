import os
from openai import OpenAI

from app.config import get_settings

def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Calls the OpenAI API to generate a response based on the provided prompts.
    """
    settings = get_settings()
    api_key = settings.openrouter_api_key
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    
    response = client.chat.completions.create(
        model=settings.openrouter_model or "openai/gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.0
    )
    
    return response.choices[0].message.content

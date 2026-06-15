import os
import json
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent.parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(f"CRITICAL: OPENAI_API_KEY is missing at: {env_path}")
            
        # OpenRouter requires identification headers for free tier traffic verification
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            default_headers={
                "HTTP-Referer": "http://localhost:8000", # Can be your local site URL
                "X-Title": "AI Testing Automation"   # The name of your tool
            }
        )

    async def generate_test_cases(self, scenario_text: str) -> dict:
        """
        Sends the user scenario to OpenRouter and requests a highly structured JSON array
        using a free open-source model.
        """
        system_prompt = (
            "You are an expert QA Automation Engineer. Your task is to convert high-level system "
            "scenarios into structured, step-by-step test cases format.\n\n"
            "You MUST respond ONLY with a raw JSON object matching this schema exactly:\n"
            "{\n"
            "  \"test_cases\": [\n"
            "    { \"id\": 1, \"step\": \"Description\", \"action\": \"goto|fill|click|assert\", \"target\": \"selector\", \"value\": \"data\" }\n"
            "  ]\n"
            "}\n"
            "Do not include any markdown styling like ```json or any conversational prose."
        )

        try:
            # Using an excellent, ultra-fast free model from OpenRouter
            response = self.client.chat.completions.create(
                model="google/gemma-3-12b-it:free",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Scenario: {scenario_text}"}
                ],
                temperature=0.2
            )
            
            raw_content = response.choices[0].message.content.strip()
            return json.loads(raw_content)

        except Exception as e:
            return {
                "error": f"AI Generation failed ({str(e)})",
                "test_cases": [
                    {
                        "id": 1,
                        "step": f"Fallback: Open browser for scenario -> {scenario_text}",
                        "action": "goto",
                        "target": "[https://example.com](https://example.com)",
                        "value": ""
                    }
                ]
            }
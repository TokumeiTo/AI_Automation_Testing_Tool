import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        # Grabs your API key from the environment variables
        # For now, it will look for an environment variable named OPENAI_API_KEY
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_test_cases(self, scenario_text: str) -> dict:
        """
        Sends the user scenario to OpenAI and requests a highly structured JSON array
        of executable steps for Playwright.
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
            # We use the standard gpt-4o-mini here to keep it free/cheap for our demo target
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Scenario: {scenario_text}"}
                ],
                temperature=0.2 # Lower temperature means more predictable, structured responses
            )
            
            # Extract text response and convert to a clean python dictionary
            raw_content = response.choices[0].message.content.strip()
            return json.loads(raw_content)

        except Exception as e:
            # Fallback mock payload if the API key is missing or calls fail during local dev testing
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
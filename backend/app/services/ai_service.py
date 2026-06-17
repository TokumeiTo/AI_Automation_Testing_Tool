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
        # We look for OPENAI_API_KEY from your .env since it holds your sk-or-v1-... key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(f"CRITICAL: OPENAI_API_KEY string is empty at: {env_path}")
            
        # Initialize the baseline OpenRouter connection gateway client
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key
        )

    async def generate_test_cases(self, scenario_text: str) -> dict:
        """
        Sends the automation request directly to Groq's engine layer and
        enforces a strict structural JSON array output response block.
        """
        system_prompt = (
            "You are an expert QA Automation Engineer. Your task is to convert high-level system "
            "scenarios into a structured, step-by-step test case format.\n\n"
            "You MUST respond ONLY with a raw JSON object matching this schema exactly:\n"
            "{\n"
            "  \"test_cases\": [\n"
            "    { \"id\": 1, \"step\": \"Description\", \"action\": \"goto|fill|click|assert\", \"target\": \"selector\", \"value\": \"data\" }\n"
            "  ]\n"
            "}\n"
            "Do not include any conversational text, explanations, or markdown code blocks like ```json."
        )

        try:
            # We move headers right here into the create() method to force compliance
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Scenario: {scenario_text}"}
                ],
                temperature=0.1,
            )
            
            raw_content = response.choices[0].message.content.strip()
            
            # Simple safeguard: If the model accidentally sends markdown back, strip it off clean
            if raw_content.startswith("```"):
                raw_content = raw_content.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
                if raw_content.startswith("json"):
                    raw_content = raw_content.split("\n", 1)[1].strip()

            return json.loads(raw_content)

        except Exception as e:
            return {
                "error": f"Groq Live Engine Error: {str(e)}",
                "test_cases": [
                    {
                        "id": 1,
                        "step": f"Fallback Parsing Trace: {scenario_text}",
                        "action": "goto",
                        "target": "https://example.com",
                        "value": ""
                    }
                ]
            }
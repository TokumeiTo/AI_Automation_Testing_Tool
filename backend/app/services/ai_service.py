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
            "    { \"id\": 1, \"step\": \"Description\", \"action\": \"goto|fill|click|assert|keyboard|select|clear_storage|wait\", \"target\": \"selector\", \"value\": \"data\" }\n"
            "  ]\n"
            "}\n\n"
            "RULES FOR THE 'goto' ACTION:\n"
            "- Use action: \"goto\"\n"
            "- Place the complete destination URL (e.g., \"https://www.google.com\", \"/dashboard\") explicitly inside \"target\".\n"
            "- Leave \"value\" as an empty string (\"\").\n\n"
            "RULES FOR THE 'select' ACTION:\n"
            "- Use action: \"select\"\n"
            "- Place the CSS or XPath dropdown element selector in \"target\".\n"
            "- Place the display text label or value option to select inside \"value\" (e.g., \"Option 1\", \"Japan\", \"Admin\").\n\n"
            "RULES FOR THE 'keyboard' ACTION:\n"
            "- Use action: \"keyboard\"\n"
            "- If targeting a specific input element before typing or pressing a key, provide its selector in \"target\". Otherwise leave \"target\" as \"\".\n"
            "- Place the key string name or key combinations in \"value\" (e.g., \"Enter\", \"Tab\", \"Control+A\", \"Backspace\").\n\n"
            "RULES FOR THE 'clear_storage' ACTION:\n"
            "- Use action: \"clear_storage\"\n"
            "- Leave \"target\" and \"value\" as empty strings (\"\").\n"
            "- Use it whenever a clean, isolated session state is required before proceeding.\n\n"
            "RULES FOR THE 'wait' ACTION:\n"
            "- Use action: \"wait\"\n"
            "- Leave \"target\" as an empty string (\"\").\n"
            "- Place the sleep duration in milliseconds inside \"value\" as a string (e.g., \"3000\" for 3 seconds, \"5000\" for 5 seconds).\n"
            "- Use it when the page undergoes heavy lazy loading, asynchronous state transitions, or needs explicit stabilization time.\n\n"
            "RULES FOR THE 'assert' ACTION:\n"
            "- Use action: \"assert\"\n"
            "- To verify visible text on the page (formerly 'AppearText'), place the exact plain text snippet or keyword directly inside \"target\" and leave \"value\" as \"\" (e.g., target: \"Welcome Back\", value: \"\").\n"
            "- To verify an element containing specific text exists, put the CSS/XPath selector in \"target\" and the expected inner text in \"value\" (e.g., target: \"#header-title\", value: \"Dashboard\").\n"
            "- To check if the browser URL is correct, put the word \"url\" explicitly in \"target\", and place the expected URL path/domain pattern inside \"value\" (e.g., target: \"url\", value: \"/dashboard\").\n"
            "- To verify the page stayed on the current route without redirecting, put the word \"stay\" in \"target\" and leave \"value\" as \"\".\n"
            "- Use it whenever a step requires verifying, confirming, checking, or validating an expected system state.\n\n"
            "CRITICAL OUTPUT RULES:\n"
            "- Do not include any conversational text, explanations, or introductory remarks.\n"
            "- Do not wrap the response in markdown blocks like ```json ... ``` or backticks.\n"
            "- Respond ONLY with the raw, parseable JSON object matching the schema."
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Scenario: {scenario_text}"}
                ],
                temperature=0.1,
            )
            
            raw_content = response.choices[0].message.content.strip()
            
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
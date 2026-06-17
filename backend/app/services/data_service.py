import re
from faker import Faker

class DataGenerationService:
    def __init__(self):
        self.fake = Faker()
        # This dictionary acts as our context memory bank to maintain relational consistency
        self.session_context = {}

    def clear_session(self):
        """Clears the data session between separate test runs."""
        self.session_context.clear()

    def _generate_value_by_type(self, data_type: str) -> str:
        """Maps specific keywords to relational Faker generators."""
        data_type = data_type.lower().strip()
        
        if "email" in data_type:
            return self.fake.unique.email()
        elif "username" in data_type or "user" in data_type:
            return f"user_{self.fake.user_name()}"
        elif "name" in data_type:
            return self.fake.name()
        elif "password" in data_type:
            return f"TestPass!{self.fake.random_int(min=1000, max=9999)}"
        elif "phone" in data_type:
            return self.fake.phone_number()
        else:
            # Fallback random string generator if a unique tag isn't explicitly matched
            return f"test_data_{self.fake.word()}"

    def inject_relational_data(self, test_cases: list) -> list:
        """
        Parses the AI steps array. Replaces structural placeholders with real-time data 
        and memorizes them so steps further down reuse the identical values.
        """
        processed_cases = []
        
        for case in test_cases:
            # Deep copy or read the step dictionary contents
            current_case = dict(case)
            value_field = current_case.get("value", "")
            
            # Check for placeholder pattern syntax: {{Faker:DataType:OptionalKey}}
            # Examples: {{Faker:Email:MainUser}} or {{Faker:Password:MainUser}}
            match = re.search(r"\{\{Faker:([^:]+)(?::([^}]+))?\}\}", str(value_field))
            
            if match:
                data_type = match.group(1)
                context_key = match.group(2) if match.group(2) else data_type
                
                # Relational Check: If we already generated this specific entity key earlier, reuse it!
                if context_key in self.session_context:
                    generated_value = self.session_context[context_key]
                else:
                    # Otherwise, generate a fresh unique value and store it in session memory
                    generated_value = self._generate_value_by_type(data_type)
                    self.session_context[context_key] = generated_value
                
                # Overwrite the placeholder string with the true generated test data value
                current_case["value"] = generated_value
                
            processed_cases.append(current_case)
            
        return processed_cases
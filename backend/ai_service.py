import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class AIService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def prioritize_issue(self, description: str, sector: str):
        prompt = f"""
        Analyze the following smart city issue and assign a priority (low, medium, high, critical).
        Sector: {sector}
        Issue Description: {description}
        
        Consider safety, impact on residents, and urgency.
        Return only the priority level.
        """
        response = self.model.generate_content(prompt)
        return response.text.strip().lower()

    async def detect_duplicate(self, new_issue: str, existing_issues: list):
        if not existing_issues:
            return None
        
        issues_summary = "\n".join([f"- {i.description}" for i in existing_issues])
        prompt = f"""
        Does the following new report refer to the same physical issue as any of the existing reports?
        New Report: {new_issue}
        
        Existing Reports:
        {issues_summary}
        
        If it's a duplicate, return 'Duplicate: [Reference Number]'. Otherwise, return 'Unique'.
        """
        response = self.model.generate_content(prompt)
        return response.text.strip()

ai_service = AIService()

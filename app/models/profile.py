from typing import List
from pydantic import BaseModel, Field


class SkillGroup(BaseModel):
    label: str = Field(description="Category name, e.g. 'AI / LLM'")
    items: List[str]


class ExperienceItem(BaseModel):
    role: str
    company: str
    period: str = ""
    highlights: List[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str
    institution: str
    period: str = ""


class ResumeExtract(BaseModel):
    skills: List[SkillGroup]
    experience: List[ExperienceItem]
    education: List[EducationItem]


class QuickView(BaseModel):
    open_to: str = ""
    work_preference: str = ""
    availability: str = ""
    location: str = ""
const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://127.0.0.1:8000/api"
  : "https://dhanush-kumar-portfolio.onrender.com/api";

// Your personal details. An empty value is hidden on the site.
const PROFILE = {
  email: "dhanushkumar9211@gmail.com",
  city: "Manipal, Udupi, Karnataka, India",
  education: "B.E. Biotechnology, NMAM Institute of Technology, Nitte (2020–2024)",
  current: "AI Engineer Intern, Oraxiz Inc",
  openTo: "AI engineer roles",
  stack: "Python · LangGraph · FastAPI · ChromaDB",
  learning: [], // e.g. ["MCP", "LLM evaluation"]. Empty = hidden.
  // Shown until you publish a resume, which then replaces this list
  skills: [
    { label: "Languages", items: ["Python", "JavaScript"] },
    { label: "AI / LLM", items: ["LangGraph", "RAG", "LLM APIs"] },
    { label: "Backend", items: ["FastAPI", "MongoDB"] },
    { label: "Tools", items: ["ChromaDB", "Git", "GitHub"] },
  ],
};

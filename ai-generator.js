// ai-generator.js
// Client-side AI Polisher and summary generator.
// Provides both instant local rule-based rewriting and API hooks for advanced Generative AI.

const AI_POLISH_DICTIONARY = [
  { weak: /wrote code/gi, strong: "Architected, developed, and deployed high-performance code structures" },
  { weak: /fixed bugs/gi, strong: "Diagnosed and resolved critical software regressions, enhancing system stability" },
  { weak: /made a website/gi, strong: "Designed, built, and launched a responsive, mobile-first web application" },
  { weak: /improved speed/gi, strong: "Optimized performance bottlenecks, achieving a 45% reduction in latency" },
  { weak: /led the team/gi, strong: "Spearheaded and mentored a cross-functional squad of developers" },
  { weak: /worked with/gi, strong: "Collaborated synergistically with cross-functional partners to integrate" },
  { weak: /helped customers/gi, strong: "Managed key account issues, boosting customer satisfaction scores by 20%" },
  { weak: /did research/gi, strong: "Conducted exhaustive literature reviews and academic research projects" },
  { weak: /tested stuff/gi, strong: "Authored and executed comprehensive test suites, expanding test coverage to 92%" },
  { weak: /helped in projects/gi, strong: "Contributed critical engineering support to enterprise-scale projects" },
  { weak: /organized event/gi, strong: "Coordinated, scheduled, and executed high-impact organizational events" },
  { weak: /increased sales/gi, strong: "Generated additional revenue streams, increasing monthly sales metrics by 30%" },
  { weak: /managed databases/gi, strong: "Maintained, optimized, and secured database schemas, decreasing query runtimes" },
  { weak: /made designs/gi, strong: "Created user-centric design assets, wireframes, and prototypes, elevating UX aesthetics" }
];

const ACTION_VERBS = {
  leadership: ["Spearheaded", "Directed", "Orchestrated", "Chaired", "Guided", "Mentored", "Pioneered", "Championed"],
  creation: ["Designed", "Formulated", "Architected", "Engineered", "Implemented", "Authored", "Launched", "Created"],
  efficiency: ["Optimized", "Streamlined", "Accelerated", "Amplified", "Consolidated", "Reorganized", "Maximized"],
  results: ["Generated", "Secured", "Attained", "Surpassed", "Expanded", "Boosted", "Maximized", "Achieved"]
};

// Generates a mock/local summary if no API key is provided
function generateLocalSummary(title, skills, category) {
  const skillsStr = skills && skills.length > 0 ? skills.slice(0, 3).join(", ") : "core competencies";
  const catNames = {
    college_app: "motivated student seeking academic excellence",
    internship: "ambitious scholar seeking hands-on industry exposure",
    fresher: "passionate graduate eager to leverage technical skills in a professional setting",
    job_interview: "detail-oriented specialist dedicated to delivering scalable project architectures",
    experienced: "accomplished professional with a proven track record of driving business value",
    academic: "dedicated researcher committed to contributing scientific insights and academic mentorship",
    scholarship: "scholastic achiever seeking opportunities to engage in leadership and academic research"
  };

  const titleStr = title || "Professional";
  const desc = catNames[category] || "driven candidate";

  return `Results-driven ${titleStr} and ${desc}. Proven track record of leveraging ${skillsStr} to solve complex challenges and implement optimized workflows. Committed to fostering teamwork, driving innovation, and achieving project excellence in fast-paced environments.`;
}

// Local rules-based rewriter
function localPolish(inputText) {
  let polished = inputText;
  let matchesFound = 0;

  // Replace dictionary terms
  for (const item of AI_POLISH_DICTIONARY) {
    if (item.weak.test(polished)) {
      polished = polished.replace(item.weak, item.strong);
      matchesFound++;
    }
  }

  // If no specific dictionary match, do semantic enhancements using action verbs
  if (matchesFound === 0 && polished.trim().length > 0) {
    // If it starts with common filler words, strip them
    polished = polished.replace(/^(i was |i did |my job was to |responsible for |had to )/i, "");
    
    // Capitalize first letter and prepend a strong action verb if it doesn't already start with one
    const randomVerb = ACTION_VERBS.creation[Math.floor(Math.random() * ACTION_VERBS.creation.length)];
    const firstWord = polished.trim().split(" ")[0] || "";
    const isCapitalizedVerb = /^[A-Z][a-z]+ed$/.test(firstWord); // check if looks like action verb (e.g. Developed)

    if (!isCapitalizedVerb && firstWord.length > 0) {
      polished = randomVerb + " " + polished.charAt(0).toLowerCase() + polished.slice(1);
    }
  }

  return polished;
}

// Call Generative AI APIs directly from client browser
async function callGenerativeAI(inputText, type, provider, apiKey) {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key is required to call Generative AI.");
  }

  const prompt = type === "summary"
    ? `You are an expert resume writer. Generate a professional, ATS-friendly summary (maximum 3-4 lines) based on this information:\n${inputText}\n\nFormat: Return ONLY the summary, no other conversational text.`
    : `You are a professional resume editor. Rewrite the following resume bullet point to make it sound highly professional, results-oriented, and ATS-optimized. Use strong action verbs and professional vocabulary:\n"${inputText}"\n\nFormat: Return ONLY the polished text, without any quotes or explanations.`;

  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "OpenAI API call failed.");
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();

  } else if (provider === "gemini") {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Gemini API call failed.");
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error("Unsupported AI Provider");
}

if (typeof window !== "undefined") {
  window.localPolish = localPolish;
  window.generateLocalSummary = generateLocalSummary;
  window.callGenerativeAI = callGenerativeAI;
  window.ACTION_VERBS = ACTION_VERBS;
}

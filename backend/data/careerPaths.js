const careerPaths = [
  {
    id: "fullstack",
    title: "Full Stack Developer",
    subtitle: "MERN / Next.js",
    emoji: "🚀",
    demand: "Very High",
    color: "#3B82F6",
    categories: [
      {
        name: "Frontend",
        skills: [
          "React",
          "Next.js",
          "Tailwind CSS",
          "TypeScript",
          "HTML/CSS",
          "JavaScript",
        ],
      },
      {
        name: "Backend",
        skills: ["Node.js", "Express", "REST API", "GraphQL"],
      },
      { name: "Database", skills: ["MongoDB", "PostgreSQL", "Redis"] },
      { name: "Auth", skills: ["JWT", "OAuth", "Session Management"] },
      {
        name: "DevOps",
        skills: ["Git", "Docker basics", "Vercel/Netlify", "CI/CD basics"],
      },
      {
        name: "Must Know",
        skills: [
          "System Design basics",
          "Clean Code",
          "Performance Optimization",
          "Scalable Architecture",
        ],
      },
    ],
    missing: [
      "Real-world project structure",
      "System design basics",
      "Performance optimization",
      "Clean code & folder architecture",
    ],
  },
  {
    id: "ai_ml",
    title: "AI / ML Engineer",
    subtitle: "Machine Learning & Deep Learning",
    emoji: "🤖",
    demand: "Exploding",
    color: "#8B5CF6",
    categories: [
      { name: "Language", skills: ["Python", "R (optional)"] },
      {
        name: "ML Libraries",
        skills: ["TensorFlow", "PyTorch", "Scikit-learn", "Keras"],
      },
      { name: "Data", skills: ["Pandas", "NumPy", "Matplotlib", "Seaborn"] },
      {
        name: "Concepts",
        skills: [
          "Regression",
          "Classification",
          "Clustering",
          "Deep Learning",
          "NLP basics",
          "Computer Vision",
        ],
      },
      {
        name: "Deployment",
        skills: ["Flask", "FastAPI", "Docker", "AWS SageMaker"],
      },
      {
        name: "Math",
        skills: [
          "Linear Algebra",
          "Probability & Statistics",
          "Calculus basics",
        ],
      },
    ],
    missing: [
      "Strong math (linear algebra, probability)",
      "Real dataset experience",
      "Model deployment",
      "Understanding business use-cases",
    ],
  },
  {
    id: "cloud_devops",
    title: "Cloud Engineer / DevOps",
    subtitle: "AWS / Azure / GCP",
    emoji: "☁️",
    demand: "Very High",
    color: "#F59E0B",
    categories: [
      { name: "Cloud", skills: ["AWS", "Azure", "GCP", "Cloud Architecture"] },
      { name: "Containers", skills: ["Docker", "Kubernetes", "Helm"] },
      {
        name: "CI/CD",
        skills: ["GitHub Actions", "Jenkins", "GitLab CI", "ArgoCD"],
      },
      {
        name: "Infrastructure",
        skills: ["Terraform", "Ansible", "Linux", "Bash Scripting"],
      },
      {
        name: "Networking",
        skills: ["TCP/IP", "DNS", "Load Balancing", "VPC", "Firewalls"],
      },
      {
        name: "Monitoring",
        skills: ["Prometheus", "Grafana", "ELK Stack", "Datadog"],
      },
    ],
    missing: [
      "Hands-on deployment projects",
      "Debugging production issues",
      "Cost optimization",
      "Infrastructure as Code",
    ],
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Specialist",
    subtitle: "Ethical Hacking & Security",
    emoji: "🔐",
    demand: "Increasing Fast",
    color: "#EF4444",
    categories: [
      {
        name: "Networking",
        skills: [
          "TCP/IP",
          "DNS",
          "HTTP/HTTPS",
          "Wireshark",
          "Networking fundamentals",
        ],
      },
      {
        name: "Ethical Hacking",
        skills: ["Kali Linux", "Metasploit", "Burp Suite", "Nmap", "SQLmap"],
      },
      {
        name: "Web Security",
        skills: ["OWASP Top 10", "XSS", "SQL Injection", "CSRF", "SSRF"],
      },
      { name: "OS", skills: ["Linux", "Windows Server", "Active Directory"] },
      {
        name: "Certifications",
        skills: ["CEH", "OSCP", "CompTIA Security+", "CISSP"],
      },
      {
        name: "Practice",
        skills: [
          "TryHackMe",
          "Hack The Box",
          "CTF Challenges",
          "Report Writing",
        ],
      },
    ],
    missing: [
      "Practical hacking labs",
      "Real vulnerability testing experience",
      "Report writing skills",
      "Real attack scenario understanding",
    ],
  },
  {
    id: "data",
    title: "Data Analyst / Scientist",
    subtitle: "Analytics & Insights",
    emoji: "📊",
    demand: "High",
    color: "#10B981",
    categories: [
      {
        name: "Tools",
        skills: ["Excel", "Google Sheets", "SQL", "Power BI", "Tableau"],
      },
      {
        name: "Programming",
        skills: ["Python", "Pandas", "Matplotlib", "Seaborn", "NumPy"],
      },
      {
        name: "Statistics",
        skills: [
          "Descriptive Statistics",
          "Hypothesis Testing",
          "A/B Testing",
          "Regression",
        ],
      },
      {
        name: "Data Skills",
        skills: [
          "Data Cleaning",
          "Data Wrangling",
          "ETL Pipeline",
          "Feature Engineering",
        ],
      },
      {
        name: "Business",
        skills: [
          "KPI Metrics",
          "Business Intelligence",
          "Storytelling with Data",
          "Dashboard Design",
        ],
      },
      {
        name: "Advanced",
        skills: [
          "Machine Learning basics",
          "NLP basics",
          "Big Data (Spark)",
          "Cloud Data (BigQuery)",
        ],
      },
    ],
    missing: [
      "Storytelling with data",
      "Business thinking",
      "Cleaning messy real-world data",
      "Dashboard design (UI/UX)",
    ],
  },
  {
    id: "mobile",
    title: "Mobile App Developer",
    subtitle: "React Native / Flutter",
    emoji: "📱",
    demand: "High",
    color: "#06B6D4",
    categories: [
      {
        name: "Cross-Platform",
        skills: ["React Native", "Flutter", "Dart", "Expo"],
      },
      {
        name: "Native",
        skills: ["Swift (iOS)", "Kotlin (Android)", "Xcode", "Android Studio"],
      },
      {
        name: "Backend",
        skills: ["Firebase", "REST API", "GraphQL", "Node.js"],
      },
      {
        name: "State Mgmt",
        skills: ["Redux", "Zustand", "Provider (Flutter)", "Riverpod"],
      },
      {
        name: "Publishing",
        skills: ["App Store", "Play Store", "TestFlight", "App Signing"],
      },
      {
        name: "UI/UX",
        skills: [
          "Mobile UI patterns",
          "Accessibility",
          "Responsive design",
          "Animations",
        ],
      },
    ],
    missing: [
      "Platform-specific APIs",
      "App performance optimization",
      "Real app publishing experience",
      "Offline-first architecture",
    ],
  },
];

module.exports = careerPaths;
